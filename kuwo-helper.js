// 酷我音乐 URL 获取工具
// 直接调用酷我音乐 API，不需要音源脚本

const axios = require('axios');
const https = require('https');

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

/**
 * 获取酷我音乐播放 URL
 * @param {string} musicRid - 音乐 ID (如: 728677)
 * @param {string} quality - 音质 (128k/320k/flac)
 * @returns {Promise<string>} 播放 URL
 */
async function getKuwoMusicUrl(musicRid, quality = '128k') {
  try {
    // 酷我音乐获取 URL 的 API
    const format = quality === 'flac' ? 'flac' : 'mp3';
    const bitrate = quality === '128k' ? 128 : (quality === '320k' ? 320 : 999);

    const url = `http://nmobi.kuwo.cn/mobi.s?f=kuwo&q=${encodeURIComponent(
      JSON.stringify({
        rid: musicRid,
        format: format,
        bitrate: bitrate
      })
    )}`;

    console.log(`[Kuwo] 请求 URL: ${url}`);

    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    console.log(`[Kuwo] 响应状态: ${response.status}`);
    console.log(`[Kuwo] 响应数据: ${response.data}`);

    // 解析响应
    if (response.data && response.data.url) {
      return response.data.url;
    }

    throw new Error('未找到播放 URL');
  } catch (error) {
    console.error('[Kuwo] 获取 URL 失败:', error.message);
    throw error;
  }
}

// 测试
if (require.main === module) {
  const musicId = process.argv[2] || '728677';
  const quality = process.argv[3] || '128k';

  console.log(`[测试] 获取酷我音乐 URL: ID=${musicId}, 音质=${quality}`);

  getKuwoMusicUrl(musicId, quality)
    .then(url => {
      console.log('\n✅ 成功获取 URL:');
      console.log(url);
    })
    .catch(error => {
      console.error('\n❌ 获取失败:', error.message);
      process.exit(1);
    });
}

module.exports = { getKuwoMusicUrl };
