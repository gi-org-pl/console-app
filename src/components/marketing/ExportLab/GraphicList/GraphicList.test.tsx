import { fireEvent, render, screen } from "@testing-library/react";
import GraphicList from "./GraphicList";
import type { GraphicListItem } from "./GraphicList.types";

const item = (id: string, patch: Partial<GraphicListItem> = {}) => ({
  id,
  thumbnailUrl: `blob:${id}`,
  hasOverflow: false,
  ...patch,
});
const THREE = [item("a"), item("b"), item("c")];

const renderList = (props: Partial<Parameters<typeof GraphicList>[0]> = {}) => {
  const handlers = {
    onSelect: vi.fn(),
    onAdd: vi.fn(),
    onMove: vi.fn(),
    onRemove: vi.fn(),
  };
  const view = render(
    <GraphicList items={THREE} activeId="b" canAdd {...handlers} {...props} />,
  );
  return { ...handlers, ...view };
};
const button = (name: string | RegExp) => screen.getByRole("button", { name });

describe("<GraphicList />", () => {
  describe("when the post has one graphic", () => {
    it("shows it with a way to add another and nothing to reorder or remove", () => {
      renderList({ items: [item("a")], activeId: "a" });

      expect(
        screen.getByRole("radiogroup", { name: "Grafiki posta" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: "Grafika 1" })).toBeChecked();
      expect(button("Dodaj grafikę")).toBeEnabled();
      expect(screen.queryByRole("button", { name: /Przesuń/ })).toBeNull();
      expect(screen.queryByRole("button", { name: /Usuń/ })).toBeNull();
    });
  });

  describe("when the post has several graphics", () => {
    it("numbers them in their order and marks the one being edited", () => {
      const { container } = renderList();

      expect(
        screen.getAllByRole("radio").map((radio) => radio.ariaLabel),
      ).toEqual(["Grafika 1", "Grafika 2", "Grafika 3"]);
      expect(screen.getByRole("radio", { name: "Grafika 2" })).toBeChecked();
      expect(
        [...container.querySelectorAll("img")].map((image) =>
          image.getAttribute("src"),
        ),
      ).toEqual(["blob:a", "blob:b", "blob:c"]);
    });

    it("selects the graphic that is chosen", () => {
      const { onSelect } = renderList();
      fireEvent.click(screen.getByRole("radio", { name: "Grafika 3" }));
      expect(onSelect).toHaveBeenCalledExactlyOnceWith("c");
    });

    it("moves and removes the graphic being edited, named by its number", () => {
      const { onMove, onRemove } = renderList();

      fireEvent.click(button("Przesuń grafikę 2 wcześniej"));
      fireEvent.click(button("Przesuń grafikę 2 później"));
      fireEvent.click(button("Usuń grafikę 2"));

      expect(onMove.mock.calls).toEqual([
        ["b", -1],
        ["b", 1],
      ]);
      expect(onRemove).toHaveBeenCalledExactlyOnceWith("b");
    });

    it.each([
      [
        "first",
        "a",
        "Przesuń grafikę 1 wcześniej",
        "Przesuń grafikę 1 później",
      ],
      ["last", "c", "Przesuń grafikę 3 później", "Przesuń grafikę 3 wcześniej"],
    ])("does not offer to move the %s one past its end", (_name, activeId, blocked, open) => {
      renderList({ activeId });
      expect(button(blocked)).toBeDisabled();
      expect(button(open)).toBeEnabled();
    });
  });

  describe("when a graphic is added", () => {
    it("asks for it, and says that it starts as a copy", () => {
      const { onAdd } = renderList();
      const add = button("Dodaj grafikę");

      expect(add).toHaveAttribute(
        "title",
        "Nowa grafika zaczyna jako kopia bieżącej",
      );
      fireEvent.click(add);
      expect(onAdd).toHaveBeenCalledTimes(1);
    });

    it("cannot be asked for once the post is full", () => {
      renderList({ canAdd: false });
      expect(button("Dodaj grafikę")).toBeDisabled();
    });
  });

  describe("when the text of a graphic may be clipped", () => {
    it("marks that graphic and says so in its name", () => {
      renderList({
        items: [item("a"), item("b", { hasOverflow: true }), item("c")],
      });

      const marked = screen.getByRole("radio", {
        name: "Grafika 2: możliwe ucięcie treści",
      });
      expect(
        marked.closest("label")?.querySelector("[data-overflow-mark]"),
      ).toBeInTheDocument();
      expect(marked.closest("label")).toHaveAttribute(
        "title",
        "Możliwe ucięcie treści",
      );
      expect(
        screen
          .getByRole("radio", { name: "Grafika 1" })
          .closest("label")
          ?.querySelector("[data-overflow-mark]"),
      ).toBeNull();
    });
  });

  describe("when a graphic is still being drawn", () => {
    it("shows a placeholder in its place", () => {
      const { container } = renderList({
        items: [item("a", { thumbnailUrl: undefined })],
        activeId: "a",
      });
      expect(container.querySelector("img")).toBeNull();
      expect(screen.getByTestId("shimmer")).toBeInTheDocument();
    });
  });
});
