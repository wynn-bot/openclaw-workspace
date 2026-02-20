#!/usr/bin/env node
// Reddit Comment Scraper
// Usage: node reddit-scraper.js "search query" [subreddit1,subreddit2,...] [limit]
// Output: Clean markdown file ready to paste into Claude

const https = require('https');

const SUBREDDITS_DEFAULT = [
  'Divorce', 'DeadBedrooms', 'marriageadvice', 'relationship_advice',
  'fitness', 'selfimprovement', 'loseit', 'decidingtobebetter'
];

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'ResearchBot/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 429) {
          reject(new Error('Rate limited - wait and try again'));
        } else {
          resolve(JSON.parse(data));
        }
      });
    }).on('error', reject);
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function searchSubreddit(subreddit, query, limit = 10) {
  const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&restrict_sr=1&sort=relevance&limit=${limit}`;
  try {
    const data = await fetch(url);
    if (!data.data || !data.data.children) return [];
    return data.data.children.map(c => ({
      title: c.data.title,
      selftext: c.data.selftext,
      score: c.data.score,
      url: `https://reddit.com${c.data.permalink}`,
      subreddit: c.data.subreddit,
      numComments: c.data.num_comments,
      created: new Date(c.data.created_utc * 1000).toISOString().split('T')[0]
    }));
  } catch (e) {
    console.error(`Error searching r/${subreddit}: ${e.message}`);
    return [];
  }
}

async function getPostComments(permalink, limit = 15) {
  const url = `https://www.reddit.com${permalink}.json?sort=top&limit=${limit}`;
  try {
    const data = await fetch(url);
    if (!Array.isArray(data) || data.length < 2) return [];
    const comments = data[1].data.children
      .filter(c => c.kind === 't1' && c.data.body && c.data.score > 2)
      .map(c => ({
        body: c.data.body,
        score: c.data.score
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    return comments;
  } catch (e) {
    console.error(`Error fetching comments: ${e.message}`);
    return [];
  }
}

async function main() {
  const query = process.argv[2] || 'working out during divorce marriage problems gym';
  const subreddits = process.argv[3] ? process.argv[3].split(',') : SUBREDDITS_DEFAULT;
  const limit = parseInt(process.argv[4]) || 5;

  console.error(`Searching for: "${query}"`);
  console.error(`Subreddits: ${subreddits.join(', ')}`);
  console.error(`Posts per sub: ${limit}\n`);

  let output = `# Reddit Research: "${query}"\n`;
  output += `Date: ${new Date().toISOString().split('T')[0]}\n`;
  output += `Subreddits: ${subreddits.join(', ')}\n\n`;
  output += `---\n\n`;

  let totalPosts = 0;
  let totalComments = 0;

  for (const sub of subreddits) {
    console.error(`Searching r/${sub}...`);
    const posts = await searchSubreddit(sub, query, limit);
    await sleep(2000); // Rate limit

    if (posts.length === 0) {
      console.error(`  No results in r/${sub}`);
      continue;
    }

    output += `## r/${sub}\n\n`;

    for (const post of posts) {
      totalPosts++;
      output += `### ${post.title}\n`;
      output += `Score: ${post.score} | Comments: ${post.numComments} | Date: ${post.created}\n`;
      output += `Link: ${post.url}\n\n`;

      if (post.selftext && post.selftext.length > 50) {
        const text = post.selftext.substring(0, 1500);
        output += `**Post:**\n> ${text.replace(/\n/g, '\n> ')}\n\n`;
      }

      // Fetch top comments
      const permalink = post.url.replace('https://reddit.com', '');
      const comments = await getPostComments(permalink, 8);
      await sleep(2000); // Rate limit

      if (comments.length > 0) {
        output += `**Top Comments:**\n\n`;
        for (const c of comments) {
          totalComments++;
          const body = c.body.substring(0, 800);
          output += `> "${body}"\n> — (Score: ${c.score})\n\n`;
        }
      }

      output += `---\n\n`;
    }
  }

  output += `\n## Summary\n`;
  output += `- Total posts found: ${totalPosts}\n`;
  output += `- Total comments collected: ${totalComments}\n`;
  output += `- Ready to paste into Claude for analysis\n`;

  // Output to stdout
  console.log(output);
  console.error(`\nDone! ${totalPosts} posts, ${totalComments} comments collected.`);
}

main().catch(console.error);
