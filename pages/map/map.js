// pages/map/map.js
const app = getApp();
const db = wx.cloud.database();
const _ = db.command;

Page({
    data: {
        mapView: null,
        markerList: null,
        stats: null,
    },
    onLoad: function (options) {
        var page = this;
        var provinceList = app.globalData.provinceList;
        /* 初始化地图 */
        db.collection('UserInfo').where({
            _openid: app.globalData.userOpenid
        }).get().then(res => {
            var successList = res.data[0].travelRecord.filter(item => item.status == '成功');     //获取成功记录
            /* 统计去过的省份，并在地图标注 */
            /* 按旅行地去重（当前列表已按时间降序排列）并将provinceList中的经纬度信息对应存放 */
            var tempList = successList.sort((a, b) => { return a.destination.localeCompare(b.destination) });
            var tempMarkerList = [{     
                name: tempList[0].destination,
                date: tempList[0].date,
                count: 1
            }]
            for(let i = 1; i < tempList.length; i++){
                if(tempList[i].destination != tempList[i - 1].destination)
                    tempMarkerList.push({
                        name: tempList[i].destination,
                        date: tempList[i].date,
                        count: 1
                    })
                else                            //若重复则count增加
                    tempMarkerList[i - 1].count = tempMarkerList[i - 1].count + 1
            }
            tempMarkerList.forEach(t => {       //填充经纬度信息并设置callout气泡窗    
                provinceList.forEach(p => {
                    if(t.name == p.name){
                        t.latitude = p.latitude;
                        t.longitude = p.longitude;
                    }
                })
                t.callout = {
                    content: t.name + "\n到达次数：" + t.count + "\n最近一次：" + t.date,
                    textAlign: 'center',
                    fontSize: 14,
                    color: '#ffffff',
                    bgColor: '#000000',
                    padding: 8,
                    borderRadius: 4,
                    boxShadow: '4px 8px 16px 0 rgba(0)'
                }
            })
            /* 统计 */
            var totalTiem = 0;
            successList.forEach(item => {
                totalTiem += parseInt(item.time) 
            })
            var max = tempMarkerList.sort((a, b) => {
                return -(a.count - b.count);
            })
            /* 绑定视图 */
            page.setData({
                markerList: tempMarkerList,
                stats: {
                    totalCount: successList.length,
                    totalTime: totalTiem,
                    max: {
                        place: max[0].name,
                        count: max[0].count
                    }
                }
            })
            
            
        })
    },
    onShow: function () {
    },
    /* 生成图片并分享至朋友圈 */
    onShareAppMessage: function (res) {
        if (res.from === 'button') {
            // 来自页面内转发按钮
            console.log(res.target)
        }
    }
})