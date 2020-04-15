// pages/setting/setting.js
var app = getApp();

Page({
    data: {
        timeUnitIndex: 1,
        timeUnitArray: [5, 10, 15, 20]
    },
    onLoad: function (options) {
        var page = this;
        wx.getStorage({
            key: 'timeUnit',
            success: function(res) {
                page.setData({
                    timeUnitIndex: page.data.timeUnitArray.findIndex(item => item == res.data)
                })
            }
        })
    },
    timeUnitChange: function (e) {
        var page = this
        this.setData({
            timeUnitIndex: e.detail.value
        })
        wx.setStorage({
            key: 'timeUnit',
            data: page.data.timeUnitArray[e.detail.value],
        })
        app.globalData.settings.timeUnit = page.data.timeUnitArray[e.detail.value]
    }
})