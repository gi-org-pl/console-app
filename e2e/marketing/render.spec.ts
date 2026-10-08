import { expect, type Page, test } from "@playwright/test";
import { stubBufferWorker } from "../bufferWorker";

const FORMATS = [
  { name: "Post kwadratowy", id: "square", width: 1080, height: 1080 },
  { name: "Post pionowy", id: "portrait", width: 1080, height: 1350 },
  { name: "Story / Reels", id: "story", width: 1080, height: 1920 },
  { name: "Post poziomy", id: "landscape", width: 1200, height: 628 },
];
const TEMPLATES = ["standard", "news"];
// The editor and the route share one rasterizer, so the PNGs match byte for byte
// except where the browser resamples the downscaled funding banner differently.
const SAME_IMAGE_TOLERANCE = 0.01;

const renderUrl = (params: Record<string, string>) =>
  `./marketing/render?${new URLSearchParams(params)}`;

const root = (page: Page) => page.getByRole("main");

const waitForStatus = (page: Page, status: string) =>
  expect(root(page)).toHaveAttribute("data-render-status", status);

/** The bytes behind an image's blob URL, i.e. the exported PNG itself. */
const pngBytes = async (page: Page, name?: RegExp) =>
  Buffer.from(
    await page
      .getByRole("img", { name })
      .first()
      .evaluate(async (img: HTMLImageElement) => {
        const blob = await (await fetch(img.src)).blob();
        // Base64 crosses the Playwright bridge much faster than a number array.
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result).split(",")[1]);
          reader.readAsDataURL(blob);
        });
      }),
    "base64",
  );

/** Share of pixels that differ between two PNGs of the same size. */
const differingShare = async (page: Page, first: Buffer, second: Buffer) =>
  first.equals(second)
    ? 0
    : page.evaluate(
        async (images) => {
          const [left, right] = await Promise.all(
            images.map(async (base64) => {
              const bitmap = await createImageBitmap(
                await (await fetch(`data:image/png;base64,${base64}`)).blob(),
              );
              const canvas = document.createElement("canvas");
              canvas.width = bitmap.width;
              canvas.height = bitmap.height;
              const context = canvas.getContext("2d")!;
              context.drawImage(bitmap, 0, 0);
              return context.getImageData(0, 0, bitmap.width, bitmap.height);
            }),
          );
          if (left.width !== right.width || left.height !== right.height)
            return 1;
          let differing = 0;
          for (let offset = 0; offset < left.data.length; offset += 4)
            if (
              left.data[offset] !== right.data[offset] ||
              left.data[offset + 1] !== right.data[offset + 1] ||
              left.data[offset + 2] !== right.data[offset + 2] ||
              left.data[offset + 3] !== right.data[offset + 3]
            )
              differing++;
          return differing / (left.width * left.height);
        },
        [first.toString("base64"), second.toString("base64")],
      );

