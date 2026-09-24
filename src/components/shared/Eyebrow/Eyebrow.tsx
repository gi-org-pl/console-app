import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

interface Props {
  children: ReactNode;
  className?: string;
}

const Eyebrow = ({ children, className }: Props) => (
  <span
    className={twMerge(
      "block text-base font-semibold text-app-muted",
      className,
    )}
  >
    {children}
  </span>
);

export default Eyebrow;
