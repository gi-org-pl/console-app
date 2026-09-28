import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@gi-org-pl/athena";
import { useState } from "react";
import type {
  BufferChannel,
  BufferSession,
} from "../../../../../services/buffer/schemas/buffer.schemas";
import EditorPanel from "../../EditorPanel/EditorPanel";
import type { Preview, PreviewsState } from "../../ExportLab.types";
import CaptionField from "./CaptionField/CaptionField";
import ChannelPicker from "./ChannelPicker/ChannelPicker";
import ChannelRow from "./ChannelRow/ChannelRow";
import FormatPicker from "./FormatPicker/FormatPicker";
import { DEFAULT_FORMAT_ID, PUBLISH_MODES } from "./PostComposer.constants";
import type { PostContent, PublishDraft } from "./PostComposer.types";
import PublishSuccess from "./PublishSuccess/PublishSuccess";
import ScheduleField from "./ScheduleField/ScheduleField";
import { getScheduleError } from "./utils/scheduleBounds";
import { usePublishing } from "./utils/usePublishing";
import { getPostIssues } from "./utils/validatePost";

interface Props {
  session: BufferSession;
  images: readonly Preview[];
  graphicStatus: PreviewsState["status"];
}

const TEXT_BUTTON_CLASS_NAME =
  "text-sm font-semibold text-app-accent-text hover:underline disabled:cursor-not-allowed disabled:opacity-60";

function createDraft(channelIds: readonly string[]): PublishDraft {
  return {
    channelIds,
    shared: { formatId: DEFAULT_FORMAT_ID, text: "" },
    overrides: {},
    mode: "addToQueue",
    dueAt: "",
  };
}

