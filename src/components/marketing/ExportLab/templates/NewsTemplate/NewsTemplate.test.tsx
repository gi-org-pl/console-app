import { render, screen } from "@testing-library/react";
import { GRAPHIC_FORMATS } from "../../ExportLab.constants";
import NewsTemplate from "./NewsTemplate";

const values = {
  personName: "Krzysztof\nTurek",
  title: "MyBetterness zajmuje podium",
  newsTitleSize: "48",
  subtitle: "Projekt wspiera opiekę nad seniorami.",
  subtitleSize: "40",
  funding: "proo",
};

describe("<NewsTemplate />", () => {
  it.each(
    GRAPHIC_FORMATS,
  )("renders the News composition in $name", (format) => {
    const { container } = render(
      <NewsTemplate values={values} photo={null} format={format} />,
    );
    expect(container.firstElementChild).toHaveStyle({
      width: `${format.width}px`,
      height: `${format.height}px`,
    });
    const banner = container.querySelector("[data-funding-banner]");
    const photo = container.querySelector("[data-news-photo]");
    const title = container.querySelector("[data-news-title]");
    const subtitle = container.querySelector("[data-news-subtitle]");
    const footer = container.querySelector("[data-news-footer]");
    expect(banner?.parentElement).toBe(footer?.parentElement);
    if (format.id === "landscape") {
      const main = container.querySelector("[data-news-main]");
      const copy = container.querySelector("[data-news-copy]");
      const centeredText = copy?.firstElementChild;
      expect(banner?.nextElementSibling).toBe(main);
      expect(main?.lastElementChild).toBe(photo);
      expect(copy).toHaveClass("justify-center");
      expect(centeredText?.firstElementChild).toBe(title);
      expect(centeredText?.lastElementChild).toBe(subtitle);
      expect(main?.nextElementSibling).toBe(footer);
    } else {
      const main = container.querySelector("[data-news-main]");
      expect(banner?.nextElementSibling).toBe(main);
      expect(photo?.parentElement).toBe(main);
      expect(photo?.nextElementSibling).toBe(subtitle);
      expect(main?.nextElementSibling).toBe(footer);
      expect(title?.parentElement).toBe(photo);
    }
    expect(title).toHaveClass("bg-black/90", "px-16");
    if (format.id === "landscape") {
      expect(title).not.toHaveClass("border-t");
    } else {
      expect(title).toHaveClass("border-t", "border-white/10");
    }
    expect(title?.querySelector(".bg-app-accent")).toHaveClass(
      "w-6",
      "rounded-r-full",
    );
    expect(subtitle).toHaveClass(
      "bg-linear-to-b",
      "from-black/90",
      "to-black",
      "px-16",
    );
    expect(subtitle).toHaveAttribute("data-fit");
    expect(subtitle).not.toHaveAttribute("style");
    expect(subtitle?.querySelector("[aria-hidden='true']")).toBeNull();
    expect(footer).toHaveClass("bg-black", "px-16", "py-8");
    expect(screen.getByText("Krzysztof", { exact: false })).toBeVisible();
    expect(screen.getByAltText("Generacja Innowacja")).toBeInTheDocument();
  });

  it("keeps the 4:5 card inside the story frame", () => {
    const { container } = render(
      <NewsTemplate values={values} photo={null} format={GRAPHIC_FORMATS[2]} />,
    );
    const card = container.querySelector("[data-news-footer]")?.parentElement;
    expect(card).toHaveStyle({ width: "1016px", height: "1270px" });
    expect(card).toHaveClass("rounded-4xl");
  });

  it("can omit the person and funding while keeping the black footer", () => {
    const { container } = render(
      <NewsTemplate
        values={{ ...values, personName: "", funding: "none" }}
        photo={null}
        format={GRAPHIC_FORMATS[1]}
      />,
    );
    expect(container.querySelector("[data-funding-banner]")).toBeNull();
    expect(container.querySelector("[data-field=personName]")).toBeNull();
    expect(container.querySelector("[data-news-footer]")).toHaveClass(
      "bg-black",
    );
  });

  it("gives the photo the space when the subtitle is empty", () => {
    const { container } = render(
      <NewsTemplate
        values={{ ...values, subtitle: "" }}
        photo={null}
        format={GRAPHIC_FORMATS[1]}
      />,
    );
    expect(container.querySelector("[data-news-subtitle]")).toBeNull();
    expect(container.querySelector("[data-news-photo]")).toHaveClass("flex-1");
  });

  it("preserves photo color and the selected crop behind the person's name", () => {
    const { container } = render(
      <NewsTemplate
        values={values}
        photo={{ url: "blob:photo", focalX: 20, focalY: 80 }}
        format={GRAPHIC_FORMATS[1]}
      />,
    );
    expect(container.querySelector('img[src="blob:photo"]')).toHaveClass(
      "object-cover",
    );
    expect(container.querySelector('img[src="blob:photo"]')).not.toHaveClass(
      "grayscale",
    );
    expect(container.querySelector('img[src="blob:photo"]')).toHaveStyle({
      objectPosition: "20% 80%",
    });
    expect(
      container.querySelector('img[src="blob:photo"]')?.parentElement,
    ).toBe(container.querySelector("[data-news-main]"));
  });
});
