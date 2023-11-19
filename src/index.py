#!/usr/bin/env python
# -*- coding: utf-8 -*-
import asyncio
import traceback
import unittest

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement

from tool import utils, cmd_color, feishu

class CInfo:
    def __init__(self):
        self.username = ""
        self.password = ""
        self.url = "" # 购买物品的 url
        self.itemopts = {} # 购买物品时需要选中的选项
        self.itemCarts = [] # 结算需要勾选的物品
        self.start_time = utils.now()  # 开抢时间


class Test_TbBot(unittest.TestCase):
    def __init__(self):
        self.browser: webdriver.Chrome = webdriver.Chrome()
        self.info = self.readInfo()

    def readInfo(self) -> CInfo:
        ins = CInfo()
        ins.url = "https://detail.tmall.com/item.htm?id=535642408486"
        ins.start_time = "20220303_105000"
        ins.itemopts = {
            "尺寸": "150cmx200cm",
            "颜色分类": "浅山茶萌萌皇冠兔",
            "数量": "3",
        }

        ins.itemCarts = [  # 购物车
            "午休办公室午睡毯",
            # "魔术贴条子母粘贴勾面",
        ]
        return ins

    def setUp(self):
        print("\n\n------------------ test result ------------------")

    def dumpHtml(self, msg):
        utils.writeFile(utils.getDesktop("tb-{}-{}.log".format(utils.now(), msg)), self.browser.page_source)

    # 查找按钮并点击
    async def click(self, ele: WebElement, tips, value, cnt=1):
        await asyncio.sleep(0.1)

        isOk = False
        while cnt > 0:
            try:
                dstEle = ele.find_element(by=By.XPATH, value=value)
                assert dstEle is not None, "ele is None"
                cmd_color.printWhite("--- 找到按钮: {}, 点击\n".format(tips))
                dstEle.click()
                isOk = True
                break
            except Exception as ex:
                cmd_color.printRed("--- 找不到按钮: {}, value: {}, 0.5s 后再次尝试\n".format(tips, value))
                await asyncio.sleep(0.5)
            finally:
                cnt = cnt - 1
        return isOk

    async def clickWithFresh(self, ele: WebElement, tips, value, cnt=1):
        isOk = False
        while cnt > 0:
            isOk = await self.click(ele=ele, tips=tips, value=value, cnt=1)
            if not isOk:
                cnt = cnt - 1
                if cnt > 0:
                    cmd_color.printRed("--- 找不到按钮: {}, value: {}, 刷新并在 2s 后再次尝试\n".format(tips, value))
                    self.browser.refresh()
                    await asyncio.sleep(2)
            else:
                break
        return isOk

    async def tryLogin(self):
        # 登录页面
        while True:
            try:
                webEle = self.browser.find_element(by=By.LINK_TEXT, value="亲，请登录")
                if webEle is not None:
                    cmd_color.printYellow("--- 请尽登录\n")
                    webEle.click()
                    break
            except Exception as ex:
                cmd_color.printRed("--- 找不到登录页面, 0.5s 后再次尝试\n")
                await asyncio.sleep(0.5)

        # 登录状态检测
        cnt = 1
        isOk = False
        while not isOk:
            cmd_color.printWhite("--- 登录状态检测\n")
            try:
                ele = self.browser.find_element(by=By.XPATH, value="//span[@class='member-nick-info']")
                isOk = ele is not None
            except Exception as ex:
                # print(utils.exmsg(ex))
                pass

            if not isOk:
                cmd_color.printRed("--- 检测不到登录状态, 1s 后再次尝试, cnt: {}\n".format(cnt))
                cnt = cnt + 1
                await asyncio.sleep(1)

        cmd_color.printGreen("--- 已经登录成功\n")

    async def selectCart(self, orderEle: WebElement, name):
        # 匹配超链接文字
        aEle = await self.safeFind(orderEle, value=".//div[@class='item-basic-info']//a")
        if name in aEle.text:
            cmd_color.printWhite("--- 匹配成功, {} -> {}\n".format(name, aEle.text))
            inputEle = await self.safeFind(orderEle, value=".//input[@class='J_CheckBoxItem']")

            parentEle = await self.safeFind(inputEle, value="..")  # 这个才是勾选项
            parentEle.click()
            cmd_color.printWhite("--- 勾选成功: {}\n".format(aEle.text))
            return True
        else:
            return False

    # 提交订单
    async def submitCardOrder(self):
        await asyncio.sleep(0.1)  # 延迟一下
        await self.click(ele=self.browser, tips="提交订单", value="//div[@class='submitOrder-container']//a[contains(text(), '提交订单')]", cnt=3)

    async def openUrl(self, url):
        cmd_color.printWhite("--- 打开链接: {}\n".format(url))
        self.browser.get(url)

    # 打开购物车
    async def openCart(self):
        # 打开购物车列表页面
        cartUrl = "https://cart.taobao.com/cart.htm"
        await self.openUrl(cartUrl)
        await asyncio.sleep(1)

        # dstItem = "运动童鞋板鞋低帮夜光DO3806"

        # 勾选目的商品
        for itemCart in self.info.itemCarts:
            orderEleArr = await self.safeFinds(self.browser, value=".//div[@id='J_OrderList']//div[@class='order-content']")
            for orderEle in orderEleArr:
                isOk = await self.selectCart(orderEle, itemCart)
                if isOk:
                    break

        # # 全选购物车
        # await self.click(ele=self.browser, tips="全选购物车", value="//div[@id='J_SelectAll1']")

        # 结算
        await asyncio.sleep(0.5)
        await self.click(ele=self.browser, tips="结算", value="//div[@class='float-bar-right']//div[@class='btn-area']//a[@class='submit-btn']")

        # 提交订单
        await asyncio.sleep(1)
        isOk = await self.clickWithFresh(ele=self.browser, tips="提交订单", value="//div[@class='submitOrder-container']//a[contains(text(), '提交订单')]", cnt=3)

        # 通知
        await self.notify(isOk=isOk)

    # 飞书通知
    async def notify(self, isOk: bool):
        cmd_color.printWhite("--- 飞书通知\n")
        orderUrl = "https://buyertrade.taobao.com/trade/itemlist/list_bought_items.htm"  # 淘宝我的订单页面
        title = isOk and "✅ success" or "❌ fail"
        conttent = "等待支付\n物品: {}\n链接: [{}]({})".format(self.info.itemCarts, orderUrl, orderUrl)
        feishu.CFeishu(appId="aaa", appSecret="bbb").sendMsg(title=title, content=conttent, toArr=["gcg2b216"])

    async def startCheck(self):
        def restSec():
            ts01 = utils.nowTs()
            ts02 = utils.FmtTs(tStr=self.info.start_time, fmt="%Y%m%d_%H%M%S")
            return ts02 - ts01

        cnt = 0
        sec = restSec()
        while sec > 0:
            cmd_color.printWhite("--- 还未到时间: {}, 剩余: {} 秒, 1 秒后再检测\n".format(self.info.start_time, sec))
            await asyncio.sleep(1)

            cnt = cnt + 1
            sec = restSec()
            if cnt % 60 == 0:  # 一分钟刷新一下浏览器
                cmd_color.printWhite("--- 刷新等待 3 秒, 保持登录状态\n")
                self.browser.refresh()
                await asyncio.sleep(3)

        cmd_color.printGreen("--- 已到达时间: {}\n".format(self.info.start_time))

    async def safeFind(self, ele: WebElement, value) -> WebElement:
        try:
            # await asyncio.sleep(0.01)
            return ele.find_element(by=By.XPATH, value=value)
        except Exception as ex:
            # cmd_color.printRed("--- 找不到 value: {}\n错误堆栈: {}".format(value, utils.exmsg(ex)))
            return None

    async def safeFinds(self, ele: WebElement, value):
        try:
            # await asyncio.sleep(0.01)
            return ele.find_elements(by=By.XPATH, value=value)
        except Exception as ex:
            cmd_color.printRed("--- 找不到 value: {}\n, stack: {}".format(value, utils.exmsg(ex)))
            return None

    # TODO: 检查参数
    def checkInfo(self, info: CInfo):
        pass

    async def select_opt(self, skuEle: WebElement, name, value):
        dlEleArr = await self.safeFinds(skuEle, value=".//dl")
        assert dlEleArr is not None, "--- 找不到 opt dl 列表"

        isFindOpt = False
        for dlEle in dlEleArr:
            ele = await self.safeFind(dlEle, value=".//dt[contains(text(),'{}')]".format(name))
            if ele is None:
                continue

            cmd_color.printGreen("--- 找到 {}\n".format(name))
            isFindOpt = True
            if name == "数量":  # 特殊判断
                inputEle = await self.safeFind(dlEle, value=".//dd//input")
                assert inputEle is not None, "--- 找不到 数量"
                inputEle.clear()
                # inputEle.send_keys(str(value)) # 清空时会自动变为 1, 需要模拟慢慢点击
                await self.setNum(dlEle, abs(int(value)))
                cmd_color.printWhite("--- 数量 设置为: {}\n".format(value))
            else:
                aEleArr = await self.safeFinds(dlEle, value=".//dd//li//a[@role='button']")
                isFindItem = False
                for aEle in aEleArr:
                    if value in aEle.text:  # 包含目的字符串, 选中
                        isFindItem = True

                        liEle = await self.safeFind(aEle, value="..")
                        assert liEle is not None, "--- 找不到 a 节点: {} 的父节点 li".format(aEle.text)

                        # 尝试选中
                        selectFlag = ""
                        while selectFlag != "tb-selected":
                            aEle.click()
                            selectFlag = liEle.get_attribute("class") or ""
                            await asyncio.sleep(1)  # 延迟一下, 防止勾选不中
                            cmd_color.printWhite("--- 选中 {} 中的 {}\n".format(name, aEle.text))

                        break
                assert isFindItem, "--- 找不到目的选中项: {}".format(value)
            await asyncio.sleep(0.1)  # 延迟一下, 防止勾选不中
            break

        assert isFindOpt, "--- 找不到选项: {}".format(name)

    # 设置数量
    async def setNum(self, ele: WebElement, num):
        if num <= 1:
            return

        addEle = await self.safeFind(ele, value="//dd//span[@class='mui-amount-increase']")
        assert addEle is not None, "--- 找不到 增加数量 按钮"

        for i in range(num - 1):
            addEle.click()

    # 倒计时判断
    async def countdown(self, ele: WebElement):
        await asyncio.sleep(0.05)
        cdEle = await self.safeFind(ele, value="//div[@class='tm-countdown-timer']")  # TODO: 刷新之后会有 Message: stale element reference: element is not attached to the page document 错误

        if cdEle is not None:
            cmd_color.printWhite("--- 还在倒计时中, 剩余时间: {}, 刷新页面并等待 1 秒\n".format(cdEle.text))
            self.browser.refresh()
            await asyncio.sleep(1)
            await self.countdown(ele=ele)

    # 打开商品页面并选中参数
    async def buyItem(self):
        skuEle: WebElement = None
        while skuEle is None:
            # 打开 商品页面, 这里有可能被验证码拦截
            await self.openUrl(self.info.url)
            await asyncio.sleep(0.1)  # 延迟一下
            # 商品操作节点
            skuEle = await self.safeFind(self.browser, value="//div[@class='tb-sku']")
            if skuEle is None:
                cmd_color.printWhite("--- 找不到 sku 节点, 刷新页面并等待 1 秒\n")
                await asyncio.sleep(1)
        cmd_color.printWhite("--- 找到 sku 节点\n")

        # 倒计时等待
        await self.countdown(skuEle)
        cmd_color.printGreen("--- 倒计时已结束\n")

        # 选中商品
        for (k, v) in self.info.itemopts.items():
            cnt = 0
            while cnt < 5:  # 尝试 找 5 次
                try:
                    await self.select_opt(skuEle, k, v)
                    cnt = 999
                except Exception as ex:
                    cnt = cnt + 1

        await asyncio.sleep(0.1)  # 延迟一下
        await self.click(ele=skuEle, tips="立即购买", value="//div//a[@id='J_LinkBuy' and contains(text(),'立即购买')]", cnt=3)

        # 提交订单
        await asyncio.sleep(1)
        isOk = await self.clickWithFresh(ele=self.browser, tips="提交订单", value="//div[@class='submitOrder-container']//a[contains(text(), '提交订单')]", cnt=3)

        # 通知
        await self.notify(isOk=isOk)

    # 测试 购买并提交订单
    async def test_buy(self):
        self.checkInfo(self.info)
        await self.openUrl("https://www.taobao.com")
        await self.tryLogin()
        await self.startCheck()
        await self.buyItem()

        aaa = utils.inputStr("--- wolegequ") # 要阻塞住, 不然进程会马上关闭

    # 测试 购物车结算
    async def test_cart(self):
        self.checkInfo(self.info)
        await self.openUrl("https://www.taobao.com")
        await self.tryLogin()
        await self.startCheck()
        await self.openCart()

        aaa = utils.inputStr("--- wolegequ") # 要阻塞住, 不然进程会马上关闭

if __name__ == "__main__":
    ins = Test_TbBot()
    asyncio.run(ins.test_buy())
    # asyncio.run(ins.test_cart())




