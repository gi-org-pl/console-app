import { InfoMessage } from "@gi-org-pl/athena";
import { useMemo, useState } from "react";
import PageHeading from "../../shared/PageHeading/PageHeading";
import ContentForm from "./ContentForm/ContentForm";
import { GRAPHIC_FORMATS, GRAPHIC_TEMPLATES } from "./ExportLab.constants";
import type { Draft } from "./ExportLab.types";
import PreviewPanel from "./PreviewPanel/PreviewPanel";
import TemplatePicker from "./TemplatePicker/TemplatePicker";
import { describeContent } from "./utils/describeContent";
import { getDefaultFieldValues } from "./utils/getDefaultFieldValues";
import { getTemplate } from "./utils/getTemplate";
import { useGraphicPreviews } from "./utils/useGraphicPreviews";
import { usePhoto } from "./utils/usePhoto";
import { useTemplateThumbnails } from "./utils/useTemplateThumbnails";

const ExportLab = () => {
  const [draft, setDraft] = useState<Draft>(() => ({
    templateId: GRAPHIC_TEMPLATES[0].id,
    values: getDefaultFieldValues(),
  }));
  const photo = usePhoto();
  const template = getTemplate(draft.templateId);
  const templatePhoto = template.supportsPhoto ? photo.photo : null;
  const content = useMemo(
    () => ({ values: draft.values, photo: templatePhoto }),
    [draft.values, templatePhoto],
  );
  const previews = useGraphicPreviews(template, content);
  const otherThumbnails = useTemplateThumbnails(
    GRAPHIC_TEMPLATES,
    draft.values,
    photo.photo,
    template.id,
  );
  // The selected template's thumbnail is its square preview, already rendered.
  const thumbnails = {
    ...otherThumbnails,
    [template.id]: previews.previews.find(
      (preview) => preview.formatId === GRAPHIC_FORMATS[0].id,
    )?.url,
  };

  return (
    <>
      <PageHeading
        isCompact
        eyebrow="Marketing / Grafiki"
        title="Generator grafik"
        description="Wybierz szablon i wygeneruj grafikę."
      />
      <div className="mt-8 grid items-start gap-4 tablet:grid-cols-[272px_minmax(0,1fr)] desktop:grid-cols-[320px_minmax(0,1fr)] desktop:gap-8">
        <div className="grid min-w-0 gap-4">
          <TemplatePicker
            templates={GRAPHIC_TEMPLATES}
            selectedId={template.id}
            thumbnails={thumbnails}
            onSelect={(templateId) =>
              setDraft((prev) => ({ ...prev, templateId }))
            }
          />
          <ContentForm
            template={template}
            values={draft.values}
            error={previews.error}
            onChange={(fieldId, value) =>
              setDraft((prev) => ({
                ...prev,
                values: { ...prev.values, [fieldId]: value },
              }))
            }
            photo={photo}
          />
        </div>
        <PreviewPanel
          state={previews}
          description={describeContent(template, draft.values)}
          isPhotoLoading={photo.isLoading}
        />
      </div>
    </>
  );
};

export default ExportLab;
