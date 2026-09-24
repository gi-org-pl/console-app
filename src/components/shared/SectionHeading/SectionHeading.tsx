import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

interface Props {
  id: string;
  title: string;
  /** Content aligned to the right, e.g. a badge or a step number. */
  aside?: ReactNode;
  className?: string;
}

const SectionHeading = ({ id, title, aside, className }: Props) => (
  <div
    className={twMerge(
      "mb-4 flex flex-wrap items-center justify-between gap-4 sm:flex-nowrap",
      className,
    )}
  >
    <h2 id={id} className="font-display text-base font-semibold">
      {title}
    </h2>
    {aside}
  </div>
);

export default SectionHeading;
