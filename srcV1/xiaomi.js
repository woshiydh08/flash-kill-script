const { getStartTime, getWindow, sleepTime, closeWindow } = require('./helper');
const puppeteer = require('puppeteer');

const WIDTH = 1200;
const HEIGHT = 768;
const BEFORE_SECOND = 2;
const CLICK_FREQUENCY = 0.3;

async function main(URL, buyTime) {
  const { browser, page } = await getWindow();

  await page.goto('https://account.xiaomi.com/pass/serviceLogin?callback=http%3A%2F%2Forder.mi.com%2Flogin%2Fcallback%3Ffollowup%3Dhttps%253A%252F%252Fwww.mi.com%252F%26sign%3DNzY3MDk1YzczNmUwMGM4ODAxOWE0NjRiNTU5ZGQyMzFhYjFmOGU0Nw%2C%2C&sid=mi_eshop&_bannerBiz=mistore&_qrsize=180');
  console.log('Please log in within 30 seconds.');
  await new Promise(resolve => setTimeout(resolve, 30000));

  await page.goto(URL);
  await new Promise(resolve => setTimeout(resolve, 10000));
  await sleepTime(buyTime);

  const oldUrl = page.url;

  let index = 0;
  while (true) {
    try {
      console.log(`Retry ${index}`);
      await page.click('[class="btn btn-primary"]');
      break;
    } catch {
      index++;
      await new Promise(resolve => setTimeout(resolve, CLICK_FREQUENCY * 1000));
    }
  }

  while (true) {
    if (page.url !== oldUrl) {
      break;
    }
    await new Promise(resolve => setTimeout(resolve, CLICK_FREQUENCY * 1000));
  }

  while (true) {
    try {
      await page.click('[class="btn btn-primary"]');
      break;
    } catch {
      await new Promise(resolve => setTimeout(resolve, CLICK_FREQUENCY * 1000));
    }
  }

  await new Promise(resolve => setTimeout(resolve, 100000));
  await closeWindow(browser);
}

// 通过命令行参数传递链接和开售时间
const URL = process.argv[2];
const buyTime = process.argv[3];
main(URL, buyTime).catch(error => console.error(error));
