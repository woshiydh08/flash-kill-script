const { getWindow, sleepTime, closeWindow } = require('./helper');
const puppeteer = require('puppeteer');

const WIDTH = 1200;
const HEIGHT = 768;
const BEFORE_SECOND = 2;
const CLICK_FREQUENCY = 0.3;

async function main(number, url, buyTime) {
  const { browser, page } = await getWindow();

  if (number === '1') {
    await page.goto('https://login.taobao.com/');
  } else {
    await page.goto('https://login.tmall.com/');
  }

  console.log('Please log in within 30 seconds.');
  await new Promise(resolve => setTimeout(resolve, 30000));

  buyTime = new Date(buyTime);
  await sleepTime(buyTime);

  await page.goto(url);

  while (true) {
    try {
      await page.click('.tb-btn-buy');
      break;
    } catch {
      await new Promise(resolve => setTimeout(resolve, CLICK_FREQUENCY * 1000));
    }
  }

  while (true) {
    try {
      await page.click('.go-btn');
      break;
    } catch {
      await new Promise(resolve => setTimeout(resolve, CLICK_FREQUENCY * 1000));
    }
  }

  await new Promise(resolve => setTimeout(resolve, 10000));
  await closeWindow(browser);
}

const number = readlineSync.question('Enter number to choose store: \n1 Taobao\n2 Tmall\n');
const url = readlineSync.question('Enter URL: ');
const buyTime = readlineSync.question('Enter sale time [2020-02-06 12:55:50]: ');

main(number, url, buyTime).catch(error => console.error(error));
