import type { ReactNode } from "react";
import SectionHeading from "../../../shared/SectionHeading/SectionHeading";

interface Props {
  titleId: string;
  title: string;
  children: ReactNode;
}

const EditorPanel = ({ titleId, title, children }: Props) => (
  <section
    aria-labelledby={titleId}
    className="grid min-w-0 gap-4 rounded-xl border border-app-border bg-app-surface p-4 [&>*]:min-w-0"
  >
    <SectionHeading id={titleId} title={title} className="mb-0" />
    {children}
  </section>
);

export default EditorPanel;
