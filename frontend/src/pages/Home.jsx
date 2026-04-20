import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLiveData } from '../hooks/useLiveData.js';
import SEOHead from '../components/seo/SEOHead.jsx';
import JsonLd from '../components/seo/JsonLd.jsx';
import LeaderboardTable from '../components/leaderboard/LeaderboardTable.jsx';
import MoversView from '../components/leaderboard/MoversView.jsx';
import RecordsView from '../components/leaderboard/RecordsView.jsx';
import LeaderboardViewFilter from '../components/filters/LeaderboardViewFilter.jsx';
import CountdownTimer from '../components/ui/CountdownTimer.jsx';
import SearchBar from '../components/ui/SearchBar.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import ErrorBanner from '../components/ui/ErrorBanner.jsx';
import NewsFeedPreview from '../components/news/NewsFeedPreview.jsx';
import './Home.css';

const VIEW_TITLES = {
  live:    'Current Concurrent Players',
  today:   'Peak CCU Today',
  '7d':    'Average Peak CCU — Last 7 Days',
  '30d':   'Average Peak CCU — Last 30 Days',
  '90d':   'Average Peak CCU — Last 90 Days',
  '180d':  'Average Peak CCU — Last 180 Days',
  '365d':  'Average Peak CCU — Last Year',
  movers:  'Top Movers',
  records: 'Peak Records',
};

const VIEW_SEO = {
  live:    { title: 'Top 100 Steam Games by CCU | How Many Are Playing',               desc: 'Live concurrent player counts for the top 100 Steam games, updated every hour.' },
  today:   { title: 'Top Steam Games — Peak CCU Today | How Many Are Playing',         desc: "Today's peak concurrent player counts for top Steam games." },
  '7d':    { title: 'Top Steam Games — Last 7 Days Avg CCU | How Many Are Playing',    desc: 'Average peak concurrent players for top Steam games over the last 7 days.' },
  '30d':   { title: 'Top Steam Games — Last 30 Days Avg CCU | How Many Are Playing',   desc: 'Average peak concurrent players for top Steam games over the last 30 days.' },
  '90d':   { title: 'Top Steam Games — Last 90 Days Avg CCU | How Many Are Playing',   desc: 'Average peak concurrent players for top Steam games over the last 90 days.' },
  '180d':  { title: 'Top Steam Games — Last 180 Days Avg CCU | How Many Are Playing',  desc: 'Average peak concurrent players for top Steam games over the last 180 days.' },
  '365d':  { title: 'Top Steam Games — Last Year Avg CCU | How Many Are Playing',      desc: 'Average peak concurrent players for top Steam games over the last year.' },
  movers:  { title: 'Top Movers — Steam Games Gaining & Losing Players | How Many Are Playing', desc: 'Steam games with the biggest player count gains and losses since the last poll.' },
  records: { title: 'Peak Records — Steam Games Hitting New Highs | How Many Are Playing',      desc: 'Steam games breaking their 7-day, 30-day, and 90-day player count records.' },
};

const AVG_VIEWS = new Set(['7d', '30d', '90d', '180d', '365d']);

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get('view') ?? 'live';

  const { data, meta, loading, error, refetch } = useLiveData(view);

  const seo = VIEW_SEO[view] ?? VIEW_SEO.live;

  const jsonLdData = useMemo(() => {
    const graph = [
      {
        '@type': 'WebSite',
        name: 'How Many Are Playing',
        url: 'https://howmanyareplaying.com',
        description: 'Real-time Steam concurrent player leaderboard — top 100 games updated every hour. Track player counts, trends, and historical peaks.',
      },
    ];
    if (data && data.length > 0) {
      graph.push({
        '@type': 'ItemList',
        name: 'Top 100 Steam Games by Concurrent Players',
        itemListOrder: 'https://schema.org/ItemListOrderDescending',
        numberOfItems: data.length,
        itemListElement: data.map((game, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: game.name,
          url: `https://howmanyareplaying.com/game/${game.appid}`,
        })),
      });
    }
    return { '@context': 'https://schema.org', '@graph': graph };
  }, [data]);

  const handleViewChange = (newView) => {
    setSearchParams({ view: newView });
  };

  const isAvgView    = AVG_VIEWS.has(view);
  const isMoversView = view === 'movers';
  const isRecordsView = view === 'records';
  const periodDays   = meta?.period_days ?? parseInt(view, 10);
  const dataDays     = meta?.data_days ?? 0;
  const dataComplete = dataDays >= periodDays;

  return (
    <div className="home-page">
      <SEOHead
        title={seo.title}
        description={seo.desc}
        path={view === 'live' ? '/' : `/?view=${view}`}
      />
      <JsonLd data={jsonLdData} />
      <div className="home-header">
        <div>
          <h1 className="home-title">Top 100 Steam Games</h1>
          <p className="home-subtitle">{VIEW_TITLES[view] ?? 'Steam leaderboard'}</p>
        </div>
        <div className="home-header__right">
          <SearchBar />
          {view === 'live' && (
            <CountdownTimer
              lastUpdatedAt={data?.[0]?.last_updated_at ?? null}
              onRefetch={refetch}
            />
          )}
        </div>
      </div>

      <LeaderboardViewFilter value={view} onChange={handleViewChange} />

      {isMoversView && <MoversView />}
      {isRecordsView && <RecordsView />}

      {!isMoversView && !isRecordsView && (
        <>
          {loading && <Spinner size="lg" />}
          {error && <ErrorBanner message={error} />}
          {data && (
            <>
              {isAvgView && !dataComplete && (
                <div className="home-data-notice">
                  <strong>Building history:</strong> ranked by avg peak CCU across{' '}
                  {dataDays} of {periodDays} days collected so far. Rankings are
                  independently computed for each time window — as data accumulates,
                  titles and order will diverge from the Live and Today views based
                  on each game&apos;s actual historical average.
                </div>
              )}
              {isAvgView && dataComplete && (
                <p className="home-ccu-notice">
                  Ranked by average peak CCU over {periodDays} days. Games with higher
                  historical averages may differ from the Live view.
                </p>
              )}
              {!isAvgView && (
                <p className="home-ccu-notice">CCU counts are updated every 60 minutes.</p>
              )}
              <LeaderboardTable games={data} view={view} />
            </>
          )}
        </>
      )}

      <NewsFeedPreview />
    </div>
  );
}
