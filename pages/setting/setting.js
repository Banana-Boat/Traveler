// pages/setting/setting.js
var app = getApp();

Page({
    data: {
        timeUnitIndex: 1,
        timeUnitArray: [5, 10, 15, 20]
    },
    onLoad: function (options) {
        var page = this;
        page.setData({                  //小程序启动函数已将本地存储值读入全局变量
            timeUnitIndex: page.data.timeUnitArray.findIndex(item => item == app.globalData.settings.timeUnit)
        })
    },
    timeUnitChange: function (e) {
        var page = this
        page.setData({          
            timeUnitIndex: e.detail.value
        })
        wx.getStorage({                 //异步取，避免削减性能
            key: 'settings',
            success: function(res) {
                res.data.timeUnit = page.data.timeUnitArray[e.detail.value];
                wx.setStorage({         //异步改
                    key: 'settings',
                    data: res.data
                })
            },
        })
        app.globalData.settings.timeUnit = page.data.timeUnitArray[e.detail.value]
    }
})