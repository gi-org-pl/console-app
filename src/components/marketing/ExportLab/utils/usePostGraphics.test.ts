import { act, renderHook } from "@testing-library/react";
import { GRAPHIC_TEMPLATES, MAX_POST_GRAPHICS } from "../ExportLab.constants";
import { getDefaultFieldValues } from "./getDefaultFieldValues";
import { usePostGraphics } from "./usePostGraphics";

const setup = () => renderHook(() => usePostGraphics());
const ids = (hook: ReturnType<typeof setup>) =>
  hook.result.current.graphics.map(({ id }) => id);
const titles = (hook: ReturnType<typeof setup>) =>
  hook.result.current.graphics.map(({ values }) => values.title);
/** Gives the graphic being edited a title, then adds a copy of it. */
const addTitled = (hook: ReturnType<typeof setup>, title: string) => {
  act(() => {
    hook.result.current.add();
  });
  act(() =>
    hook.result.current.update((draft) => ({
      ...draft,
      values: { ...draft.values, title },
    })),
  );
};

describe("usePostGraphics", () => {
  describe("when a post is started", () => {
    it("holds one graphic of the first template with the sample values", () => {
      const hook = setup();
      const { graphics, active, activeIndex, canAdd } = hook.result.current;

      expect(graphics).toHaveLength(1);
      expect(active).toBe(graphics[0]);
      expect(activeIndex).toBe(0);
      expect(active.templateId).toBe(GRAPHIC_TEMPLATES[0].id);
      expect(active.values).toEqual(getDefaultFieldValues());
      expect(canAdd).toBe(true);
    });
  });

  describe("when a graphic is added", () => {
    it("copies the one being edited, puts the copy after it and edits the copy", () => {
      const hook = setup();
      act(() =>
        hook.result.current.update((draft) => ({
          ...draft,
          templateId: "news",
          values: { ...draft.values, title: "Pierwsza" },
        })),
      );
      let copyId: string | undefined;
      act(() => {
        copyId = hook.result.current.add();
      });

      const { graphics, active, activeIndex } = hook.result.current;
      expect(graphics).toHaveLength(2);
      expect(activeIndex).toBe(1);
      expect(active.id).toBe(copyId);
      expect(active.id).not.toBe(graphics[0].id);
      expect(active).toMatchObject({
        templateId: "news",
        values: graphics[0].values,
      });
    });

    it("goes right after the graphic being edited, not to the end", () => {
      const hook = setup();
      addTitled(hook, "Druga");
      act(() => hook.result.current.select(ids(hook)[0]));
      addTitled(hook, "Wstawiona");

      expect(titles(hook)).toEqual([
        getDefaultFieldValues().title,
        "Wstawiona",
        "Druga",
      ]);
    });

    it("stops at the number of images one post may carry", () => {
      const hook = setup();
      for (let count = 1; count < MAX_POST_GRAPHICS; count++)
        act(() => {
          hook.result.current.add();
        });
      expect(hook.result.current.graphics).toHaveLength(MAX_POST_GRAPHICS);
      expect(hook.result.current.canAdd).toBe(false);

      let extra: string | undefined = "unset";
      act(() => {
        extra = hook.result.current.add();
      });
      expect(extra).toBeUndefined();
      expect(hook.result.current.graphics).toHaveLength(MAX_POST_GRAPHICS);
    });
  });

  describe("when the graphic being edited changes", () => {
    it("changes that graphic only and keeps its id", () => {
      const hook = setup();
      addTitled(hook, "Druga");
      const [first, second] = hook.result.current.graphics;

      act(() =>
        hook.result.current.update((draft) => ({
          ...draft,
          templateId: "news",
        })),
      );

      expect(hook.result.current.graphics[0]).toBe(first);
      expect(hook.result.current.graphics[1]).toMatchObject({
        id: second.id,
        templateId: "news",
        values: second.values,
      });
    });
  });

  describe("when another graphic is selected", () => {
    it("edits that one", () => {
      const hook = setup();
      addTitled(hook, "Druga");
      act(() => hook.result.current.select(ids(hook)[0]));
      expect(hook.result.current.activeIndex).toBe(0);
    });

    it("ignores an id the post does not hold", () => {
      const hook = setup();
      const before = hook.result.current.active;
      act(() => hook.result.current.select("unknown"));
      expect(hook.result.current.active).toBe(before);
    });
  });

  describe("when a graphic is moved", () => {
    it("swaps it with its neighbour and keeps editing it", () => {
      const hook = setup();
      addTitled(hook, "Druga");
      addTitled(hook, "Trzecia");
      const [first, second, third] = ids(hook);

      act(() => hook.result.current.move(third, -1));
      expect(ids(hook)).toEqual([first, third, second]);
      expect(hook.result.current.active.id).toBe(third);

      act(() => hook.result.current.move(first, 1));
      expect(ids(hook)).toEqual([third, first, second]);
    });

    it("stays put at either end and for an unknown id", () => {
      const hook = setup();
      addTitled(hook, "Druga");
      const before = ids(hook);

      act(() => hook.result.current.move(before[0], -1));
      act(() => hook.result.current.move(before[1], 1));
      act(() => hook.result.current.move("unknown", 1));
      expect(ids(hook)).toEqual(before);
    });
  });

  describe("when a graphic is removed", () => {
    it("hands the editing over to the graphic that takes its place", () => {
      const hook = setup();
      addTitled(hook, "Druga");
      addTitled(hook, "Trzecia");
      const [first, second, third] = ids(hook);
      act(() => hook.result.current.select(second));

      act(() => hook.result.current.remove(second));
      expect(ids(hook)).toEqual([first, third]);
      expect(hook.result.current.active.id).toBe(third);
    });

    it("hands it to the new last graphic when the last one goes", () => {
      const hook = setup();
      addTitled(hook, "Druga");
      const [first, second] = ids(hook);

      act(() => hook.result.current.remove(second));
      expect(hook.result.current.active.id).toBe(first);
    });

    it("keeps editing the same graphic when another one goes", () => {
      const hook = setup();
      addTitled(hook, "Druga");
      const [first, second] = ids(hook);

      act(() => hook.result.current.remove(first));
      expect(ids(hook)).toEqual([second]);
      expect(hook.result.current.active.id).toBe(second);
    });

    it("never removes the only graphic, nor one it does not hold", () => {
      const hook = setup();
      const [only] = ids(hook);
      act(() => hook.result.current.remove(only));
      expect(ids(hook)).toEqual([only]);

      addTitled(hook, "Druga");
      const before = ids(hook);
      act(() => hook.result.current.remove("unknown"));
      expect(ids(hook)).toEqual(before);
    });
  });
});
