# LX Music 音源测试工具

基于洛雪音乐（LX Music）音源脚本机制的测试工具，支持 Node.js 运行环境。

## 功能特性

- 🔍 **歌曲搜索**：支持酷我音乐关键词搜索
- 🎵 **音源测试**：加载并测试洛雪音乐音源脚本
- 🔗 **URL 获取**：获取音乐播放链接
- 📝 **实时日志**：详细的操作日志显示
- 🌐 **跨域解决**：服务端运行，无跨域限制

## 快速开始

### 本地运行

1. 安装依赖：
```bash
cd lx-music-node
pnpm install
```

2. 启动服务：
```bash
node server.js
```

3. 访问界面：
打开浏览器访问 `http://localhost:5000`

### 部署到 Vercel

1. 安装 Vercel CLI：
```bash
npm install -g vercel
```

2. 登录 Vercel：
```bash
vercel login
```

3. 部署：
```bash
vercel
```

## 使用说明

### 1. 加载音源脚本

在界面中选择音源并点击"加载脚本"按钮，或者手动输入脚本URL。

### 2. 搜索歌曲

在搜索框中输入关键词（如：周杰伦、晴天等），选择音源平台（目前仅支持酷我音乐 kw），点击"搜索"按钮。

### 3. 选择歌曲

从搜索结果中点击选择一首歌曲，歌曲信息会自动填充到表单中。

### 4. 获取播放链接

点击"获取URL"按钮，系统会调用音源脚本获取音乐播放链接。

## 支持的音源

目前支持以下音源（需要加载对应脚本）：

- **kw**：酷我音乐（支持搜索）
- 更多音源正在开发中...

## 技术栈

- **后端**：Node.js + Express
- **前端**：原生 HTML + CSS + JavaScript
- **API**：酷我音乐搜索 API

## 注意事项

1. 音源脚本需要从 GitHub 下载，首次加载可能需要几秒钟
2. 如果 GitHub 访问慢，会自动使用 ghproxy.net 代理
3. 搜索功能目前仅支持酷我音乐
4. 获取播放链接需要先加载对应的音源脚本

## 项目结构

```
lx-music-node/
├── server.js              # 后端服务
├── public/
│   └── index.html         # 前端界面
├── vercel.json           # Vercel 部署配置
└── package.json          # 项目配置
```

## 许可证

MIT License

## 相关资源

- [洛雪音乐](https://github.com/lyswhut/lx-music-desktop)
- [洛雪音乐音源脚本](https://github.com/pdone/lx-music-source)
