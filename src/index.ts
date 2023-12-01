import { Builder, By, Key, until, WebDriver } from 'selenium-webdriver'
import { WebElement } from 'selenium-webdriver'

class CInfo {
  username!: string
  password!: string
  url!: string
  itemopts!: { [key: string]: string }
  itemCarts!: string[]
  start_time!: string
}

class Test_TbBot {
  browser: WebDriver
  info: CInfo

  constructor() {
    this.browser = new Builder().forBrowser('chrome').build()
    this.info = this.readInfo()
  }
  readInfo(): CInfo {
    const ins = new CInfo()
    ins.url = 'https://detail.tmall.com/item.htm?id=710632886998'
    ins.start_time = '2023-12-01 16:30:00'
    ins.itemopts = {
      // 尺寸: '150cmx200cm',
      颜色分类: '足球款、买20只送20只共40只【亏本甩卖】',
      数量: '1',
    }

    ins.itemCarts = [
      '【买20只送20只】袜子男士短袜船袜春秋薄款浅口低帮韩版潮学生袜',
    ]
    return ins
  }

  async setUp() {
    console.log('------------------ test result ------------------')
  }

  async dumpHtml(msg: string) {
    const pageSource = await this.browser.getPageSource()
    // write pageSource to file
  }

  async click(
    ele: WebElement | WebDriver,
    tips: string,
    value: string,
    cnt = 1
  ): Promise<boolean> {
    await this.sleep(100)
    let isOk = false
    while (cnt > 0) {
      try {
        const dstEle = await ele.findElement(By.xpath(value))
        if (dstEle) {
          console.log(`--- 找到按钮: ${tips}, 点击`)
          await dstEle.click()
          isOk = true
          break
        }
      } catch (ex) {

        console.log('🌊 ~ 点击异常:', ex)

        console.log(`--- 找不到按钮: ${tips}, value: ${value}, 0.5s 后再次尝试`)
        await this.sleep(500)
      } finally {
        cnt--
      }
    }
    return isOk
  }

  async clickWithFresh(
    ele: WebElement | WebDriver,
    tips: string,
    value: string,
    cnt = 1
  ): Promise<boolean> {
    let isOk = false
    while (cnt > 0) {
      isOk = await this.click(ele, tips, value, 1)
      if (!isOk) {
        cnt--
        if (cnt > 0) {
          console.log(
            `--- 找不到按钮: ${tips}, value: ${value}, 刷新并在 2s 后再次尝试`
          )
          await this.browser.navigate().refresh()
          await this.sleep(2000)
        }
      } else {
        break
      }
    }
    return isOk
  }

  async tryLogin() {
    while (true) {
      try {
        const webEle = await this.browser.findElement(By.linkText('亲，请登录'))
        if (webEle) {
          console.log('--- 请尽登录')
          await webEle.click()
          break
        }
      } catch (ex) {
        console.log('--- 找不到登录页面, 0.5s 后再次尝试')
        await this.sleep(500)
      }
    }

    let cnt = 1
    let isOk = false
    while (!isOk) {
      console.log('--- 登录状态检测')
      try {
        const ele = await this.browser.findElement(
          By.xpath("//span[@class='member-nick-info']")
        )
        isOk = !!ele
      } catch (ex) {
        // console.log(utils.exmsg(ex));
      }

      if (!isOk) {
        console.log(`--- 检测不到登录状态, 1s 后再次尝试, cnt: ${cnt}`)
        cnt++
        await this.sleep(1000)
      }
    }

    console.log('--- 已经登录成功')
  }

  async selectCart(orderEle: WebElement, name: string): Promise<boolean> {
    const aEle = await this.safeFind(
      orderEle,
      ".//div[@class='item-basic-info']//a"
    )
    if (aEle && (await aEle.getText()).includes(name)) {
      console.log(`--- 匹配成功, ${name} -> ${aEle.getText()}`)
      const inputEle = await this.safeFind(
        orderEle,
        ".//input[@class='J_CheckBoxItem']"
      )
      const parentEle = await this.safeFind(inputEle, '..')
      parentEle?.click()
      console.log(`--- 勾选成功: ${aEle.getText()}`)
      return true
    } else {
      return false
    }
  }

