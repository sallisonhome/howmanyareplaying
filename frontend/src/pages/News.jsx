import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import SEOHead from '../components/seo/SEOHead.jsx';
import { NewsCard } from '../components/news/NewsFeedPreview.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import ErrorBanner from '../components/ui/ErrorBanner.jsx';
import '../components/news/NewsFeedPreview.css';
import './News.css';

export default function News() {
  const [articles, setArticles] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    api.getNews()
      .then((result) => { setArticles(result.data); setError(null); })
      .catch((err)   => setError(err.message))
      .finally(()    => setLoading(false));
  }, []);

  return (
    <div className="news-page">
      <SEOHead
        title="CCU News — Steam Player Count Updates | How Many Are Playing"
        description="Latest news about Steam game player counts, CCU records, and gaming industry trends."
        path="/news"
      />
      <Link to="/" className="back-link">← Back to Leaderboard</Link>

      <div className="news-page__header">
        <h1 className="news-page__title">CCU News</h1>
        <p className="news-page__subtitle">
          Articles about player counts, records, and Steam CCU from top gaming publications —
          updated daily at 9AM EST.
        </p>
      </div>

      {loading && <Spinner size="lg" />}
      {error   && <ErrorBanner message={error} />}

      {articles && articles.length === 0 && (
        <p className="news-page__empty">
          No articles yet — check back after the next daily update.
        </p>
      )}

      {articles && articles.length > 0 && (
        <div className="news-feed">
          {articles.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
