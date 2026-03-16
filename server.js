const express = require('express');
const cors = require('cors');
const axios = require('axios');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 5000;

// 创建一个禁用证书验证的 HTTPS Agent
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 静态文件服务
app.use(express.static('public'));

// 根路径 - 返回 index.html
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// 全局变量
global._initData = null;
global._requestHandler = null;

// 确保全局对象存在（但不覆盖 Buffer）
global.globalThis = global;
global.process = process;
global.globalThis.process = process;

// 挂载 btoa/atob 到全局（如果不存在）
if (!global.btoa) {
  global.btoa = function(str) {
    return Buffer.from(str, 'binary').toString('base64');
  };
  global.globalThis.btoa = global.btoa;
}

if (!global.atob) {
  global.atob = function(str) {
    return Buffer.from(str, 'base64').toString('binary');
  };
  global.globalThis.atob = global.atob;
}

// ============ lx 全局对象（模拟洛雪音乐 API）============
const lx = {
  EVENT_NAMES: {
    request: 'request',
    inited: 'inited',
    updateAlert: 'updateAlert'
  },

  send: function(eventName, data) {
    console.log(`[lx.send] 事件: ${eventName}`);
    if (eventName === 'inited') {
      global._initData = data;
      console.log(`[lx.send] 初始化数据:`, data);
    }
  },

  on: function(eventName, handler) {
    console.log(`[lx.on] 监听事件: ${eventName}`);
    if (eventName === 'request') {
      global._requestHandler = handler;
      console.log(`[lx.on] 请求处理器已注册`);
    }
  },

  request: function(url, options, callback) {
    console.log(`[lx.request] ${url}`);

    const method = (options.method || 'GET').toUpperCase();
    const headers = options.headers || {};
    const body = options.body || options.form || options.formData || undefined;

    let requestBody = body;
    if (options.form) {
      const formData = new URLSearchParams();
      for (const key in options.form) {
        formData.append(key, options.form[key]);
      }
      requestBody = formData.toString();
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }

    const timeout = options.response_timeout || 30000;

    axios({
      method,
      url,
      headers,
      data: requestBody,
      timeout,
      maxRedirects: options.follow_max || 5,
      validateStatus: () => true,
      httpsAgent: url.startsWith('https') ? httpsAgent : undefined
    })
      .then(response => {
        const result = {
          statusCode: response.status,
          headers: response.headers,
          body: response.data
        };

        console.log(`[lx.request] 响应: ${response.status}`);

        if (callback) {
          callback(null, result, response.data);
        }
      })
      .catch(error => {
        console.error(`[lx.request] 错误: ${error.message}`);

        if (callback) {
          callback(error, null, null);
        }
      });
  },

  crypto: {
    md5: function(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(hash).toString(16);
    }
  },

  atob: function(str) {
    return Buffer.from(str, 'base64').toString('binary');
  },
  btoa: function(str) {
    return Buffer.from(str, 'binary').toString('base64');
  },

  buffer: Buffer,

  utils: {
    crypto: {
      md5: function(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          hash = ((hash << 5) - hash) + str.charCodeAt(i);
          hash |= 0;
        }
        return Math.abs(hash).toString(16);
      }
    }
  },

  env: 'desktop',
  version: '1.0.0',
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval
};

global.lx = lx;
global.globalThis.lx = lx;

// ============ API 路由 ============

