import React from 'react';
import './TimeRangeFilter.css';

const RANGES = [
  { value: 'week',  label: '7D' },
  { value: 'month', label: '30D' },
  { value: '3m',    label: '3M' },
  { value: '6m',    label: '6M' },
  { value: '1y',    label: '1Y' },
  { value: 'all',   label: 'All' },
];

const RANK_RANGES = [
  { value: '3m',  label: '3M' },
  { value: '6m',  label: '6M' },
  { value: '1y',  label: '1Y' },
  { value: 'all', label: 'All' },
];

export default function TimeRangeFilter({ value, onChange, rankMode = false }) {
  const ranges = rankMode ? RANK_RANGES : RANGES;
  return (
    <div className="time-range-filter" role="group" aria-label="Time range">
      {ranges.map((r) => (
        <button
          key={r.value}
          className={`range-tab ${value === r.value ? 'range-tab--active' : ''}`}
          onClick={() => onChange(r.value)}
          aria-pressed={value === r.value}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
