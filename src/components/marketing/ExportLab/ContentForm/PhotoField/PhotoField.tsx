import { faImage, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@gi-org-pl/athena";
import { PHOTO_ACCEPTED_TYPES } from "../../ExportLab.constants";
import type { PhotoControls } from "../../ExportLab.types";
import Shimmer from "../../Shimmer/Shimmer";
import FocalPointPicker from "./FocalPointPicker/FocalPointPicker";

interface Props {
  photo: PhotoControls;
}

const PhotoField = ({ photo }: Props) => (
  <>
    {photo.photo ? (
      <div className="relative mx-auto w-fit">
        <FocalPointPicker photo={photo.photo} onChange={photo.setFocus} />
        <Button
          isIconButton
          type="ghost"
          size="small"
          onClick={photo.remove}
          aria-label="Usuń zdjęcie"
          title="Usuń zdjęcie"
          className="absolute top-2 right-2 size-8 bg-app-bg/70 backdrop-blur-sm hover:bg-app-bg/90"
        >
          <FontAwesomeIcon icon={faTrashCan} />
        </Button>
      </div>
    ) : (
      // Clicking opens the file picker; dropping a file works as well.
      <label
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          void photo.select(event.dataTransfer.files[0]);
        }}
        className="relative grid cursor-pointer place-items-center gap-2 overflow-hidden rounded-lg border border-dashed border-app-border-strong bg-app-surface-2 p-8 text-center transition-colors hover:border-app-accent focus-within:outline-3 focus-within:outline-offset-4 focus-within:outline-app-focus"
      >
        <FontAwesomeIcon icon={faImage} className="text-2xl text-app-accent" />
        Dodaj zdjęcie
        <input
          type="file"
          accept={PHOTO_ACCEPTED_TYPES.join(",")}
          className="sr-only"
          onChange={(event) => {
            void photo.select(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        {photo.isLoading && (
          <Shimmer className="pointer-events-none absolute inset-0 bg-app-surface-2/70" />
        )}
      </label>
    )}
    <p role="status" className="sr-only">
      {photo.isLoading ? "Wczytywanie zdjęcia…" : ""}
    </p>
    {photo.error && (
      <p role="alert" className="text-app-error">
        {photo.error}
      </p>
    )}
  </>
);

export default PhotoField;
