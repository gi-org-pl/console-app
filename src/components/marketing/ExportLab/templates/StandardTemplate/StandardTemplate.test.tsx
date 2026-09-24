import { render, screen } from "@testing-library/react";
import { GRAPHIC_FORMATS } from "../../ExportLab.constants";
import StandardTemplate from "./StandardTemplate";

const [square] = GRAPHIC_FORMATS;
const values = {
  title: "Dobre *idee*",
  titleSize: "48",
  subtitle: "Podtytuł",
  subtitleSize: "24",
  position: "bottom",
  align: "left",
};

const textBox = (container: HTMLElement) =>
  container.querySelector("[data-fit]");

describe("<StandardTemplate />", () => {
  describe("when rendered without a photo", () => {
    it("paints the GI background at the format size", () => {
      const { container } = render(
        <StandardTemplate values={values} photo={null} format={square} />,
      );
      const root = container.firstElementChild as HTMLElement;
      expect(root).toHaveStyle({ width: "1080px", height: "1080px" });
      expect(root.style.backgroundImage).toContain("radial-gradient");
    });
  });

  describe("when given texts, sizes and a highlight", () => {
    it("renders them with the highlight in the accent color", () => {
      render(<StandardTemplate values={values} photo={null} format={square} />);
      const title = screen.getByRole("heading", { level: 1 });
      expect(title).toHaveTextContent("Dobre idee");
      expect(title).toHaveStyle({ fontSize: "48px" });
      expect(screen.getByText("idee")).toHaveClass("text-app-accent");
      expect(screen.getByText("Podtytuł").closest("p")).toHaveStyle({
        fontSize: "24px",
      });
    });
  });

  describe("when the texts are blank or only markers", () => {
    it("leaves only the background and footer", () => {
      const { container } = render(
        <StandardTemplate
          values={{ ...values, title: " ** ", subtitle: "" }}
          photo={null}
          format={square}
        />,
      );
      expect(textBox(container)).toBeEmptyDOMElement();
    });
  });

  describe("when the user picks a position and alignment", () => {
    it.each([
      ["top", "right", "justify-start", "text-right"],
      ["middle", "center", "justify-center-safe", "text-center"],
      ["bottom", "left", "justify-end-safe", "text-left"],
    ])("places the text %s and aligns it %s", (position, align, justify, textAlign) => {
      const { container } = render(
        <StandardTemplate
          values={{ ...values, position, align }}
          photo={null}
          format={square}
        />,
      );
      expect(textBox(container)).toHaveClass(justify, textAlign);
    });

    it("falls back to bottom left for unknown values", () => {
      const { container } = render(
        <StandardTemplate
          values={{ ...values, position: "x", align: "y" }}
          photo={null}
          format={square}
        />,
      );
      expect(textBox(container)).toHaveClass("justify-end-safe", "text-left");
    });
  });

  describe("when a photo replaces the background", () => {
    it("crops it at the focus point under a darkening overlay", () => {
      const { container } = render(
        <StandardTemplate
          values={values}
          photo={{ url: "blob:photo", focalX: 10, focalY: 90 }}
          format={square}
        />,
      );
      const root = container.firstElementChild as HTMLElement;
      expect(root.style.backgroundImage).toBe("");
      const photo = container.querySelector('img[src="blob:photo"]');
      expect(photo).toHaveStyle({ objectPosition: "10% 90%" });
      expect(photo?.nextElementSibling).toHaveClass(
        "from-black/50",
        "to-black",
      );
    });
  });

  describe("when the format is taller than the 4:5 card", () => {
    it("frames the card on the long background instead of stretching it", () => {
      const story = GRAPHIC_FORMATS[2];
      const { container } = render(
        <StandardTemplate values={values} photo={null} format={story} />,
      );
      const frame = container.firstElementChild as HTMLElement;
      expect(frame).toHaveStyle({ width: "1080px", height: "1920px" });
      // Vite inlines the small 9:16 background SVG.
      expect(frame.querySelector("img")?.getAttribute("src")).toMatch(
        /svg|long-bg/,
      );
      const card = textBox(container)?.parentElement;
      expect(card).toHaveStyle({ width: "1016px", height: "1270px" });
      expect(card).toHaveClass("rounded-4xl", "border", "border-white/10");
    });
  });

  describe("when the format is at most as tall as the card", () => {
    it.each([
      GRAPHIC_FORMATS[1],
      GRAPHIC_FORMATS[3],
    ])("fills $name edge to edge", (format) => {
      const { container } = render(
        <StandardTemplate values={values} photo={null} format={format} />,
      );
      expect(container.firstElementChild).toHaveStyle({
        width: `${format.width}px`,
        height: `${format.height}px`,
      });
      expect(container.firstElementChild).not.toHaveClass("rounded-4xl");
    });
  });

  describe("when rendered", () => {
    it("always ends with the GI footer", () => {
      render(<StandardTemplate values={values} photo={null} format={square} />);
      expect(screen.getByAltText("Generacja Innowacja")).toHaveClass("h-12");
      expect(screen.getByAltText("gi.org.pl")).toHaveClass("h-8");
    });
  });
});
