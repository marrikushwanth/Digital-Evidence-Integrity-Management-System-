const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      console.log('>>', request.method(), request.url());
    }
  });
  page.on('requestfailed', request => {
    if (request.url().includes('/api/')) {
      console.log('FAILED:', request.method(), request.url(), request.failure().errorText);
    }
  });
  page.on('response', response => {
    if (response.url().includes('/api/')) {
      console.log('<<', response.status(), response.url());
    }
  });

  await page.goto('http://localhost:5173/login');
  
  await page.fill('input[type="text"]', 'kushwanth');
  await page.fill('input[type="password"]', 'kushwanth');
  await page.click('button:has-text("Authenticate")');
  
  await page.waitForURL('**/dashboard');
  
  await page.goto('http://localhost:5173/upload');
  
  // wait for case select to populate
  await page.waitForTimeout(1000);
  
  // Create a dummy file
  const fs = require('fs');
  fs.writeFileSync('dummy.txt', 'Hello world');
  
  await page.setInputFiles('input[type="file"]', 'dummy.txt');
  
  // Select first case
  await page.selectOption('select', { index: 1 });
  
  // Click Upload
  await page.click('button:has-text("Commit Evidence to Vault")');
  
  // Wait for 3 seconds to let interval finish
  await page.waitForTimeout(4000);
  
  await browser.close();
})();
