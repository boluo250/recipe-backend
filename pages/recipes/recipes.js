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

  // 搜索菜谱
  async searchRecipes(query) {
    try {
      console.log('搜索菜谱:', query);
      const recipes = await request(`/api/recipes?query=${encodeURIComponent(query)}&page=1&size=${this.data.size}`);
      console.log('搜索结果:', recipes);
      this.setData({
        recipes,
        page: 1,
        hasMore: recipes.length === this.data.size
      });
    } catch (error) {
      console.error('搜索失败:', error);
      wx.showToast({
        title: '搜索失败',
        icon: 'none'
      });
    }
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

  // 搜索输入
  onSearchInput(e) {
    this.searchQuery = e.detail.value;
  },

  // 搜索确认
  onSearchConfirm(e) {
    const query = e.detail.value || this.searchQuery;
    if (query && query.trim()) {
      this.searchRecipes(query.trim());
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