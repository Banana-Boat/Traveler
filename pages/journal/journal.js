// pages/journal/journal.js
const db = wx.cloud.database();
const _ = db.command
var app = getApp();

Page({
    data: {
        RecordList: null
    },
    onLoad: function (options) {
        var page =  this;
        db.collection('UserInfo').where({
            _openid: app.globalData.userOpenid
        }).get().then(res =>{
            page.setData({
                RecordList: res.data[0].travelRecord
            }) 
        })
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {

    }
})