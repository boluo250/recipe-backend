// pages/search/search.js
const { request } = require('../../utils/request.js');

Page({
  data: {
    searchResults: [],
    searchQuery: '',
    page: 1,
    size: 10,
    hasMore: true,
    isLoading: false,
    popularKeywords: [], // 热门搜索关键词
    showPopularKeywords: true // 是否显示热门搜索关键词
  },

  onLoad(options) {
    // 加载热门搜索关键词
    this.loadPopularKeywords();
    
    // 如果从其他页面传入了搜索关键词
    if (options.query) {
      this.setData({ searchQuery: options.query });
      this.searchRecipes(options.query);
    }
  },

  // 加载热门搜索关键词
  async loadPopularKeywords() {
    try {
      const popularKeywords = await request('/api/recipes/popular-keywords?limit=10');
      this.setData({ popularKeywords });
    } catch (error) {
      console.error('加载热门搜索关键词失败:', error);
    }
  },

  // 点击热门搜索关键词
  onPopularKeywordTap(e) {
    const keyword = e.currentTarget.dataset.keyword;
    this.setData({ 
      searchQuery: keyword,
      showPopularKeywords: false
    });
    this.searchRecipes(keyword);
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({ searchQuery: e.detail.value });
  },

  // 搜索确认
  onSearchConfirm(e) {
    const query = e.detail.value || this.data.searchQuery;
    if (query && query.trim()) {
      this.setData({ showPopularKeywords: false });
      this.searchRecipes(query.trim());
    }
  },

  // 搜索菜谱
  async searchRecipes(query) {
    if (this.data.isLoading) return;
    
    this.setData({ 
      isLoading: true,
      page: 1,
      searchResults: []
    });

    try {
      console.log('搜索菜谱:', query);
      const recipes = await request(`/api/recipes?query=${encodeURIComponent(query)}&page=1&size=${this.data.size}`);
      console.log('搜索结果:', recipes);
      
      this.setData({
        searchResults: recipes,
        hasMore: recipes.length === this.data.size,
        isLoading: false
      });
    } catch (error) {
      console.error('搜索失败:', error);
      this.setData({ isLoading: false });
      wx.showToast({
        title: '搜索失败',
        icon: 'none'
      });
    }
  },

  // 加载更多搜索结果
  async loadMoreResults() {
    if (this.data.isLoading || !this.data.hasMore) return;
    
    this.setData({ isLoading: true });
    
    try {
      const nextPage = this.data.page + 1;
      const recipes = await request(`/api/recipes?query=${encodeURIComponent(this.data.searchQuery)}&page=${nextPage}&size=${this.data.size}`);
      
      this.setData({
        searchResults: [...this.data.searchResults, ...recipes],
        page: nextPage,
        hasMore: recipes.length === this.data.size,
        isLoading: false
      });
    } catch (error) {
      console.error('加载更多失败:', error);
      this.setData({ isLoading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
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

  // 上拉加载更多
  onReachBottom() {
    if (this.data.hasMore && this.data.searchQuery) {
      this.loadMoreResults();
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    if (this.data.searchQuery) {
      this.searchRecipes(this.data.searchQuery).then(() => {
        wx.stopPullDownRefresh();
      });
    } else {
      this.loadPopularKeywords().then(() => {
        wx.stopPullDownRefresh();
      });
    }
  }
}); 