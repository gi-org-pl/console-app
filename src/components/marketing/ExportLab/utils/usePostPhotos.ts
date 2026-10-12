import { useEffect, useRef, useState } from "react";
import { PHOTO_ACCEPTED_TYPES } from "../ExportLab.constants";
import type {
  GraphicPhoto,
  PhotoControls,
  PhotoState,
} from "../ExportLab.types";
import { downscalePhoto } from "./downscalePhoto";

interface Entry extends PhotoState {
  /** Kept so a copy of the graphic can get an object URL of its own. */
  blob: Blob | null;
}

const EMPTY: Entry = { photo: null, isLoading: false, error: "", blob: null };

/**
 * The photos of a post, one per graphic. Every graphic owns the object URL of
 * its photo: it is revoked when the photo is replaced, when the graphic goes,
 * and when the editor unmounts.
 */
export function usePostPhotos(activeId: string) {
  const [entries, setEntries] = useState<Readonly<Record<string, Entry>>>({});
  // Only the latest selection of a graphic may land; slower decodes of older files are dropped.
  const requests = useRef(new Map<string, number>());
  const urls = useRef(new Map<string, string>());

  useEffect(
    () => () => {
      for (const url of urls.current.values()) URL.revokeObjectURL(url);
    },
    [],
  );

  function replaceUrl(id: string, url: string | null) {
    const previous = urls.current.get(id);
    if (previous) URL.revokeObjectURL(previous);
    if (url) urls.current.set(id, url);
    else urls.current.delete(id);
  }

  function nextRequest(id: string) {
    const request = (requests.current.get(id) ?? 0) + 1;
    requests.current.set(id, request);
    return request;
  }

  function patch(id: string, change: (entry: Entry) => Entry) {
    setEntries((prev) => ({ ...prev, [id]: change(prev[id] ?? EMPTY) }));
  }

  async function select(file?: File) {
    if (!file) return;
    const id = activeId;
    const current = nextRequest(id);
    if (!PHOTO_ACCEPTED_TYPES.includes(file.type)) {
      patch(id, (entry) => ({
        ...entry,
        isLoading: false,
        error:
          "Wybierz JPG, PNG lub WebP. Zdjęcie HEIC zapisz najpierw jako JPG.",
      }));
      return;
    }
    patch(id, (entry) => ({ ...entry, isLoading: true, error: "" }));
    try {
      const blob = await downscalePhoto(file);
      if (current !== requests.current.get(id)) return;
      const url = URL.createObjectURL(blob);
      replaceUrl(id, url);
      patch(id, () => ({
        photo: { url, focalX: 50, focalY: 50 },
        isLoading: false,
        error: "",
        blob,
      }));
    } catch {
      if (current === requests.current.get(id))
        patch(id, (entry) => ({
          ...entry,
          isLoading: false,
          error:
            "Nie udało się odczytać zdjęcia. Wybierz inny plik JPG, PNG lub WebP.",
        }));
    }
  }

  function setFocus(focus: Partial<Pick<GraphicPhoto, "focalX" | "focalY">>) {
    patch(activeId, (entry) =>
      entry.photo ? { ...entry, photo: { ...entry.photo, ...focus } } : entry,
    );
  }

  /** Forgets the photo of a graphic, also one that is still being read. */
  function drop(id: string) {
    nextRequest(id);
    replaceUrl(id, null);
    setEntries(({ [id]: _dropped, ...rest }) => rest);
  }

  /** Gives a copied graphic the photo of its source, under a URL of its own. */
  function copy(fromId: string, toId: string) {
    const source = entries[fromId];
    if (!source?.photo || !source.blob) return;
    const url = URL.createObjectURL(source.blob);
    replaceUrl(toId, url);
    patch(toId, () => ({
      ...EMPTY,
      blob: source.blob,
      photo: { ...source.photo, url } as GraphicPhoto,
    }));
  }

  const { photo, isLoading, error } = entries[activeId] ?? EMPTY;
  const controls: PhotoControls = {
    photo,
    isLoading,
    error,
    select,
    setFocus,
    remove: () => drop(activeId),
  };

  return {
    /** The photo of the graphic being edited, as the form uses it. */
    controls,
    photoOf: (id: string) => entries[id]?.photo ?? null,
    copy,
    drop,
  };
}
