const { BASE_URL, API_KEY } = require('./config');
const request = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const fullUrl = `${BASE_URL}${url}`;
    const method = options.method || 'GET';
    const data = options.data || {};
    const header = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
      ...options.header
    };
    console.log('请求信息:', { url: fullUrl, method, data, header });
    wx.request({
      url: fullUrl,
      method,
      data,
      header,
      success: (res) => {
        console.log('响应结果:', res);
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject(res);
        }
      },
      fail: (err) => {
        console.log('请求失败:', err);
        reject(err);
      }
    });
  });
};
module.exports = { request }; // 确保导出