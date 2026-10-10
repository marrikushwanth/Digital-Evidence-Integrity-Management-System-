import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`PAGE ERROR: ${msg.text()}`);
    } else {
      console.log(`PAGE LOG: ${msg.text()}`);
    }
  });

  page.on('pageerror', err => {
    console.log(`PAGE EXCEPTION: ${err.message}`);
  });

  console.log("Navigating to http://localhost:5173/login");
  await page.goto('http://localhost:5173/login');
  
  // Login first
  await page.fill('input[placeholder="Username"]', 'admin'); // Assuming 'admin' is valid, wait, we don't know the credentials.
  // Actually, we can just inject localStorage.
  await page.evaluate(() => {
    localStorage.setItem('soc_auth', 'true');
    localStorage.setItem('soc_current_user', JSON.stringify({ role: 'Super Admin' }));
    localStorage.setItem('soc_token', '"fake-token"');
  });

  console.log("Navigating to http://localhost:5173/merkle-batches");
  await page.goto('http://localhost:5173/merkle-batches');
  
  await page.waitForTimeout(2000);
  
  await browser.close();
})();
