import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const APP_URL = 'http://localhost:5173/';

async function runTests() {
  console.log('🚀 Starting Real Browser DOM Verification Test Suite...');
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (e) {
    console.log('Trying system channel chrome fallback...');
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  }

  const page = await browser.newPage();

  page.on('console', (msg) => {
    if (msg.text().includes('[TEST-LOG]')) {
      console.log('  -> Browser Console:', msg.text());
    }
  });

  let failedCount = 0;
  const assert = (condition, testName, details = '') => {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
    } else {
      console.error(`❌ [FAIL] ${testName}: ${details}`);
      failedCount++;
    }
  };

  try {
    // Step 1: Open Website
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    console.log('🌐 Connected to http://localhost:5173/');

    // Step 2: Test Home Page elements
    const heroHeading = await page.textContent('h1');
    assert(heroHeading.includes('Happy Birthday, Annu'), 'Hero Heading Test', `Got: ${heroHeading}`);

    // Step 3: Run In-App Automated Test Suite Modal
    console.log('🧪 Executing In-App Verification Suite...');
    await page.click('[data-testid="open-test-suite-btn"]');
    await page.waitForSelector('[data-testid="run-automated-tests-btn"]');
    await page.click('[data-testid="run-automated-tests-btn"]');
    await page.waitForTimeout(3000);

    const testResultsText = await page.textContent('body');
    assert(testResultsText.includes('All Tests Passed Successfully'), 'In-App Automated Suite Execution', 'Automated test suite reported errors');

    // Close test modal
    await page.click('button:has-text("Close Window")');

    // Step 4: Real DOM Upload & Carousel Mapping Test
    console.log('📸 Performing Real DOM Photo Upload & Carousel Verification...');
    
    const createTestPng = (filename) => {
      const filePath = path.join(process.cwd(), filename);
      const pngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
      fs.writeFileSync(filePath, pngBuffer);
      return filePath;
    };

    const fileA = createTestPng('test_img_a.png');
    const fileB = createTestPng('test_img_b.png');
    const fileC = createTestPng('test_img_c.png');

    // Open Media Manager
    await page.click('[data-testid="nav-add-photos-btn"]');
    await page.waitForSelector('[data-testid="media-manager-modal"]');

    // Upload to Chapter 01 Slot 01
    const uploadInputCh1S1 = page.locator('[data-testid="media-upload-chapter-01-1"]');
    await uploadInputCh1S1.setInputFiles(fileA);
    await page.waitForTimeout(500);

    // Upload to Chapter 01 Slot 02
    const uploadInputCh1S2 = page.locator('[data-testid="media-upload-chapter-01-2"]');
    await uploadInputCh1S2.setInputFiles(fileB);
    await page.waitForTimeout(500);

    // Switch tab in Media Manager to Chapter 03
    await page.click('button:has-text("CHAPTER 03")');
    await page.waitForTimeout(300);

    // Upload to Chapter 03 Slot 04
    const uploadInputCh3S4 = page.locator('[data-testid="media-upload-chapter-03-4"]');
    await uploadInputCh3S4.setInputFiles(fileC);
    await page.waitForTimeout(500);

    // Close Media Manager
    await page.click('button:has-text("Done & View Journey")');

    // Step 5: Verify Journey Rendering & Carousel Navigation
    console.log('🎠 Verifying Journey Photo Frame & Carousel Updates...');

    await page.click('button:has-text("JOURNEY")');
    await page.waitForTimeout(500);

    await page.click('[data-testid="chapter-tab-chapter-01"]');
    await page.waitForTimeout(300);

    const counterText1 = await page.textContent('[data-testid="journey-slide-counter"]');
    assert(counterText1.includes('01 / 05'), 'Slide Counter 01 / 05', `Got: ${counterText1}`);

    const frameImageCh1S1 = page.locator('[data-testid="journey-photo-frame"] img[data-testid="journey-photo-image"]');
    const isImageVisible1 = await frameImageCh1S1.isVisible();
    assert(isImageVisible1, 'Chapter 01 Slide 01 Photo Frame Image Visible');
    const src1 = await frameImageCh1S1.getAttribute('src');
    assert(src1 && (src1.startsWith('http') || src1.startsWith('blob:')), 'Chapter 01 Slide 01 URL Generated', `Got src: ${src1}`);

    await page.click('[data-testid="journey-next-btn"]');
    await page.waitForTimeout(500);

    const counterText2 = await page.textContent('[data-testid="journey-slide-counter"]');
    assert(counterText2.includes('02 / 05'), 'Slide Counter 02 / 05', `Got: ${counterText2}`);

    const frameImageCh1S2 = page.locator('[data-testid="journey-photo-frame"] img[data-testid="journey-photo-image"]');
    const isImageVisible2 = await frameImageCh1S2.isVisible();
    assert(isImageVisible2, 'Chapter 01 Slide 02 Photo Frame Image Visible');
    const src2 = await frameImageCh1S2.getAttribute('src');
    assert(src2 && src2 !== src1, 'Chapter 01 Slide 02 Unique Photo URL (No Interference)');

    // Step 6: Test Chapter Switching Reset & Isolation
    console.log('🔀 Testing Chapter Switching & Chapter Isolation...');

    await page.click('[data-testid="chapter-tab-chapter-03"]');
    await page.waitForTimeout(500);

    const counterReset = await page.textContent('[data-testid="journey-slide-counter"]');
    assert(counterReset.includes('01 / 05'), 'Chapter Switch Resets Slide Counter to 01 / 05', `Got: ${counterReset}`);

    await page.click('[data-testid="journey-next-btn"]');
    await page.click('[data-testid="journey-next-btn"]');
    await page.click('[data-testid="journey-next-btn"]');
    await page.waitForTimeout(500);

    const counterTextCh3S4 = await page.textContent('[data-testid="journey-slide-counter"]');
    assert(counterTextCh3S4.includes('04 / 05'), 'Chapter 03 Slide Counter 04 / 05', `Got: ${counterTextCh3S4}`);

    const frameImageCh3S4 = page.locator('[data-testid="journey-photo-frame"] img[data-testid="journey-photo-image"]');
    const isImageVisibleCh3S4 = await frameImageCh3S4.isVisible();
    assert(isImageVisibleCh3S4, 'Chapter 03 Slide 04 Photo Frame Image Visible');

    // Step 7: Test Refresh Persistence across browser reload
    console.log('🔄 Testing IndexedDB Page Refresh Persistence...');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.click('button:has-text("JOURNEY")');
    await page.click('[data-testid="chapter-tab-chapter-03"]');
    await page.click('[data-testid="journey-next-btn"]');
    await page.click('[data-testid="journey-next-btn"]');
    await page.click('[data-testid="journey-next-btn"]');
    await page.waitForTimeout(500);

    const rehydratedImage = page.locator('[data-testid="journey-photo-frame"] img[data-testid="journey-photo-image"]');
    const isRehydratedVisible = await rehydratedImage.isVisible();
    assert(isRehydratedVisible, 'Photo in Chapter 03 Slide 04 Survived Page Refresh via IndexedDB Rehydration!');

    try {
      fs.unlinkSync(fileA);
      fs.unlinkSync(fileB);
      fs.unlinkSync(fileC);
    } catch (e) {}

    console.log('\n==================================================');
    if (failedCount === 0) {
      console.log('🎉 ALL REAL BROWSER DOM VERIFICATION TESTS PASSED SUCCESSFULLY!');
    } else {
      console.error(`💥 VERIFICATION FAILED WITH ${failedCount} ERRORS`);
      process.exit(1);
    }

  } catch (err) {
    console.error('Fatal test runner exception:', err);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}

runTests();
