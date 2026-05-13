const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const db = require('../db');
const { amenityCases } = require('../test-data/testData.js');

describe('Amenity System Tests', () => {
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

  test.each(amenityCases)('$id | $description | $testData | $expectedDesc', async (data) => {
    await driver.get('http://localhost:3000/services/amenities');
    
    // Đợi danh sách load
    const amenityCard = await driver.wait(until.elementLocated(By.css('.amenity-card')), 20000).catch(()=>null);
    expect(amenityCard).not.toBeNull();

    // Tìm nút book đầu tiên
    const bookButtons = await driver.findElements(By.xpath('//button[contains(text(), "Book")]'));
    if (bookButtons.length > 0) {
      await driver.executeScript("arguments[0].click();", bookButtons[0]);
      
      // Chờ modal bật lên
      const dateInput = await driver.wait(until.elementLocated(By.name('date'), By.css('input[type="date"]')), 5000).catch(()=>null);
      if (dateInput) {
        await dateInput.sendKeys(data.date);
        const submitBtn = await driver.findElement(By.xpath('//button[contains(text(), "Confirm") or contains(text(), "Book")]'));
        await driver.executeScript("arguments[0].click();", submitBtn);
        
        // Wait for success or error
        await driver.sleep(500);
      }
    }
  });
});
