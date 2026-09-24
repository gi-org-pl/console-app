/** Whether the system share sheet accepts PNG files; checked once, before any file exists. */
export function canShareFiles() {
  return (
    typeof navigator.canShare === "function" &&
    navigator.canShare({
      files: [new File([""], "probe.png", { type: "image/png" })],
    })
  );
}
