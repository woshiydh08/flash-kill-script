import webdriver from 'selenium-webdriver'
import dayjs from 'dayjs'
import { assert, sleep, utils } from './utils'
import duration from 'dayjs/plugin/duration' // 引入 duration 插件

dayjs.extend(duration)

const { By } = webdriver

class CInfo {
  username!: string
  password!: string
  url!: string
  start_time!: string
  itemopts!: Record<string, string>
  itemCarts: string[] = []
}

class Test_TbBot {
  info: CInfo

  browser: webdriver.ThenableWebDriver
  // browser: any

  constructor() {
    this.browser = new webdriver.Builder().forBrowser('chrome').build()
    this.info = this.readInfo()
  }

  readInfo() {
    return {
      username: '',
      password: '',
      url: 'https://detail.tmall.com/item.htm?id=670589023950', // 购买物品的 url
      itemopts: {
        尺寸: '150cmx200cm',
        颜色分类: '浅山茶萌萌皇冠兔',
        数量: '1',
      }, // 购买物品时需要选中的选项

      itemCarts: ['午休办公室午睡毯'], // 结算需要勾选的物品
      start_time: '2023-11-20 23:00:00', // 开抢时间
    }
  }

  async setUp() {
    console.log('\n\n------------------ test result ------------------')
  }

  dumpHtml(msg: any) {
    // Implement the utils.writeFile and utils.getDesktop functions accordingly in Node.js
    // utils.writeFile(utils.getDesktop(`tb-${utils.now()}-${msg}.log`), this.browser.getPageSource());
  }

  async click(ele: webdriver.WebElement, tips: string, value: string, cnt = 1) {
    await sleep(100)
    let isOk = false
    while (cnt > 0) {
      try {
        const dstEle = await ele.findElement(By.xpath(value))
        assert(dstEle !== null, 'ele is None')
        console.log(`--- 找到按钮: ${tips}, 点击\n`)
        await dstEle.click()
        isOk = true
        break
      } catch (ex) {
        console.log(
          `--- 找不到按钮: ${tips}, value: ${value}, 0.5s 后再次尝试\n`
        )
        await sleep(500)
      } finally {
        cnt--
      }
    }
    return isOk
  }

  async clickWithFresh(
    ele: webdriver.WebElement,
    tips: string,
    value: string,
    cnt = 1
  ) {
    let isOk = false
    while (cnt > 0) {
      isOk = await this.click(ele, tips, value, 1)
      if (!isOk) {
        cnt--
        if (cnt > 0) {
          console.log(
            `--- 找不到按钮: ${tips}, value: ${value}, 刷新并在 2s 后再次尝试\n`
          )
          this.browser.navigate().refresh()
          await sleep(2000)
        }
      } else {
        break
      }
    }
    return isOk
  }

  async tryLogin() {
    // 登录页面
    while (true) {
      try {
        const webEle = await this.browser.findElement(By.linkText('亲，请登录'))
        if (webEle !== null) {
          console.log('--- 请尽登录\n')
          await webEle.click()
          break
        }
      } catch (ex) {
        console.log('--- 找不到登录页面, 2s 后再次尝试\n')
        await sleep(2000)
      }
    }

    // 登录状态检测
    let cnt = 1
    let isOk = false
    while (!isOk) {
      console.log('--- 登录状态检测\n')
      try {
        const ele = await this.browser.findElement(
          By.xpath("//span[@class='member-nick-info']")
        )
        isOk = ele !== null
      } catch (ex) {
        // console.log(utils.exmsg(ex));
      }

      if (!isOk) {
        console.log(`--- 检测不到登录状态, 1s 后再次尝试, cnt: ${cnt}\n`)
        cnt++
        await sleep(1000)
      }
    }

    console.log('--- 已经登录成功\n')
  }

  // 选择购物车商品
  async selectCart(orderEle: webdriver.WebElement, name: string | any[]) {
    // 匹配超链接文字
    const aEle = await this.safeFind(
      orderEle,
      ".//div[@class='item-basic-info']//a"
    )
    const str = (await aEle?.getText()) as string
    if (name.includes(str)) {
      console.log(`--- 匹配成功, ${name} -> ${str}\n`)
      const inputEle = await this.safeFind(
        orderEle,
        ".//input[@class='J_CheckBoxItem']"
      )

      const parentEle = await this.safeFind(inputEle, '..') // 这个才是勾选项
      await parentEle?.click()
      console.log(`--- 勾选成功: ${str || ''}\n`)
      return true
    } else {
      return false
    }
  }

  // 提交购物车订单
  async submitCardOrder() {
    await sleep(100) // 延迟一下
    await this.click(
      this.browser,
      '提交订单',
      "//div[@class='submitOrder-container']//a[contains(text(), '提交订单')]",
      3
    )
  }

