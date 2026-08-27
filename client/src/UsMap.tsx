import { useMemo } from "react";
import { geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
// Pre-projected (Albers USA) US state boundaries — Alaska/Hawaii already inset.
// Source: us-atlas (public domain, US Census Bureau data via topojson).
import usStatesTopology from "us-atlas/states-albers-10m.json";
import type { Category, Assignments } from "./types";

const UNASSIGNED_FILL = "#cccccc";
const STROKE_COLOR = "#ffffff";
const STRIPE_TILE = 8; // user-space units per diagonal stripe tile, for multi-category states

// DC's real land area is a few pixels across at this scale — practically unclickable.
// It's rendered as a fixed-size circle over its centroid instead of its true shape.
const DC_NAME = "District of Columbia";
const DC_RADIUS = 6;

interface UsMapProps {
  categories: Category[];
  assignments: Assignments;
  paintingEnabled: boolean;
  onStateClick: (stateName: string) => void;
  hoveredState: string | null;
  onHoverState: (stateName: string | null) => void;
}

interface RenderFeature {
  key: string;
  stateName: string;
  d: string | null;
  center: [number, number];
  fill: string;
  patternColors: string[] | null;
  tooltip: string;
}

export function UsMap({
  categories,
  assignments,
  paintingEnabled,
  onStateClick,
  hoveredState,
  onHoverState,
}: UsMapProps) {
  const { renderFeatures, viewBox } = useMemo(() => {
    const topology = usStatesTopology as unknown as Topology;
    const statesObject = topology.objects.states as GeometryCollection;
    const collection = feature(topology, statesObject);
    const [minX, minY, maxX, maxY] = topology.bbox ?? [0, 0, 960, 600];
    // states-albers-10m ships pre-projected coordinates, so geoPath needs no projection.
    const pathGenerator = geoPath();

    const built: RenderFeature[] = collection.features.map((f) => {
      const stateName = (f.properties as { name: string }).name;
      const key = String(f.id ?? stateName);
      const assignedCategories = (assignments[stateName] ?? [])
        .map((id) => categories.find((c) => c.id === id))
        .filter((c): c is Category => Boolean(c));

      let fill = UNASSIGNED_FILL;
      let patternColors: string[] | null = null;
      if (assignedCategories.length === 1) {
        fill = assignedCategories[0].color;
      } else if (assignedCategories.length > 1) {
        patternColors = assignedCategories.map((c) => c.color);
        fill = `url(#stripes-${key})`;
      }

      return {
        key,
        stateName,
        d: pathGenerator(f),
        center: pathGenerator.centroid(f),
        fill,
        patternColors,
        tooltip: assignedCategories.length
          ? `${stateName} — ${assignedCategories.map((c) => c.name).join(", ")}`
          : stateName,
      };
    });

    return {
      renderFeatures: built,
      viewBox: `${minX} ${minY} ${maxX - minX} ${maxY - minY}`,
    };
  }, [assignments, categories]);

  const dc = renderFeatures.find((f) => f.stateName === DC_NAME);
  const otherFeatures = renderFeatures.filter((f) => f.stateName !== DC_NAME);
  const patternedFeatures = renderFeatures.filter(
    (f): f is RenderFeature & { patternColors: string[] } => f.patternColors !== null,
  );

  const interactiveProps = (f: RenderFeature) => ({
    fill: f.fill,
    stroke: STROKE_COLOR,
    strokeWidth: hoveredState === f.stateName ? 1.5 : 0.75,
    className: paintingEnabled ? "state paintable" : "state",
    onClick: () => onStateClick(f.stateName),
    onMouseEnter: () => onHoverState(f.stateName),
    onMouseLeave: () => onHoverState(null),
  });

  return (
    <svg viewBox={viewBox} role="img" aria-label="Clickable map of the United States" className="us-map">
      <defs>
        {patternedFeatures.map((f) => {
          const stripeWidth = STRIPE_TILE / f.patternColors.length;
          return (
            <pattern
              key={f.key}
              id={`stripes-${f.key}`}
              patternUnits="userSpaceOnUse"
              width={STRIPE_TILE}
              height={STRIPE_TILE}
              patternTransform="rotate(45)"
            >
              {f.patternColors.map((color, i) => (
                <rect key={i} x={stripeWidth * i} y={0} width={stripeWidth} height={STRIPE_TILE} fill={color} />
              ))}
            </pattern>
          );
        })}
      </defs>

      {otherFeatures.map((f) => (
        <path key={f.key} data-state={f.stateName} d={f.d ?? undefined} {...interactiveProps(f)}>
          <title>{f.tooltip}</title>
        </path>
      ))}

      {dc && (
        <circle
          key={dc.key}
          data-state={dc.stateName}
          cx={dc.center[0]}
          cy={dc.center[1]}
          r={DC_RADIUS}
          {...interactiveProps(dc)}
        >
          <title>{dc.tooltip}</title>
        </circle>
      )}
    </svg>
  );
}
