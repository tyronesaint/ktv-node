# 🚀 Vercel 部署指南

## 方法一：通过 GitHub 部署（推荐）⭐⭐⭐⭐⭐

### 步骤 1：推送到 GitHub

```bash
# 初始化 Git 仓库（如果还没有）
cd lx-music-node
git init
git add .
git commit -m "初始化项目"

# 推送到 GitHub
git branch -M main
git remote add origin https://github.com/你的用户名/lx-music-node.git
git push -u origin main
```

### 步骤 2：在 Vercel 部署

1. 访问 [vercel.com](https://vercel.com)
2. 注册/登录（可以用 GitHub 账号）
3. 点击 **"Add New..."** → **"Project"**
4. 选择 `lx-music-node` 仓库
5. 点击 **"Deploy"** 按钮
6. 等待 2-3 分钟

### 步骤 3：获取访问地址

部署成功后，你会得到一个免费域名：
```
https://lx-music-node-xxxxx.vercel.app
```

---

## 方法二：通过 Vercel CLI 部署

### 步骤 1：安装 Vercel CLI

```bash
npm install -g vercel
```

### 步骤 2：登录

```bash
vercel login
```

### 步骤 3：部署

```bash
cd lx-music-node
vercel
```

按照提示操作：
- ? Set up and deploy "~/lx-music-node"? [Y/n] `Y`
- ? Which scope do you want to deploy to? `选择你的账号`
- ? Link to existing project? [y/N] `N`
- ? What's your project's name? `lx-music-node`
- ? In which directory is your code located? `./`
- ? Want to override the settings? [y/N] `N`

### 步骤 4：确认部署

部署完成后，你会看到：
```
✅ Production: https://lx-music-node-xxxxx.vercel.app
```

---

## 方法三：直接上传代码（最快）⭐⭐⭐⭐⭐

### 步骤 1：准备代码

确保 `lx-music-node` 文件夹包含以下文件：
```
lx-music-node/
├── server.js          ← 主程序
├── package.json       ← 依赖配置
├── vercel.json        ← Vercel 配置
├── public/
│   └── index.html     ← Web 界面
└── node_modules/      ← 依赖（可选，Vercel 会自动安装）
```

### 步骤 2：压缩文件

```bash
cd lx-music-node
zip -r lx-music-node.zip . -x "node_modules/*" ".git/*"
```

### 步骤 3：上传部署

1. 访问 [vercel.com/new](https://vercel.com/new)
2. 选择 **"Upload a project"**（或者"导入"标签页）
3. 拖拽 `lx-music-node.zip` 到上传区域
4. 填写项目名称：`lx-music-node`
5. 点击 **"Deploy"**
6. 等待 2-3 分钟

---

## ✅ 部署成功后

### 1. 访问你的应用

```
https://lx-music-node-你的用户名.vercel.app
```

### 2. 测试 API

#### 加载音源脚本
```bash
curl -X POST https://你的域名.vercel.app/api/load \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://raw.githubusercontent.com/pdone/lx-music-source/main/ikun/latest.js"
  }'
```

#### 获取音乐链接
```bash
curl -X POST https://你的域名.vercel.app/api/music/url \
  -H 'Content-Type: application/json' \
  -d '{
    "source": "kw",
    "musicInfo": {
      "songmid": "MUSIC_12345",
      "name": "演员",
      "singer": "薛之谦"
    },
    "quality": "128k"
  }'
```

---

## 💰 完全免费

Vercel 免费额度：
- ✅ 100GB 带宽/月
- ✅ 6000 分钟构建时间/月
- ✅ 无限项目
- ✅ 自动 HTTPS
- ✅ 全球 CDN
- ✅ 无需信用卡

---

## 🔄 自动部署

如果通过 GitHub 部署：
- 每次推送代码到 GitHub
- Vercel 自动重新部署
- 通常 1-2 分钟完成

---

## 🛠️ 配置说明

### vercel.json 配置

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ]
}
```

- `builds`: 告诉 Vercel 使用 Node.js 运行时
- `routes`: 将所有请求路由到 server.js

---

## 🎯 推荐方案

**方法一（GitHub 部署）** 或 **方法三（直接上传）**

如果你有 GitHub 账号 → 方法一
如果你不想用 GitHub → 方法三

都是 5 分钟搞定，完全免费！

---

## 🆘 常见问题

### Q: 部署失败怎么办？
A: 检查 Vercel 部署日志，通常是因为：
- 缺少 `package.json`
- 缺少 `start` 脚本
- 端口配置错误（Vercel 自动处理，无需修改）

### Q: 可以修改域名吗？
A: 可以！在 Vercel 项目设置中添加自定义域名

### Q: 免费额度用完了怎么办？
A: 个人测试完全够用，如果用完了可以考虑：
- 创建新账号
- 升级到 Pro（$20/月）

---

**需要我帮你处理部署中的任何问题吗？** 🚀
