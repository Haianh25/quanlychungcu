const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const db = require('../db');
const { authRegisterCases } = require('../test-data/testData.js');

describe('Register System Tests', () => {
  let driver;
  jest.setTimeout(300000);

  beforeAll(async () => {
    await db.setupTestData();
    let options = new chrome.Options();
    options.addArguments('--headless=new');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');
    options.addArguments('--window-size=1920,1080');
    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  });

  afterAll(async () => {
    if (driver) await driver.quit();
    await db.rollbackData();
    await db.query("DELETE FROM users WHERE email LIKE 'new%@test.com'");
    await db.closePool();
  });

  async function clearAndType(element, text) {
    await element.click();
    await element.sendKeys(Key.CONTROL, "a");
    await element.sendKeys(Key.BACK_SPACE);
    await element.sendKeys(text || ' '); // Avoid empty sendKeys error
  }

  test.each(authRegisterCases)('$id | $description | $testData | $expectedDesc', async (data) => {
    await driver.get('http://localhost:3000/register');
    
    const fullnameInput = await driver.wait(until.elementLocated(By.name('fullName')), 20000);
    const emailInput = await driver.findElement(By.name('email'));
    const passwordInput = await driver.findElement(By.name('password'));
    const phoneInput = await driver.findElement(By.name('phone'));
    const registerButton = await driver.findElement(By.css('button[type="submit"]'));

    // Extract email and name from testData string using regex or split (or just pass them as props)
    // Wait, testData string in authRegisterCases is: "Email: 'xxx', Tên: 'yyy'"
    // Better to parse from testData, or I should have added raw fields to `createCase`!
    // Since I added them to testData string, I can parse it here.
    let email = 'test@test.com';
    let name = 'User';
    
    if (data.testData.includes('Email:')) {
       const emailMatch = data.testData.match(/Email: '([^']*)'/);
       if (emailMatch) email = emailMatch[1];
    }
    if (data.testData.includes('Tên:')) {
       const nameMatch = data.testData.match(/Tên: '([^']*)'/);
       if (nameMatch) name = nameMatch[1];
    }

    await clearAndType(fullnameInput, name);
    await clearAndType(emailInput, email);
    await clearAndType(passwordInput, 'Password123!');
    await clearAndType(phoneInput, '0912345678');
    
    await driver.executeScript("arguments[0].scrollIntoView(true);", registerButton);
    await driver.sleep(500);
    await driver.executeScript("arguments[0].click();", registerButton);

    if (data.expected === 'success') {
      const successMsg = await driver.wait(until.elementLocated(By.css('.alert-success')), 10000).catch(() => null);
      expect(successMsg).not.toBeNull();
    } else {
      const successMsg = await driver.findElements(By.css('.alert-success'));
      expect(successMsg.length).toBe(0);
    }
  });
});
