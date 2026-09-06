# YouTube Ad Skipper

自动跳过  广告的 Chrome 扩展和 Tampermonkey 脚本。

## 功能特性

- **自动点击跳过按钮** — 检测并自动点击 "Skip Ad" 按钮
- **广告静音** — 广告播放时自动静音，结束后恢复
- **快进不可跳过广告** — 自动快进无法跳过的广告
- **网络层屏蔽** — 通过广告域名屏蔽减少广告加载
- **统计面板** — 显示已跳过广告数量
- **一键开关** — 便捷的启用/禁用控制

## 安装方式

### 方式一：Chrome 扩展（推荐）

1. 打开 Chrome 浏览器，访问 `chrome://extensions/`
2. 开启右上角的「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择 `extension` 文件夹
5. 扩展安装完成，图标会出现在工具栏

### 方式二：Tampermonkey 脚本

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 扩展
2. 点击 Tampermonkey 图标 → 「添加新脚本」
3. 复制 `userscript/youtube-ad-skipper.user.js` 的内容
4. 粘贴并保存
5. 访问 YouTube 即可生效

## 使用说明

### Chrome 扩展

点击工具栏的扩展图标，可以：

- **启用/禁用广告跳过** — 主开关
- **自动点击跳过** — 自动点击跳过按钮
- **广告静音** — 广告播放时静音
- **快进不可跳过广告** — 自动跳过无法跳过的广告
- **查看统计** — 显示已跳过广告数量

### Tampermonkey 脚本

- 点击 Tampermonkey 图标 → 「YouTube Ad Skipper」
- 选择「启用/禁用广告跳过」或「查看统计」

## 工作原理

1. **MutationObserver** — 监听 DOM 变化，实时检测广告元素
2. **多选择器匹配** — 支持多种 YouTube 广告按钮选择器
3. **页面上下文执行** — 绕过 `event.isTrusted` 检查
4. **网络层屏蔽** — 阻止广告域名的请求

## 项目结构

```
YouTubeAdSkipper/
├── extension/              # Chrome 扩展
│   ├── manifest.json       # MV3 配置
│   ├── background.js       # Service Worker
│   ├── content.js          # 内容脚本（核心逻辑）
│   ├── popup.html/js       # 控制面板
│   ├── rules.json          # 广告屏蔽规则
│   └── icons/              # 扩展图标
├── userscript/             # Tampermonkey 脚本
│   └── youtube-ad-skipper.user.js
├── README.md
└── generate_icons.py       # 图标生成脚本
```

## 注意事项

- YouTube 会定期更新广告选择器，如果跳过功能失效，请检查更新
- 部分广告可能无法完全跳过，脚本会尝试快进
- 建议同时使用广告屏蔽扩展以获得最佳体验

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 相关项目

- [YouTube Ad Skipper (Android)](https://github.com/xiaoyudianbaba/ScreenOffDrama) - Android 息屏听剧应用
