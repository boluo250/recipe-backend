// pages/recipes/recipes.js
const { request } = require('../../utils/request.js');

Page({
  data: {
    recipes: [],
    page: 1,
    size: 10,
    hasMore: true
  },

  onLoad() {
    console.log('recipes 页面 onLoad');
    this.loadRecipes();
  },

  // 获取菜谱列表
  async loadRecipes() {
    console.log('开始加载菜谱，page:', this.data.page, 'size:', this.data.size);
    try {
      const { page, size } = this.data;
      const recipes = await request(`/api/recipes?page=${page}&size=${size}`);
      console.log('菜谱数据:', recipes);
      this.setData({
        recipes: page === 1 ? recipes : [...this.data.recipes, ...recipes],
        hasMore: recipes.length === size
      });
    } catch (error) {
      wx.showToast({
        title: '获取菜谱失败',
        icon: 'none'
      });
    }
  },

  // 跳转到搜索页面
  goToSearch() {
    wx.navigateTo({
      url: '/pages/search/search'
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({ page: 1 });
    this.loadRecipes().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.hasMore) {
      this.setData({ page: this.data.page + 1 });
      this.loadRecipes();
    }
  },

  // 跳转到详情页面
  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    if (id) {
      wx.navigateTo({
        url: `/pages/detail/detail?id=${id}`
      });
    }
  },

  // 加载更多
  loadMore() {
    if (this.data.hasMore) {
      this.setData({ page: this.data.page + 1 });
      this.loadRecipes();
    }
  }
});