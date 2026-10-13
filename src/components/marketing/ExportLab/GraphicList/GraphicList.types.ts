export interface GraphicListItem {
  id: string;
  /** The square preview of the graphic; absent while it renders. */
  thumbnailUrl?: string;
  /** Text does not fit a box in at least one format of this graphic. */
  hasOverflow: boolean;
}
