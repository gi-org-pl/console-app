import {
  GRAPHIC_FORMATS,
  GRAPHIC_TEMPLATES,
} from "../../ExportLab/ExportLab.constants";
import { ContentError } from "../../ExportLab/utils/contentError";
import { getDefaultFieldValues } from "../../ExportLab/utils/getDefaultFieldValues";
import { validateContent } from "../../ExportLab/utils/validateContent";
import {
  FOCAL_DEFAULT,
  FOCAL_MAX,
  FOCAL_MIN,
  PHOTO_EXPECTED,
  RENDER_PARAMS,
} from "../GraphicRender.constants";
import type {
  ParsedRenderParams,
  RenderErrorCode,
  RenderFailure,
  RenderRequest,
} from "../GraphicRender.types";

const RESERVED = new Set<string>(Object.values(RENDER_PARAMS));

const fail = (
  code: RenderErrorCode,
  message: string,
  fieldIds: readonly string[] = [],
): { error: RenderFailure } => ({ error: { code, message, fieldIds } });

const listIds = (items: readonly { id: string }[]) =>
  items.map((item) => item.id).join(", ");

function parseFocal(name: string, raw: string | null) {
  if (raw === null) return FOCAL_DEFAULT;
  const value = Number(raw);
  return raw.trim() !== "" && value >= FOCAL_MIN && value <= FOCAL_MAX
    ? value
    : fail(
        "invalid-photo",
        `Parametr "${name}" musi być liczbą od ${FOCAL_MIN} do ${FOCAL_MAX}.`,
      );
}

/**
 * Turns the render route's query string into what the editor keeps in state:
 * a template, a format and field values, validated by the editor's own rules.
 */
export function parseRenderParams(params: URLSearchParams): ParsedRenderParams {
  const names = [...new Set(params.keys())];
  const duplicate = names.find((name) => params.getAll(name).length > 1);
  if (duplicate)
    return fail(
      "duplicate-parameter",
      `Parametr "${duplicate}" podano więcej niż raz.`,
    );

  for (const name of [RENDER_PARAMS.template, RENDER_PARAMS.format])
    if (!params.get(name))
      return fail("missing-parameter", `Podaj parametr "${name}".`);

  const templateId = params.get(RENDER_PARAMS.template);
  const template = GRAPHIC_TEMPLATES.find((item) => item.id === templateId);
  if (!template)
    return fail(
      "unknown-template",
      `Nieznany szablon "${templateId}". Dostępne: ${listIds(GRAPHIC_TEMPLATES)}.`,
    );

  const formatId = params.get(RENDER_PARAMS.format);
  const format = GRAPHIC_FORMATS.find((item) => item.id === formatId);
  if (!format)
    return fail(
      "unknown-format",
      `Nieznany format "${formatId}". Dostępne: ${listIds(GRAPHIC_FORMATS)}.`,
    );

  const fieldIds = new Set(template.fields.map((field) => field.id));
  const unknown = names.find(
    (name) => !RESERVED.has(name) && !fieldIds.has(name),
  );
  if (unknown)
    return fail(
      "unknown-parameter",
      `Nieznany parametr "${unknown}". Pola szablonu ${template.name}: ${listIds(template.fields)}.`,
    );

  // Same starting point as the editor, so equal values give an equal graphic.
  const values = getDefaultFieldValues();
  for (const id of fieldIds) {
    const value = params.get(id);
    if (value !== null) values[id] = value;
  }

  const photo = params.get(RENDER_PARAMS.photo);
  let photoFocus: RenderRequest["photoFocus"] = null;
  if (photo === null) {
    const stray = [RENDER_PARAMS.focalX, RENDER_PARAMS.focalY].find((name) =>
      params.has(name),
    );
    if (stray)
      return fail(
        "invalid-photo",
        `Parametr "${stray}" wymaga ${RENDER_PARAMS.photo}=${PHOTO_EXPECTED}.`,
      );
  } else {
    if (photo !== PHOTO_EXPECTED)
      return fail(
        "invalid-photo",
        `Parametr "${RENDER_PARAMS.photo}" przyjmuje tylko wartość ${PHOTO_EXPECTED}.`,
      );
    if (!template.supportsPhoto)
      return fail(
        "invalid-photo",
        `Szablon ${template.name} nie obsługuje zdjęcia.`,
      );
    const focalX = parseFocal(
      RENDER_PARAMS.focalX,
      params.get(RENDER_PARAMS.focalX),
    );
    if (typeof focalX !== "number") return focalX;
    const focalY = parseFocal(
      RENDER_PARAMS.focalY,
      params.get(RENDER_PARAMS.focalY),
    );
    if (typeof focalY !== "number") return focalY;
    photoFocus = { focalX, focalY };
  }

  try {
    validateContent(template, values);
  } catch (cause) {
    if (cause instanceof ContentError)
      return fail("invalid-content", cause.message, cause.fieldIds);
    throw cause;
  }

  return { request: { template, format, values, photoFocus } };
}
