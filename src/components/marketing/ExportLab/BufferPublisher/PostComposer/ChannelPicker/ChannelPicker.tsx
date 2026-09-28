import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { BufferChannel } from "../../../../../../services/buffer/schemas/buffer.schemas";
import { SERVICES } from "../PostComposer.constants";

interface Props {
  channels: readonly BufferChannel[];
  selectedIds: readonly string[];
  isDisabled?: boolean;
  onToggle: (channelId: string) => void;
}

/** One tap selects a channel; the checkboxes stay for keyboard and screen readers. */
const ChannelPicker = ({
  channels,
  selectedIds,
  isDisabled,
  onToggle,
}: Props) => (
  <div className="grid gap-2 sm:grid-cols-2 tablet:grid-cols-1">
    {channels.map((channel) => {
      const info = SERVICES[channel.service];
      return (
        <label
          key={channel.id}
          className="group flex cursor-pointer items-center gap-3 rounded-lg border border-app-border p-2 pr-3 transition-colors hover:bg-app-hover has-checked:border-app-accent has-checked:bg-app-accent/10 has-disabled:cursor-not-allowed has-disabled:opacity-60 has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-app-focus"
        >
          <input
            type="checkbox"
            checked={selectedIds.includes(channel.id)}
            disabled={isDisabled}
            onChange={() => onToggle(channel.id)}
            className="sr-only"
          />
          <span
            aria-hidden="true"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-app-surface-2 text-xl text-app-muted transition-colors group-has-checked:bg-app-accent group-has-checked:text-app-text"
          >
            <FontAwesomeIcon icon={info.icon} />
          </span>
          <span className="min-w-0 flex-1">
            <strong className="block truncate font-semibold">
              {channel.name}
            </strong>
            <span className="block text-sm text-app-muted">{info.label}</span>
          </span>
          <FontAwesomeIcon
            icon={faCircleCheck}
            className="text-app-accent-text opacity-0 transition-opacity group-has-checked:opacity-100"
          />
        </label>
      );
    })}
  </div>
);

export default ChannelPicker;
