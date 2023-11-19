const dayjs = require('dayjs')
const { By } = require('selenium-webdriver')
const selenium = require('selenium-webdriver')

const driver = new selenium.Builder().forBrowser('chrome').build()

// 最大化浏览器
driver.manage().window().maximize()

driver.get('https://www.taobao.com')

// 类似于python中time的sleep函数
const sleep = (time) => {
  return new Promise((resolve) => {
    setTimeout(resolve, time * 1000)
  })
}

// 登录
const login = async () => {
  const loginText = driver.findElement(By.linkText('亲，请登录'))
  if (loginText) loginText.click()
  console.log('请在20秒内完成扫码')
  await sleep(20)
  driver.get('https://cart.taobao.com/cart.htm')
  await sleep(3)
  //   点击全选按钮
  if (driver.findElement(By.id('J_SelectAll1')))
    driver.findElement(By.id('J_SelectAll1')).click()
  console.log('登录成功：', dayjs(new Date()).format('YYYY-MM-DD HH:mm:ss'))
  await sleep(0.4)
  buy('2023-02-25 22:22:00')
}

// 秒杀
const buy = async (buyTime) => {
  while (true) {
    const now = dayjs(new Date()).format('YYYY-MM-DD HH:mm:ss')
    if (now === buyTime) {
      if (driver.findElement({ id: 'J_Go' }))
        driver.findElement({ id: 'J_Go' }).click()
      await sleep(0.4)
      submit()
      break
    }
  }
}

// 提交订单
const submit = async () => {
  if (driver.findElement(By.linkText('提交订单')))
    driver.findElement(By.linkText('提交订单')).click()
  console.log('抢购时间：', dayjs(new Date()).format('YYYY-MM-DD HH:mm:ss'))
  await sleep(1000)
}

login()
