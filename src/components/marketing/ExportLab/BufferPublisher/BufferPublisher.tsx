import { faBuffer } from "@fortawesome/free-brands-svg-icons";
import {
  faArrowRightToBracket,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, InfoMessage } from "@gi-org-pl/athena";
import { useState } from "react";
import { useBufferSessionStore } from "../../../../services/buffer/utils/useBufferSession";
import type { Preview, PreviewsState } from "../ExportLab.types";
import PostComposer from "./PostComposer/PostComposer";

interface Props {
  /** The previews of every graphic of the post, in the order they are published. */
  graphics: readonly PreviewsState[];
}

const NO_IMAGES: readonly Preview[] = [];

const BufferPublisher = ({ graphics }: Props) => {
  const { status, session, error, checkSession, connect } =
    useBufferSessionStore();
  // Editing a graphic briefly empties its previews; keeping the last ready set
  // of each one stops the composer, and the post being written, from resetting.
  const [images, setImages] = useState<readonly (readonly Preview[])[]>([]);
  const latest = graphics.map((state, index) =>
    state.status === "ready" ? state.previews : (images[index] ?? NO_IMAGES),
  );
  if (
    latest.length !== images.length ||
    latest.some((set, index) => set !== images[index])
  ) {
    setImages(latest);
  }
  const graphicStatus = graphics.some(({ status }) => status === "error")
    ? "error"
    : graphics.some(({ status }) => status === "rendering")
      ? "rendering"
      : "ready";

  return (
    <section
      aria-labelledby="publish-title"
      className="mt-12 border-t border-app-border pt-8"
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2
            id="publish-title"
            className="font-display text-2xl font-semibold"
          >
            Publikacja<span className="text-app-accent">.</span>
          </h2>
          <p className="mt-1 text-app-muted">
            Opublikuj grafikę na kanałach fundacji przez Buffer.
          </p>
        </div>
        {session && (
          <p className="inline-flex min-w-0 items-center gap-2 text-sm text-app-muted">
            <FontAwesomeIcon icon={faBuffer} className="text-app-text" />
            <span className="truncate">{session.email}</span>
          </p>
        )}
      </div>
      {status === "checking" && (
        <p role="status" className="flex items-center gap-2 text-app-muted">
          <FontAwesomeIcon icon={faSpinner} spin />
          Sprawdzanie połączenia z Buffer…
        </p>
      )}
      {status === "error" && (
        <div className="grid justify-items-start gap-4">
          <InfoMessage variant="error">{error}</InfoMessage>
          <Button type="outlined" onClick={() => void checkSession()}>
            Spróbuj ponownie
          </Button>
        </div>
      )}
      {status === "disconnected" && (
        <div className="grid justify-items-center gap-4 rounded-xl border border-app-border bg-app-surface p-8 text-center">
          <span
            aria-hidden="true"
            className="grid size-14 place-items-center rounded-full bg-app-surface-2 text-2xl"
          >
            <FontAwesomeIcon icon={faBuffer} />
          </span>
          <div className="max-w-md">
            <h3 className="font-display text-base font-semibold">
              Zaloguj się, aby publikować
            </h3>
            <p className="mt-1 text-app-muted">
              Publikacja jest dostępna dla zespołu fundacji. Grafiki możesz
              pobrać bez logowania.
            </p>
          </div>
          <Button
            type="primary"
            LeftIcon={<FontAwesomeIcon icon={faArrowRightToBracket} />}
            onClick={() => void connect()}
          >
            Zaloguj się
          </Button>
        </div>
      )}
      {status === "connected" && session && (
        <PostComposer
          session={session}
          graphics={images}
          graphicStatus={graphicStatus}
        />
      )}
    </section>
  );
};

export default BufferPublisher;
