# 生日纪念网站 · 项目架构

## 📁 项目目录结构

```
birthday-website/
│
├── app.py                      # Flask 应用主入口
├── config.py                   # 配置文件（密码、内容配置）
├── requirements.txt            # Python 依赖
│
├── data/                       # 数据/内容配置
│   ├── content.json            # 所有页面的文字内容
│   ├── timeline.json           # 时间线数据
│   └── secrets.json            # 密码和彩蛋配置
│
├── static/                     # 静态资源
│   ├── css/
│   │   ├── base.css            # 全局样式、CSS变量、字体
│   │   ├── components.css      # 可复用组件样式
│   │   ├── intro.css           # 开场页样式
│   │   ├── timeline.css        # 时间线页样式
│   │   ├── moments.css         # 故事放大页样式
│   │   ├── letter.css          # 信件页样式
│   │   ├── secret.css          # 彩蛋页样式
│   │   └── ending.css          # 结尾页样式
│   │
│   ├── js/
│   │   ├── main.js             # 主逻辑、页面切换
│   │   ├── intro.js            # 对话交互逻辑
│   │   ├── timeline.js         # 滚动触发逻辑
│   │   ├── moments.js          # 卡片翻转/展开逻辑
│   │   ├── letter.js           # 分段展示逻辑
│   │   └── secret.js           # 密码验证逻辑
│   │
│   ├── images/                 # 图片资源
│   │   ├── photos/             # 你们的照片
│   │   └── icons/              # 图标素材
│   │
│   └── fonts/                  # 自定义字体（可选）
│
├── templates/                  # HTML 模板
│   ├── base.html               # 基础模板
│   ├── index.html              # 主页面（单页应用容器）
│   └── pages/                  # 各页面片段
│       ├── intro.html          # 1. 开场页
│       ├── timeline.html       # 2. 时间线页
│       ├── moments.html        # 3. 故事放大页
│       ├── letter.html         # 4. 信件页
│       ├── secret.html         # 5. 彩蛋页一
│       ├── playful.html        # 6. 彩蛋页二
│       └── ending.html         # 7. 结尾页
│
└── utils/                      # 工具函数
    └── helpers.py              # 辅助函数
```

## 🎯 技术选型

| 层级 | 技术 | 说明 |
|------|------|------|
| 后端 | Flask | 轻量级，适合小型项目 |
| 前端 | HTML + CSS + Vanilla JS | 纯原生，无框架依赖 |
| 数据 | JSON 文件 | 简单易改，无需数据库 |
| 部署 | 可选 Vercel / Railway / 本地 | 灵活部署 |

## 📄 页面路由设计

| 路由 | 说明 | 方法 |
|------|------|------|
| `/` | 主页面（SPA 容器） | GET |
| `/api/chat` | 对话交互接口 | POST |
| `/api/verify-password` | 密码验证接口 | POST |
| `/api/content/<page>` | 获取页面内容 | GET |

---

## 情绪节奏与页面对应

```
好奇 → 参与 → 回忆 → 共鸣 → 轻松 → 落点
  │      │      │      │      │      │
开场页  开场页  时间线  信件页  彩蛋页  结尾页
        ↓      ↓
      故事放大页
```
