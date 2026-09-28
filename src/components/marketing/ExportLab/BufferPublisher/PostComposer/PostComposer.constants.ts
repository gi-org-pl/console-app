import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faBluesky,
  faFacebook,
  faInstagram,
  faLinkedin,
  faMastodon,
  faThreads,
  faXTwitter,
} from "@fortawesome/free-brands-svg-icons";
import {
  faBolt,
  faCalendarDays,
  faLayerGroup,
} from "@fortawesome/free-solid-svg-icons";
import {
  type BufferChannel,
  type BufferPublishMode,
  MAX_POST_TEXT_LENGTH,
} from "../../../../../services/buffer/schemas/buffer.schemas";

export interface ServiceInfo {
  label: string;
  icon: IconDefinition;
  /** The network's caption limit, capped by what the Worker accepts. */
  maxLength: number;
  /** Graphic formats the network rejects as a feed post. */
  unsupportedFormatIds: readonly string[];
  hasClickableLinks: boolean;
}

export const SERVICES: Record<BufferChannel["service"], ServiceInfo> = {
  facebook: {
    label: "Facebook",
    icon: faFacebook,
    maxLength: MAX_POST_TEXT_LENGTH,
    unsupportedFormatIds: [],
    hasClickableLinks: true,
  },
  instagram: {
    label: "Instagram",
    icon: faInstagram,
    maxLength: 2200,
    // The Worker publishes feed posts, which Instagram crops to 4:5 at most.
    unsupportedFormatIds: ["story"],
    hasClickableLinks: false,
  },
  linkedin: {
    label: "LinkedIn",
    icon: faLinkedin,
    maxLength: 3000,
    unsupportedFormatIds: [],
    hasClickableLinks: true,
  },
  threads: {
    label: "Threads",
    icon: faThreads,
    maxLength: 500,
    unsupportedFormatIds: [],
    hasClickableLinks: true,
  },
  bluesky: {
    label: "Bluesky",
    icon: faBluesky,
    maxLength: 300,
    unsupportedFormatIds: [],
    hasClickableLinks: true,
  },
  mastodon: {
    label: "Mastodon",
    icon: faMastodon,
    maxLength: 500,
    unsupportedFormatIds: [],
    hasClickableLinks: true,
  },
  twitter: {
    label: "X",
    icon: faXTwitter,
    maxLength: 280,
    unsupportedFormatIds: [],
    hasClickableLinks: true,
  },
};

export interface PublishModeOption {
  value: BufferPublishMode;
  label: string;
  hint: string;
  action: string;
  icon: IconDefinition;
}

export const PUBLISH_MODES: readonly PublishModeOption[] = [
  {
    value: "addToQueue",
    label: "Do kolejki",
    hint: "Buffer wstawi post w najbliższy wolny termin z harmonogramu kanału.",
    action: "Dodaj do kolejki",
    icon: faLayerGroup,
  },
  {
    value: "shareNow",
    label: "Teraz",
    hint: "Post zostanie opublikowany od razu po wysłaniu.",
    action: "Opublikuj teraz",
    icon: faBolt,
  },
  {
    value: "customScheduled",
    label: "Zaplanuj",
    hint: "Wybierz dzień i godzinę, maksymalnie 30 dni do przodu.",
    action: "Zaplanuj",
    icon: faCalendarDays,
  },
];

export const DEFAULT_FORMAT_ID = "portrait";
