/** URL parameters that are not template fields. */
export const RENDER_PARAMS = {
  template: "template",
  format: "format",
  photo: "photo",
  focalX: "focalX",
  focalY: "focalY",
} as const;

/** The only accepted value of `photo`: a file will be put into the page's file input. */
export const PHOTO_EXPECTED = "1";

/** Focal point in percent of the photo, as in the editor's picker. */
export const FOCAL_MIN = 0;
export const FOCAL_MAX = 100;
export const FOCAL_DEFAULT = 50;
