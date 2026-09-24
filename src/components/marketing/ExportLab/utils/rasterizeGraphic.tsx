import { domToBlob } from "modern-screenshot";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import type {
  GraphicContent,
  GraphicFormat,
  GraphicTemplate,
} from "../ExportLab.types";
import { contentOverflows } from "./contentOverflows";

/**
 * Renders the template's HTML off screen at the format's exact pixel size
 * and turns it into the PNG used both as preview and as download.
 * A scale below 1 gives a smaller image of the same layout, e.g. for thumbnails.
 */
export async function rasterizeGraphic(
  template: GraphicTemplate,
  content: GraphicContent,
  format: GraphicFormat,
  scale = 1,
): Promise<{ blob: Blob; hasOverflow: boolean }> {
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.className = "pointer-events-none fixed top-0 -left-[100000px]";
  document.body.append(host);
  const root = createRoot(host);
  try {
    flushSync(() =>
      root.render(<template.Component {...content} format={format} />),
    );
    const node = host.firstElementChild;
    if (!(node instanceof HTMLElement))
      throw new Error("Szablon nie wyrenderował grafiki.");
    await Promise.all(
      Array.from(node.querySelectorAll("img"), (image) => image.decode()),
    );
    const hasOverflow = contentOverflows(node);
    const blob = await domToBlob(node, {
      width: format.width,
      height: format.height,
      scale,
      type: "image/png",
    });
    return { blob, hasOverflow };
  } finally {
    root.unmount();
    host.remove();
  }
}
