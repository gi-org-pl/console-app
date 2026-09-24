import { Badge, InfoMessage } from "@gi-org-pl/athena";
import { useEffect, useState } from "react";
import SectionHeading from "../../../shared/SectionHeading/SectionHeading";
import { GRAPHIC_FORMATS } from "../ExportLab.constants";
import type { PreviewsState } from "../ExportLab.types";
import { canShareFiles } from "../utils/canShareFiles";
import PreviewCard from "./PreviewCard/PreviewCard";
import { STATUS_BADGE_LABEL } from "./PreviewPanel.constants";

interface Props {
  state: PreviewsState;
  /** Text alternative shared by all formats, built from the template fields. */
  description: string;
  isPhotoLoading: boolean;
}

const PreviewPanel = ({ state, description, isPhotoLoading }: Props) => {
  // Probed after mount: the page is prerendered, where `navigator` does not exist.
  const [canShare, setCanShare] = useState(false);
  useEffect(() => setCanShare(canShareFiles()), []);

  async function share(file: File) {
    try {
      // File is prepared before the tap: iOS requires a live user activation.
      await navigator.share({ files: [file] });
    } catch {}
  }

  return (
    <section
      className="min-w-0"
      aria-labelledby="preview-title"
      aria-busy={state.status === "rendering" || isPhotoLoading}
    >
      <SectionHeading
        id="preview-title"
        title="Podgląd formatów"
        className="mb-4"
        aside={
          <Badge
            variant="secondary"
            type={state.status === "error" ? "error" : "default"}
          >
            {STATUS_BADGE_LABEL[state.status]}
          </Badge>
        }
      />
      {/* Field errors are shown next to their inputs; only the rest lands here. */}
      {state.error && state.error.fieldIds.length === 0 && (
        <div role="alert" className="mb-4">
          <InfoMessage variant="error">{state.error.message}</InfoMessage>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {GRAPHIC_FORMATS.map((format) => (
          <PreviewCard
            key={format.id}
            format={format}
            preview={state.previews.find(
              (preview) => preview.formatId === format.id,
            )}
            description={description}
            isRendering={state.status === "rendering"}
            areActionsDisabled={isPhotoLoading}
            canShare={canShare}
            onShare={(file) => void share(file)}
          />
        ))}
      </div>
    </section>
  );
};

export default PreviewPanel;
