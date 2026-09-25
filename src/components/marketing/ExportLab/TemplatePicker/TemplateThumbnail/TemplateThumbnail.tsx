import { useState } from "react";
import { THUMBNAIL_SIZE } from "../../ExportLab.constants";
import Shimmer from "../../Shimmer/Shimmer";

interface Props {
  /** A 1:1 PNG of the template with the current content; absent while it renders. */
  url?: string;
}

/** Keeps the last thumbnail on screen until a newer one exists, so cards never blank. */
const TemplateThumbnail = ({ url }: Props) => {
  const [shownUrl, setShownUrl] = useState(url);
  if (url && url !== shownUrl) setShownUrl(url);

  return (
    <div
      aria-hidden="true"
      className="relative shrink-0 overflow-hidden rounded-md border border-app-border bg-app-surface"
      style={{ width: THUMBNAIL_SIZE, height: THUMBNAIL_SIZE }}
    >
      {shownUrl ? (
        <img src={shownUrl} alt="" className="size-full" />
      ) : (
        <Shimmer className="size-full" />
      )}
    </div>
  );
};

export default TemplateThumbnail;
