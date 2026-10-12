import {
  faArrowLeft,
  faArrowRight,
  faPlus,
  faTrash,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import EditorPanel from "../EditorPanel/EditorPanel";
import TemplateThumbnail from "../TemplatePicker/TemplateThumbnail/TemplateThumbnail";
import type { GraphicListItem } from "./GraphicList.types";

interface Props {
  /** The graphics of the post, in the order they are published. */
  items: readonly GraphicListItem[];
  activeId: string;
  canAdd: boolean;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onMove: (id: string, by: -1 | 1) => void;
  onRemove: (id: string) => void;
}

const ACTION_CLASS_NAME =
  "inline-flex size-9 items-center justify-center rounded-lg border border-app-border transition-colors hover:bg-app-hover disabled:cursor-not-allowed disabled:opacity-40";

/** The graphics of one post: which one is edited, their order, adding and removing. */
const GraphicList = ({
  items,
  activeId,
  canAdd,
  onSelect,
  onAdd,
  onMove,
  onRemove,
}: Props) => {
  const activeIndex = items.findIndex(({ id }) => id === activeId);
  const activeNumber = activeIndex + 1;

  return (
    <EditorPanel titleId="graphics-title" title="Grafiki posta">
      <div
        role="radiogroup"
        aria-labelledby="graphics-title"
        className="flex flex-wrap gap-2"
      >
        {items.map(({ id, thumbnailUrl, hasOverflow }, index) => (
          <label
            key={id}
            title={hasOverflow ? "Możliwe ucięcie treści" : undefined}
            className="relative cursor-pointer rounded-lg border border-app-border p-1 hover:bg-app-hover has-checked:border-app-accent has-checked:bg-app-accent/10 has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-app-focus"
          >
            {/* The card shows the selection; the radio stays for keyboard and screen readers. */}
            <input
              type="radio"
              name="post-graphic"
              value={id}
              checked={id === activeId}
              onChange={() => onSelect(id)}
              aria-label={`Grafika ${index + 1}${hasOverflow ? ": możliwe ucięcie treści" : ""}`}
              className="sr-only"
            />
            <TemplateThumbnail url={thumbnailUrl} />
            <span
              aria-hidden="true"
              className="absolute top-0 left-0 grid size-5 place-items-center rounded-tl-lg rounded-br-lg bg-app-bg/80 text-xs leading-none font-semibold"
            >
              {index + 1}
            </span>
            {/* A mark of its own: the frame already says which graphic is edited. */}
            {hasOverflow && (
              <span
                aria-hidden="true"
                data-overflow-mark
                className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full border-2 border-app-surface bg-red-500 text-[10px] text-white"
              >
                <FontAwesomeIcon icon={faTriangleExclamation} />
              </span>
            )}
          </label>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={!canAdd}
          onClick={onAdd}
          title="Nowa grafika zaczyna jako kopia bieżącej"
          className="inline-flex items-center gap-2 rounded-lg border border-app-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-app-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          <FontAwesomeIcon icon={faPlus} />
          Dodaj grafikę
        </button>
        {items.length > 1 && (
          <span className="ml-auto flex gap-1">
            <button
              type="button"
              disabled={activeIndex === 0}
              onClick={() => onMove(activeId, -1)}
              aria-label={`Przesuń grafikę ${activeNumber} wcześniej`}
              title="Przesuń wcześniej"
              className={ACTION_CLASS_NAME}
            >
              <FontAwesomeIcon icon={faArrowLeft} />
            </button>
            <button
              type="button"
              disabled={activeIndex === items.length - 1}
              onClick={() => onMove(activeId, 1)}
              aria-label={`Przesuń grafikę ${activeNumber} później`}
              title="Przesuń później"
              className={ACTION_CLASS_NAME}
            >
              <FontAwesomeIcon icon={faArrowRight} />
            </button>
            <button
              type="button"
              onClick={() => onRemove(activeId)}
              aria-label={`Usuń grafikę ${activeNumber}`}
              title="Usuń grafikę"
              className={ACTION_CLASS_NAME}
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </span>
        )}
      </div>
    </EditorPanel>
  );
};

export default GraphicList;
