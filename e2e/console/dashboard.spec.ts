import { expect, test } from "@playwright/test";

test.describe("Feature: Console dashboard", () => {
  test("Scenario: a team member opens a module from the dashboard", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));

    await test.step("Given the user is on the dashboard", async () => {
      await page.goto("./");
      await expect(
        page.getByRole("heading", { name: /Narzędzia dla\s*wolontariuszy/ }),
      ).toBeVisible();
    });

    await test.step("When they open the Marketing module", async () => {
      await page.getByRole("link", { name: /Otwórz moduł/ }).click();
    });

    await test.step("Then the module is shown and marked in the navigation", async () => {
      await expect(page).toHaveURL(/\/marketing\/?$/);
      await expect(
        page.getByRole("link", { name: "Marketing", exact: true }),
      ).toHaveAttribute("aria-current", "page");
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      expect(errors).toEqual([]);
    });
  });
});
