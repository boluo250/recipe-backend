// pages/recipes/recipes.js
const { request } = require('../../utils/request.js');

Page({
  data: {
    recipes: [],
    page: 1,
    size: 10,
    hasMore: true,
    // 上传表单相关
    uploadImage: '',
    uploadName: '',
    uploadIngredients: '',
    uploadSteps: '',
    uploadTags: ''
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
  },

  // 表单输入绑定
  onInputChange(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: e.detail.value });
  },

  // 选择图片
  chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({ uploadImage: res.tempFilePaths[0] });
      }
    });
  },

  // 上传菜谱表单提交
  async onUploadRecipe(e) {
    const { uploadImage, uploadName, uploadIngredients, uploadSteps, uploadTags } = this.data;
    if (!uploadImage || !uploadName || !uploadIngredients || !uploadSteps) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }
    // 先上传图片到服务器（假设有 /api/upload-image 接口，返回图片路径）
    let imagePath = '';
    try {
      const uploadRes = await new Promise((resolve, reject) => {
        wx.uploadFile({
          url: 'http://43.130.10.169:3000/api/upload-image',
          filePath: uploadImage,
          name: 'file',
          header: { 'Authorization': 'Bearer fa7a7ec5a23247014108e0dd4e7db0ac985a870860d82a7a2a8e105021c0a627' },
          success: resolve,
          fail: reject
        });
      });
      const data = JSON.parse(uploadRes.data);
      imagePath = data.path || data.url || data.image || '';
    } catch (err) {
      wx.showToast({ title: '图片上传失败', icon: 'none' });
      return;
    }
    // 处理步骤（换行分割）
    const stepsArr = uploadSteps.split(/\n|\r/).filter(Boolean).map(s => ({ description: s }));
    // 提交菜谱
    try {
      await require('../../utils/request').request('/api/recipes/upload', {
        method: 'POST',
        data: {
          name: uploadName,
          image: imagePath,
          ingredients: uploadIngredients,
          steps: stepsArr,
          tags: uploadTags
        }
      });
      wx.showToast({ title: '上传成功，等待审核', icon: 'success' });
      this.setData({
        uploadImage: '',
        uploadName: '',
        uploadIngredients: '',
        uploadSteps: '',
        uploadTags: ''
      });
    } catch (err) {
      wx.showToast({ title: '上传失败', icon: 'none' });
    }
  }
});