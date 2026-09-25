import type { ReactNode } from "react";
import Eyebrow from "../Eyebrow/Eyebrow";

interface Props {
  eyebrow: string;
  /** Rendered with the brand accent full stop appended. */
  title: ReactNode;
  description: ReactNode;
  isCompact?: boolean;
}

const PageHeading = ({ eyebrow, title, description, isCompact }: Props) => (
  <div className={isCompact ? "mb-4" : "mb-8"}>
    <Eyebrow>{eyebrow}</Eyebrow>
    <h1 className="my-2 font-display text-2xl font-semibold">
      {title}
      <span className="text-app-accent">.</span>
    </h1>
    <p className="text-base text-app-muted">{description}</p>
  </div>
);

export default PageHeading;
