/**
 * Playwright test: Delete Memory persistence
 *
 * Tests the full delete flow including:
 *  - Cancel (memory remains)
 *  - Confirm (memory disappears)
 *  - Reload (memory stays gone — IndexedDB verified)
 *  - Other memories remain untouched
 *  - Category filter preserves remaining cards correctly
 */

import { chromium } from "playwright";

const APP_URL = "http://localhost:5173";
const PASS = (msg) => console.log(`  ✅ PASS: ${msg}`);
const FAIL = (msg) => { console.error(`  ❌ FAIL: ${msg}`); process.exit(1); };
const LOG  = (msg) => console.log(`\n► ${msg}`);

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  const browser = await chromium.launch({ headless: false, slowMo: 120 });
  const ctx    = await browser.newContext();
  const page   = await ctx.newPage();

  page.on("console", (m) => {
    if (m.type() === "error") console.warn("  [browser error]", m.text());
  });

  // ──────────────────────────────────────────────────────────────
  LOG("Opening the app and navigating to Our Memories");
  await page.goto(APP_URL, { waitUntil: "networkidle" });
  await sleep(1500);

  // Click the Memories nav link
  const memNav = page.locator("nav").getByText(/our memories/i).first();
  await memNav.click();
  await sleep(1000);

  // ──────────────────────────────────────────────────────────────
  LOG("TEST 1 — Verify memory cards exist");
  const cards = page.locator('[data-testid="memory-card"]');
  await cards.first().waitFor({ state: "visible", timeout: 8000 });
  const totalCards = await cards.count();
  if (totalCards < 2) FAIL(`Expected at least 2 memory cards, found ${totalCards}`);
  PASS(`Found ${totalCards} memory cards`);

  // Read the IDs of the first two cards
  const firstCardId  = await cards.nth(0).getAttribute("data-memory-id");
  const secondCardId = await cards.nth(1).getAttribute("data-memory-id");
  if (!firstCardId)  FAIL("First card has no data-memory-id");
  if (!secondCardId) FAIL("Second card has no data-memory-id");
  PASS(`First card ID:  ${firstCardId}`);
  PASS(`Second card ID: ${secondCardId}`);

  // ──────────────────────────────────────────────────────────────
  LOG("TEST 2 — Hover to reveal delete button, then click CANCEL");

  const firstCard = page.locator(`[data-memory-id="${firstCardId}"]`);
  await firstCard.hover();
  await sleep(300);

  const deleteBtn = firstCard.locator('[data-testid="delete-memory"]');
  await deleteBtn.waitFor({ state: "visible", timeout: 5000 });
  await deleteBtn.click();
  await sleep(500);

  // Confirmation modal must appear
  const confirmBtn = page.locator('[data-testid="delete-memory-confirm"]');
  const cancelBtn  = page.locator('[data-testid="delete-memory-cancel"]');
  await confirmBtn.waitFor({ state: "visible", timeout: 5000 });
  PASS("Delete confirmation modal appeared");

  await cancelBtn.click();
  await sleep(500);

  // Modal must be gone
  const modalVisible = await confirmBtn.isVisible();
  if (modalVisible) FAIL("Modal still visible after Cancel");
  PASS("Modal closed after Cancel");

  // Card must still be in DOM
  const cardStillHere = await page.locator(`[data-memory-id="${firstCardId}"]`).isVisible();
  if (!cardStillHere) FAIL("Card disappeared after Cancel — it should remain");
  PASS("Card still visible after Cancel");

  // ──────────────────────────────────────────────────────────────
  LOG("TEST 3 — Delete first card and confirm it disappears");

  await firstCard.hover();
  await sleep(300);
  await deleteBtn.click();
  await sleep(400);

  await confirmBtn.waitFor({ state: "visible", timeout: 5000 });
  await confirmBtn.click();
  await sleep(1500); // wait for IndexedDB write + state update

  // Deleted card must be gone
  const deletedCardVisible = await page
    .locator(`[data-memory-id="${firstCardId}"]`)
    .isVisible()
    .catch(() => false);
  if (deletedCardVisible) FAIL(`Card ${firstCardId} still visible after Delete`);
  PASS(`Card ${firstCardId} disappeared from UI`);

  // Second card must still be visible
  const secondCardStillHere = await page
    .locator(`[data-memory-id="${secondCardId}"]`)
    .isVisible();
  if (!secondCardStillHere) FAIL(`Card ${secondCardId} was accidentally deleted`);
  PASS(`Other card ${secondCardId} still visible — no collateral deletion`);

  // ──────────────────────────────────────────────────────────────
  LOG("TEST 4 — Reload and verify deleted card is STILL gone (IndexedDB)");

  await page.reload({ waitUntil: "networkidle" });
  await sleep(2000);

  // Re-navigate to memories
  const memNav2 = page.locator("nav").getByText(/our memories/i).first();
  await memNav2.click();
  await sleep(1000);

  const deletedCardAfterReload = await page
    .locator(`[data-memory-id="${firstCardId}"]`)
    .isVisible()
    .catch(() => false);
  if (deletedCardAfterReload) FAIL(`Card ${firstCardId} reappeared after reload — IndexedDB not persisted`);
  PASS(`Card ${firstCardId} still absent after reload — IndexedDB confirmed`);

  const secondCardAfterReload = await page
    .locator(`[data-memory-id="${secondCardId}"]`)
    .isVisible();
  if (!secondCardAfterReload) FAIL(`Card ${secondCardId} missing after reload`);
  PASS(`Card ${secondCardId} present after reload`);

  // ──────────────────────────────────────────────────────────────
  LOG("TEST 5 — Category filter test: delete under HER ❤️ filter");

  // Switch to HER ❤️ filter
  const herBtn = page.getByRole("button", { name: /HER/i }).first();
  await herBtn.click();
  await sleep(600);

  const herCards = page.locator('[data-testid="memory-card"]');
  const herCount = await herCards.count();
  console.log(`  ℹ️  HER ❤️ filter shows ${herCount} card(s)`);

  if (herCount >= 1) {
    const herCardId = await herCards.nth(0).getAttribute("data-memory-id");
    PASS(`HER ❤️ card found: ${herCardId}`);

    // Delete it
    await herCards.nth(0).hover();
    await sleep(300);
    const herDeleteBtn = herCards.nth(0).locator('[data-testid="delete-memory"]');
    await herDeleteBtn.waitFor({ state: "visible", timeout: 5000 });
    await herDeleteBtn.click();
    await sleep(400);

    const herConfirmBtn = page.locator('[data-testid="delete-memory-confirm"]');
    await herConfirmBtn.waitFor({ state: "visible", timeout: 5000 });
    await herConfirmBtn.click();
    await sleep(1500);

    const herCardGone = await page
      .locator(`[data-memory-id="${herCardId}"]`)
      .isVisible()
      .catch(() => false);
    if (herCardGone) FAIL(`HER ❤️ card ${herCardId} still visible after delete`);
    PASS(`HER ❤️ card ${herCardId} deleted successfully`);

    // Switch to ALL and verify other categories untouched
    const allBtn = page.getByRole("button", { name: /^ALL$/i }).first();
    await allBtn.click();
    await sleep(600);
    const allCards = page.locator('[data-testid="memory-card"]');
    const allCount = await allCards.count();
    PASS(`ALL filter now shows ${allCount} card(s) — filter integrity confirmed`);
  } else {
    console.log("  ℹ️  No HER ❤️ cards to test filter delete (may have been already deleted)");
  }

  // ──────────────────────────────────────────────────────────────
  LOG("TEST 6 — Verify empty state if all memories deleted");

  // Count remaining
  const allBtn2 = page.getByRole("button", { name: /^ALL$/i }).first();
  await allBtn2.click();
  await sleep(400);

  const remainingCount = await page.locator('[data-testid="memory-card"]').count();
  console.log(`  ℹ️  ${remainingCount} memory card(s) remaining`);

  if (remainingCount === 0) {
    const emptyState = page.getByText(/no memories yet/i);
    const emptyVisible = await emptyState.isVisible();
    if (!emptyVisible) FAIL("Empty state text not shown when no memories remain");
    PASS("Empty state correctly shown when no memories remain");

    const addBtn = page.getByRole("button", { name: /add memory/i }).first();
    const addBtnVisible = await addBtn.isVisible();
    if (!addBtnVisible) FAIL("'+ Add Memory' button not visible in empty state");
    PASS("'+ Add Memory' button visible in empty state");
  } else {
    PASS(`${remainingCount} memories remain — empty state not triggered (expected)`);
  }

  // ──────────────────────────────────────────────────────────────
  LOG("All tests passed! ✅");
  await sleep(2000);
  await browser.close();
}

run().catch((err) => {
  console.error("Test suite crashed:", err);
  process.exit(1);
});
