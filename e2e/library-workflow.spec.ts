import { expect, test } from "@playwright/test";
import { stat } from "node:fs/promises";

test.describe("Coaching library workflow", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("tmc-cookie-consent", JSON.stringify({ analytics: false, ts: "e2e" }));
      localStorage.setItem("tmc-language", "pl");
      localStorage.setItem("tmc-studio-dev-cloud-user", "dev-library-workflow-v2");
      if (sessionStorage.getItem("tmc-library-test-initialized") !== "1") {
        localStorage.removeItem("tmc-studio-dev-cloud-projects-dev-library-workflow-v2");
        localStorage.removeItem("tmc-studio-dev-cloud-folders-dev-library-workflow-v2");
        localStorage.removeItem("tmc-studio-board");
        sessionStorage.setItem("tmc-library-test-initialized", "1");
      }
      localStorage.setItem(
        "tmc-auth",
        JSON.stringify({
          state: {
            isInitialized: true,
            isMockUser: true,
            isAuthenticated: true,
            isPro: true,
            isTeam: false,
            user: {
              id: "dev-library-workflow-v2",
              email: "library@tmcstudio.test",
              full_name: "Library Coach",
              subscription_tier: "pro",
            },
          },
          version: 0,
        }),
      );
      localStorage.setItem(
        "tmc-ui-settings",
        JSON.stringify({
          state: { tutorialCompleted: true, clubWelcomeSeen: true },
          version: 0,
        }),
      );
      localStorage.setItem("tmc-exercise-guide-seen", "1");
      localStorage.setItem("tmc-session-guide-seen", "1");
    });
    await page.goto("/board");
    await page.waitForLoadState("networkidle");
  });

  test("opens dedicated exercise and session editors and persists a complete plan", async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    const openLibrary = async () => {
      const workspaceButton = page.getByRole("button", { name: "Biblioteka" });
      if (await workspaceButton.isVisible().catch(() => false)) await workspaceButton.click();
      else await page.locator('[data-tour="projects"] button').first().click();
      await expect(page.locator('[data-tour="projects-panel"]')).toBeVisible();
    };

    await openLibrary();
    await page.getByTestId("library-tutorial-open").click();
    const libraryGuide = page.getByTestId("library-tutorial");
    await expect(libraryGuide).toContainText("Narysuj grafikę");
    await libraryGuide.getByRole("button", { name: "Dalej" }).click();
    await expect(libraryGuide).toContainText("Zbuduj ćwiczenie");
    await libraryGuide.getByRole("button", { name: "Dalej" }).click();
    await expect(libraryGuide).toContainText("Ułóż konspekt");
    await libraryGuide.getByRole("button", { name: "Gotowe" }).click();

    await page.getByTestId("create-graphic-project").click();
    await expect(page.locator('[data-tour="projects-panel"]')).toBeHidden();
    await page.keyboard.press("b");
    await page.waitForTimeout(2300);

    await openLibrary();
    await expect(page.getByTestId("recent-projects")).toBeVisible();
    await page.getByTestId("library-type-exercise").click();
    await page.getByTestId("create-exercise-project").click();
    await expect(page.locator('[data-tour="projects-panel"]')).toBeHidden();
    await expect(page.getByTestId("exercise-workspace")).toBeVisible();
    await page.getByRole("button", { name: "Szybki przewodnik" }).click();
    await expect(page.getByRole("heading", { name: "Stwórz kompletne ćwiczenie" })).toBeVisible();
    await page.getByRole("button", { name: "Zaczynamy" }).click();

    await expect(page.getByTestId("exercise-graphic-picker")).toBeVisible();
    await expect(page.getByTestId("exercise-graphic-option").first()).toHaveAttribute("aria-pressed", "true");

    const copiedElementTypes = await page.evaluate(() => {
      const document = JSON.parse(localStorage.getItem("tmc-studio-board") ?? "{}");
      return document.steps?.[0]?.elements?.map((element: { type: string }) => element.type) ?? [];
    });
    expect(copiedElementTypes).toContain("ball");

    await page.getByLabel("Czas łącznie (min)").fill("20");
    await page.getByLabel("Serie").fill("2");
    await page.getByLabel("Praca (min)").fill("7");
    await page.getByLabel("Przerwa (min)").fill("1");
    await expect(page.getByText("2 × 7 min + 1 min · 15 min", { exact: true })).toBeVisible();
    await page.getByLabel("Liczba zawodników").fill("8 + 2 neutralnych");
    await page.getByLabel("Kategoria / faza").fill("Gra pozycyjna");
    await page.getByLabel("Cel treningowy").fill("Skanowanie i zmiana centrum gry");
    await page.getByLabel("Treść ćwiczenia").fill("Gra 4v4 z dwoma neutralnymi. Punkt po zmianie strony.");
    await page.getByLabel("Organizacja").fill("Pole 30x25 m, dwa zespoły po czterech.");
    await page.getByLabel("Kluczowe wskazówki").fill("Skanowanie przed przyjęciem.");
    await page.getByLabel("Progresja / regresja").fill("Maksymalnie dwa kontakty.");
    await page.getByLabel("Sprzęt").fill("8 stożków, piłki, znaczniki.");
    const exerciseName = page.getByLabel("Nazwa ćwiczenia").first();
    await exerciseName.fill("Pressing 4v4");
    await exerciseName.press("Enter");
    await expect(page.getByRole("button", { name: "Pobierz PDF" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Drukuj" })).toBeVisible();

    await page.evaluate(() => {
      window.print = () => {
        document.documentElement.dataset.exercisePrintCalled = "true";
      };
    });
    await page.getByRole("button", { name: "Drukuj" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-exercise-print-called", "true");

    const exerciseDownloadPromise = page.waitForEvent("download", {
      timeout: 30_000,
    });
    await page.getByRole("button", { name: "Pobierz PDF" }).click();
    const exerciseDownload = await exerciseDownloadPromise;
    expect(exerciseDownload.suggestedFilename()).toBe("Pressing-4v4.pdf");
    const exercisePdfPath = testInfo.outputPath("exercise.pdf");
    await exerciseDownload.saveAs(exercisePdfPath);
    expect((await stat(exercisePdfPath)).size).toBeGreaterThan(10_000);
    const firstExerciseId = await page.getByTestId("exercise-workspace").getAttribute("data-project-id");

    await openLibrary();
    await page.getByTestId("library-type-exercise").click();
    await page.getByTestId("create-exercise-project").click();
    await expect(page.locator('[data-tour="projects-panel"]')).toBeHidden();
    await expect(page.getByTestId("exercise-workspace")).toBeVisible();
    await expect(page.getByTestId("exercise-workspace")).not.toHaveAttribute("data-project-id", firstExerciseId ?? "");
    await page.getByLabel("Czas łącznie (min)").fill("10");

    await openLibrary();
    await page.getByTestId("library-type-session").click();
    await page.getByTestId("create-session-project").click();
    await expect(page.locator('[data-tour="projects-panel"]')).toBeHidden();
    await expect(page.getByTestId("session-workspace")).toBeVisible();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const expectedDate = [tomorrow.getFullYear(), String(tomorrow.getMonth() + 1).padStart(2, "0"), String(tomorrow.getDate()).padStart(2, "0")].join("-");
    const expectedNameDate = [String(tomorrow.getDate()).padStart(2, "0"), String(tomorrow.getMonth() + 1).padStart(2, "0"), tomorrow.getFullYear()].join(".");
    await expect(page.getByLabel("Data")).toHaveValue(expectedDate);
    await expect(page.getByLabel("Nazwa konspektu").first()).toHaveValue(`Trening - ${expectedNameDate}`);
    await page.getByRole("button", { name: "Szybki przewodnik" }).click();
    await expect(page.getByRole("heading", { name: "Zbuduj konspekt treningowy" })).toBeVisible();
    await page.getByRole("button", { name: "Zaczynamy" }).click();

    const sessionName = page.getByLabel("Nazwa konspektu").first();
    await sessionName.fill("MD +2 — wysoki pressing");
    await sessionName.press("Enter");
    await expect(page.getByRole("button", { name: "Pobierz PDF" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Drukuj" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Wróć do tablicy" })).toBeVisible();

    await page.getByLabel("Data").fill("2026-08-12");
    await page.getByLabel("Dzień mikrocyklu").fill("MD +2");
    await page.getByLabel("Miejsce").fill("Siechnice");
    await page.getByLabel("Godzina").fill("10:00");
    await page.getByLabel("Sztab").fill("MH, MHA, KR");
    await page.getByLabel("Cele jednostki").fill("Obrona wysoka i budowanie gry.");

    const exerciseButtons = page.getByRole("complementary").getByRole("button");
    await exerciseButtons.first().click();
    await exerciseButtons.nth(1).click();
    await expect(page.locator("article")).toHaveCount(2);
    await expect(page.getByText("25 min", { exact: true }).first()).toBeVisible();
    await page.getByPlaceholder("Treść, zasady, warianty i wskazówki…").first().fill("Rozgrzewka z piłką.");

    await page.getByRole("button", { name: /Dodaj grupę pozycyjną/ }).click();
    await page.getByPlaceholder("Jeden zawodnik w wierszu").fill("Nowak\nKowalski");
    await page.getByRole("button", { name: /Dodaj członka sztabu/ }).click();
    await page.locator("tbody input").first().fill("KR");
    await page.getByLabel("Sprzęt i przygotowanie").fill("Bramki, piłki, GPS.");
    await page.waitForTimeout(2300);

    await page.evaluate(() => {
      window.print = () => {
        document.documentElement.dataset.printCalled = "true";
      };
    });
    await page.getByRole("button", { name: "Drukuj" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-print-called", "true");

    const downloadPromise = page.waitForEvent("download", { timeout: 30_000 });
    await page.getByRole("button", { name: "Pobierz PDF" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("MD-2-wysoki-pressing.pdf");
    const sessionPdfPath = testInfo.outputPath("session.pdf");
    await download.saveAs(sessionPdfPath);
    expect((await stat(sessionPdfPath)).size).toBeGreaterThan(10_000);

    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("session-workspace")).toBeVisible();
    await expect(page.getByLabel("Nazwa konspektu").first()).toHaveValue("MD +2 — wysoki pressing");
    await expect(page.getByLabel("Miejsce")).toHaveValue("Siechnice");
    await expect(page.locator("article")).toHaveCount(2);
    await expect(page.getByPlaceholder("Treść, zasady, warianty i wskazówki…").first()).toHaveValue(
      "Rozgrzewka z piłką.",
    );
    await expect(page.getByPlaceholder("Jeden zawodnik w wierszu")).toHaveValue("Nowak\nKowalski");
    await expect(page.getByLabel("Sprzęt i przygotowanie")).toHaveValue("Bramki, piłki, GPS.");

    await page.setViewportSize({ width: 390, height: 844 });
    const workspaceDimensions = await page.getByTestId("session-workspace").evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));
    expect(workspaceDimensions.scrollWidth).toBeLessThanOrEqual(workspaceDimensions.clientWidth);
    await openLibrary();
    const workspaceHeader = page.getByTestId("session-workspace").locator("header");
    await expect(workspaceHeader).toBeVisible();
    const panelTop = await page
      .locator('[data-tour="projects-panel"]')
      .evaluate((element) => element.getBoundingClientRect().top);
    const headerBottom = await workspaceHeader.evaluate((element) => element.getBoundingClientRect().bottom);
    expect(panelTop).toBeGreaterThanOrEqual(headerBottom - 1);
    const drawerDimensions = await page.locator('[data-tour="projects-panel"]').evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));
    expect(drawerDimensions.scrollWidth).toBeLessThanOrEqual(drawerDimensions.clientWidth);
    await expect(page.getByTestId("recent-projects")).toBeVisible();
    await page.getByRole("button", { name: "Wróć", exact: true }).click();
    await expect(page.locator('[data-tour="projects-panel"]')).toBeHidden();

    await page.setViewportSize({ width: 1440, height: 900 });
    await openLibrary();
    await page.getByTestId("library-type-all").click();
    await page.getByRole("button", { name: /Nieposegregowane/ }).click();
    const projectCards = page.locator('[data-tour="projects-panel"] main article');
    const beforeBulkDelete = await projectCards.count();
    await projectCards.nth(0).getByRole("button", { name: /Zaznacz / }).click();
    await projectCards.nth(1).getByRole("button", { name: /Zaznacz / }).click();
    await expect(page.getByTestId("bulk-project-actions")).toContainText("Zaznaczono: 2");
    await page.getByRole("button", { name: "Usuń zaznaczone" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Usuń zaznaczone" }).click();
    await expect(projectCards).toHaveCount(beforeBulkDelete - 2);
  });
});
