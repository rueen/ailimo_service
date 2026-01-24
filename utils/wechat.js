/**
 * 微信工具类
 * 
 * @description 处理微信 JSSDK 配置生成
 */
const axios = require('axios');
const crypto = require('crypto');
const logger = require('../config/logger');

/**
 * 微信 access_token 和 jsapi_ticket 缓存
 */
let tokenCache = {
  accessToken: null,
  accessTokenExpireTime: 0,
  jsapiTicket: null,
  jsapiTicketExpireTime: 0
};

/**
 * 获取微信 access_token
 * 
 * @returns {Promise<string>} access_token
 */
async function getAccessToken() {
  // 检查缓存是否有效（提前5分钟过期）
  const now = Date.now();
  if (tokenCache.accessToken && tokenCache.accessTokenExpireTime > now + 300000) {
    logger.info('使用缓存的 access_token');
    return tokenCache.accessToken;
  }

  try {
    const appId = process.env.WECHAT_APPID;
    const appSecret = process.env.WECHAT_APPSECRET;

    if (!appId || !appSecret) {
      throw new Error('微信 AppID 或 AppSecret 未配置');
    }

    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
    const response = await axios.get(url);

    if (response.data.errcode) {
      const errcode = response.data.errcode;
      const errmsg = response.data.errmsg;
      
      // 处理常见错误
      let errorMessage = `获取 access_token 失败 (${errcode}): ${errmsg}`;
      
      if (errcode === 40164) {
        // IP 白名单错误
        const ipMatch = errmsg.match(/invalid ip ([0-9.]+)/);
        const ip = ipMatch ? ipMatch[1] : '未知';
        errorMessage = `服务器 IP (${ip}) 不在微信公众平台白名单中，请在微信公众平台添加此 IP 到白名单`;
      } else if (errcode === 40013) {
        errorMessage = '微信 AppID 不正确，请检查配置';
      } else if (errcode === 40125) {
        errorMessage = '微信 AppSecret 不正确，请检查配置';
      }
      
      throw new Error(errorMessage);
    }

    const accessToken = response.data.access_token;
    const expiresIn = response.data.expires_in || 7200;

    // 缓存 access_token
    tokenCache.accessToken = accessToken;
    tokenCache.accessTokenExpireTime = now + expiresIn * 1000;

    logger.info('获取新的 access_token 成功');
    return accessToken;
  } catch (error) {
    logger.error('获取 access_token 失败:', error.message);
    throw error;
  }
}

/**
 * 获取微信 jsapi_ticket
 * 
 * @returns {Promise<string>} jsapi_ticket
 */
async function getJsapiTicket() {
  // 检查缓存是否有效（提前5分钟过期）
  const now = Date.now();
  if (tokenCache.jsapiTicket && tokenCache.jsapiTicketExpireTime > now + 300000) {
    logger.info('使用缓存的 jsapi_ticket');
    return tokenCache.jsapiTicket;
  }

  try {
    const accessToken = await getAccessToken();
    
    if (!accessToken) {
      throw new Error('access_token 为空');
    }
    
    // URL 编码 access_token，防止特殊字符导致 invalid url 错误
    const encodedToken = encodeURIComponent(accessToken);
    const url = `https://api.weixin.qq.com/cgi-bin/ticket/getjsapi_ticket?access_token=${encodedToken}`;
    logger.info('请求 jsapi_ticket');
    
    const response = await axios.get(url);

    logger.info('jsapi_ticket 响应:', response.data);

    if (response.data.errcode !== 0) {
      const errcode = response.data.errcode;
      const errmsg = response.data.errmsg;
      
      // 处理常见错误
      let errorMessage = `获取 jsapi_ticket 失败 (${errcode}): ${errmsg}`;
      
      if (errcode === 40001) {
        errorMessage = 'access_token 无效或已过期，请检查微信配置';
        // 清除缓存的 token，下次重新获取
        tokenCache.accessToken = null;
        tokenCache.accessTokenExpireTime = 0;
      } else if (errcode === 40014) {
        errorMessage = 'access_token 不合法，请检查微信 AppID 和 AppSecret';
      }
      
      throw new Error(errorMessage);
    }

    const jsapiTicket = response.data.ticket;
    const expiresIn = response.data.expires_in || 7200;

    // 缓存 jsapi_ticket
    tokenCache.jsapiTicket = jsapiTicket;
    tokenCache.jsapiTicketExpireTime = now + expiresIn * 1000;

    logger.info('获取新的 jsapi_ticket 成功');
    return jsapiTicket;
  } catch (error) {
    logger.error('获取 jsapi_ticket 失败:', error.message);
    throw error;
  }
}

/**
 * 生成随机字符串
 * 
 * @param {number} length 字符串长度
 * @returns {string} 随机字符串
 */
function generateNonceStr(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 生成微信 JSSDK 签名
 * 
 * @param {string} jsapiTicket jsapi_ticket
 * @param {string} nonceStr 随机字符串
 * @param {number} timestamp 时间戳
 * @param {string} url 当前页面 URL
 * @returns {string} 签名
 */
function generateSignature(jsapiTicket, nonceStr, timestamp, url) {
  // 按字典序排列参数
  const string = `jsapi_ticket=${jsapiTicket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${url}`;
  
  // SHA1 加密
  const signature = crypto.createHash('sha1').update(string).digest('hex');
  
  logger.info('生成签名:', {
    string,
    signature
  });
  
  return signature;
}

/**
 * 获取微信 JSSDK 配置
 * 
 * @param {string} url 当前页面完整 URL
 * @returns {Promise<Object>} 微信配置对象
 */
async function getJssdkConfig(url) {
  try {
    // 获取 jsapi_ticket
    const jsapiTicket = await getJsapiTicket();
    
    // 生成随机字符串和时间戳
    const nonceStr = generateNonceStr();
    const timestamp = Math.floor(Date.now() / 1000);
    
    // 生成签名
    const signature = generateSignature(jsapiTicket, nonceStr, timestamp, url);
    
    // 返回配置
    return {
      appId: process.env.WECHAT_APPID,
      timestamp,
      nonceStr,
      signature
    };
  } catch (error) {
    logger.error('获取微信 JSSDK 配置失败:', error);
    throw error;
  }
}

/**
 * 清除缓存（用于测试或强制刷新）
 */
function clearCache() {
  tokenCache = {
    accessToken: null,
    accessTokenExpireTime: 0,
    jsapiTicket: null,
    jsapiTicketExpireTime: 0
  };
  logger.info('微信 token 缓存已清除');
}

module.exports = {
  getAccessToken,
  getJsapiTicket,
  getJssdkConfig,
  clearCache
};
