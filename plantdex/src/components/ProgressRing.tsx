import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

interface Props {
  /** 0–1 */
  progress: number;
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
}

/** Animated circular completion ring (the Collection centerpiece). */
export function ProgressRing({
  progress,
  size = 168,
  stroke = 12,
  children,
}: Props) {
  const reduced = usePrefersReducedMotion();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.max(0, Math.min(1, progress)));

  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(0,0,0,0.3)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ring-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          strokeDasharray={c}
          initial={{ strokeDashoffset: reduced ? offset : c }}
          animate={{ strokeDashoffset: offset }}
          transition={reduced ? { duration: 0 } : { duration: 1, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5bbf6f" />
            <stop offset="100%" stopColor="#9be0b0" />
          </linearGradient>
        </defs>
      </svg>
      <div className="ring__center">{children}</div>
    </div>
  );
}
