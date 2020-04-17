// pages/traveling/traveling.js
const db = wx.cloud.database();
const _ = db.command
const app = getApp();
var clock;                  //定时器
var totalSec, leftSec;      //总共所需时间，当前所需时间
var util = require('../../utils/util.js');

Page({
    data: {
    },
    onLoad: function (options) {
        var page = this;
        page.setData({
            departure: app.globalData.userLocation.province.replace(/(.*)省/, '$1'),
            destination: options.name,
            totalTime: options.time
        });
        totalSec = Number.parseInt(options.time) * 60;
        leftSec = options.time * 60;

        clock = setInterval(countDown, 1000);           //开启倒计时
        function countDown(){
            page.setData({
                leftTime: Math.floor(leftSec / 60) + ' : ' + p(leftSec % 60)
            });
            leftSec--;
            if(leftSec == 0){
                clearInterval(clock);                   //清除定时器
                wx.showModal({
                    content: '伟大的旅行家，你已成功到达目的地！',
                    showCancel: false
                });
                setTimeout(function(){                  //延时跳转回首页
                    wx.navigateBack();
                }, 2000)
            }             
        }
        function p(n) {         //固定时间格式
            return n < 10 ? '0' + n : n;
        }
    },
    /* 点击提前结束，显示弹窗，若执意退出，在onUnLoad中处理 */
    quit: function(){
        if(leftSec / totalSec < 0.5)
            wx.showModal({
                title: '行程过半，确定要结束旅行吗？',
                cancelText: '坚持一下',
                confirmText: '确认退出',
                success: res => {
                    if(res.confirm)
                        wx.navigateBack();
                }
            });
        else
            wx.showModal({
                title: '确定要提前退出旅行吗？',
                cancelText: '继续旅行',
                confirmText: '确认退出',
                success: res => {
                    if (res.confirm)
                        wx.navigateBack();
                }
            });
    },
    onShow: function () {
        if(app.globalData.travelStatus == 'failed'){    //重新回到前台运行
            wx.navigateBack();
        }
    },
    onHide: function () {
        console.log('page--hide');
        app.globalData.travelStatus = 'failed'      //设置全局标记为失败
        clearInterval(clock);                       //停止定时器
        addTravelToDB('失败', 'none');
    },
    onUnload: function () {
        if (leftSec == 0){
            app.globalData.travelStatus = 'none';
            this.addTravelToDB('成功', 'none')   //将记录添加进数据库
        }else {                                     //时间到后停止返回首页
            clearInterval(clock);                   //清除定时器
            app.globalData.travelStatus = 'failed'  //时间未到，退出当前页面，标记失败
            this.addTravelToDB('失败', 'none');         //将记录添加至数据库
        }                             
    },
    /* 将记录存入数据库 */
    addTravelToDB: function(status, partners) {     
        var page = this;
        var table = db.collection('UserInfo');
        table.where({
            _openid: app.globalData.userOpenid
        }).get({
            success: res =>{
                var date = util.formatTime(new Date());
                table.doc(res.data[0]._id).update({
                    data: {
                        travelRecord: _.unshift({       //插入数组开头，保证以时间为降序排列
                            date: date,
                            destination: page.data.destination,
                            departure: page.data.departure,
                            status: status,
                            time: page.data.totalTime,
                            partner: partners
                        })
                    },
                    fail: res =>{
                        wx.showToast({
                            icon: 'none',
                            duration: 2000,
                            title: '添加旅行记录失败...'
                        })
                    }
                })
                
            }
        })
    }
})