import { useState } from 'react';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [logs, setLogs] = useState([]);
  const [formData, setFormData] = useState({
    subreddits: 'Divorce,DeadBedrooms,marriageadvice,fitness,selfimprovement',
    query: 'divorce marriage fitness',
    emailTo: 'tryreloria@gmail.com'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleScrape = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResults(null);
    const newLogs = [];

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subreddits: formData.subreddits.split(',').map(s => s.trim()),
          query: formData.query,
          emailTo: formData.emailTo
        })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l);
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.status) {
              newLogs.push(data.status);
              setLogs([...newLogs]);
            }
            if (data.success) {
              setResults(data.data);
            }
          } catch (e) {}
        }
      }
    } catch (error) {
      newLogs.push(`Error: ${error.message}`);
      setLogs([...newLogs]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🔥 Reddit Ad Copy Generator</h1>
        <p>Scrape Reddit → Analyze Trends → Generate Ad Copy</p>
      </div>

      <div className={styles.grid}>
        {/* Form */}
        <div className={styles.card}>
          <h2>⚙️ Settings</h2>
          <form onSubmit={handleScrape}>
            <div className={styles.formGroup}>
              <label>Subreddits (comma-separated)</label>
              <input
                type="text"
                name="subreddits"
                value={formData.subreddits}
                onChange={handleInputChange}
                placeholder="Divorce,fitness,selfimprovement"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Search Query</label>
              <input
                type="text"
                name="query"
                value={formData.query}
                onChange={handleInputChange}
                placeholder="divorce fitness transformation"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Email To</label>
              <input
                type="email"
                name="emailTo"
                value={formData.emailTo}
                onChange={handleInputChange}
                placeholder="your@email.com"
              />
            </div>

            <button type="submit" disabled={loading} className={styles.btnPrimary}>
              {loading ? '⏳ Processing...' : '🚀 Start Scrape'}
            </button>
          </form>
        </div>

        {/* Logs */}
        <div className={styles.card}>
          <h2>📊 Live Progress</h2>
          <div className={styles.logs}>
            {logs.length === 0 ? (
              <p className={styles.empty}>Waiting to start...</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className={styles.logEntry}>
                  <span className={styles.logTime}>
                    {new Date().toLocaleTimeString()}
                  </span>
                  <span>{log}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      {results && (
        <div className={styles.card}>
          <h2>📈 Results</h2>
          
          <div className={styles.summary}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Posts Analyzed</span>
              <span className={styles.statValue}>{results.postCount}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Comments Analyzed</span>
              <span className={styles.statValue}>{results.commentCount}</span>
            </div>
          </div>

          {results.trends && (
            <>
              <div className={styles.section}>
                <h3>🧠 Emotional Patterns</h3>
                {results.trends.emotional_patterns?.slice(0, 5).map((e, i) => (
                  <div key={i} className={styles.trend}>
                    <strong>{e.emotion}</strong> ({e.frequency})
                    <div className={styles.examples}>
                      {e.examples?.slice(0, 2).map((ex, j) => (
                        <span key={j}>{ex}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.section}>
                <h3>😣 Pain Points</h3>
                {results.trends.pain_points?.slice(0, 5).map((p, i) => (
                  <div key={i} className={styles.trend}>
                    <strong>{p.point}</strong> ({p.frequency})
                  </div>
                ))}
              </div>
            </>
          )}

          <div className={styles.section}>
            <h3>✍️ Generated Ad Copy</h3>
            <pre className={styles.adCopy}>
              {results.adCopy?.substring(0, 2000)}...
            </pre>
            <p className={styles.note}>Full report sent to {formData.emailTo}</p>
          </div>
        </div>
      )}
    </div>
  );
}
