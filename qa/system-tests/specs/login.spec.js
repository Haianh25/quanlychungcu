const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const db = require('../db');

// Read test data from dynamically generated array
const { authLoginCases } = require('../test-data/testData.js');

describe('Login System Tests', () => {
  let driver;
  jest.setTimeout(90000);

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
    await db.closePool();
  });

  async function clearAndType(element, text) {
    await element.click();
    await element.sendKeys(Key.CONTROL, "a");
    await element.sendKeys(Key.BACK_SPACE);
    await element.sendKeys(text);
  }

  test.each(authLoginCases)('$id | $description | $testData | $expectedDesc', async (data) => {
    await driver.get('http://localhost:3000/login');
    
    const emailInput = await driver.wait(until.elementLocated(By.name('email')), 20000);
    const passwordInput = await driver.findElement(By.name('password'));
    const loginButton = await driver.findElement(By.css('button[type="submit"]'));

    let email = '';
    let password = '';
    if (data.testData.includes('Email:')) {
       const emailMatch = data.testData.match(/Email: '([^']*)'/);
       if (emailMatch) email = emailMatch[1];
    }
    if (data.testData.includes('Pass:')) {
       const passMatch = data.testData.match(/Pass: '([^']*)'/);
       if (passMatch) password = passMatch[1];
    }

    await clearAndType(emailInput, email);
    await clearAndType(passwordInput, password);
    
    await loginButton.click();

    if (data.expected === 'success') {
      await driver.wait(until.urlIs('http://localhost:3000/'), 20000);
      const url = await driver.getCurrentUrl();
      expect(url).toBe('http://localhost:3000/');
    } else {
      const errorMsg = await driver.wait(until.elementLocated(By.css('.alert-danger')), 20000);
      expect(errorMsg).not.toBeNull();
      const text = await errorMsg.getText();
      expect(text.length).toBeGreaterThan(0);
    }
  });
});
