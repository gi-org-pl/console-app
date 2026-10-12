import { type RefObject, useEffect, useMemo } from "react";
import type {
  GraphicPhoto,
  GraphicPreviewsEntry,
  PostGraphic,
} from "../ExportLab.types";
import { getTemplate } from "../utils/getTemplate";
import { useGraphicPreviews } from "../utils/useGraphicPreviews";

interface Props {
  graphic: PostGraphic;
  photo: GraphicPhoto | null;
  /** Shared by the graphics of a post, so only one of them is rasterized at a time. */
  queue: RefObject<Promise<void>>;
  /**
   * Called with every new state of the previews and what they were drawn from,
   * and with `null` when the graphic goes.
   */
  onChange: (graphicId: string, previews: GraphicPreviewsEntry | null) => void;
}

/**
 * Keeps the previews of one graphic of a post up to date. It draws nothing:
 * every graphic needs its PNGs for publishing and download, also while another
 * one is being edited.
 */
const GraphicPreviews = ({ graphic, photo, queue, onChange }: Props) => {
  const { id, templateId, values } = graphic;
  const template = getTemplate(templateId);
  const templatePhoto = template.supportsPhoto ? photo : null;
  const content = useMemo(
    () => ({ values, photo: templatePhoto }),
    [values, templatePhoto],
  );
  const state = useGraphicPreviews(template, content, queue);

  useEffect(() => {
    onChange(id, { state, graphic, photo });
  }, [id, state, graphic, photo, onChange]);
  useEffect(() => () => onChange(id, null), [id, onChange]);

  return null;
};

export default GraphicPreviews;
