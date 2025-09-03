Page({
  data: {
    uploadImage: '',
    uploadName: '',
    uploadIngredients: '',
    uploadSteps: '',
    uploadTags: ''
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
    
    // 根据菜谱名称或标签判断分类
    const category = this.determineCategory(uploadName, uploadTags);
    
    // 先上传图片到服务器
    let imagePath = '';
    try {
      const uploadRes = await new Promise((resolve, reject) => {
        wx.uploadFile({
          url: 'https://veganbubu.site/api/upload-image',
          filePath: uploadImage,
          name: 'file',
          formData: {
            category: category
          },
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
      setTimeout(() => {
        wx.navigateBack();
      }, 1200);
    } catch (err) {
      wx.showToast({ title: '上传失败', icon: 'none' });
    }
  },

  // 根据菜谱名称和标签判断分类
  determineCategory(name, tags) {
    const nameLower = name.toLowerCase();
    const tagsLower = (tags || '').toLowerCase();
    
    // 炒菜相关关键词
    if (nameLower.includes('炒') || tagsLower.includes('炒') || 
        nameLower.includes('清炒') || tagsLower.includes('清炒')) {
      return 'chao';
    }
    
    // 煮菜相关关键词
    if (nameLower.includes('煮') || tagsLower.includes('煮') ||
        nameLower.includes('汤') || tagsLower.includes('汤') ||
        nameLower.includes('炖') || tagsLower.includes('炖')) {
      return 'zhu';
    }
    
    // 拌菜相关关键词
    if (nameLower.includes('拌') || tagsLower.includes('拌') ||
        nameLower.includes('凉拌') || tagsLower.includes('凉拌')) {
      return 'ban';
    }
    
    // 默认分类
    return 'default';
  }
}); 