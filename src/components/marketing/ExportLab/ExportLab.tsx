import { useCallback, useRef, useState } from "react";
import PageHeading from "../../shared/PageHeading/PageHeading";
import BufferPublisher from "./BufferPublisher/BufferPublisher";
import ContentForm from "./ContentForm/ContentForm";
import { GRAPHIC_FORMATS, GRAPHIC_TEMPLATES } from "./ExportLab.constants";
import type {
  GraphicPreviewsEntry,
  PostGraphic,
  PreviewsState,
} from "./ExportLab.types";
import GraphicList from "./GraphicList/GraphicList";
import GraphicPreviews from "./GraphicPreviews/GraphicPreviews";
import PreviewPanel from "./PreviewPanel/PreviewPanel";
import TemplatePicker from "./TemplatePicker/TemplatePicker";
import { describeContent } from "./utils/describeContent";
import { getTemplate } from "./utils/getTemplate";
import { usePostGraphics } from "./utils/usePostGraphics";
import { usePostPhotos } from "./utils/usePostPhotos";
import { useTemplateThumbnails } from "./utils/useTemplateThumbnails";

const RENDERING_STATE: PreviewsState = {
  status: "rendering",
  previews: [],
  error: null,
};

const getSquareUrl = (state?: PreviewsState) =>
  state?.previews.find(({ formatId }) => formatId === GRAPHIC_FORMATS[0].id)
    ?.url;

const ExportLab = () => {
  const post = usePostGraphics();
  const { graphics, active, activeIndex } = post;
  const photos = usePostPhotos(active.id);
  // One queue for the whole post: its graphics are rasterized one after another.
  const renderQueue = useRef(Promise.resolve());
  const [previewsById, setPreviewsById] = useState<
    Readonly<Record<string, GraphicPreviewsEntry>>
  >({});
  const handlePreviews = useCallback(
    (graphicId: string, previews: GraphicPreviewsEntry | null) =>
      setPreviewsById(({ [graphicId]: _previous, ...rest }) =>
        previews ? { ...rest, [graphicId]: previews } : rest,
      ),
    [],
  );
  // Previews count only for the graphic and the photo they were drawn from. A
  // graphic that changed is being rendered from the moment it changed, so
  // nothing downstream can take the previews of what it was before for ready.
  const previewsOf = (graphic: PostGraphic): PreviewsState => {
    const entry = previewsById[graphic.id];
    return entry?.graphic === graphic &&
      entry.photo === photos.photoOf(graphic.id)
      ? entry.state
      : RENDERING_STATE;
  };

  const template = getTemplate(active.templateId);
  const previews = previewsOf(active);
  const otherThumbnails = useTemplateThumbnails(
    GRAPHIC_TEMPLATES,
    active.values,
    photos.controls.photo,
    template.id,
  );
  // The selected template's thumbnail is its square preview, already rendered.
  const thumbnails = {
    ...otherThumbnails,
    [template.id]: getSquareUrl(previews),
  };

  function addGraphic() {
    const sourceId = active.id;
    const copyId = post.add();
    if (copyId) photos.copy(sourceId, copyId);
  }

  function removeGraphic(graphicId: string) {
    if (graphics.length === 1) return;
    post.remove(graphicId);
    photos.drop(graphicId);
  }

  return (
    <>
      <PageHeading
        isCompact
        eyebrow="Marketing"
        title="Generator grafik"
        description="Wybierz szablon, wygeneruj grafikę i opublikuj ją w social mediach."
      />
      {graphics.map((graphic) => (
        <GraphicPreviews
          key={graphic.id}
          graphic={graphic}
          photo={photos.photoOf(graphic.id)}
          queue={renderQueue}
          onChange={handlePreviews}
        />
      ))}
      <div className="mt-8 grid items-start gap-4 tablet:grid-cols-[272px_minmax(0,1fr)] desktop:grid-cols-[320px_minmax(0,1fr)] desktop:gap-8">
        <div className="grid min-w-0 gap-4">
          <GraphicList
            items={graphics.map((graphic) => {
              // The thumbnail may lag behind an edit; the warning may not.
              const shown = previewsById[graphic.id]?.state;
              return {
                id: graphic.id,
                thumbnailUrl: getSquareUrl(shown),
                hasOverflow: previewsOf(graphic).previews.some(
                  ({ hasOverflow }) => hasOverflow,
                ),
              };
            })}
            activeId={active.id}
            canAdd={post.canAdd}
            onSelect={post.select}
            onAdd={addGraphic}
            onMove={post.move}
            onRemove={removeGraphic}
          />
          <TemplatePicker
            templates={GRAPHIC_TEMPLATES}
            selectedId={template.id}
            thumbnails={thumbnails}
            onSelect={(templateId) =>
              post.update((draft) => ({ ...draft, templateId }))
            }
          />
          <ContentForm
            template={template}
            values={active.values}
            error={previews.error}
            onChange={(fieldId, value) =>
              post.update((draft) => ({
                ...draft,
                values: { ...draft.values, [fieldId]: value },
              }))
            }
            photo={photos.controls}
          />
        </div>
        <PreviewPanel
          state={previews}
          description={describeContent(template, active.values)}
          isPhotoLoading={photos.controls.isLoading}
          position={{ number: activeIndex + 1, count: graphics.length }}
        />
      </div>
      <BufferPublisher graphics={graphics.map(previewsOf)} />
    </>
  );
};

export default ExportLab;
