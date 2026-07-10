/**
 * Minimal SVG sparkline. No deps. Takes an array of numbers and renders an
 * inline polyline. Renders nothing if data is empty or single point.
 *
 * Color handling:
 *   - If `stroke` is provided, use it as-is (string or CSS var).
 *   - If omitted, fall back to `currentColor` — the parent's CSS `color`
 *     controls the line. Theme-aware by default.
 *   - Same for `thresholdColor`.
 */
import React from "react";

export function Sparkline({
  values,
  width = 80,
  height = 24,
  stroke,
  strokeWidth = 1.5,
  threshold,
  thresholdColor,
  style,
}: {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
  strokeWidth?: number;
  threshold?: number;
  thresholdColor?: string;
  /** Caller-provided style. Merged with our default `verticalAlign`. */
  style?: React.CSSProperties;
}) {
  if (!values || values.length < 2) {
    return <span className="spark" style={{ width, height, display: "inline-block", ...style }} />;
  }

  const min = Math.min(...values, threshold ?? Infinity);
  const max = Math.max(...values, threshold ?? -Infinity);
  const range = max - min || 1;
  const stepX = width / (values.length - 1);

  const points = values
    .map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  // Default to currentColor so the parent's CSS color drives it
  const strokeValue = stroke ?? "currentColor";
  const thresholdValue = thresholdColor ?? "currentColor";

  return (
    <svg
      className="spark"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ verticalAlign: "middle", ...style }}
    >
      {threshold !== undefined && (
        <line
          x1={0}
          y1={height - ((threshold - min) / range) * (height - 4) - 2}
          x2={width}
          y2={height - ((threshold - min) / range) * (height - 4) - 2}
          stroke={thresholdValue}
          strokeWidth={1}
          strokeDasharray="2 2"
          opacity={0.5}
        />
      )}
      <polyline
        points={points}
        fill="none"
        stroke={strokeValue}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}