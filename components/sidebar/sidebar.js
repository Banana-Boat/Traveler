// components/sidebar.js
Component({
    /**
     * 组件的属性列表
     */
    properties: {

    },

    /**
     * 组件的初始数据
     */
    data: {
        open: false
    },

    /**
     * 组件的方法列表
     */
    methods: {
        // 点击左上角小图标事件
        tap_ch: function (e) {
            if (this.data.open) {
                this.setData({
                    open: false
                });
            } else {
                this.setData({
                    open: true
                });
            }
        },
        tap_end: function (e) {
            // touchend事件
            this.data.mark = 0;
            this.data.newmark = 0;
            // 通过改变 opne 的值，让主页加上滑动的样式
            if (this.istoright) {
                this.setData({
                    open: true
                });
            } else {
                this.setData({
                    open: false
                });
            }
        }
    }
})
