import { fireEvent, render, screen } from "@testing-library/react";
import { GRAPHIC_FORMATS } from "../../ExportLab.constants";
import PreviewCard from "./PreviewCard";

const format = GRAPHIC_FORMATS[0];
const createPreview = (url: string) => ({
  formatId: "square",
  url,
  file: new File(["png"], "gi-classic-square.png", { type: "image/png" }),
});
const preview = createPreview("blob:square");
const baseProps = {
  format,
  description: "Tytuł",
  isRendering: false,
  areActionsDisabled: false,
  canShare: false,
  onShare: vi.fn(),
};

const shimmer = () => screen.getByTestId("shimmer");
const downloadLink = () => screen.getByLabelText("Pobierz Post kwadratowy PNG");
const imageWithSrc = (container: HTMLElement, src: string) =>
  container.querySelector<HTMLImageElement>(`img[src="${src}"]`);

describe("<PreviewCard />", () => {
  describe("when rendered", () => {
    it("titles the card with the ratio and names the format for screen readers", () => {
      render(<PreviewCard {...baseProps} />);
      expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(
        "1:1 · Post kwadratowy",
      );
      expect(screen.queryByText(/1080 × 1080/)).toBeNull();
    });
  });

  describe("when the graphic is rendering for the first time", () => {
    it("shimmers a box in the format's proportions with disabled actions", () => {
      const { container } = render(
        <PreviewCard
          {...baseProps}
          format={GRAPHIC_FORMATS[3]}
          canShare
          isRendering
        />,
      );
      expect(shimmer()).toHaveClass("opacity-100");
      expect(shimmer().parentElement).toHaveStyle({
        aspectRatio: "1200 / 628",
      });
      expect(container.querySelector("img")).toBeNull();
      expect(screen.getByText("Przygotowujemy grafikę…")).toHaveClass(
        "sr-only",
      );
      expect(
        screen.getByLabelText("Pobierz Post poziomy PNG"),
      ).not.toHaveAttribute("href");
      expect(screen.getByLabelText("Pobierz Post poziomy PNG")).toHaveAttribute(
        "aria-disabled",
        "true",
      );
      expect(screen.getByRole("button", { name: /Udostępnij/ })).toBeDisabled();
    });
  });

  describe("when the first preview arrives", () => {
    it("keeps shimmering until the image has loaded, then shows it", () => {
      const { container, rerender } = render(
        <PreviewCard {...baseProps} isRendering />,
      );
      rerender(<PreviewCard {...baseProps} preview={preview} />);
      const image = imageWithSrc(container, "blob:square");
      expect(image).toHaveClass("opacity-0");
      expect(image).toHaveAttribute("aria-hidden", "true");
      expect(shimmer()).toHaveClass("opacity-100");

      fireEvent.load(image as HTMLImageElement);
      expect(
        screen.getByRole("img", { name: "Post kwadratowy: Tytuł" }),
      ).toHaveClass("opacity-100");
      expect(shimmer()).toHaveClass("opacity-0");
      expect(screen.queryByText("Przygotowujemy grafikę…")).toBeNull();
    });
  });

  describe("when the graphic re-renders", () => {
    it("dims the old image under the shimmer and cross-fades to the new one", () => {
      const { container, rerender } = render(
        <PreviewCard {...baseProps} preview={preview} />,
      );
      fireEvent.load(
        imageWithSrc(container, "blob:square") as HTMLImageElement,
      );

      rerender(<PreviewCard {...baseProps} isRendering />);
      expect(imageWithSrc(container, "blob:square")).toHaveClass("opacity-60");
      expect(shimmer()).toHaveClass("opacity-100");

      rerender(
        <PreviewCard {...baseProps} preview={createPreview("blob:next")} />,
      );
      const next = imageWithSrc(container, "blob:next") as HTMLImageElement;
      expect(next).toHaveClass("opacity-0");
      fireEvent.load(next);
      // The same element animates in; the old image waits underneath.
      expect(imageWithSrc(container, "blob:next")).toBe(next);
      expect(next).toHaveClass("opacity-100");
      expect(imageWithSrc(container, "blob:square")).toHaveAttribute(
        "aria-hidden",
        "true",
      );

      fireEvent.transitionEnd(next);
      expect(imageWithSrc(container, "blob:square")).toBeNull();
    });
  });

  describe("when rendering failed", () => {
    it("hides the old image and asks to fix the content", () => {
      const { container, rerender } = render(
        <PreviewCard {...baseProps} preview={preview} />,
      );
      fireEvent.load(
        imageWithSrc(container, "blob:square") as HTMLImageElement,
      );
      rerender(<PreviewCard {...baseProps} />);
      expect(
        screen.getByText("Popraw treść, aby zobaczyć grafikę"),
      ).toBeVisible();
      expect(imageWithSrc(container, "blob:square")).toHaveClass("opacity-0");
      expect(screen.queryByRole("img")).toBeNull();
      expect(shimmer()).toHaveClass("opacity-0");
      expect(downloadLink()).toHaveAttribute("aria-disabled", "true");
    });
  });

  describe("when the preview is ready", () => {
    it("offers a named icon download and no share without support", () => {
      render(<PreviewCard {...baseProps} preview={preview} />);
      expect(
        screen.getByRole("link", { name: "Pobierz Post kwadratowy PNG" }),
      ).toHaveAttribute("download", "gi-classic-square.png");
      expect(downloadLink()).toHaveAttribute("href", "blob:square");
      expect(downloadLink()).toHaveAttribute("title", "Pobierz PNG");
      expect(screen.queryByRole("button")).toBeNull();
    });
  });

  describe("when sharing is available", () => {
    it("shares the prepared file", () => {
      const onShare = vi.fn();
      render(
        <PreviewCard
          {...baseProps}
          preview={preview}
          canShare
          onShare={onShare}
        />,
      );
      fireEvent.click(
        screen.getByRole("button", { name: "Udostępnij Post kwadratowy" }),
      );
      expect(onShare).toHaveBeenCalledWith(preview.file);
    });
  });

  describe("when actions are disabled while a photo loads", () => {
    it("keeps the buttons in place but disabled", () => {
      const onShare = vi.fn();
      render(
        <PreviewCard
          {...baseProps}
          preview={preview}
          canShare
          areActionsDisabled
          onShare={onShare}
        />,
      );
      expect(downloadLink()).not.toHaveAttribute("href");
      const share = screen.getByRole("button", { name: /Udostępnij/ });
      expect(share).toBeDisabled();
      fireEvent.click(share);
      expect(onShare).not.toHaveBeenCalled();
    });
  });
});
