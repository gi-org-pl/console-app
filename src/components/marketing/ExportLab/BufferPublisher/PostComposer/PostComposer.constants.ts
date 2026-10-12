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
import type { ImageScope, PostKind } from "./PostComposer.types";

export interface ServiceInfo {
  label: string;
  icon: IconDefinition;
  /** The network's caption limit, capped by what the Worker accepts. */
  maxLength: number;
  /** Graphic formats the network rejects as a feed post. */
  unsupportedFormatIds: readonly string[];
  hasClickableLinks: boolean;
  /** How many graphics one post may carry; mirrors `MAX_IMAGES` of the Worker. */
  maxImages: number;
  /** What a channel of this network gets from a post with several graphics, unless changed. */
  defaultImageScope: ImageScope;
  /** Why the default is what it is, shown next to the choice. */
  imageScopeHint: string;
  /** Whether a channel of this network can publish the 9:16 format as a story. */
  hasStories: boolean;
}

const SINGLE_IMAGE = {
  maxImages: 1,
  defaultImageScope: "first",
  imageScopeHint:
    "Ten kanał przyjmuje jedną grafikę w poście, więc dostaje pierwszą.",
  hasStories: false,
} as const;

export const SERVICES: Record<BufferChannel["service"], ServiceInfo> = {
  facebook: {
    label: "Facebook",
    icon: faFacebook,
    maxLength: MAX_POST_TEXT_LENGTH,
    unsupportedFormatIds: [],
    hasClickableLinks: true,
    maxImages: 10,
    defaultImageScope: "first",
    imageScopeHint:
      "Facebook układa kilka grafik w kolaż, więc domyślnie dostaje tylko pierwszą.",
    hasStories: true,
  },
  instagram: {
    label: "Instagram",
    icon: faInstagram,
    maxLength: 2200,
    // The Worker publishes feed posts, which Instagram crops to 4:5 at most.
    unsupportedFormatIds: ["story"],
    hasClickableLinks: false,
    maxImages: 10,
    defaultImageScope: "all",
    imageScopeHint:
      "Instagram pokaże grafiki jako karuzelę, w proporcjach pierwszej z nich.",
    hasStories: true,
  },
  linkedin: {
    label: "LinkedIn",
    icon: faLinkedin,
    maxLength: 3000,
    unsupportedFormatIds: [],
    hasClickableLinks: true,
    maxImages: 20,
    defaultImageScope: "first",
    imageScopeHint:
      "LinkedIn układa kilka grafik w kolaż, więc domyślnie dostaje tylko pierwszą.",
    hasStories: false,
  },
  threads: {
    label: "Threads",
    icon: faThreads,
    maxLength: 500,
    unsupportedFormatIds: [],
    hasClickableLinks: true,
    ...SINGLE_IMAGE,
  },
  bluesky: {
    label: "Bluesky",
    icon: faBluesky,
    maxLength: 300,
    unsupportedFormatIds: [],
    hasClickableLinks: true,
    ...SINGLE_IMAGE,
  },
  mastodon: {
    label: "Mastodon",
    icon: faMastodon,
    maxLength: 500,
    unsupportedFormatIds: [],
    hasClickableLinks: true,
    ...SINGLE_IMAGE,
  },
  twitter: {
    label: "X",
    icon: faXTwitter,
    maxLength: 280,
    unsupportedFormatIds: [],
    hasClickableLinks: true,
    ...SINGLE_IMAGE,
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
/** The format a story is published in. */
export const STORY_FORMAT_ID = "story";

export const POST_KIND_LABELS: Record<PostKind, string> = {
  post: "Post",
  story: "Relacja",
};

/** Names one entry of a run among its results; a post keeps the ID of its channel. */
export const getEntryKey = (channelId: string, kind: PostKind) =>
  kind === "post" ? channelId : `${channelId}:${kind}`;
