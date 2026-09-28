import { getScheduleError, scheduleBounds } from "./scheduleBounds";

const NOW = Date.parse("2026-01-01T12:00:00Z");
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const iso = (offset: number) => new Date(NOW + offset).toISOString();

describe("scheduleBounds", () => {
  it("spans one minute to 30 days ahead as local datetime-local values", () => {
    const { min, max } = scheduleBounds(NOW);
    expect(min).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    expect(new Date(max).getTime() - new Date(min).getTime()).toBe(
      30 * DAY - 60_000,
    );
  });
});

describe("getScheduleError", () => {
  describe("when the date is missing or unreadable", () => {
    it.each(["", "nie-data"])("asks for a date (%j)", (value) => {
      expect(getScheduleError(value, NOW)).toBe(
        "Wybierz dzień i godzinę publikacji.",
      );
    });
  });

  describe("when the date is too soon", () => {
    it("asks for at least a minute ahead", () => {
      expect(getScheduleError(iso(30_000), NOW)).toBe(
        "Termin musi być co najmniej minutę od teraz.",
      );
    });
  });

  describe("when the date is over 30 days ahead", () => {
    it("names Buffer's limit", () => {
      expect(getScheduleError(iso(31 * DAY), NOW)).toBe(
        "Buffer pozwala zaplanować post najwyżej 30 dni do przodu.",
      );
    });
  });

  describe("when the date is inside the window", () => {
    it("accepts it", () => {
      expect(getScheduleError(iso(HOUR), NOW)).toBeNull();
    });
  });
});
