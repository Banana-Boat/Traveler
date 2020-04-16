// pages/walking/walking.js
const app = getApp();
var QQMapWX = require('../../script/qqmap-wx-jssdk1.2/qqmap-wx-jssdk.js');  //获取应用实例
var qqmapsdk = new QQMapWX({        //创建腾讯地图对象
    key: 'S2FBZ-PNXK3-62I3W-3REB6-M4AWJ-6IBAB'
});

Page({
    data: {
        userLocation: null,
        daysPicker: {
            index: 0,
            array: [7, 15, 20, 25, 30]
        },
        markerList: null,
        distance: null,
    },
    onLoad: function (options) {
        var page = this;
        page.setData({
            userLocation: app.globalData.userLocation
        })
        qqmapsdk.search({
            keyword: '5A级景区',                     //搜索关键词
            address_format: 'short',                //返回短地址
            page_size: 20,
            success: function (res) {
                var mks = []
                for (var i = 0; i < res.data.length; i++) {
                    mks.push({
                        id: i,
                        latitude: res.data[i].location.lat,
                        longitude: res.data[i].location.lng,
                        callout: {
                            content: res.data[i].title,
                            textAlign: 'center',
                            fontSize: 14,
                            color: '#ffffff',
                            bgColor: '#000000',
                            padding: 8,
                            borderRadius: 4,
                            boxShadow: '4px 8px 16px 0 rgba(0)'
                        }
                    })
                }
                page.setData({
                    markerList: mks
                })
            },
            fail: function (res) {
                console.log('获取失败周边信息失败');
            }
        });
    },
    mapTap: function (e) {          /* 计算距离值，过近过远提示 */
        console.log(e.detail)
    },
    markerTap: function(e){
        console.log(e)
    },
    onShow: function () {

    },
})