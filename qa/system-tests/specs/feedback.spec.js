const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const db = require('../db');
const { feedbackCases } = require('../test-data/testData.js');

describe('Feedback System Tests', () => {
  let driver;
  jest.setTimeout(300000); // Tăng timeout cho DDT

  beforeAll(async () => {
    await db.setupTestData();
    let options = new chrome.Options();
    options.addArguments('--headless=new');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');
    options.addArguments('--window-size=1920,1080');
    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

    // Login 1 lần để tái sử dụng session
    await driver.get('http://localhost:3000/login');
    const emailInput = await driver.wait(until.elementLocated(By.name('email')), 20000);
    const passwordInput = await driver.findElement(By.name('password'));
    const loginButton = await driver.findElement(By.css('button[type="submit"]'));
    await emailInput.sendKeys('test_admin@test.com');
    await passwordInput.sendKeys('Password123!');
    await loginButton.click();
    await driver.wait(until.urlIs('http://localhost:3000/'), 20000);
  });

  afterAll(async () => {
    if (driver) await driver.quit();
    await db.rollbackData();
    await db.query("DELETE FROM feedback WHERE title LIKE 'Feedback Title%' OR title = 'Valid Title'");
    await db.closePool();
  });

  test.each(feedbackCases)('$id | $description | $testData | $expectedDesc', async (data) => {
    await driver.get('http://localhost:3000/feedback');
    
    const titleInput = await driver.wait(until.elementLocated(By.name('title')), 20000);
    
    let title = '';
    if (data.testData.includes('Tiêu đề:')) {
       const titleMatch = data.testData.match(/Tiêu đề: '([^']*)'/);
       if (titleMatch) title = titleMatch[1];
    }

    await titleInput.sendKeys(Key.CONTROL, "a");
    await titleInput.sendKeys(Key.BACK_SPACE);
    await titleInput.sendKeys(title || ' ');
    const descInput = await driver.findElement(By.css('textarea[placeholder="Detailed explanation..."]'));
    const categorySelect = await driver.findElement(By.tagName('select'));
    const submitButton = await driver.findElement(By.css('button[type="submit"]'));

    await descInput.sendKeys(data.description);
    await categorySelect.sendKeys('Complaint');
    
    await driver.executeScript("arguments[0].scrollIntoView(true);", submitButton);
    await driver.sleep(500); // Đợi scroll
    await driver.executeScript("arguments[0].click();", submitButton);

    if (data.expected === 'success') {
      const successMsg = await driver.wait(until.elementLocated(By.css('.alert-success')), 10000).catch(() => null);
      expect(successMsg).not.toBeNull();
    } else {
      const successMsg = await driver.findElements(By.css('.alert-success'));
      expect(successMsg.length).toBe(0);
    }
  });
});
