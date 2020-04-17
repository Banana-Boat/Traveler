//index.js
var QQMapWX = require('../../script/qqmap-wx-jssdk1.2/qqmap-wx-jssdk.js');  //获取应用实例
var qqmapsdk = new QQMapWX({        //创建腾讯地图对象
    key: 'S2FBZ-PNXK3-62I3W-3REB6-M4AWJ-6IBAB'
});
const app = getApp();
const db = wx.cloud.database();
var provinceList = require('../../data/provinces_data.js');   //获取外部数据（省份及其中心经纬度）

Page({
    data: {
        /* 用户信息 */
        userInfo: null,
        hasUserInfo: false,
        canIUse: wx.canIUse('button.open-type.getUserInfo'),
        userLocation: {
            latitude: null,
            longitude: null,
            userProvince: null,
            userCity: null
        },
        /* 已选地点 */
        selectedPlace: null,
        selectedMark: null,
        /* 控件绑定 */
        timeSlider: {
            value: null,
            max: null,
            unit: null
        },
        placePicker: {
            index: null,
            array: null
        }
    },
    onLoad: function () {
        var page = this;
        /* 获取用户所在城市 */
        page.getUserLocation();
        /* 通过openid添加用户至数据库 */
        if(app.globalData.userOpenid){      
            page.addUserToDB(app.globalData.userOpenid);
        }else{
            app.getOpenid().then(   //promise异步回调获取openid
                function(data){
                    page.addUserToDB(data);
                },
                function(reason){
                    wx.showModal({
                        title: reason,
                        showCancel: false
                    })
                }
            )
        }
        /* 获取用户信息 */
        if (app.globalData.userInfo) {
            this.setData({
                userInfo: app.globalData.userInfo,
                hasUserInfo: true
            })
        } else if (this.data.canIUse){
            // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
            // 所以此处加入 callback 以防止这种情况
            app.userInfoReadyCallback = res => {
                this.setData({
                    userInfo: res.userInfo,
                    hasUserInfo: true
                })
            }
        } else {  // 在没有 open-type=getUserInfo 版本的兼容处理
            wx.getUserInfo({
            success: res => {
                app.globalData.userInfo = res.userInfo
                this.setData({
                    userInfo: res.userInfo,
                    hasUserInfo: true
                })
            }
            })
        }
    },
    onShow: function(){
        var page = this;
        //初始化控件的绑定值
        let unit = app.globalData.settings.timeUnit;
        if(page.data.timeSlider.value){    //当更改设置信息从设置页面返回时，重新读取信息
            page.setData({
                timeSlider: {              //value为设置前选择地rank*现unit的值
                    value: page.data.selectedPlace.time / page.data.timeSlider.unit * unit,
                    max: unit * 12,
                    unit: unit
                }
            })
        }else{
            page.setData({
                timeSlider: {
                    value: 0,
                    max: unit * 12,
                    unit: unit
                }
            })
        }
        
        //从旅行页面直接点击返回按钮
        if (app.globalData.travelStatus == 'failed') {   
            wx.showModal({
                title: '很遗憾，本次旅行失败...',
                showCancel: false
            });
            app.globalData.travelStatus = 'none';
        }
    },
    /* 获取用户信息 */
    getUserInfo: function(e) {
        console.log(e)
        app.globalData.userInfo = e.detail.userInfo
    },
    /* 将用户信息（openid）添加至数据库 */
    addUserToDB: function(openid){
        db.collection('UserInfo').where({
            _openid: openid
        }).get({
            success: res => {
                if(res.data.length == 0){
                    db.collection('UserInfo').add({
                        data: {
                            travelRecord: []
                        },
                        success: res => {
                            console.log('添加用户成功')
                        }
                    })
                }
            }
        })
    },
    /* 获取用户当前所在位置信息、计算到达各省会所需时间、初始化控件内容 */
    getUserLocation: function () {
        var page = this;
        wx.getLocation({
            success: function (res) {           //获取用户当前经纬度信息
                let latitude = res.latitude;
                let longitude = res.longitude;
                page.setData({
                    selectedMarker: [{          //初始化地图标注为当前位置
                        latitude: latitude,
                        longitude: longitude
                    }],
                    'userLocation.latitude': latitude,
                    'userLocation.longitude': longitude
                })
                qqmapsdk.reverseGeocoder({      //通过经纬度获取城市信息
                    location: {
                        latitude: latitude,
                        longitude: longitude
                    },
                    success: function (res) {
                        page.setData({
                            'userLocation.province': res.result.ad_info.province,
                            'userLocation.city': res.result.ad_info.city 
                        })
                        app.globalData.userLocation = {
                            latitude: latitude,
                            longitude: longitude,
                            province: res.result.ad_info.province,
                            city: res.result.ad_info.city
                        }
                        var destinationList = [];       //制作数组参数
                        for (let i = 0; i < provinceList.length; i++) {
                            destinationList.push({
                                latitude: provinceList[i].latitude,
                                longitude: provinceList[i].longitude
                            });
                        }
                        qqmapsdk.calculateDistance({
                            mode: 'walking',        
                            to: destinationList,
                            success: function (res) {
                                /* 按距离计算相应rank */
                                for (let i = 0; i < res.result.elements.length; i++) {
                                    provinceList[i]['distance'] = res.result.elements[i].distance
                                }
                                provinceList.sort(function (a, b) { return a.distance - b.distance });   
                                let rank = 0;       //按顺序对应等级
                                for (let i = 0; i < provinceList.length; i++) {
                                    if (i % 3 == 0) rank++;
                                    provinceList[i]['rank'] = rank;
                                }
                                app.globalData.provinceList = provinceList;
                                /* 地点选择控件初始化 */
                                page.setData({
                                    placePicker: {
                                        index: 0,
                                        array: provinceList.filter(item => item.rank == 1)
                                    }
                                })
                            },
                            fail: function (res) {
                                wx.showToast({
                                    icon: 'none',
                                    duration: 2000,
                                    title: '计算至各地区距离失败...'
                                })
                            }
                        })
                    },
                    fail: function () {
                        wx.showToast({
                            icon: 'none',
                            duration: 2000,
                            title: '获取城市信息失败'
                        })
                    }
                });
            },
            fail: function () {
                wx.showToast({
                    icon: 'none',
                    duration: 2000,
                    title: '获取当前位置信息失败'
                })
            }
        })
    },
    /* 通过标注地图选择目的地 */
    markChange: function(e){
        var page = this;
        page.setData({
            selectedMarker: [{          //显示地图标注
                latitude: e.detail.latitude,
                longitude: e.detail.longitude
            }]
        })
        qqmapsdk.reverseGeocoder({      //获取位置对应的城市名及所需时间
            location:{
                latitude: e.detail.latitude,
                longitude: e.detail.longitude
            },
            success: res => {
                if(res.result.address_component.nation == '中国'){
                    var tempProvInfo = provinceList.filter(
                        item => {
                            return res.result.address_component.province.match(item.name);
                        }
                    );
                    if (tempProvInfo.length > 0) {      //若地区信息存在于距离列表中，更新已选地点信息
                        let name = tempProvInfo[0].name;
                        let time = tempProvInfo[0].rank * page.data.timeSlider.unit;
                        let pickerArray = provinceList.filter(item => item.rank == tempProvInfo[0].rank)
                        page.setData({
                            selectedPlace: {
                                name: name,
                                time: time
                            },
                            'timeSlider.value': time,
                            placePicker: {
                                index: pickerArray.findIndex(item => item.name == name),
                                array: pickerArray
                            }
                        })

                    } else {
                        wx.showModal({
                            title: '目前旅行范围仅在中国大陆内部',
                            showCancel: false
                        })
                    }
                } else {
                    wx.showModal({
                        title: '目前旅行范围仅在中国大陆内部',
                        showCancel: false
                    })
                }                
            }
        })
    },
    /* 通过时间滑动选择器缩小目的地可选范围  */
    timeChange: function(e){
        var page = this;                 
        var placeArray = provinceList.filter(item => item.rank == e.detail.value / page.data.timeSlider.unit);             
        page.setData({
            selectedPlace: {
                name: placeArray[0].name,
                time: placeArray[0].rank * page.data.timeSlider.unit
            },
            selectedMarker: [{
                latitude: placeArray[0].latitude,
                longitude: placeArray[0].longitude
            }],
            placePicker: {
                index: 0,
                array: placeArray
            }
        })
    },
    /* 通过地点滚动选择器选择目的地 */
    placeChange: function(e){
        var page = this;
        var placeArray = page.data.placePicker.array;       //获取地点picker的绑定数组
        var item = provinceList.filter(item => item.name == placeArray[e.detail.value].name)[0]      //获取绑定数组中picker选中的对象
        page.setData({
            selectedPlace: {
                name: item.name,
                time: item.rank * page.data.timeSlider.unit
            },
            selectedMarker: [{
                latitude: item.latitude,
                longitude: item.longitude
            }],
            'placePicker.index': e.detail.value
        })
        
    },
    /* 点击开始旅行 */
    startTraveling: function(){
        var page = this;
        if(page.data.selectedPlace){
            app.globalData.travelStatus = 'traveling'
            wx.navigateTo({
                url: '../traveling/traveling?name=' + page.data.selectedPlace.name +
                    '&time=' + page.data.selectedPlace.time,
            })
        }else{
            wx.showModal({
                title: '请先选择旅行目的地',
                showCancel: false
            })
        }
    },
    /* 生成图片并分享链接 */
    onShareAppMessage: function (res) {
        if (res.from === 'button') {
            // 来自页面内转发按钮
            console.log(res.target)
        }
        return {
            title: '旅行家的召唤',
            path: '/page/index/index?id=' + app.globalData.userOpenid
        }
    }
})