/** One post shared by every selected channel, which any channel can override. */
const PostComposer = ({ session, images, graphicStatus }: Props) => {
  const { channels } = session;
  const [draft, setDraft] = useState<PublishDraft>(() =>
    createDraft(channels.length === 1 ? [channels[0].id] : []),
  );
  const { results, isPublishing, publish, reset } = usePublishing();

  const selected = channels.filter(({ id }) => draft.channelIds.includes(id));
  const contentFor = (channelId: string) =>
    draft.overrides[channelId] ?? draft.shared;
  const issuesFor = ({ id, service }: BufferChannel) =>
    getPostIssues(service, contentFor(id));
  const pending = selected.filter(
    ({ id }) => results[id]?.status !== "success",
  );
  const mode = PUBLISH_MODES.find(({ value }) => value === draft.mode);

  if (selected.length > 0 && pending.length === 0) {
    return (
      <PublishSuccess
        channels={selected}
        mode={draft.mode}
        dueAt={draft.dueAt}
        onStartOver={() => {
          reset();
          setDraft(createDraft(draft.channelIds));
        }}
      />
    );
  }

  const pendingIssues = pending.flatMap((channel) =>
    issuesFor(channel).filter(({ level }) => level === "error"),
  );
  const blocker =
    selected.length === 0
      ? "Wybierz co najmniej jeden kanał."
      : graphicStatus === "rendering"
        ? "Poczekaj, aż grafika się przygotuje."
        : graphicStatus === "error"
          ? "Popraw grafikę powyżej, aby ją opublikować."
          : pendingIssues.some(({ code }) => code === "empty")
            ? "Dodaj treść posta."
            : pendingIssues.length > 0
              ? "Popraw posty oznaczone na czerwono."
              : draft.mode === "customScheduled"
                ? getScheduleError(draft.dueAt)
                : null;
  const hasFailures = pending.some(({ id }) => results[id]?.status === "error");
  const sharedServices = selected
    .filter(({ id }) => !draft.overrides[id])
    .map(({ service }) => service);
  const allSelected = selected.length === channels.length;

  function update(patch: Partial<PublishDraft>) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  function toggleChannel(channelId: string) {
    setDraft((prev) => ({
      ...prev,
      channelIds: prev.channelIds.includes(channelId)
        ? prev.channelIds.filter((id) => id !== channelId)
        : [...prev.channelIds, channelId],
    }));
  }

  function setOverride(channelId: string, content: PostContent | null) {
    setDraft((prev) => {
      const { [channelId]: _removed, ...rest } = prev.overrides;
      return {
        ...prev,
        overrides: content ? { ...rest, [channelId]: content } : rest,
      };
    });
  }

  function submit() {
    void publish(
      pending.map(({ id }) => {
        const content = contentFor(id);
        return {
          channelId: id,
          file: images.find(({ formatId }) => formatId === content.formatId)
            ?.file,
          text: content.text.trim(),
          mode: draft.mode,
          dueAt:
            draft.mode === "customScheduled"
              ? new Date(draft.dueAt).toISOString()
              : undefined,
        };
      }),
    );
  }

  return (
    <div className="grid items-start gap-4 tablet:grid-cols-[272px_minmax(0,1fr)] desktop:grid-cols-[320px_minmax(0,1fr)] desktop:gap-8">
      <EditorPanel
        titleId="channels-title"
        title="Kanały"
        aside={
          channels.length > 1 && (
            <button
              type="button"
              disabled={isPublishing}
              onClick={() =>
                update({
                  channelIds: allSelected ? [] : channels.map(({ id }) => id),
                })
              }
              className={TEXT_BUTTON_CLASS_NAME}
            >
              {allSelected ? "Odznacz" : "Zaznacz wszystkie"}
            </button>
          )
        }
      >
        <ChannelPicker
          channels={channels}
          selectedIds={draft.channelIds}
          isDisabled={isPublishing}
          onToggle={toggleChannel}
        />
      </EditorPanel>
      <div className="grid min-w-0 gap-4">
        <EditorPanel titleId="post-title" title="Post">
          <FormatPicker
            name="format-shared"
            label="Grafika"
            images={images}
            value={draft.shared.formatId}
            isDisabled={isPublishing}
            onChange={(formatId) =>
              update({ shared: { ...draft.shared, formatId } })
            }
          />
          <CaptionField
            id="caption-shared"
            label="Treść"
            value={draft.shared.text}
            services={sharedServices}
            isDisabled={isPublishing}
            onChange={(text) => update({ shared: { ...draft.shared, text } })}
          />
        </EditorPanel>
        {selected.length > 0 && (
          <EditorPanel titleId="per-channel-title" title="Na kanałach">
            <p className="-mt-2 text-sm text-app-muted">
              Każdy kanał dostaje wspólny post. Wybierz „Dostosuj”, aby dać mu
              inną grafikę lub treść.
            </p>
            <ul className="grid gap-2">
              {selected.map((channel) => (
                <ChannelRow
                  key={channel.id}
                  channel={channel}
                  content={contentFor(channel.id)}
                  isCustomized={!!draft.overrides[channel.id]}
                  images={images}
                  issues={issuesFor(channel)}
                  result={results[channel.id]}
                  isDisabled={isPublishing}
                  onCustomize={() =>
                    setOverride(channel.id, { ...draft.shared })
                  }
                  onReset={() => setOverride(channel.id, null)}
                  onChange={(content) => setOverride(channel.id, content)}
                />
              ))}
            </ul>
          </EditorPanel>
        )}
        <EditorPanel titleId="schedule-title" title="Termin">
          <ScheduleField
            mode={draft.mode}
            dueAt={draft.dueAt}
            isDisabled={isPublishing}
            onChange={update}
          />
        </EditorPanel>
        <div className="flex flex-col gap-3 rounded-xl border border-app-border bg-app-surface p-4 sm:flex-row sm:items-center sm:justify-between">
          <p
            role="status"
            className={blocker ? "text-sm text-app-muted" : "text-sm"}
          >
            {blocker ??
              `Gotowe: ${pending.length} ${pending.length === 1 ? "kanał" : "kanały"} · ${mode?.label}`}
          </p>
          <Button
            type="primary"
            disabled={!!blocker || isPublishing}
            isLoading={isPublishing}
            LeftIcon={<FontAwesomeIcon icon={faPaperPlane} />}
            onClick={submit}
            className="disabled:cursor-not-allowed disabled:opacity-40"
          >
            {hasFailures ? "Ponów nieudane" : mode?.action}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PostComposer;
