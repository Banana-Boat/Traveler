//app.js
App({
    onLaunch: function () {
        var that = this;
        wx.cloud.init({         //初始化云能力
            env: 'traveler-ejvl3',
            traceUser: true,
        });
        // 展示本地存储能力
        var logs = wx.getStorageSync('logs') || []
        logs.unshift(Date.now())
        wx.setStorageSync('logs', logs)

        // 获取用户信息
        wx.getSetting({
            success: res => {
                if (res.authSetting['scope.userInfo']) {
                // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
                    
                }
                wx.getUserInfo({
                    success: res => {
                        // 可以将 res 发送给后台解码出 unionId
                        this.globalData.userInfo = res.userInfo
                        console.log(res)
                        // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
                        // 所以此处加入 callback 以防止这种情况
                        if (this.userInfoReadyCallback) {
                            this.userInfoReadyCallback(res)
                        }
                    }
                })
            }
        })
    },
    getOpenid: function(){
        var that = this;
        return new Promise((resolve, reject) => {
            wx.login({
                success: res => {
                    if (res.code) {
                        wx.request({
                            url: 'https://api.weixin.qq.com/sns/jscode2session',
                            data: {
                                appid: 'wxfa57e37a72bb37d7',
                                secret: '4fb33ad59a3f3f8aae432d57ce67514d',
                                js_code: res.code,
                                grant_type: 'authorization_code'
                            },
                            success: res => {
                                that.globalData.userOpenid = res.data.openid;
                                resolve(res.data.openid);
                            }
                        })
                    } else {
                        reject('登录失败！' + res.errMsg);
                    }
                }
            })
        })
    },
    onHide: function(){
        console.log('app--hide');
    },
    globalData: {
        /* 用户信息 */
        userInfo: null,
        userOpenid: null,
        userLocation: null,
        /* 旅行 */
        distanceToProvinces: null,
        travelStatus: 'none',
        memberCount: 1,
        /* 设置 */
        settings: {
            timeUnit: 10
        }
    },
})