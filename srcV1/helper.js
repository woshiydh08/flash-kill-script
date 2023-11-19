const puppeteer = require('puppeteer')

const WIDTH = 1200
const HEIGHT = 768
const BEFORE_SECOND = 2
const CLICK_FREQUENCY = 0.1

function getStartTime(buyTime) {
  buyTime = buyTime || new Date()

  if (typeof buyTime === 'string') {
    buyTime = new Date(buyTime)
  }

  const waitSecond = (buyTime - new Date()) / 1000
  return waitSecond >= 0 ? waitSecond : 0
}

async function getWindow() {
  const browser = await puppeteer.launch({ headless: false })
  const content = await browser.createIncognitoBrowserContext()
  const page = await content.newPage()
  await page.setViewport({ width: WIDTH, height: HEIGHT })
  return { browser, page }
}

async function sleepTime(buyTime) {
  const waitSecond = getStartTime(buyTime)
  console.log(`Waiting for ${waitSecond} seconds...`)
  if (waitSecond - BEFORE_SECOND > 0) {
    await new Promise((resolve) =>
      setTimeout(resolve, (waitSecond - BEFORE_SECOND) * 1000)
    )
  }
}

async function closeWindow(browser) {
  await browser.close()
}

module.exports = { getStartTime, getWindow, sleepTime, closeWindow }
