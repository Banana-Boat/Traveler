// pages/walking/walking.js
const app = getApp();
var QQMapWX = require('../../script/qqmap-wx-jssdk1.2/qqmap-wx-jssdk.js');  //获取应用实例
var qqmapsdk = new QQMapWX({        //创建腾讯地图对象
    key: 'S2FBZ-PNXK3-62I3W-3REB6-M4AWJ-6IBAB'
});
const MaxStepsPerDay = 100000;      //单日步数上限

Page({
    data: {
        userLocation: null,
        heightPicker: {
            index: null,
            array: null
        },
        daysPicker: {
            index: 1,
            array: [5, 7, 15, 20, 25, 30]
        },
        markerList: null,
        selectedPlace: {
            name: null,
            totalDistance: null,
            stepsPerDay: null
        },
        strideLength: null,
    },
    onLoad: function (options) {
        var page = this;
        /* 初始化步幅、身高选择器、用户位置 */
        var heightArray = [];
        for (let i = 0; i < 80; i++) {
            heightArray.push(i + 130)
        }
        var storageHeight = wx.getStorageSync('height')
        if(storageHeight){                                      //若有本地存储信息（身高），则直接读取
            page.setData({
                'heightPicker.index': heightArray.findIndex(item => item == storageHeight),
                'heightPicker.array': heightArray,
                strideLength: wx.getStorageSync('height') / 100 * 0.37,
                userLocation: app.globalData.userLocation,
            })
        }else{                                                  //无本地信息
            if (app.globalData.userInfo.gender == 1) {          //若性别为男，初始身高设置为170
                page.setData({
                    'heightPicker.index': 40,
                    'heightPicker.array': heightArray,
                    strideLength: 1.7 * 0.37,
                    userLocation: app.globalData.userLocation,
                })
            } else {                                            //若性别为女，初始身高设置为160
                page.setData({
                    'heightPicker.index': 30,
                    'heightPicker.array': heightArray,
                    strideLength: 1.6 * 0.37,
                    userLocation: app.globalData.userLocation,
                })
            }
        }
        /* 查询周边5A级景区并在地图中标注 */
        qqmapsdk.search({
            keyword: '5A级景区',                     //搜索关键词
            address_format: 'short',                //返回短地址
            page_size: 20,
            success: function (res) {
                var mks = []
                for (var i = 0; i < res.data.length; i++) {
                    mks.push({
                        id: i,
                        name: res.data[i].title,
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
                wx.showToast({
                    icon: 'none',
                    duration: 2000,
                    title: '获取失败周边信息失败'
                })
            }
        });
    },
    /* 身高选择器 */
    heightChange: function (e) { 
        var page = this;           
        page.setData({              //绑定数据
            selectedPlace: {
                name: null,
                totalDistance: null,
                stepsPerDay: null
            },
            'heightPicker.index': e.detail.value
        })
        wx.setStorage({             //更新本地存储
            key: 'height',
            data: page.data.heightPicker.array[e.detail.value]
        })
    },
    /* 计划天数选择器 */
    daysChange: function(e){                
        var page = this;
        page.setData({
            selectedPlace: {
                name: null,
                totalDistance: null,
                stepsPerDay: null
            },
            'daysPicker.index': e.detail.value
        })
    },
    /* 点击地图，选择目的地 */
    mapTap: function (e) {
        this.showDistance(e.detail.latitude, e.detail.longitude, null)
    },
    /* 点击地图标注点，选择目的地 */
    markerTap: function (e) {
        var tempMarker = this.data.markerList[e.markerId]
        this.showDistance(tempMarker.latitude, tempMarker.longitude, tempMarker.name)
    },
    /* 函数：通过经纬度计算距离并绑定页面数据 */
    showDistance: function (lat, lon, name){
        var page = this;
        if(name){                           //如果是点击marker，则直接设置地点名
            page.setData({
                'selectedPlace.name': name
            })
        }else{
            qqmapsdk.reverseGeocoder({      //如果是点击地图上的非marker点，则查询地点名称
                location: {
                    latitude: lat,
                    longitude: lon
                },
                success: function (res) {
                    page.setData({
                        'selectedPlace.name': res.result.ad_info.city + res.result.ad_info.district
                    })
                },
                fail: function () {
                    wx.showToast({
                        icon: 'none',
                        duration: 2000,
                        title: '获取城市信息失败'
                    })
                    page.setData({
                        selectedPlace: {
                            name: null,
                            totalDistance: null,
                            stepsPerDay: null
                        }
                    })
                }
            });
        }
        qqmapsdk.calculateDistance({        //计算选取地点距离
            mode: 'walking',
            to: [{
                latitude: lat,
                longitude: lon
            }],
            success: function (res) {
                var totalDistance = res.result.elements[0].distance
                var day = parseInt(page.data.daysPicker.array[page.data.daysPicker.index])
                var stepsPerDay = parseInt(totalDistance / page.data.strideLength / day)        
                if(stepsPerDay < MaxStepsPerDay){
                    page.setData({
                        'selectedPlace.totalDistance': totalDistance,                            
                        'selectedPlace.stepsPerDay': stepsPerDay
                    })
                }else{
                    wx.showModal({
                        title: '任务艰巨，确定要坚持吗？',
                        confirmText: '坚持前往',
                        cancelText: '再想想',
                        success: function(res){
                            if(res.confirm){
                                page.setData({
                                    'selectedPlace.totalDistance': totalDistance,
                                    'selectedPlace.stepsPerDay': stepsPerDay
                                })
                            }
                        }
                    })
                }
            },
            fail: function (res) {
                wx.showToast({
                    icon: 'none',
                    duration: 2000,
                    title: '计算距离失败...'
                })
                page.setData({
                    selectedPlace: {
                        name: null,
                        totalDistance: null,
                        stepsPerDay: null
                    }
                })
            }
        })
    },
    /* 点击开始旅行 */
    startTraveling: function () {
        var page = this;
        if (page.data.selectedPlace.name && page.data.selectedPlace.totalDistance){
            var name = page.data.selectedPlace.name;
            var totalDistance = page.data.selectedPlace.totalDistance;
            var days = page.data.daysPicker.array[page.data.daysPicker.index];
            wx.showModal({
                title: '徒步旅行计划书',
                content: '目的地：' + name
                    + '步行距离：' + totalDistance + '公里'
                    + '计划完成天数：' + days + '天',
                confirmText: '冲！',
                cancelText: '再想想',
                success: function (res) {
                    if (res.confirm) {

                    }
                }
            })
        }else{
            wx.showModal({
                title: '请先选择旅行目的地',
                showCancel: false
            })
        }
    },
    onShow: function () {

    },
})