test.describe("Feature: Marketing graphic render route", () => {
  for (const template of TEMPLATES) {
    test(`Scenario: ${template} renders in every format at its pixel size`, async ({
      page,
    }) => {
      for (const format of FORMATS) {
        await test.step(`Given the render URL of ${template} in ${format.id}`, async () => {
          await page.goto(renderUrl({ template, format: format.id }));
        });

        await test.step("Then only the PNG of that size is shown", async () => {
          await waitForStatus(page, "ready");
          await expect(root(page)).toHaveAttribute(
            "data-render-overflow",
            "false",
          );
          const bytes = await pngBytes(page);
          expect(bytes.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
          expect(bytes.readUInt32BE(16)).toBe(format.width);
          expect(bytes.readUInt32BE(20)).toBe(format.height);
          await expect(page.getByRole("navigation")).toHaveCount(0);
          await expect(page.getByRole("banner")).toHaveCount(0);
        });
      }
    });
  }

  test("Scenario: the route and the editor produce the same image", async ({
    page,
  }) => {
    const title = "Zażółć *gęślą* jaźń";
    let editorBytes: Buffer[] = [];

    await test.step("Given the editor exported a graphic with an own headline", async () => {
      await stubBufferWorker(page);
      await page.goto("./marketing");
      await page.getByLabel("Tytuł", { exact: true }).fill(title);
      await expect(
        page.getByRole("img", { name: /^Post poziomy: Zażółć gęślą jaźń/ }),
      ).toBeVisible();
      await expect(page.getByRole("link", { name: /^Pobierz/ })).toHaveCount(4);
      editorBytes = [];
      for (const format of FORMATS)
        editorBytes.push(
          await pngBytes(page, new RegExp(`^${format.name}: Zażółć`)),
        );
    });

    for (const [index, format] of FORMATS.entries()) {
      await test.step(`Then the render URL gives the same ${format.id} PNG`, async () => {
        await page.goto(
          renderUrl({ template: "standard", format: format.id, title }),
        );
        await waitForStatus(page, "ready");
        const share = await differingShare(
          page,
          await pngBytes(page),
          editorBytes[index],
        );
        console.log(
          `${format.id}: ${(share * 100).toFixed(3)}% of pixels differ`,
        );
        expect(share).toBeLessThan(SAME_IMAGE_TOLERANCE);
      });
    }
  });

  test("Scenario: text that does not fit is reported, not hidden", async ({
    page,
  }) => {
    await page.goto(
      renderUrl({
        template: "standard",
        format: "landscape",
        subtitle: "Wspólnie tworzymy zmiany dla młodych ludzi. ".repeat(8),
      }),
    );
    await waitForStatus(page, "ready");
    await expect(root(page)).toHaveAttribute("data-render-overflow", "true");
    await expect(page.getByRole("img")).toBeVisible();
  });

  test("Scenario: a wrong URL explains itself", async ({ page }) => {
    await page.goto(renderUrl({ template: "poster", format: "square" }));
    await waitForStatus(page, "error");
    await expect(root(page)).toHaveAttribute(
      "data-render-error",
      "unknown-template",
    );
    await expect(page.getByRole("alert")).toHaveText(
      'Nieznany szablon "poster". Dostępne: standard, news.',
    );

    await page.goto(
      renderUrl({ template: "standard", format: "square", align: "justify" }),
    );
    await waitForStatus(page, "error");
    await expect(root(page)).toHaveAttribute(
      "data-render-error",
      "invalid-content",
    );
    await expect(root(page)).toHaveAttribute(
      "data-render-error-fields",
      "align",
    );
  });

  test("Scenario: a background photo is injected as a file", async ({
    page,
  }) => {
    const pixel = () =>
      page.getByRole("img").evaluate((img: HTMLImageElement) => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const context = canvas.getContext("2d")!;
        context.drawImage(img, 0, 0);
        return Array.from(context.getImageData(540, 300, 1, 1).data);
      });

    await test.step("Given a render URL that announces a photo framed on its right edge", async () => {
      await page.goto(
        renderUrl({
          template: "standard",
          format: "square",
          photo: "1",
          focalX: "95",
        }),
      );
      await waitForStatus(page, "awaiting-photo");
      await expect(page.getByRole("img")).toHaveCount(0);
    });

    await test.step("When the automation puts a half-red, half-blue photo into the file input", async () => {
      const fixture = await page.evaluate(() => {
        const canvas = document.createElement("canvas");
        canvas.width = 800;
        canvas.height = 400;
        const context = canvas.getContext("2d")!;
        context.fillStyle = "#ff0000";
        context.fillRect(0, 0, 400, 400);
        context.fillStyle = "#0000ff";
        context.fillRect(400, 0, 400, 400);
        return canvas.toDataURL("image/png").split(",")[1];
      });
      await page.getByLabel("Zdjęcie w tle").setInputFiles({
        name: "crop.png",
        mimeType: "image/png",
        buffer: Buffer.from(fixture, "base64"),
      });
    });

    await test.step("Then the graphic shows the blue part of the photo", async () => {
      await waitForStatus(page, "ready");
      // The overlay darkens the photo, so compare channels instead of exact colours.
      const [red, , blue] = await pixel();
      expect(blue).toBeGreaterThan(60);
      expect(red).toBeLessThan(20);
    });
  });
});
