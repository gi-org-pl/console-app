import { fireEvent, render, screen } from "@testing-library/react";
import FocalPointPicker from "./FocalPointPicker";

const photo = { url: "blob:1", focalX: 50, focalY: 50 };

function renderPicker(focus = photo) {
  const onChange = vi.fn();
  render(<FocalPointPicker photo={focus} onChange={onChange} />);
  const picker = screen.getByRole("group", { name: /Punkt kadrowania/ });
  picker.getBoundingClientRect = () =>
    ({ left: 100, top: 50, width: 200, height: 100 }) as DOMRect;
  return { onChange, picker };
}

describe("<FocalPointPicker />", () => {
  describe("when rendered", () => {
    it("marks the focal point on the whole photo", () => {
      renderPicker({ ...photo, focalX: 30, focalY: 80 });
      expect(
        screen.getByRole("group", {
          name: "Punkt kadrowania: 30% w poziomie, 80% w pionie",
        }),
      ).toHaveAttribute("title", "Wskaż, co ma zostać w kadrze");
      expect(document.querySelector("span[aria-hidden]")).toHaveStyle({
        left: "30%",
        top: "80%",
      });
    });
  });

  describe("when the user clicks the photo", () => {
    it("moves the point there", () => {
      const { onChange, picker } = renderPicker();
      fireEvent.pointerDown(picker, {
        clientX: 150,
        clientY: 125,
        pointerId: 1,
      });
      expect(onChange).toHaveBeenCalledWith({ focalX: 25, focalY: 75 });
    });
  });

  describe("when the user drags", () => {
    it("follows the pointer only while the button is pressed", () => {
      const { onChange, picker } = renderPicker();
      fireEvent.pointerMove(picker, { clientX: 300, clientY: 50, buttons: 0 });
      expect(onChange).not.toHaveBeenCalled();
      fireEvent.pointerMove(picker, { clientX: 400, clientY: 0, buttons: 1 });
      expect(onChange).toHaveBeenCalledWith({ focalX: 100, focalY: 0 });
    });
  });

  describe("when the user uses the keyboard", () => {
    it.each([
      ["ArrowLeft", { focalX: 45, focalY: 50 }],
      ["ArrowRight", { focalX: 55, focalY: 50 }],
      ["ArrowUp", { focalX: 50, focalY: 45 }],
      ["ArrowDown", { focalX: 50, focalY: 55 }],
    ])("moves the point with %s", (key, expected) => {
      const { onChange, picker } = renderPicker();
      fireEvent.keyDown(picker, { key });
      expect(onChange).toHaveBeenCalledWith(expected);
    });

    it("stays within the photo and ignores other keys", () => {
      const { onChange, picker } = renderPicker({
        ...photo,
        focalX: 0,
        focalY: 100,
      });
      fireEvent.keyDown(picker, { key: "Enter" });
      expect(onChange).not.toHaveBeenCalled();
      fireEvent.keyDown(picker, { key: "ArrowLeft" });
      expect(onChange).toHaveBeenCalledWith({ focalX: 0, focalY: 100 });
    });
  });
});
