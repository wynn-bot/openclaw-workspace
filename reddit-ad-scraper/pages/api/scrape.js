import axios from 'axios';
import { Anthropic } from '@anthropic-ai/sdk';
import nodemailer from 'nodemailer';

const client = new Anthropic();

// Better Reddit scraper with rate-limit handling
async function scrapeReddit(subreddits, query, limit = 100) {
  const allPosts = [];
  const commentData = [];

  for (const subreddit of subreddits) {
    try {
      const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&restrict_sr=1&sort=relevance&limit=${limit / subreddits.length}`;
      
      const response = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        timeout: 10000
      });

      if (response.data?.data?.children) {
        for (const post of response.data.data.children) {
          if (post.data?.title) {
            allPosts.push({
              title: post.data.title,
              score: post.data.score,
              url: `https://reddit.com${post.data.permalink}`,
              selftext: post.data.selftext?.substring(0, 500),
              subreddit: post.data.subreddit
            });

            // Get top comments
            try {
              const commentsUrl = `https://www.reddit.com${post.data.permalink}.json?sort=top&limit=10`;
              const commentsResp = await axios.get(commentsUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                timeout: 8000
              });

              if (Array.isArray(commentsResp.data) && commentsResp.data[1]?.data?.children) {
                for (const comment of commentsResp.data[1].data.children) {
                  if (comment.data?.body && comment.data.score > 1) {
                    commentData.push({
                      text: comment.data.body,
                      score: comment.data.score,
                      postTitle: post.data.title
                    });
                  }
                }
              }
            } catch (e) {
              console.log('Rate limited on comments, continuing...');
            }

            // Rate limit
            await new Promise(r => setTimeout(r, 1000));
          }
        }
      }
    } catch (error) {
      console.log(`Error scraping r/${subreddit}:`, error.message);
    }

    // Delay between subreddits
    await new Promise(r => setTimeout(r, 2000));
  }

  return { allPosts, commentData };
}

// Analyze trends in comments
async function analyzeTrends(commentData) {
  const allText = commentData.map(c => c.text).join(' ');

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `Analyze these Reddit comments and identify trends. Focus on:
1. Top 10 emotional language patterns (fear, guilt, helplessness, etc.)
2. Most common pain points (stated problems)
3. Common objections/hesitations
4. Language patterns (exact phrases people use)
5. Desired outcomes (what they want)

Comments:
${allText}

Format as JSON:
{
  "emotional_patterns": [{"emotion": "...", "frequency": "...", "examples": [...]}],
  "pain_points": [{"point": "...", "frequency": "...", "examples": [...]}],
  "objections": [{"objection": "...", "frequency": "...", "examples": [...]}],
  "language_patterns": [{"pattern": "...", "frequency": "...", "examples": [...]}],
  "desired_outcomes": [{"outcome": "...", "frequency": "...", "examples": [...]}]
}`
    }]
  });

  try {
    const jsonMatch = response.content[0].text.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    return null;
  }
}

// Generate ad copy
async function generateAdCopy(trends, query) {
  const trendsText = JSON.stringify(trends, null, 2);

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 3000,
    messages: [{
      role: 'user',
      content: `Based on these Reddit research trends, write 3 long-form story ad angles (600-900 words each) targeting people searching for: "${query}"

Use the exact emotional language and pain points from the data. Make each story feel authentic and native.

Trends:
${trendsText}

Format each ad as:
---AD COPY #1---
[Long-form story ad here, 600-900 words, storytelling focused]

---AD COPY #2---
[Different angle, same style]

---AD COPY #3---
[Third unique angle]`
    }]
  });

  return response.content[0].text;
}

// Send email
async function sendEmail(data, emailTo) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    }
  });

  const htmlContent = `
    <h2>Reddit Research Report</h2>
    <h3>Summary</h3>
    <p>Total posts analyzed: ${data.postCount}</p>
    <p>Total comments analyzed: ${data.commentCount}</p>
    
    <h3>Top Emotional Patterns</h3>
    ${data.trends.emotional_patterns?.slice(0, 5).map(e => 
      `<p><strong>${e.emotion}</strong> (${e.frequency}): ${e.examples?.join(', ')}</p>`
    ).join('') || '<p>No data</p>'}
    
    <h3>Pain Points</h3>
    ${data.trends.pain_points?.slice(0, 5).map(p => 
      `<p><strong>${p.point}</strong> (${p.frequency})</p>`
    ).join('') || '<p>No data</p>'}
    
    <h3>Ad Copy Generated</h3>
    <pre>${data.adCopy}</pre>
  `;

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: emailTo,
    subject: `Reddit Research Report - ${new Date().toLocaleDateString()}`,
    html: htmlContent,
    text: `Research completed. ${data.postCount} posts, ${data.commentCount} comments analyzed. Ad copy generated.`
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { subreddits, query, emailTo } = req.body;

    res.setHeader('Content-Type', 'application/json');
    res.write(JSON.stringify({ status: 'Scraping Reddit...' }) + '\n');

    // Scrape
    const { allPosts, commentData } = await scrapeReddit(subreddits, query, 100);
    res.write(JSON.stringify({ status: `Found ${allPosts.length} posts and ${commentData.length} comments. Analyzing trends...` }) + '\n');

    // Analyze
    const trends = await analyzeTrends(commentData);
    res.write(JSON.stringify({ status: 'Generating ad copy...' }) + '\n');

    // Generate copy
    const adCopy = await generateAdCopy(trends, query);
    res.write(JSON.stringify({ status: 'Sending email...' }) + '\n');

    // Email
    const reportData = {
      postCount: allPosts.length,
      commentCount: commentData.length,
      trends,
      adCopy,
      query,
      timestamp: new Date().toISOString()
    };

    await sendEmail(reportData, emailTo);

    res.write(JSON.stringify({ 
      status: 'Complete!',
      success: true,
      data: reportData
    }) + '\n');
    res.end();

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
