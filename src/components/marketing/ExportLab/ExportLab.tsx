import { Badge, Button, InfoMessage, Input, TextArea } from "@gi-org-pl/athena";
import { useEffect, useRef, useState } from "react";
import {
  canvasToBlob,
  formats,
  loadGraphicFonts,
  renderGraphic,
} from "./renderGraphic";

interface Preview {
  id: string;
  url: string;
  file: File;
}

export default function ExportLab() {
  const [title, setTitle] = useState("Dobre idee zmieniają świat.");
  const [detail, setDetail] = useState(
    "Łączymy technologię i społeczne zaangażowanie. Działaj razem z nami!",
  );
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  const [focalX, setFocalX] = useState(50);
  const [focalY, setFocalY] = useState(50);
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [error, setError] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(true);
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const photoRequest = useRef(0);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const urls: string[] = [];
    setBusy(true);
    setError("");
    setPreviews([]);
    async function prepare() {
      try {
        await loadGraphicFonts();
        const results: Preview[] = [];
        // Sequential rendering bounds peak memory on phones.
        for (const format of formats) {
          if (cancelled) return;
          const canvas = renderGraphic(
            { title, detail, photo, focalX, focalY },
            format,
          );
          const blob = await canvasToBlob(canvas);
          canvas.width = 0;
          canvas.height = 0;
          if (cancelled) return;
          const url = URL.createObjectURL(blob);
          urls.push(url);
          results.push({
            id: format.id,
            url,
            file: new File([blob], `gi-test-${format.id}.png`, {
              type: "image/png",
            }),
          });
        }
        if (!cancelled) {
          setPreviews(results);
          setCanShare(
            typeof navigator.canShare === "function" &&
              navigator.canShare({ files: [results[0].file] }),
          );
        }
      } catch (cause) {
        if (!cancelled)
          setError(
            cause instanceof Error
              ? cause.message
              : "Nie udało się przygotować grafik.",
          );
      } finally {
        if (!cancelled) setBusy(false);
      }
    }
    void prepare();
    return () => {
      cancelled = true;
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, [title, detail, photo, focalX, focalY]);

  async function selectPhoto(file?: File) {
    if (!file) return;
    const request = ++photoRequest.current;
    setPhotoError("");
    setLoadingPhoto(false);
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 12 * 1024 * 1024
    ) {
      setPhotoError(
        "Wybierz JPG, PNG lub WebP do 12 MB. Zdjęcie HEIC zapisz najpierw jako JPG.",
      );
      return;
    }
    setLoadingPhoto(true);
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      if (image.naturalWidth * image.naturalHeight > 40_000_000)
        throw new Error("Zbyt duże zdjęcie.");
      if (request === photoRequest.current) {
        setPhoto(image);
        setFocalX(50);
        setFocalY(50);
      }
    } catch {
      if (request === photoRequest.current)
        setPhotoError(
          "Nie udało się odczytać zdjęcia. Wybierz mniejszy plik JPG lub PNG.",
        );
    } finally {
      URL.revokeObjectURL(url);
      if (request === photoRequest.current) setLoadingPhoto(false);
    }
  }

  async function share(file: File) {
    try {
      // File is prepared before the tap: iOS requires a live user activation.
      await navigator.share({ files: [file] });
      setStatus("Grafika przekazana do systemowego udostępniania.");
    } catch (cause) {
      if (!(cause instanceof DOMException && cause.name === "AbortError"))
        setStatus(
          "Udostępnianie nie powiodło się. Pobierz PNG i dodaj je w aplikacji.",
        );
    }
  }

  return (
    <>
      <div className="page-heading compact">
        <span className="eyebrow">MARKETING / LABORATORIUM EKSPORTU</span>
        <h1>
          Jedna treść. Cztery formaty<span className="accent-dot">.</span>
        </h1>
        <p>
          Sprawdź, jak Twoja treść wygląda i zapisuje się na różnych
          urządzeniach.
        </p>
      </div>
      <InfoMessage variant="info">
        Układ demonstracyjny do akceptacji fundamentu. To jeszcze nie jest
        zatwierdzony szablon GI. Treść i zdjęcie pozostają w tej przeglądarce;
        po odświeżeniu zostaną wyczyszczone.
      </InfoMessage>
      <div className="editor-layout">
        <section className="editor-panel" aria-labelledby="content-title">
          <div className="section-heading">
            <h2 id="content-title">Twoja treść</h2>
            <span className="step-number">01</span>
          </div>
          <Input
            id="headline"
            label="Nagłówek"
            value={title}
            onChange={setTitle}
            isError={title.length > 90}
            helper={`${title.length} / 90 znaków`}
          />
          <TextArea
            id="detail"
            label="Szczegóły"
            aria-label="Szczegóły"
            value={detail}
            onChange={setDetail}
            rows={4}
            isError={detail.length > 140}
            helper={`${detail.length} / 140 znaków`}
          />
          <div className="photo-field">
            <label htmlFor="photo">
              Zdjęcie <span>opcjonalne</span>
            </label>
            <div className="upload-box">
              <span aria-hidden="true">↥</span>
              <strong>Dodaj własne zdjęcie</strong>
              <small>JPG, PNG, WebP · do 12 MB</small>
              <input
                id="photo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  void selectPhoto(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </div>
          </div>
          {loadingPhoto && <p role="status">Wczytywanie zdjęcia…</p>}
          {photoError && (
            <p role="alert" className="error-text">
              {photoError}
            </p>
          )}
          {photo && (
            <div className="crop-controls">
              <p>Co ma zostać w kadrze?</p>
              <label htmlFor="focal-x">
                Poziomo{" "}
                <input
                  id="focal-x"
                  type="range"
                  min="0"
                  max="100"
                  value={focalX}
                  onChange={(event) => setFocalX(Number(event.target.value))}
                />
              </label>
              <label htmlFor="focal-y">
                Pionowo{" "}
                <input
                  id="focal-y"
                  type="range"
                  min="0"
                  max="100"
                  value={focalY}
                  onChange={(event) => setFocalY(Number(event.target.value))}
                />
              </label>
              <Button
                type="ghost"
                size="small"
                onClick={() => {
                  ++photoRequest.current;
                  setLoadingPhoto(false);
                  setPhoto(null);
                }}
              >
                Usuń zdjęcie
              </Button>
            </div>
          )}
          <div className="editor-tip">
            <span aria-hidden="true">✳</span>
            <p>
              Ty wybierasz słowa.
              <br />
              <b>Układ dba o resztę.</b>
            </p>
          </div>
        </section>
        <section
          className="previews-panel"
          aria-labelledby="preview-title"
          aria-busy={busy || loadingPhoto}
        >
          <div className="section-heading">
            <h2 id="preview-title">Podgląd formatów</h2>
            <Badge variant="secondary" type={error ? "error" : "info"}>
              {busy
                ? "Przygotowywanie…"
                : error
                  ? "Popraw treść"
                  : "PNG · gotowe"}
            </Badge>
          </div>
          <p className="preview-description">
            Podgląd jest dokładnie tym plikiem, który pobierzesz.
          </p>
          {error && (
            <div role="alert">
              <InfoMessage variant="error">{error}</InfoMessage>
            </div>
          )}
          <div className="preview-grid">
            {formats.map((format) => {
              const preview = previews.find((item) => item.id === format.id);
              return (
                <article className="preview-card" key={format.id}>
                  <div className="preview-stage">
                    {preview ? (
                      <img
                        src={preview.url}
                        width={format.width}
                        height={format.height}
                        alt={`${format.name}: ${title}. ${detail}`}
                      />
                    ) : (
                      <div className="preview-placeholder">
                        {busy
                          ? "Przygotowujemy grafikę…"
                          : "Popraw treść, aby zobaczyć grafikę"}
                      </div>
                    )}
                  </div>
                  <div className="preview-meta">
                    <h3>{format.name}</h3>
                    <p>{format.platforms}</p>
                    <span>
                      {format.width} × {format.height} px
                    </span>
                  </div>
                  <div className="preview-actions">
                    {preview && !loadingPhoto && (
                      <>
                        <Button asChild type="outlined" size="small">
                          <a
                            href={preview.url}
                            download={preview.file.name}
                            aria-label={`Pobierz ${format.name} PNG`}
                          >
                            Pobierz PNG ↓
                          </a>
                        </Button>
                        {canShare && (
                          <Button
                            type="ghost"
                            size="small"
                            aria-label={`Udostępnij ${format.name}`}
                            onClick={() => void share(preview.file)}
                          >
                            Udostępnij ↗
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
          <p className="share-note">
            Na obsługiwanym telefonie pojawi się „Udostępnij”. Dostępne
            aplikacje wybiera system urządzenia.
          </p>
          <p role="status" className="status-message">
            {status}
          </p>
        </section>
      </div>
    </>
  );
}
