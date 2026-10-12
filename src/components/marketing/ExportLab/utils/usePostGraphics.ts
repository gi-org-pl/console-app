import { useState } from "react";
import { GRAPHIC_TEMPLATES, MAX_POST_GRAPHICS } from "../ExportLab.constants";
import type { Draft, PostGraphic } from "../ExportLab.types";
import { getDefaultFieldValues } from "./getDefaultFieldValues";

interface State {
  graphics: readonly PostGraphic[];
  activeId: string;
}

function createInitialState(): State {
  const first: PostGraphic = {
    id: crypto.randomUUID(),
    templateId: GRAPHIC_TEMPLATES[0].id,
    values: getDefaultFieldValues(),
  };
  return { graphics: [first], activeId: first.id };
}

/** The graphics of one post, in the order they are published, and the one being edited. */
export function usePostGraphics() {
  const [state, setState] = useState(createInitialState);
  const { graphics, activeId } = state;
  const activeIndex = graphics.findIndex(({ id }) => id === activeId);

  function select(id: string) {
    setState((prev) =>
      prev.graphics.some((graphic) => graphic.id === id)
        ? { ...prev, activeId: id }
        : prev,
    );
  }

  /**
   * A new graphic starts as a copy of the one being edited and follows it, so
   * a series keeps its template and style. Returns the id of the copy.
   */
  function add(): string | undefined {
    if (graphics.length >= MAX_POST_GRAPHICS) return undefined;
    const id = crypto.randomUUID();
    setState((prev) => {
      const index = prev.graphics.findIndex(
        (graphic) => graphic.id === prev.activeId,
      );
      const copy = { ...prev.graphics[index], id };
      return {
        graphics: [
          ...prev.graphics.slice(0, index + 1),
          copy,
          ...prev.graphics.slice(index + 1),
        ],
        activeId: id,
      };
    });
    return id;
  }

  /** A post keeps at least one graphic; the neighbour of a removed one takes over. */
  function remove(id: string) {
    setState((prev) => {
      const index = prev.graphics.findIndex((graphic) => graphic.id === id);
      if (index === -1 || prev.graphics.length === 1) return prev;
      const rest = prev.graphics.filter((graphic) => graphic.id !== id);
      return {
        graphics: rest,
        activeId:
          prev.activeId === id
            ? rest[Math.min(index, rest.length - 1)].id
            : prev.activeId,
      };
    });
  }

  function move(id: string, by: -1 | 1) {
    setState((prev) => {
      const index = prev.graphics.findIndex((graphic) => graphic.id === id);
      const target = index + by;
      if (index === -1 || target < 0 || target >= prev.graphics.length)
        return prev;
      const next = [...prev.graphics];
      [next[index], next[target]] = [next[target], next[index]];
      return { ...prev, graphics: next };
    });
  }

  /** Changes the graphic being edited. */
  function update(change: (draft: Draft) => Draft) {
    setState((prev) => ({
      ...prev,
      graphics: prev.graphics.map((graphic) =>
        graphic.id === prev.activeId
          ? { ...change(graphic), id: graphic.id }
          : graphic,
      ),
    }));
  }

  return {
    graphics,
    active: graphics[activeIndex],
    activeIndex,
    canAdd: graphics.length < MAX_POST_GRAPHICS,
    select,
    add,
    remove,
    move,
    update,
  };
}
