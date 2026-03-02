import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { formatCompact } from '../../utils/formatNumber.js';
import './HourlyChart.css';

function HourlyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const h = String(label).padStart(2, '0');
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip__date">{h}:00 – {h}:59 UTC</div>
      <div className="chart-tooltip__value">
        <span className="chart-tooltip__dot" />
        {payload[0].value.toLocaleString()} avg players
      </div>
    </div>
  );
}

export default function HourlyChart({ data }) {
  if (!data || data.length === 0) {
    return <div className="chart-empty">No hourly data available yet.</div>;
  }

  const maxCcu = Math.max(...data.map((d) => d.avg_ccu));

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#3d5a73" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="hour"
            tickFormatter={(v) => (v % 6 === 0 ? `${String(v).padStart(2, '0')}:00` : '')}
            tick={{ fill: '#8ba5be', fontSize: 11 }}
            axisLine={{ stroke: '#3d5a73' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatCompact}
            tick={{ fill: '#8ba5be', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip content={<HourlyTooltip />} />
          <Bar dataKey="avg_ccu" radius={[2, 2, 0, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.hour}
                fill="#66c0f4"
                fillOpacity={0.4 + 0.6 * (entry.avg_ccu / maxCcu)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="hourly-chart-caption">
        Average concurrent players by hour of day (UTC) — last 30 days
      </p>
    </div>
  );
}
