import {
  faArrowUpRightFromSquare,
  faCircleCheck,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@gi-org-pl/athena";
import type {
  BufferChannel,
  BufferPublishMode,
} from "../../../../../../services/buffer/schemas/buffer.schemas";
import { SERVICES } from "../PostComposer.constants";
import type { PostKind } from "../PostComposer.types";

interface Props {
  /** What was sent: one entry per channel and kind, so a story shows next to the post of its channel. */
  entries: readonly { channel: BufferChannel; kind: PostKind; key: string }[];
  mode: BufferPublishMode;
  dueAt: string;
  onStartOver: () => void;
}

function describe(mode: BufferPublishMode, dueAt: string) {
  if (mode === "shareNow") return "Opublikowano";
  if (mode === "addToQueue") return "Dodano do kolejki";
  return `Zaplanowano na ${new Date(dueAt).toLocaleString("pl-PL", {
    dateStyle: "medium",
    timeStyle: "short",
  })}`;
}

const PublishSuccess = ({ entries, mode, dueAt, onStartOver }: Props) => (
  <div
    role="status"
    className="grid justify-items-center gap-4 rounded-xl border border-app-border bg-app-surface p-8 text-center"
  >
    <FontAwesomeIcon
      icon={faCircleCheck}
      className="text-4xl text-app-accent-text"
    />
    <div>
      <h3 className="font-display text-base font-semibold">
        {describe(mode, dueAt)}
      </h3>
      <p className="mt-1 text-app-muted">
        Buffer przyjął posty. Ostateczną publikację sprawdzisz w Buffer.
      </p>
    </div>
    <ul className="flex flex-wrap justify-center gap-2">
      {entries.map(({ channel, kind, key }) => (
        <li
          key={key}
          className="inline-flex items-center gap-2 rounded-full border border-app-border px-3 py-1 text-sm"
        >
          <FontAwesomeIcon icon={SERVICES[channel.service].icon} />
          {channel.name}
          {kind === "story" && (
            <span className="text-app-muted">· relacja</span>
          )}
        </li>
      ))}
    </ul>
    <div className="flex flex-wrap justify-center gap-2">
      <Button
        type="primary"
        LeftIcon={<FontAwesomeIcon icon={faPlus} />}
        onClick={onStartOver}
      >
        Nowa publikacja
      </Button>
      <Button
        asChild
        type="outlined"
        RightIcon={<FontAwesomeIcon icon={faArrowUpRightFromSquare} />}
      >
        <a href="https://publish.buffer.com" target="_blank" rel="noreferrer">
          Otwórz Buffer
        </a>
      </Button>
    </div>
  </div>
);

export default PublishSuccess;
