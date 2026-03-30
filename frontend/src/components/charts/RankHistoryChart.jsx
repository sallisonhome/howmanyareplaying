import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { formatAxisDate } from '../../utils/formatDate.js';
import { formatTooltipDate } from '../../utils/formatDate.js';
import './RankHistoryChart.css';

const RANGE_DAYS = {
  '7d':  7,
  '30d': 30,
  '3m':  90,
  '6m':  180,
  '1y':  365,
  'all': Infinity,
};

const RANGE_LABELS = {
  '7d':  '7 days',
  '30d': '30 days',
  '3m':  '3 months',
  '6m':  '6 months',
  '1y':  '1 year',
  'all': 'all time',
};

function RankTooltip({ active, payload, label, range }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip__date">{formatTooltipDate(label, range)}</div>
      <div className="chart-tooltip__value">
        <span className="chart-tooltip__dot" />
        Rank #{payload[0].value}
      </div>
    </div>
  );
}

export default function RankHistoryChart({ data, range }) {
  if (!data || data.length === 0) {
    const label = RANGE_LABELS[range] ?? range;
    const needed = RANGE_DAYS[range] ?? 90;
    const daysNeeded = needed === Infinity ? 'more time' : `${needed} days`;
    return (
      <div className="chart-empty">
        <p>No rank history available for this time range yet.</p>
        <p className="chart-empty__sub">
          Rank data for the <strong>{label}</strong> view requires {daysNeeded} of
          collection. Check back once more data has accumulated — it grows daily.
        </p>
      </div>
    );
  }

  // If we have data but it's sparse (fewer than 5 points), show a notice alongside the chart
  const sparse = data.length < 5;

  return (
    <div className="chart-container">
      {sparse && (
        <div className="chart-notice">
          Only {data.length} day{data.length !== 1 ? 's' : ''} of rank data collected so far — chart will fill in over time.
        </div>
      )}
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#3d5a73" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="time"
            tickFormatter={(v) => formatAxisDate(v, range)}
            tick={{ fill: '#8ba5be', fontSize: 11 }}
            axisLine={{ stroke: '#3d5a73' }}
            tickLine={false}
            minTickGap={60}
          />
          <YAxis
            domain={[1, 100]}
            reversed={true}
            tickFormatter={(v) => `#${v}`}
            tick={{ fill: '#8ba5be', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={40}
            ticks={[1, 10, 25, 50, 75, 100]}
          />
          <Tooltip content={<RankTooltip range={range} />} />
          <ReferenceLine
            y={10}
            stroke="#66c0f4"
            strokeDasharray="5 4"
            strokeOpacity={0.35}
            label={{ value: 'Top 10', position: 'insideTopRight', fill: '#8ba5be', fontSize: 11 }}
          />
          <Line
            type="monotone"
            dataKey="rank"
            stroke="#66c0f4"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#66c0f4', strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
