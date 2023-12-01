import { Builder, By, Key, until, WebDriver } from 'selenium-webdriver'
import { WebElement } from 'selenium-webdriver'

class Test_TbBot {
  browser: WebDriver

  constructor() {
    this.browser = new Builder().forBrowser('chrome').build()
  }
  async sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  async openUrl(url: string) {
    console.log(`--- 打开链接: ${url}`)
    await this.browser.get(url)
  }

  async safeFinds(
    ele: WebElement | WebDriver,
    value: string
  ): Promise<WebElement[] | null> {
    try {
      const res = await ele.findElements(By.xpath(value))
      // console.log('🌊 ~ file: demo.ts:25 ~ Test_TbBot ~ res:', res)
      return res
    } catch (ex) {
      return null
    }
  }

  async openCart() {
    const cartUrl = 'https://www.baidu.com'
    await this.openUrl(cartUrl)

    // 这意味着等待页面加载完成并找到 <body> 元素。这样，当 <body> 元素出现时，driver.wait() 就会结束等待，然后继续执行后续的操作。
    await this.browser.wait(until.elementLocated(By.xpath('//body')), 10000) // 最长等待10秒
    console.log('加载完成')

    await this.sleep(1000)

    const orderEleArr = await this.safeFinds(
      this.browser,
      ".//span[@class='title-content-title']"
    )

    orderEleArr?.forEach(async (ele) => {
      const text = await ele?.getText()
      console.log('Element Text:', text)
    })

    // 进行操作或其他操作
    // 例如打印元素文本
    // const text = await firstEle?.getText()
    // console.log('Element Text:', text)
  }
}

function main() {
  const bot = new Test_TbBot()
  bot.openCart()
}

main()
