import type { KeyboardEvent, PointerEvent } from "react";
import type { GraphicPhoto } from "../../../ExportLab.types";

interface Props {
  photo: GraphicPhoto;
  onChange: (focus: Pick<GraphicPhoto, "focalX" | "focalY">) => void;
}

const KEYBOARD_STEP = 5;
const KEY_MOVES: Record<string, [number, number]> = {
  ArrowLeft: [-KEYBOARD_STEP, 0],
  ArrowRight: [KEYBOARD_STEP, 0],
  ArrowUp: [0, -KEYBOARD_STEP],
  ArrowDown: [0, KEYBOARD_STEP],
};

const clamp = (value: number) => Math.min(100, Math.max(0, Math.round(value)));

/**
 * The whole photo with a draggable point marking what every format keeps in
 * frame, so one choice works for square, story and wide crops alike.
 */
const FocalPointPicker = ({ photo, onChange }: Props) => {
  function pick(event: PointerEvent<HTMLDivElement>) {
    const frame = event.currentTarget.getBoundingClientRect();
    onChange({
      focalX: clamp(((event.clientX - frame.left) / frame.width) * 100),
      focalY: clamp(((event.clientY - frame.top) / frame.height) * 100),
    });
  }

  function move(event: KeyboardEvent<HTMLDivElement>) {
    const step = KEY_MOVES[event.key];
    if (!step) return;
    event.preventDefault();
    onChange({
      focalX: clamp(photo.focalX + step[0]),
      focalY: clamp(photo.focalY + step[1]),
    });
  }

  return (
    <div
      role="group"
      tabIndex={0}
      aria-label={`Punkt kadrowania: ${photo.focalX}% w poziomie, ${photo.focalY}% w pionie`}
      title="Wskaż, co ma zostać w kadrze"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture?.(event.pointerId);
        pick(event);
      }}
      onPointerMove={(event) => {
        if (event.buttons & 1) pick(event);
      }}
      onKeyDown={move}
      className="relative cursor-crosshair touch-none overflow-hidden rounded-lg border border-app-border select-none"
    >
      <img
        src={photo.url}
        alt="Wybrane zdjęcie"
        draggable={false}
        className="block max-h-48 max-w-full"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute size-4 -translate-1/2 rounded-full border-2 border-app-text bg-app-accent shadow-[0_0_0_2px_rgb(0_0_0/50%)]"
        style={{ left: `${photo.focalX}%`, top: `${photo.focalY}%` }}
      />
    </div>
  );
};

export default FocalPointPicker;
