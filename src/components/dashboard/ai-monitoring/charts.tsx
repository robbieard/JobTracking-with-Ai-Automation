export type ChartSeries = {
  key: string;
  label: string;
  color: string;
  values: number[];
};

type RequestVolumeChartProps = {
  labels: string[];
  series: ChartSeries[];
  ariaLabel?: string;
};

type DonutItem = {
  key: string;
  name: string;
  share: number;
  requests: number;
  color: string;
};

type LatencyItem = {
  key: string;
  name: string;
  latency: string;
  latencyValue: number;
  color: string;
};

type Point = {
  x: number;
  y: number;
};

function smoothPath(points: Point[]) {
  if (points.length === 0) return "";

  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;

    const previous = points[index - 1];
    const middleX = (previous.x + point.x) / 2;

    return `${path} C ${middleX} ${previous.y}, ${middleX} ${point.y}, ${point.x} ${point.y}`;
  }, "");
}

function formatCount(value: number) {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function RequestVolumeChart({
  labels,
  series,
  ariaLabel = "AI request volume over the last 7 days",
}: RequestVolumeChartProps) {
  const width = 680;
  const height = 240;
  const padding = { top: 18, right: 12, bottom: 28, left: 34 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const highestValue = Math.max(...series.flatMap((item) => item.values));
  const maxValue = Math.max(50, Math.ceil((highestValue * 1.15) / 50) * 50);
  const ticks = Array.from({ length: 5 }, (_, index) => (maxValue / 4) * index);

  const x = (index: number) => padding.left + (index / Math.max(labels.length - 1, 1)) * plotWidth;
  const y = (value: number) => padding.top + (1 - value / maxValue) * plotHeight;

  return (
    <svg
      aria-label={ariaLabel}
      className="ai-line-chart"
      role="img"
      viewBox={`0 0 ${width} ${height}`}
    >
      {ticks.map((tick) => (
        <g key={tick}>
          <line
            className="ai-chart-grid-line"
            x1={padding.left}
            x2={width - padding.right}
            y1={y(tick)}
            y2={y(tick)}
          />
          <text className="ai-chart-axis" textAnchor="end" x={padding.left - 8} y={y(tick) + 3}>
            {Math.round(tick)}
          </text>
        </g>
      ))}

      {labels.map((label, index) => (
        <text
          className="ai-chart-axis"
          key={label}
          textAnchor="middle"
          x={x(index)}
          y={height - 8}
        >
          {label}
        </text>
      ))}

      {series.map((item) => {
        const points = item.values.map((value, index) => ({ x: x(index), y: y(value) }));
        const line = smoothPath(points);
        const area = `${line} L ${x(points.length - 1)} ${y(0)} L ${x(0)} ${y(0)} Z`;

        return (
          <g key={item.key}>
            <path d={area} fill={item.color} opacity=".055" />
            <path
              d={line}
              fill="none"
              stroke={item.color}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.2"
            />
            {points.map((point, index) => (
              <circle
                cx={point.x}
                cy={point.y}
                fill="var(--surface)"
                key={`${item.key}-${index}`}
                r="2.6"
                stroke={item.color}
                strokeWidth="1.7"
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

export function UsageDonut({
  items,
  total,
  ariaLabel = "AI usage distribution by provider",
}: {
  items: DonutItem[];
  total: number;
  ariaLabel?: string;
}) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const segments = items.reduce<{ item: DonutItem; offset: number; length: number }[]>(
    (result, item) => {
      const previous = result[result.length - 1];
      const offset = previous ? previous.offset + previous.length : 0;

      result.push({ item, offset, length: (item.share / 100) * circumference });
      return result;
    },
    [],
  );

  return (
    <div className="ai-donut-wrap">
      <svg aria-label={ariaLabel} className="ai-donut" role="img" viewBox="0 0 140 140">
        <circle cx="70" cy="70" fill="none" r={radius} stroke="var(--surface-hover)" strokeWidth="16" />
        <g transform="rotate(-90 70 70)">
          {segments.map(({ item, offset, length }) => {
            const dash = Math.max(length - 3, 0);

            return (
              <circle
                cx="70"
                cy="70"
                fill="none"
                key={item.key}
                r={radius}
                stroke={item.color}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                strokeWidth="16"
              />
            );
          })}
        </g>
        <text className="ai-donut-total" textAnchor="middle" x="70" y="66">
          {formatCount(total)}
        </text>
        <text className="ai-donut-label" textAnchor="middle" x="70" y="81">
          request
        </text>
      </svg>

      <div className="ai-donut-legend">
        {items.map((item) => (
          <div className="ai-donut-row" key={item.key}>
            <i style={{ background: item.color }} />
            <span>{item.name}</span>
            <strong>{item.share}%</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LatencyBars({ items }: { items: LatencyItem[] }) {
  const maxLatency = Math.max(...items.map((item) => item.latencyValue));

  return (
    <div className="ai-latency-list">
      {items.map((item) => (
        <div className="ai-latency-row" key={item.key}>
          <div className="ai-latency-meta">
            <span>{item.name}</span>
            <strong>{item.latency}</strong>
          </div>
          <div className="ai-latency-track">
            <span
              style={{
                background: item.color,
                width: `${(item.latencyValue / maxLatency) * 100}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
