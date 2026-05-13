const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const db = require('../db');
const { billingCases } = require('../test-data/testData.js');

describe('Billing System Tests', () => {
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

  test.each(billingCases)('$id | $description | $testData | $expectedDesc', async (data) => {
    await driver.get('http://localhost:3000/bills');
    
    let filter = 'Tất cả';
    if (data.testData.includes('Bộ lọc:')) {
       const filterMatch = data.testData.match(/Bộ lọc: (.*)/);
       if (filterMatch) filter = filterMatch[1].trim();
    }

    const filterSelect = await driver.wait(until.elementLocated(By.tagName('select')), 20000);
    if (filter === 'Chưa thanh toán') {
        await filterSelect.sendKeys('unpaid');
    } else {
        await filterSelect.sendKeys('all');
    }
    
    // Đợi page render
    const billsHeader = await driver.wait(until.elementLocated(By.xpath('//h2[contains(text(), "Bills")]')), 20000).catch(()=>null);
    expect(billsHeader).not.toBeNull();

    if (data.action === 'view_unpaid') {
      const unpaidFilter = await driver.findElements(By.xpath('//button[contains(text(), "Unpaid")]'));
      if (unpaidFilter.length > 0) {
        await driver.executeScript("arguments[0].click();", unpaidFilter[0]);
      }
    }
    
    // Đảm bảo table hoặc empty state hiển thị
    const tableOrEmpty = await driver.wait(
      until.elementLocated(By.css('.bills-container, .empty-state, table')), 
      20000
    );
    expect(tableOrEmpty).not.toBeNull();
  });
});
