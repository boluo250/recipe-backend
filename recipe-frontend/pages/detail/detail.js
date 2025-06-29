const { request } = require('../../utils/request');

Page({
  data: {
    recipe: null
  },

  onLoad(options) {
    if (options.id) {
      this.loadRecipeDetail(options.id);
    }
  },

  async loadRecipeDetail(id) {
    try {
      const recipe = await request(`/api/recipes/${id}`);
      console.log('菜谱详情数据:', recipe); 
      this.setData({ recipe });
    } catch (error) {
      wx.showToast({
        title: '获取详情失败',
        icon: 'none'
      });
    }
  }
});