// 1. 加载脚本
app.post('/api/load', async (req, res) => {
  console.log('[API] 收到加载脚本请求');

  try {
    const { script, url } = req.body;
    let scriptContent = script;

    global._initData = null;
    global._requestHandler = null;

    if (url) {
      console.log(`[API] 从 URL 下载脚本: ${url}`);

      try {
        const response = await axios.get(url, {
          timeout: 60000,
          maxRedirects: 5,
          httpsAgent: url.startsWith('https') ? httpsAgent : undefined,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        scriptContent = response.data;
        console.log(`[API] 脚本下载成功，大小: ${scriptContent.length} 字节`);
      } catch (error) {
        console.error('[API] 下载脚本失败:', error.message);
        console.error('[API] 错误详情:', error.code, error.response?.status, error.response?.statusText);
        return res.status(500).json({
          success: false,
          error: `下载脚本失败: ${error.message}${error.response ? ` (${error.response.status})` : ''}`
        });
      }
    }

    if (!scriptContent) {
      return res.status(400).json({
        success: false,
        error: '缺少脚本内容或 URL'
      });
    }

    console.log('[API] 开始执行脚本...');

    try {
      const scriptFn = new Function(scriptContent);
      scriptFn();
      console.log('[API] 脚本执行完成');
    } catch (error) {
      console.error('[API] 脚本执行失败:', error.message);
      return res.status(500).json({
        success: false,
        error: `脚本执行失败: ${error.message}`
      });
    }

    // 等待脚本初始化（最多 10 秒）
    console.log('[API] 等待脚本初始化...');

    await new Promise((resolve, reject) => {
      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        if (global._initData) {
          clearInterval(checkInterval);
          console.log('[API] 脚本初始化成功');
          resolve();
        }

        if (Date.now() - startTime > 10000) {
          clearInterval(checkInterval);
          reject(new Error('脚本初始化超时（10秒）'));
        }
      }, 100);
    });

    res.json({
      success: true,
      data: global._initData
    });

  } catch (error) {
    console.error('[API] 加载脚本失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 2. 搜索歌曲
app.post('/api/search', async (req, res) => {
  console.log('[API] 收到搜索请求');

  try {
    const { keyword, source } = req.body;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        error: '缺少搜索关键词'
      });
    }

    if (!source) {
      return res.status(400).json({
        success: false,
        error: '缺少音源平台'
      });
    }

    console.log(`[API] 搜索关键词: ${keyword}, 音源: ${source}`);

    // 根据音源调用不同的搜索接口
    let apiUrl = '';
    let songs = [];

    try {
      if (source === 'kw') {
        // 酷我音乐搜索
        apiUrl = `http://search.kuwo.cn/r.s?all=${encodeURIComponent(keyword)}&pn=0&rn=20&ft=music&rformat=json&encoding=utf8&vipver=1`;
        console.log('[API] 调用酷我搜索 API:', apiUrl);

        const response = await axios.get(apiUrl, {
          timeout: 30000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        console.log('[API] 搜索响应状态:', response.status);

        // 酷我返回的是单引号格式，需要转换成双引号
        let jsonStr = response.data;
        jsonStr = jsonStr.replace(/'/g, '"');

        let jsonData;
        try {
          jsonData = JSON.parse(jsonStr);
        } catch (e) {
          console.error('[API] JSON 解析失败，尝试 eval:', e.message);
          // 如果 JSON.parse 失败，尝试使用 eval (需要小心)
          jsonData = eval(`(${response.data})`);
        }

        if (jsonData && jsonData.abslist && jsonData.abslist.length > 0) {
          songs = jsonData.abslist.map(song => {
            const musicRid = song.MUSICRID || '';
            return {
              songmid: musicRid.replace('MUSIC_', ''),
              name: song.SONGNAME || '未知',
              singer: song.ARTIST || '未知歌手',
              album: song.ALBUM || '未知专辑'
            };
          }).slice(0, 20); // 最多返回20首
          console.log(`[API] 搜索成功，找到 ${songs.length} 首歌曲`);
          console.log('[API] 示例歌曲:', songs[0]);
        } else {
          console.log('[API] 未找到歌曲，响应数据:', JSON.stringify(jsonData).substring(0, 500));
        }
      } else if (source === 'wy') {
        // 网易云音乐搜索 - 使用音源脚本
        console.log('[API] 网易云音乐搜索需要音源脚本支持');

        if (!global._requestHandler) {
          return res.status(400).json({
            success: false,
            error: '网易云音乐搜索需要先加载音源脚本，请点击"加载脚本"按钮'
          });
        }

        console.log('[API] 调用音源脚本搜索...');

        try {
          const result = await new Promise((resolve, reject) => {
            global._requestHandler(
              {
                action: 'search',
                source: source,
                info: {
                  keyword: keyword,
                  page: 1,
                  limit: 20
                }
              },
              (err, data) => {
                if (err) {
                  reject(err);
                } else {
                  resolve(data);
                }
              }
            );
          });

          if (result && Array.isArray(result) && result.length > 0) {
            songs = result.map(song => ({
              songmid: song.songmid || song.id || '',
              name: song.name || song.songname || '未知',
              singer: song.singer || song.artist || song.ar?.[0]?.name || '未知歌手',
              album: song.album || song.al?.name || '未知专辑'
            })).slice(0, 20);
            console.log(`[API] 搜索成功，找到 ${songs.length} 首歌曲`);
          } else {
            console.log('[API] 搜索未找到结果');
          }
        } catch (error) {
          console.error('[API] 网易云音乐搜索失败:', error.message);
          throw new Error(`搜索失败: ${error.message}`);
        }
      } else if (source === 'git') {
        // Git Music 暂不支持搜索
        console.log(`[API] 音源 ${source} 暂不支持搜索`);
        return res.status(400).json({
          success: false,
          error: `音源 ${source} 暂不支持搜索功能，请使用 kw (酷我) 或 wy (网易云音乐)`
        });
      } else {
        // 其他音源暂时不支持搜索
        console.log(`[API] 音源 ${source} 暂不支持搜索`);
        return res.status(400).json({
          success: false,
          error: `音源 ${source} 暂不支持搜索功能，请使用 kw (酷我)`
        });
      }

      res.json({
        success: true,
        data: songs
      });

    } catch (error) {
      console.error('[API] 搜索 API 请求失败:', error.message);
      res.status(500).json({
        success: false,
        error: `搜索失败: ${error.message}`
      });
    }

  } catch (error) {
    console.error('[API] 搜索失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 3. 获取音乐 URL (直接实现，不依赖音源脚本)
app.post('/api/music/url', async (req, res) => {
  console.log('[API] 收到获取音乐 URL 请求');

  try {
    const { source, musicInfo, quality } = req.body;

    if (!source || !musicInfo) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数: source 和 musicInfo'
      });
    }

    const songmid = musicInfo.songmid || musicInfo.id;

    if (source === 'kw') {
      // 直接调用酷我音乐 API
      console.log(`[API] 使用酷我音乐 API: songmid=${songmid}, quality=${quality}`);

      try {
        // 方法1: 尝试使用酷我的获取 URL 接口
        const musicUrl = await getKuwoMusicUrl(songmid, quality);

        res.json({
          success: true,
          data: {
            url: musicUrl
          }
        });
        return;
      } catch (error) {
        console.error('[API] 酷我 API 失败，尝试音源脚本:', error.message);
      }

      // 方法2: 如果直接 API 失败，尝试使用音源脚本
      if (!global._requestHandler) {
        return res.status(400).json({
          success: false,
          error: '请先加载音源脚本'
        });
      }

      console.log('[API] 调用请求处理器...');

      const result = await new Promise((resolve, reject) => {
        try {
          global._requestHandler(
            {
              action: 'musicUrl',
              source: source,
              info: {
                musicInfo: {
                  ...musicInfo,
                  type: 'music',
                  source: source
                },
                type: quality || '128k'
              }
            },
            (err, data) => {
              if (err) {
                reject(err);
              } else {
                resolve(data);
              }
            }
          );
        } catch (error) {
          reject(error);
        }
      });

      res.json({
        success: true,
        data: result
      });

    } else {
      // 其他音源使用音源脚本
      if (!global._requestHandler) {
        return res.status(400).json({
          success: false,
          error: '请先加载音源脚本'
        });
      }

      console.log('[API] 调用请求处理器...');

      const result = await new Promise((resolve, reject) => {
        try {
          global._requestHandler(
            {
              action: 'musicUrl',
              source: source,
              info: {
                musicInfo: {
                  ...musicInfo,
                  type: 'music',
                  source: source
                },
                type: quality || '128k'
              }
            },
            (err, data) => {
              if (err) {
                reject(err);
              } else {
                resolve(data);
              }
            }
          );
        } catch (error) {
          reject(error);
        }
      });

      res.json({
        success: true,
        data: result
      });
    }

  } catch (error) {
    console.error('[API] 获取音乐 URL 失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 辅助函数：获取酷我音乐 URL
async function getKuwoMusicUrl(musicRid, quality = '128k') {
  console.log(`[Kuwo] 开始获取 URL: ID=${musicRid}, 音质=${quality}`);

  // 尝试多个酷我 API
  const apis = [
    // API 1: 移动端接口
    `http://antiserver.kuwo.cn/anti.s?type=convert_url&rid=${musicRid}&format=mp3&response=url`,
    // API 2: 另一个移动端接口
    `http://nmobi.kuwo.cn/mobi.s?f=kuwo&q=${encodeURIComponent(JSON.stringify({
      rid: musicRid,
      format: quality === 'flac' ? 'flac' : 'mp3',
      bitrate: quality === '128k' ? 128 : (quality === '320k' ? 320 : 999)
    }))}`,
    // API 3: 播放接口
    `http://mobi.kuwo.cn/mobi.s?f=kuwo&q=${encodeURIComponent(JSON.stringify({
      rid: musicRid,
      format: 'mp3',
      bitrate: 128
    }))}`
  ];

  for (let i = 0; i < apis.length; i++) {
    try {
      console.log(`[Kuwo] 尝试 API ${i + 1}: ${apis[i].substring(0, 80)}...`);

      const response = await axios.get(apis[i], {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
        }
      });

      console.log(`[Kuwo] API ${i + 1} 响应状态: ${response.status}`);
      console.log(`[Kuwo] API ${i + 1} 响应数据: ${response.data.substring(0, 200)}`);

      if (response.data && response.data.length > 0 && response.data.startsWith('http')) {
        console.log(`[Kuwo] API ${i + 1} 成功获取 URL!`);
        return response.data;
      }

      // 尝试解析 JSON
      try {
        const json = JSON.parse(response.data);
        if (json.url) {
          console.log(`[Kuwo] API ${i + 1} 成功获取 URL (JSON)!`);
          return json.url;
        }
      } catch (e) {
        // 不是 JSON，继续
      }

    } catch (error) {
      console.log(`[Kuwo] API ${i + 1} 失败: ${error.message}`);
    }
  }

  throw new Error('所有酷我 API 都失败了');
}

// 3. 查询状态
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    data: {
      inited: !!global._initData,
      initData: global._initData,
      hasHandler: !!global._requestHandler
    }
  });
});

// 4. 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `路径未找到: ${req.url}`
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🎵 服务运行在 http://localhost:${PORT}`);
});
