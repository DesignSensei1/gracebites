import Svg, { Circle, ClipPath, Defs, G, Path, Rect } from "react-native-svg";
import { FLAVOUR_TINTS } from "@/lib/menu";

const KERNELS: [number, number, number][] = [
  [30, 30, 11], [44, 22, 12], [58, 20, 12], [72, 26, 11], [84, 34, 10],
  [22, 40, 10], [38, 38, 11], [52, 34, 12], [66, 38, 11], [80, 42, 10],
  [28, 50, 9], [46, 48, 10], [62, 50, 10], [76, 50, 9], [50, 12, 9],
];

const BUCKET = "M16 52 L92 52 L82 114 Q81 118 77 118 L31 118 Q27 118 26 114 Z";

/** Striped sky-blue popcorn bucket, kernels tinted by flavour (same art as the website). */
export function PopcornBucket({ flavour = "salted", size = 96 }: { flavour?: string; size?: number }) {
  const tint = FLAVOUR_TINTS[flavour] ?? FLAVOUR_TINTS.salted;
  const clipId = `clip-${flavour}`;
  return (
    <Svg viewBox="0 0 108 120" width={size} height={(size * 120) / 108}>
      <Defs>
        <ClipPath id={clipId}>
          <Path d={BUCKET} />
        </ClipPath>
      </Defs>
      {KERNELS.map(([x, y, r], i) => (
        <G key={i}>
          <Circle cx={x} cy={y + 4} r={r} fill={tint.shade} />
          <Circle cx={x} cy={y} r={r} fill={tint.kernel} stroke={tint.shade} strokeWidth={1.2} />
          <Circle cx={x - r / 3} cy={y - r / 3} r={r / 3.5} fill="#ffffff" opacity={0.55} />
        </G>
      ))}
      <G clipPath={`url(#${clipId})`}>
        <Rect x={0} y={50} width={108} height={70} fill="#ffffff" />
        {[20, 40, 60, 80].map((x) => (
          <Rect key={x} x={x - 2} y={50} width={10} height={70} fill="#38bdf8" transform={`skewX(${(x - 54) / 6})`} />
        ))}
      </G>
      <Path d={BUCKET} fill="none" stroke="#0284c7" strokeWidth={2} />
      <Rect x={12} y={48} width={84} height={8} rx={4} fill="#0ea5e9" />
    </Svg>
  );
}
