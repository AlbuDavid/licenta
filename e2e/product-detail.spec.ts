import { test, expect } from "@playwright/test";

test.describe("Product Detail Page", () => {
  test("navigate from catalog to product detail", async ({ page }) => {
    await page.goto("/produse");

    // Wait for product cards to render
    const firstCard = page.locator("a[href^='/produse/']").first();
    await expect(firstCard).toBeVisible();

    // Get the product link href
    const href = await firstCard.getAttribute("href");
    expect(href).toBeTruthy();

    // Click the product image/name link
    await firstCard.click();
    await page.waitForURL(/\/produse\/.+/);

    // Verify the detail page loaded
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("h1")).not.toBeEmpty();

    // Verify price is displayed (contains RON)
    await expect(page.getByText(/\d+,\d{2}\s*RON/).first()).toBeVisible();

    // Verify breadcrumbs exist
    await expect(page.locator("nav[aria-label='Breadcrumb']")).toBeVisible();
    await expect(page.getByLabel("Breadcrumb").getByRole("link", { name: "Produse" })).toBeVisible();
  });

  test("add to cart from detail page", async ({ page }) => {
    // Navigate to the catalog first to get a real product ID
    await page.goto("/produse");

    const firstLink = page.locator("a[href^='/produse/']").first();
    await expect(firstLink).toBeVisible();
    const href = await firstLink.getAttribute("href");

    // Go directly to the product detail page
    await page.goto(href!);
    await expect(page.locator("h1")).toBeVisible();

    // Click "Adaugă în Coș"
    await page.getByRole("button", { name: /Adaugă în Coș/ }).first().click();

    // The cart drawer should open
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 3000 });
  });

  test("related products section renders", async ({ page }) => {
    await page.goto("/produse");

    const firstLink = page.locator("a[href^='/produse/']").first();
    await expect(firstLink).toBeVisible();
    const href = await firstLink.getAttribute("href");

    await page.goto(href!);
    await expect(page.locator("h1")).toBeVisible();

    // Check for "Produse similare" section
    const relatedSection = page.getByText("Produse similare");
    // Related products may or may not exist depending on category
    // Just verify page loads without error
    const hasRelated = await relatedSection.isVisible().catch(() => false);

    if (hasRelated) {
      // If related products exist, verify at least one product card is rendered
      const relatedCards = page.locator("section a[href^='/produse/']");
      await expect(relatedCards.first()).toBeVisible();
    }
  });

  test("breadcrumbs navigate back to catalog", async ({ page }) => {
    await page.goto("/produse");

    const firstLink = page.locator("a[href^='/produse/']").first();
    await expect(firstLink).toBeVisible();
    const href = await firstLink.getAttribute("href");

    await page.goto(href!);
    await expect(page.locator("nav[aria-label='Breadcrumb']")).toBeVisible();

    // Click "Produse" breadcrumb to go back to catalog
    await page.locator("nav[aria-label='Breadcrumb']").getByRole("link", { name: "Produse" }).click();
    await page.waitForURL("/produse");

    // Verify catalog loaded
    await expect(page.getByText("Produsele Noastre")).toBeVisible();
  });

  test("tabs show correct content", async ({ page }) => {
    await page.goto("/produse");

    const firstLink = page.locator("a[href^='/produse/']").first();
    await expect(firstLink).toBeVisible();
    const href = await firstLink.getAttribute("href");

    await page.goto(href!);
    await expect(page.locator("h1")).toBeVisible();

    // Default tab "Descriere" should be active
    await expect(page.getByRole("tab", { name: "Descriere" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Specificații" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Livrare" })).toBeVisible();

    // Click "Specificații" tab
    await page.getByRole("tab", { name: "Specificații" }).click();
    await expect(page.getByText("Material", { exact: true })).toBeVisible();

    // Click "Livrare" tab
    await page.getByRole("tab", { name: "Livrare" }).click();
    await expect(page.getByText("Timp de procesare")).toBeVisible();
  });
});

test.describe("Product Detail Page - Mobile", () => {
  test("mobile layout stacks vertically", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Mobile-only test");

    await page.goto("/produse");

    const firstLink = page.locator("a[href^='/produse/']").first();
    await expect(firstLink).toBeVisible();
    const href = await firstLink.getAttribute("href");

    await page.goto(href!);
    await expect(page.locator("h1")).toBeVisible();

    // On mobile, the image and info should stack vertically
    // Verify both the image and the product name are visible
    const image = page.locator("img").first();
    const heading = page.locator("h1");

    await expect(image).toBeVisible();
    await expect(heading).toBeVisible();

    // The heading should be below the image
    const imageBox = await image.boundingBox();
    const headingBox = await heading.boundingBox();

    expect(imageBox).toBeTruthy();
    expect(headingBox).toBeTruthy();
    expect(headingBox!.y).toBeGreaterThan(imageBox!.y);
  });
});
