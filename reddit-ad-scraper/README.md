# 🔥 Reddit Ad Copy Generator

Scrape Reddit → Analyze Trends → Generate Long-Form Ad Copy → Email Results

## What It Does

1. **Scrapes Reddit** — searches multiple subreddits for posts + top comments (100+ per run)
2. **Analyzes Trends** — identifies emotional patterns, pain points, objections, language
3. **Generates Ad Copy** — writes 3 long-form story ad angles based on the data
4. **Sends Email** — emails full report + trends + ad copy to you

## Setup (On Your PC)

### Prerequisites
- Node.js 18+ ([download](https://nodejs.org/))
- Gmail account with 2FA enabled

### Installation

```bash
# Clone the repo
git clone https://github.com/wynn-bot/openclaw-workspace
cd reddit-ad-scraper

# Install dependencies
npm install

# Create .env.local (copy from .env.local.example)
cp .env.local.example .env.local

# Edit .env.local with your credentials:
# - Your Anthropic API key
# - Gmail email + App Password
```

### Get Gmail App Password

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification (if not already done)
3. Search for "App passwords"
4. Select Mail + Windows Computer (or your OS)
5. Copy the 16-character password
6. Paste into `.env.local`

### Run It

```bash
npm run dev
```

Open **http://localhost:3000** in your browser.

## Usage

1. **Enter Subreddits** — comma-separated (e.g., "Divorce,fitness,selfimprovement")
2. **Enter Search Query** — what you're researching (e.g., "divorce marriage fitness")
3. **Set Email** — where to send the report
4. **Click "Start Scrape"** — watch live progress
5. **Check Your Email** — full analysis + ad copy incoming

## What You Get

**Trends Analysis:**
- Top emotional language patterns
- Most common pain points
- Typical objections
- Exact phrases people use
- Desired outcomes

**Ad Copy:**
- 3 long-form story ad angles (600-900 words each)
- Written in authentic market language
- Ready to test immediately

## File Structure

```
reddit-ad-scraper/
├── pages/
│   ├── api/
│   │   └── scrape.js       # Backend: scraping + analysis + email
│   └── index.js            # Frontend: dashboard UI
├── styles/
│   └── Home.module.css     # Styling
├── package.json
├── next.config.js
└── .env.local             # (create this)
```

## Customization

**Change defaults in `pages/index.js`:**
```javascript
const [formData, setFormData] = useState({
  subreddits: 'Divorce,DeadBedrooms,fitness',  // Change these
  query: 'divorce marriage fitness',            // Change these
  emailTo: 'your@email.com'                     // Change this
});
```

## Troubleshooting

**"Gmail not working"**
- Make sure you're using App Password, not regular password
- Check Gmail "Less secure app access" is off (use App Passwords instead)

**"Rate limited by Reddit"**
- Normal — the scraper adds delays between requests
- Just means you hit Reddit's API limits, will retry next run

**"No results found"**
- Try different subreddits or search query
- Make sure subreddits exist (r/Divorce, not just "Divorce")

## Performance

- ~100 posts + comments per run
- Takes 5-10 minutes per scrape (includes analysis + email)
- Can run multiple times without issues

## Next Steps

- Run it weekly to track trends over time
- Test generated ad copy on your audience
- Iterate based on what works
- Build swipe file of best-performing angles

---

Built with Next.js + Claude + Nodemailer 🚀
