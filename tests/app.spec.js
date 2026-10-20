import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("locked colors survive shuffling and undo restores the palette", async ({
  page,
}) => {
  await page.goto("/");
  const before = await page.locator(".hex").allTextContents();
  await page.getByRole("button", { name: "Lock color 3", exact: true }).click();
  await page.getByRole("button", { name: "Shuffle the palette" }).click();
  const after = await page.locator(".hex").allTextContents();
  expect(after[2]).toBe(before[2]);
  expect(after).not.toEqual(before);
  await page.getByRole("button", { name: "Undo" }).click();
  expect(await page.locator(".hex").allTextContents()).toEqual(before);
});

test("save, reload, open, and remove a palette", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("textbox", { name: "Palette name" })
    .fill("After the rain");
  await page.getByRole("button", { name: "Save palette" }).click();
  await page.reload();
  await page.getByRole("button", { name: /Your shelf/ }).click();
  await expect(
    page.getByRole("heading", { name: "After the rain" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open palette" }).click();
  await expect(page.getByRole("heading", { name: /Trust your/ })).toBeVisible();
  await page.getByRole("button", { name: /Your shelf/ }).click();
  await page.getByRole("button", { name: "Delete After the rain" }).click();
  await expect(
    page.getByRole("heading", { name: "A blank canvas. Nice." }),
  ).toBeVisible();
});

test("shared links restore colors and export CSS", async ({ page }) => {
  await page.goto("/#000000-FFFFFF-FF0000-00FF00-0000FF");
  await expect(page.locator(".hex").first()).toContainText("#000000");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSS" }).click();
  expect((await download).suggestedFilename()).toBe("pigment.css");
  await page.getByLabel("Text color").selectOption("0");
  await page.getByLabel("Background", { exact: true }).selectOption("1");
  await expect(page.locator(".ratio strong")).toHaveText("21.00:1");
});

test("layout fits and default controls meet accessibility checks", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      document
        .getAnimations()
        .filter(
          (animation) => animation.effect.getTiming().iterations !== Infinity,
        )
        .map((animation) => animation.finished),
    );
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    results.violations.map((item) => ({
      id: item.id,
      nodes: item.nodes.map((node) => ({
        target: node.target,
        summary: node.failureSummary,
      })),
    })),
  ).toEqual([]);
});