  // 打开链接
  async openUrl(url: string) {
    console.log(`--- 打开链接: ${url}\n`)
    await this.browser.get(url)
  }

  // 打开购物车
  // async openCart() {
  //   // 打开购物车列表页面
  //   const cartUrl = 'https://cart.taobao.com/cart.htm'
  //   await this.openUrl(cartUrl)
  //   await sleep(1000)

  //   // 勾选目的商品
  //   for (const itemCart of this.info.itemCarts) {
  //     const orderEleArr = await this.safeFinds(
  //       this.browser,
  //       ".//div[@id='J_OrderList']//div[@class='order-content']"
  //     )
  //     for (const orderEle of orderEleArr) {
  //       const isOk = await this.selectCart(orderEle, itemCart)
  //       if (isOk) {
  //         break
  //       }
  //     }
  //   }

  //   // 结算
  //   await sleep(500)
  //   await this.click(
  //     this.browser,
  //     '结算',
  //     "//div[@class='float-bar-right']//div[@class='btn-area']//a[@class='submit-btn']"
  //   )

  //   // 提交订单
  //   await sleep(1000)
  //   const isOk = await this.clickWithFresh(
  //     this.browser,
  //     '提交订单',
  //     "//div[@class='submitOrder-container']//a[contains(text(), '提交订单')]",
  //     3
  //   )

  //   // 通知
  //   await this.notify(isOk)
  // }

  // 飞书通知
  async notify(isOk: boolean) {
    console.log('--- 飞书通知')
    const orderUrl =
      'https://buyertrade.taobao.com/trade/itemlist/list_bought_items.htm' // 淘宝我的订单页面
    const title = isOk ? '✅ success' : '❌ fail'
    const conttent = `等待支付\n物品: ${this.info.itemCarts}\n链接: [${orderUrl}](${orderUrl})`
    // new feishu.CFeishu({ appId: 'aaa', appSecret: 'bbb' }).sendMsg({
    //   title,
    //   content: conttent,
    //   toArr: ['gcg2b216'],
    // })
  }

  async startCheck() {
    const restSec = () => {
      const endTime = utils.nowTs()
      // const ts02 = utils.dayjs({
      //   tStr: this.info.start_time,
      //   fmt: '%Y%m%d_%H%M%S',
      // })
      const startTime = dayjs(this.info.start_time)
      const diff = dayjs.duration(startTime.diff(endTime))
      return diff
    }

    let cnt = 0
    let diff = restSec()


    while (diff.asSeconds() > 0) {

      // 使用 duration 插件将秒数转换为时分秒
      const duration = dayjs.duration(diff.asSeconds(), 'seconds')
      const formattedTime = `${duration.hours()} 小时 ${duration.minutes()} 分钟 ${duration.seconds()} 秒`
      console.log(
        `--- 还未到时间: ${this.info.start_time}, 剩余: ${formattedTime}, 1 秒后再检测`
      )
      await new Promise((resolve) => setTimeout(resolve, 1000))

      cnt++
      diff = restSec()
      if (cnt % 60 === 0) {
        // 一分钟刷新一下浏览器
        console.log('--- 刷新等待 3 秒, 保持登录状态')
        this.browser.navigate().refresh()
        // this.browser.
        await new Promise((resolve) => setTimeout(resolve, 3000))
      }
    }

    console.log(`--- 已到达时间: ${this.info.start_time}`)
  }

  async safeFind(ele: webdriver.WebElement, value: string) {
    try {
      // await new Promise(resolve => setTimeout(resolve, 10)); // 如果需要延迟，可以取消注释此行
      return await ele.findElement(By.xpath(value))
    } catch (ex) {
      // console.log(`--- 找不到 value: ${value}\n错误堆栈: ${utils.exmsg(ex)}`);
      return null
    }
  }

  async safeFinds(ele: webdriver.WebElement, value: string) {
    try {
      // await new Promise(resolve => setTimeout(resolve, 10)); // 如果需要延迟，可以取消注释此行
      return await ele.findElements(By.xpath(value))
    } catch (ex) {
      console.log(`--- 找不到 value: ${value}\n, stack: ${Date.now()}`)
      return null
    }
  }

  // TODO: 检查参数
  checkInfo(info: CInfo) {
    // 检查逻辑...
  }

