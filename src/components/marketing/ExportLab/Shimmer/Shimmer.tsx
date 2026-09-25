import type { CSSProperties } from "react";
import { twMerge } from "tailwind-merge";

interface Props {
  className?: string;
  style?: CSSProperties;
}

/** Decorative loading surface; pair it with a text status for screen readers. */
const Shimmer = ({ className, style }: Props) => (
  <div
    aria-hidden="true"
    data-testid="shimmer"
    style={style}
    className={twMerge(
      "animate-shimmer bg-app-surface bg-linear-to-r from-transparent via-white/10 to-transparent bg-size-[200%_100%] motion-reduce:animate-none",
      className,
    )}
  />
);

export default Shimmer;
