const overflowsX = (element: HTMLElement) =>
  element.scrollWidth > element.clientWidth + 1;
const overflowsY = (element: HTMLElement) =>
  element.scrollHeight > element.clientHeight + 1;

/** Check marked text areas without preventing the user from exporting the result. */
export function contentOverflows(root: HTMLElement): boolean {
  return Array.from(root.querySelectorAll<HTMLElement>("[data-fit]")).some(
    (box) =>
      Array.from(box.querySelectorAll<HTMLElement>("[data-field]")).some(
        overflowsX,
      ) ||
      overflowsX(box) ||
      overflowsY(box),
  );
}
