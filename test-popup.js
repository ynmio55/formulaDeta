const { chromium } = require('playwright');

(async () => {
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  let newTabOpened = false;
  context.on('page', (newPage) => {
    newTabOpened = true;
    console.log("TEST FAILED: A new tab was opened: " + newPage.url());
  });

  console.log("Navigating to local stream page...");
  try {
    await page.goto('http://localhost:3000/stream?key=9225', { timeout: 15000, waitUntil: 'networkidle' });
  } catch(e) {
    console.log("Page loaded or timed out waiting for networkidle");
  }
  
  console.log("Waiting for iframe to settle...");
  await page.waitForTimeout(5000);
  
  console.log("Simulating user clicks on the player...");
  await page.mouse.click(600, 400);
  await page.waitForTimeout(1000);
  
  await page.mouse.click(650, 450);
  await page.waitForTimeout(2000);

  if (!newTabOpened) {
     console.log("TEST PASSED: No new tab was opened after multiple clicks!");
  } else {
     console.log("TEST FAILED: Popups are still escaping!");
  }
  
  await browser.close();
})();
