import { useEffect, useRef, useState } from "react";
import { PHOTO_ACCEPTED_TYPES } from "../ExportLab.constants";
import type { PhotoControls, PhotoState } from "../ExportLab.types";
import { downscalePhoto } from "./downscalePhoto";

const INITIAL_STATE: PhotoState = { photo: null, isLoading: false, error: "" };

export function usePhoto(): PhotoControls {
  const [state, setState] = useState<PhotoState>(INITIAL_STATE);
  // Only the latest selection may land; slower decodes of older files are dropped.
  const request = useRef(0);
  const currentUrl = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (currentUrl.current) URL.revokeObjectURL(currentUrl.current);
    },
    [],
  );

  function replaceUrl(url: string | null) {
    if (currentUrl.current) URL.revokeObjectURL(currentUrl.current);
    currentUrl.current = url;
  }

  async function select(file?: File) {
    if (!file) return;
    const current = ++request.current;
    if (!PHOTO_ACCEPTED_TYPES.includes(file.type)) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          "Wybierz JPG, PNG lub WebP. Zdjęcie HEIC zapisz najpierw jako JPG.",
      }));
      return;
    }
    setState((prev) => ({ ...prev, isLoading: true, error: "" }));
    try {
      const photo = await downscalePhoto(file);
      if (current !== request.current) return;
      const url = URL.createObjectURL(photo);
      replaceUrl(url);
      setState({
        photo: { url, focalX: 50, focalY: 50 },
        isLoading: false,
        error: "",
      });
    } catch {
      if (current === request.current)
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error:
            "Nie udało się odczytać zdjęcia. Wybierz inny plik JPG, PNG lub WebP.",
        }));
    }
  }

  function setFocus(focus: Parameters<PhotoControls["setFocus"]>[0]) {
    setState((prev) =>
      prev.photo ? { ...prev, photo: { ...prev.photo, ...focus } } : prev,
    );
  }

  function remove() {
    ++request.current;
    replaceUrl(null);
    setState(INITIAL_STATE);
  }

  return { ...state, select, setFocus, remove };
}
