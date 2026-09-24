import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

test("shell navigation and all PNGs preserve preview bytes and dimensions", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("./");
  await expect(
    page.getByRole("heading", { name: /Mniej klikania/ }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("console.png"),
    fullPage: true,
  });
  await page.getByRole("link", { name: "Otwórz moduł" }).click();
  await expect(page.getByText("PNG · gotowe", { exact: true })).toBeVisible();
  await page.getByLabel("Nagłówek").fill("Zażółć gęślą jaźń");
  await expect(page.getByText("PNG · gotowe", { exact: true })).toBeVisible();
  const dimensions = [
    [1080, 1080],
    [1080, 1350],
    [1080, 1920],
    [1200, 628],
  ];
  const downloads = page.getByRole("link", { name: /^Pobierz/ });
  await expect(downloads).toHaveCount(4);
  for (const [index, [width, height]] of dimensions.entries()) {
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
    expect(bytes.equals(Buffer.from(preview))).toBe(true);
    expect(bytes.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
    expect(bytes.readUInt32BE(16)).toBe(width);
    expect(bytes.readUInt32BE(20)).toBe(height);
    await download.saveAs(info.outputPath(download.suggestedFilename()));
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: info.outputPath("marketing.png"),
    fullPage: true,
  });
  await page.reload();
  await expect(page.getByText("PNG · gotowe", { exact: true })).toBeVisible();
});

test("overflow and missing fonts block exports with explicit errors", async ({
  page,
}) => {
  await page.goto("./marketing");
  await expect(page.getByText("PNG · gotowe", { exact: true })).toBeVisible();
  await page.getByLabel("Nagłówek").fill("A".repeat(91));
  await expect(page.getByRole("alert")).toContainText("Skróć treść");
  await expect(page.getByRole("link", { name: /^Pobierz/ })).toHaveCount(0);
  await page.getByLabel("Nagłówek").fill("W".repeat(60));
  await expect(page.getByRole("alert")).toContainText("Zbyt długie słowo");
  await page.getByLabel("Nagłówek").fill("");
  await expect(page.getByRole("alert")).toContainText("Wpisz nagłówek");
  await page.getByLabel("Nagłówek").fill("Możemy działać!");
  await expect(page.getByRole("link", { name: /^Pobierz/ })).toHaveCount(4);
  await page.route("**/fonts/*.ttf", (route) => route.abort());
  await page.reload();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByRole("link", { name: /^Pobierz/ })).toHaveCount(0);
});

test("local photo cropping changes exported pixels and rejects invalid files", async ({
  page,
}, info) => {
  await page.goto("./marketing");
  await expect(page.getByText("PNG · gotowe", { exact: true })).toBeVisible();
  await page.getByLabel("Zdjęcie", { exact: false }).setInputFiles({
    name: "bad.png",
    mimeType: "image/png",
    buffer: Buffer.from("broken"),
  });
  await expect(page.getByRole("alert")).toContainText(
    "Nie udało się odczytać zdjęcia",
  );
  const fixture = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 400;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ff0000";
    ctx.fillRect(0, 0, 400, 400);
    ctx.fillStyle = "#0000ff";
    ctx.fillRect(400, 0, 400, 400);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  await page.getByLabel("Zdjęcie", { exact: false }).setInputFiles({
    name: "crop.png",
    mimeType: "image/png",
    buffer: Buffer.from(fixture, "base64"),
  });
  await expect(page.getByLabel("Poziomo")).toBeVisible();
  await page.getByLabel("Poziomo").fill("0");
  await expect(page.getByText("PNG · gotowe", { exact: true })).toBeVisible();
  const image = page.getByRole("img", { name: /^Post poziomy:/ });
  const leftUrl = await image.getAttribute("src");
  const pixel = () =>
    image.evaluate((img: HTMLImageElement) => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      return Array.from(ctx.getImageData(800, 100, 1, 1).data);
    });
  await expect.poll(pixel).toEqual([255, 0, 0, 255]);
  await page.getByLabel("Poziomo").fill("100");
  await expect(image).not.toHaveAttribute("src", leftUrl!);
  await expect.poll(pixel).toEqual([0, 0, 255, 255]);
  await page.screenshot({
    path: info.outputPath("photo-crop.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Usuń zdjęcie" }).click();
  await expect(page.getByLabel("Poziomo")).toHaveCount(0);
});

test("share passes a prepared PNG during the user gesture and keeps download fallback", async ({
  page,
}) => {
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
          active: navigator.userActivation.isActive,
        });
      },
      configurable: true,
    });
  });
  await page.goto("./marketing");
  await page
    .getByRole("button", { name: "Udostępnij Post kwadratowy", exact: true })
    .click();
  const shared = JSON.parse(
    (await page.locator("html").getAttribute("data-shared"))!,
  );
  expect(shared).toMatchObject({
    name: "gi-test-square.png",
    type: "image/png",
    active: true,
  });
  expect(shared.size).toBeGreaterThan(1000);
  await expect(page.getByRole("link", { name: /^Pobierz/ })).toHaveCount(4);
});
