import {
  MAX_SCHEDULE_DAYS,
  MIN_SCHEDULE_LEAD_MS,
} from "../../../../../../services/buffer/schemas/buffer.schemas";

const DAY_MS = 24 * 60 * 60 * 1000;

const toLocalInputValue = (timestamp: number) =>
  new Date(timestamp - new Date(timestamp).getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);

/** `datetime-local` input bounds matching the Worker's accepted scheduling window. */
export function scheduleBounds(now = Date.now()): { min: string; max: string } {
  return {
    min: toLocalInputValue(now + MIN_SCHEDULE_LEAD_MS),
    max: toLocalInputValue(now + MAX_SCHEDULE_DAYS * DAY_MS),
  };
}

/** Mirrors the Worker's check, so a bad date is caught before it round-trips. */
export function getScheduleError(
  dueAt: string,
  now = Date.now(),
): string | null {
  const time = new Date(dueAt).getTime();
  if (!dueAt || Number.isNaN(time))
    return "Wybierz dzień i godzinę publikacji.";
  if (time < now + MIN_SCHEDULE_LEAD_MS)
    return "Termin musi być co najmniej minutę od teraz.";
  if (time > now + MAX_SCHEDULE_DAYS * DAY_MS)
    return `Buffer pozwala zaplanować post najwyżej ${MAX_SCHEDULE_DAYS} dni do przodu.`;
  return null;
}
