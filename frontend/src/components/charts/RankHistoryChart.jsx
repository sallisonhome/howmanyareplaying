import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { formatAxisDate } from '../../utils/formatDate.js';
import { formatTooltipDate } from '../../utils/formatDate.js';
import './RankHistoryChart.css';

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
    return (
      <div className="chart-empty">
        Rank history is building — data accumulates daily.
      </div>
    );
  }

  return (
    <div className="chart-container">
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
