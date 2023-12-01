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
    await this.sleep(1000)

    const orderEleArr = await this.safeFinds(
      this.browser,
      ".//span[@class='title-content-title']"
    )
    // const firstEle = orderEleArr?.[0] || null

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
