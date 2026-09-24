import { readFile } from "node:fs/promises";
import { expect, type Page, test } from "@playwright/test";

const FORMATS = [
  { name: "Post kwadratowy", id: "square", width: 1080, height: 1080 },
  { name: "Post pionowy", id: "portrait", width: 1080, height: 1350 },
  { name: "Story / Reels", id: "story", width: 1080, height: 1920 },
  { name: "Post poziomy", id: "landscape", width: 1200, height: 628 },
];

// Choice options are icon cards; their radios are visually hidden, as for users.
const choose = async (page: Page, name: string | RegExp) => {
  const radio = page.getByRole("radio", { name });
  await page.locator("label", { has: radio }).click();
  await expect(radio).toBeChecked();
};

const waitForPreviews = (page: Page) =>
  expect(page.getByRole("link", { name: /^Pobierz/ })).toHaveCount(4);

test.describe("Feature: Marketing graphics export", () => {
  test("Scenario: PROO bar is optional and exported at the top of every format", async ({
    page,
  }, info) => {
    await page.goto("./marketing");
    await waitForPreviews(page);
    const noFunding = page.getByRole("radio", { name: "Bez belki" });
    const proo = page.getByRole("radio", { name: "PROO" });
    await expect(noFunding).toBeChecked();
    const square = page.getByRole("img", { name: /^Post kwadratowy:/ });
    const before = await square.getAttribute("src");

    await choose(page, "PROO");
    await expect(square).not.toHaveAttribute("src", before!);
    await waitForPreviews(page);

    for (const format of FORMATS) {
      const image = page.getByRole("img", {
        name: new RegExp(`^${format.name}:`),
      });
      const pixels = await image.evaluate((img: HTMLImageElement) => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const context = canvas.getContext("2d")!;
        context.drawImage(img, 0, 0);
        const top = context.getImageData(0, 0, canvas.width, 160).data;
        let leftWhite = 0;
        let rightWhite = 0;
        for (let y = 32; y < 155; y++) {
          for (let x = 64; x < canvas.width - 64; x++) {
            const offset = (y * canvas.width + x) * 4;
            if (
              top[offset] > 220 &&
              top[offset + 1] > 220 &&
              top[offset + 2] > 220
            ) {
              if (x < canvas.width / 2) leftWhite++;
              else rightWhite++;
            }
          }
        }
        return {
          blackCorner: Array.from(top.slice(0, 4)),
          leftWhite,
          rightWhite,
        };
      });
      expect(pixels.blackCorner).toEqual([0, 0, 0, 255]);
      expect(pixels.leftWhite).toBeGreaterThan(100);
      expect(pixels.rightWhite).toBeGreaterThan(100);
    }

    await page.screenshot({
      path: info.outputPath("proo-selected.png"),
      fullPage: true,
    });
    const withFunding = await square.getAttribute("src");
    await choose(page, "Bez belki");
    await expect(square).not.toHaveAttribute("src", withFunding!);
    await waitForPreviews(page);
  });

  test("Scenario: exporting every format of the default template", async ({
    page,
  }, info) => {
    await test.step("Given the user is in the Marketing module", async () => {
      await page.goto("./marketing");
      await waitForPreviews(page);
    });

    await test.step("When they write their own headline", async () => {
      await page.getByLabel("Tytuł", { exact: true }).fill("Zażółć gęślą jaźń");
      await expect(
        page.getByText("PNG · gotowe", { exact: true }),
      ).toBeVisible();
      await waitForPreviews(page);
    });

    await test.step("Then each download is the exact previewed PNG in the format size", async () => {
      const downloads = page.getByRole("link", { name: /^Pobierz/ });
      for (const [index, format] of FORMATS.entries()) {
        const link = downloads.nth(index);
        const href = await link.getAttribute("href");
        const preview = await page.evaluate(
          async (url) =>
            Array.from(new Uint8Array(await (await fetch(url!)).arrayBuffer())),
          href,
        );
        const pendingDownload = page.waitForEvent("download");
        await link.click();
        const download = await pendingDownload;
        const bytes = await readFile((await download.path())!);
        expect(download.suggestedFilename()).toBe(
          `gi-standard-${format.id}.png`,
        );
        expect(bytes.equals(Buffer.from(preview))).toBe(true);
        expect(bytes.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
        expect(bytes.readUInt32BE(16)).toBe(format.width);
        expect(bytes.readUInt32BE(20)).toBe(format.height);
        await download.saveAs(info.outputPath(download.suggestedFilename()));
      }
    });
  });

  test("Scenario: styling the text", async ({ page }) => {
    const title = page.getByLabel("Tytuł", { exact: true });

    await test.step("Given the user wrote a title", async () => {
      await page.goto("./marketing");
      await waitForPreviews(page);
      await title.fill("Razem tworzymy jutro");
    });

    await test.step("When they highlight a word and restyle the text", async () => {
      await title.evaluate((element: HTMLTextAreaElement) =>
        element.setSelectionRange(6, 14),
      );
      await page
        .getByRole("button", { name: "Wyróżnij zaznaczony tekst" })
        .first()
        .click();
      await choose(page, /Bardzo duży \(80 px\)/);
      await choose(page, "Tekst u góry");
      await choose(page, "Wyśrodkuj");
    });

    await test.step("Then the word is marked and every export is rendered again", async () => {
      await expect(title).toHaveValue("Razem *tworzymy* jutro");
      await waitForPreviews(page);
      await expect(
        page.getByRole("img", {
          name: /^Post kwadratowy: Razem tworzymy jutro/,
        }),
      ).toBeVisible();
    });
  });

  test("Scenario: framing an own photo", async ({ page }) => {
    // Square crops the 2:1 photo heavily, so the focal point decides the colour.
    const image = page.getByRole("img", { name: /^Post kwadratowy:/ });
    const picker = page.getByRole("group", { name: /Punkt kadrowania/ });
    const pixel = () =>
      image.evaluate((img: HTMLImageElement) => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const context = canvas.getContext("2d")!;
        context.drawImage(img, 0, 0);
        return Array.from(context.getImageData(540, 300, 1, 1).data);
      });
    const pickAt = async (share: number) => {
      const box = (await picker.boundingBox())!;
      await picker.click({
        position: { x: box.width * share, y: box.height / 2 },
      });
    };

    await test.step("Given the user added a half-red, half-blue photo", async () => {
      await page.goto("./marketing");
      await waitForPreviews(page);
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
      await page.getByLabel("Dodaj zdjęcie").setInputFiles({
        name: "crop.png",
        mimeType: "image/png",
        buffer: Buffer.from(fixture, "base64"),
      });
      await expect(picker).toBeVisible();
    });

    await test.step("When they point at the left part of the photo", async () => {
      await pickAt(0.05);
    });

    await test.step("Then the export shows the left part", async () => {
      // The overlay darkens the photo, so compare channels instead of exact colours.
      await expect
        .poll(async () => {
          const [red, , blue] = await pixel();
          return red > 60 && blue < 20;
        })
        .toBe(true);
    });

    await test.step("When they point at the right part of the photo", async () => {
      await pickAt(0.95);
    });

    await test.step("Then the export shows the right part", async () => {
      await expect
        .poll(async () => {
          const [red, , blue] = await pixel();
          return blue > 60 && red < 20;
        })
        .toBe(true);
    });
  });

  test("Scenario: sharing a prepared graphic from a phone", async ({
    page,
  }) => {
    await test.step("Given the device supports sharing files", async () => {
      await page.addInitScript(() => {
        Object.defineProperty(navigator, "canShare", {
          value: () => true,
          configurable: true,
        });
        Object.defineProperty(navigator, "share", {
          value: async (data: ShareData) => {
            const file = data.files?.[0];
            document.documentElement.dataset.shared = JSON.stringify({
              name: file?.name,
              type: file?.type,
              size: file?.size,
              isActive: navigator.userActivation.isActive,
            });
          },
          configurable: true,
        });
      });
      await page.goto("./marketing");
      await waitForPreviews(page);
    });

    await test.step("When the user taps share on the square post", async () => {
      await page
        .getByRole("button", {
          name: "Udostępnij Post kwadratowy",
          exact: true,
        })
        .click();
    });

    await test.step("Then the ready PNG is passed during the tap", async () => {
      const shared = JSON.parse(
        (await page.locator("html").getAttribute("data-shared"))!,
      );
      expect(shared).toMatchObject({
        name: "gi-standard-square.png",
        type: "image/png",
        isActive: true,
      });
      expect(shared.size).toBeGreaterThan(1000);
    });
  });
});
