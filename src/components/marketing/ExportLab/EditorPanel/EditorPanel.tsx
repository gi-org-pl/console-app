import type { ReactNode } from "react";
import SectionHeading from "../../../shared/SectionHeading/SectionHeading";

interface Props {
  titleId: string;
  title: string;
  /** Content aligned right of the title, e.g. a quick action. */
  aside?: ReactNode;
  children: ReactNode;
}

const EditorPanel = ({ titleId, title, aside, children }: Props) => (
  <section
    aria-labelledby={titleId}
    className="grid min-w-0 gap-4 rounded-xl border border-app-border bg-app-surface p-4 [&>*]:min-w-0"
  >
    <SectionHeading id={titleId} title={title} aside={aside} className="mb-0" />
    {children}
  </section>
);

export default EditorPanel;