  async select_opt(skuEle: webdriver.WebElement, name: string, value: string) {
    const dlEleArr = await this.safeFinds(skuEle, `.//dl`)
    assert(dlEleArr !== null, `--- 找不到 opt dl 列表`)

    let isFindOpt = false
    for (const dlEle of dlEleArr || []) {
      const ele = await this.safeFind(
        dlEle,
        `.//dt[contains(text(),'${name}')]`
      )
      if (!ele) continue

      console.log(`--- 找到 ${name}`)
      isFindOpt = true
      if (name === '数量') {
        // 特殊判断
        const inputEle = await this.safeFind(dlEle, `.//dd//input`)
        assert(inputEle !== null, `--- 找不到 数量`)
        inputEle?.clear()
        // inputEle.sendKeys(value.toString()); // 清空时会自动变为 1, 需要模拟慢慢点击
        await this.setNum(dlEle, Math.abs(parseInt(value)))
        console.log(`--- 数量 设置为: ${value}`)
      } else {
        const aEleArr =
          (await this.safeFinds(dlEle, `.//dd//li//a[@role='button']`)) || []
        let isFindItem = false
        for (const aEle of aEleArr) {
          if (aEle.text.includes(value)) {
            // 包含目的字符串, 选中
            isFindItem = true

            const liEle = await this.safeFind(aEle, `..`)
            assert(
              liEle !== null,
              `--- 找不到 a 节点: ${aEle.text} 的父节点 li`
            )

            // 尝试选中
            let selectFlag = ''
            while (selectFlag !== 'tb-selected') {
              aEle.click()
              selectFlag = (await liEle?.getAttribute('class')) || ''
              await new Promise((resolve) => setTimeout(resolve, 1000)) // 延迟一下, 防止勾选不中
              console.log(`--- 选中 ${name} 中的 ${aEle.text}`)
            }

            break
          }
        }
        assert(isFindItem, `--- 找不到目的选中项: ${value}`)
      }
      await new Promise((resolve) => setTimeout(resolve, 100)) // 延迟一下, 防止勾选不中
      break
    }

    assert(isFindOpt, `--- 找不到选项: ${name}`)
  }

  // 设置数量
  async setNum(ele: any, num: number) {
    if (num <= 1) {
      return
    }

    const addEle = await this.safeFind(
      ele,
      `//dd//span[@class='mui-amount-increase']`
    )
    assert(addEle !== null, '--- 找不到 增加数量 按钮')

    for (let i = 0; i < num - 1; i++) {
      await addEle?.click()
      // 可能需要一些延迟来确保点击有效
      await new Promise((resolve) => setTimeout(resolve, 1000)) // 等待 1 秒钟
    }
  }

  // 倒计时判断
  async countdown(ele: any) {
    await sleep(50)
    const cdEle = await this.safeFind(ele, "//div[@class='tm-countdown-timer']")

    if (cdEle !== null) {
      console.log(
        `--- 还在倒计时中, 剩余时间: ${cdEle.text}, 刷新页面并等待 1 秒\n`
      )
      this.browser.navigate().refresh()
      await sleep(1000)
      await this.countdown(ele)
    }
  }

  // 打开商品页面并选中参数
  async buyItem() {
    let skuEle = null
    while (skuEle === null) {
      // 打开商品页面, 这里有可能被验证码拦截
      await this.openUrl(this.info.url)
      await sleep(100) // 延迟一下
      // 商品操作节点
      skuEle = await this.safeFind(this.browser, "//div[@class='tb-sku']")
      if (skuEle === null) {
        console.log('--- 找不到 sku 节点, 刷新页面并等待 1 秒\n')
        await sleep(1000)
      }
    }
    console.log('--- 找到 sku 节点\n')

    // 倒计时等待
    await this.countdown(skuEle)
    console.log('--- 倒计时已结束\n')

    // 选中商品
    for (const [k, v] of Object.entries(this.info.itemopts)) {
      let cnt = 0
      while (cnt < 5) {
        // 尝试找 5 次
        try {
          await this.select_opt(skuEle, k, v)
          cnt = 999
        } catch (ex) {
          cnt++
        }
      }
    }

    await sleep(100) // 延迟一下
    await this.click(
      skuEle,
      '立即购买',
      "//div//a[@id='J_LinkBuy' and contains(text(),'立即购买')]",
      3
    )

    // 提交订单
    await sleep(1000)
    const isOk = await this.clickWithFresh(
      this.browser,
      '提交订单',
      "//div[@class='submitOrder-container']//a[contains(text(), '提交订单')]",
      3
    )

    // 通知
    // await this.notify(isOk)
  }

  // 测试购买并提交订单
  async test_buy() {
    this.checkInfo(this.info)
    await this.openUrl('https://www.taobao.com')
    await this.tryLogin()
    await this.startCheck()
    await this.buyItem()

    const aaa = await utils.inputStr('--- wolegequ') // 要阻塞住, 不然进程会马上关闭
  }

  // 测试购物车结算
  async test_cart() {
    // this.checkInfo(this.info)
    // await this.openUrl('https://www.taobao.com')
    // await this.tryLogin()
    // await this.startCheck()
    // await this.openCart()

    const aaa = await utils.inputStr('--- wolegequ') // 要阻塞住, 不然进程会马上关闭
  }
}

// Run the script
;(async () => {
  const testBot = new Test_TbBot()
  await testBot.test_buy()
  // Other actions as per your original Python code...
})()
