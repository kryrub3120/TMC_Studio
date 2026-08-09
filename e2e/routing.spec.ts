import { expect, test } from "@playwright/test";

test.describe("Public routing", () => {
  test("unknown route renders a useful 404 page", async ({ page }) => {
    await page.goto("/this-route-does-not-exist");

    await expect(
      page.getByRole("heading", {
        name: /Page not found|Nie znaleziono strony/i,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Open the board|Otwórz tablicę/i }),
    ).toHaveAttribute("href", "/board");
  });

  test("legacy /app URL keeps checkout query parameters", async ({ page }) => {
    await page.goto("/app?upgrade=team&cycle=yearly");

    await expect(page).toHaveURL(/\/board/);
    await expect(
      page.getByRole("dialog", { name: /choose|wybierz/i }),
    ).toContainText("$290");
  });

  test("localized public routes keep language in internal links", async ({
    page,
  }) => {
    await page.goto("/pl/");

    await expect(
      page.getByRole("heading", { name: /Narysuj dowolną taktykę/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Cennik" }).first(),
    ).toHaveAttribute("href", "/pl/pricing/");

    await page.goto("/es/pricing/");
    await expect(
      page.getByRole("heading", {
        name: /Elige cómo quieres usar TMC Studio/i,
      }),
    ).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
  });

  test("formation template opens an editable preset on the board", async ({
    page,
  }) => {
    await page.goto("/templates/4-2-3-1-formation/");
    await expect(
      page.getByRole("heading", { name: /4-2-3-1 formation/i }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Use this formation" }).click();

    await expect(page).toHaveURL(/\/board$/);
    await expect(page.getByTestId("board-viewport")).toHaveAttribute(
      "data-home-player-count",
      "11",
    );
  });
});