  async submitCardOrder() {
    await this.sleep(100)
    await this.click(
      this.browser,
      '提交订单',
      "//div[@class='submitOrder-container']//a[contains(text(), '提交订单')]",
      3
    )
  }

  async openUrl(url: string) {
    console.log(`--- 打开链接: ${url}`)
    await this.browser.get(url)
  }

  async openCart() {
    const cartUrl = 'https://cart.taobao.com/cart.htm'
    await this.openUrl(cartUrl)
    await this.sleep(1000)

    // 勾选目的商品
    for (const itemCart of this.info.itemCarts) {
      const orderEleArr = await this.safeFinds(
        this.browser,
        ".//div[@id='J_OrderList']//div[@class='order-content']"
      )

      console.log(
        '🌊 ~ file: index.ts:182 ~ Test_TbBot ~ openCart ~ orderEleArr:',
        orderEleArr
      )

      for (const orderEle of orderEleArr || []) {
        const isOk = await this.selectCart(orderEle, itemCart)
        if (isOk) {
          break
        }
      }
    }

    await this.sleep(500)
    const clickRes = await this.click(
      this.browser,
      '结算',
      "//div[@class='float-bar-right']//div[@class='btn-area']//a[@class='submit-btn']"
    )
    await this.sleep(1000)
    const isOk = await this.clickWithFresh(
      this.browser,
      '提交订单',
      "//div[@class='submitOrder-container']//a[contains(text(), '提交订单')]",
      3
    )
    await this.notify(isOk)
  }

  async startCheck() {
    const restSec = () => {
      const ts01 = Date.now()
      const ts02 = new Date(this.info.start_time).getTime()
      return Math.floor((ts02 - ts01) / 1000)
    }

    let cnt = 0
    let sec = restSec()
    while (sec > 0) {
      console.log(
        `--- 还未到时间: ${this.info.start_time}, 剩余: ${sec} 秒, 1 秒后再检测`
      )
      await this.sleep(1000)

      cnt++
      sec = restSec()
      if (cnt % 60 === 0) {
        console.log('--- 刷新等待 5 秒, 保持登录状态')
        await this.browser.navigate().refresh()
        await this.sleep(5000)
      }
    }

    console.log(`--- 已到达时间: ${this.info.start_time}`)
  }

  async safeFind(
    ele: WebElement | WebDriver,
    value: string
  ): Promise<WebElement | null> {
    try {
      return await ele.findElement(By.xpath(value))
    } catch (ex) {
      return null
    }
  }

  async safeFinds(
    ele: WebElement | WebDriver,
    value: string
  ): Promise<WebElement[] | null> {
    try {
      return await ele.findElements(By.xpath(value))
    } catch (ex) {
      console.log('🌊 ~ file: index.ts:254 ~ Test_TbBot ~ ex:', ex)
      return null
    }
  }

  checkInfo(info: CInfo) {
    // TODO: check info
  }

  async select_opt(skuEle: WebElement, name: string, value: string) {
    const dlEleArr = await this.safeFinds(skuEle, './/dl')
    if (!dlEleArr) {
      throw new Error('--- 找不到 opt dl 列表')
    }

    let isFindOpt = false
    for (const dlEle of dlEleArr) {
      const ele = await this.safeFind(
        dlEle,
        `.//dt[contains(text(),'${name}')]`
      )
      if (!ele) {
        continue
      }

      console.log(`--- 找到 ${name}`)
      isFindOpt = true
      if (name === '数量') {
        const inputEle = await this.safeFind(dlEle, './/dd//input')
        if (!inputEle) {
          throw new Error('--- 找不到 数量')
        }
        await inputEle.clear()
        await this.setNum(dlEle, Math.abs(parseInt(value)))
        console.log(`--- 数量 设置为: ${value}`)
      } else {
        const aEleArr = await this.safeFinds(
          dlEle,
          ".//dd//li//a[@role='button']"
        )
        let isFindItem = false
        for (const aEle of aEleArr || []) {
          if ((await aEle.getText()).includes(value)) {
            isFindItem = true
            const liEle = await this.safeFind(aEle, '..')
            if (!liEle) {
              throw new Error(
                `--- 找不到 a 节点: ${aEle.getText()} 的父节点 li`
              )
            }
            let selectFlag = ''
            while (selectFlag !== 'tb-selected') {
              await aEle.click()
              selectFlag = (await liEle.getAttribute('class')) || ''
              await this.sleep(1000)
              console.log(`--- 选中 ${name} 中的 ${aEle.getText()}`)
            }
            break
          }
        }
        if (!isFindItem) {
          throw new Error(`--- 找不到目的选中项: ${value}`)
        }
      }
      await this.sleep(100)
      break
    }

    if (!isFindOpt) {
      throw new Error(`--- 找不到选项: ${name}`)
    }
  }

