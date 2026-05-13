const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const db = require('../db');
const { profileCases } = require('../test-data/testData.js');

describe('Profile System Tests', () => {
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
    await db.closePool();
  });

  test.each(profileCases)('$id | $description | $testData | $expectedDesc', async (data) => {
    await driver.get('http://localhost:3000/profile');
    
    const phoneInput = await driver.wait(until.elementLocated(By.name('phone')), 20000);
    
    let phone = '';
    if (data.testData.includes('Phone:')) {
       const phoneMatch = data.testData.match(/Phone: '([^']*)'/);
       if (phoneMatch) phone = phoneMatch[1];
    }

    await phoneInput.sendKeys(require('selenium-webdriver').Key.CONTROL, "a");
    await phoneInput.sendKeys(require('selenium-webdriver').Key.BACK_SPACE);
    await phoneInput.sendKeys(phone || ' ');

    const updateButton = await driver.findElement(By.css('button[type="submit"]'));
    await driver.executeScript("arguments[0].scrollIntoView(true);", updateButton);
    await driver.sleep(500); // Đợi scroll
    await driver.executeScript("arguments[0].click();", updateButton);

    if (data.expected === 'success') {
      const successMsg = await driver.wait(until.elementLocated(By.css('.alert-success')), 10000).catch(() => null);
      expect(successMsg).not.toBeNull();
    } else {
      // Trường hợp không hợp lệ, nút submit có thể bị disable hoặc hiện lỗi
      // Ta chỉ cần check nó không hiện success là pass test
      const successMsg = await driver.findElements(By.css('.alert-success'));
      expect(successMsg.length).toBe(0);
    }
  });
});