  async setNum(ele: WebElement, num: number) {
    if (num <= 1) {
      return
    }

    const addEle = await this.safeFind(
      ele,
      "//dd//span[@class='mui-amount-increase']"
    )
    if (!addEle) {
      throw new Error('--- 找不到 增加数量 按钮')
    }

    for (let i = 0; i < num - 1; i++) {
      await addEle.click()
    }
  }

  async countdown(ele: WebElement) {
    await this.sleep(50)
    const cdEle = await this.safeFind(ele, "//div[@class='tm-countdown-timer']")
    if (cdEle) {
      console.log(
        `--- 还在倒计时中, 剩余时间: ${cdEle.getText()}, 刷新页面并等待 1 秒`
      )
      await this.browser.navigate().refresh()
      await this.sleep(1000)
      await this.countdown(ele)
    }
  }

  async buyItem() {
    let skuEle: WebElement | null = null
    while (!skuEle) {
      await this.openUrl(this.info.url)
      await this.sleep(100)
      skuEle = await this.safeFind(this.browser, "//div[@class='tb-sku']")
      if (!skuEle) {
        console.log('--- 找不到 sku 节点, 刷新页面并等待 1 秒')
        await this.sleep(1000)
      }
    }
    console.log('--- 找到 sku 节点')

    await this.countdown(skuEle)
    console.log('--- 倒计时已结束')

    for (const [k, v] of Object.entries(this.info.itemopts)) {
      let cnt = 0
      while (cnt < 5) {
        try {
          await this.select_opt(skuEle, k, v)
          cnt = 999
        } catch (ex) {
          cnt++
        }
      }
    }

    await this.sleep(100)
    await this.click(
      skuEle,
      '立即购买',
      "//div//a[@id='J_LinkBuy' and contains(text(),'立即购买')]",
      3
    )
    await this.sleep(1000)
    const isOk = await this.clickWithFresh(
      this.browser,
      '提交订单',
      "//div[@class='submitOrder-container']//a[contains(text(), '提交订单')]",
      3
    )
    await this.notify(isOk)
  }

  async test_buy() {
    this.checkInfo(this.info)
    await this.openUrl('https://www.taobao.com')
    await this.tryLogin()
    await this.startCheck()
    await this.buyItem()

    const aaa = await this.inputStr('--- wolegequ') // 要阻塞住, 不然进程会马上关闭
  }

  async test_cart() {
    this.checkInfo(this.info)
    await this.openUrl('https://www.taobao.com')
    await this.tryLogin()
    // await this.startCheck()
    await this.openCart()

    const aaa = await this.inputStr('--- wolegequ') // 要阻塞住, 不然进程会马上关闭
  }

  async notify(isOk: boolean) {
    console.log('--- 飞书通知')
    const orderUrl =
      'https://buyertrade.taobao.com/trade/itemlist/list_bought_items.htm'
    const title = isOk ? '✅ success' : '❌ fail'
    const content = `等待支付\n物品: ${this.info.itemCarts}\n链接: [${orderUrl}](${orderUrl})`
    // send notification
  }

  async sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  async inputStr(msg: string) {
    // read input
  }
}

const ins = new Test_TbBot()
// ins.test_buy()
ins.test_cart()
