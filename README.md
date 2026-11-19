# MB 插件模板

用一份 JavaScript 插件和一个安装包支持 [MB](https://github.com/xTreeRoot/MB) 桌面、iOS、Android。此仓库只提供两条自制合成试听：能从首页点播，也能搜索「试听」并翻页，不需要账号或第三方 API。它不是曲库，也不会自动继承平台账号。

## 做一个自己的插件

1. 在 GitHub 点 **Use this template** 新建自己的仓库。把 `plugin.json` 的 `id`、`name`、`version` 改成自己的，接入平台后再替换 `permissions.network`。`id` 使用稳定、唯一的小写字母／数字／连字符，比如 `my-service-music`；不要在升级时改 ID。
2. 用实际平台数据替换 `index.js` 的试听目录和媒体解析。把 `test/contract.test.js` 的样例换成该平台的脱敏数据，覆盖正常播放、翻页、空结果和错误。`demo/` 是示例音频，换成真实媒体源后可以删掉。
3. 用 Node.js 20+、npm 和 `zip` 执行 `npm run package`。把 `dist/mb-plugin.zip` 装到目标客户端验证，并将**这个 ZIP**作为自己仓库的 GitHub Release 资产上传；不是 GitHub 自动生成的 Source code ZIP。Release 标签与 `plugin.json` 版本保持一致，例如 `v0.1.0` 和 `0.1.0`。

## 申请收录：必须实现什么

这是一份 **MB 社区收录基线**，不是宿主的强制清单校验；ZIP 能装上不等于符合收录要求。能公开访问的内容应能直接使用；平台确实要求账号时，见下方登录要求。

| 必做 | 交付契约 |
| --- | --- |
| 清单和同一份安装包 | ZIP 根目录放 `plugin.json`、`main` 指向的脚本及实际运行需要的资源。提供 `id`、`name`、`version`、`main`、`playback: "stream"`；需要较新宿主契约时按实测填写 `minAppVersion`。脚本使用具名 `export`。Node 只用于开发测试；运行时别依赖 Node、桌面子进程或直接读写系统文件。 |
| `search({query, kind, offset})` | 至少支持 `kind: "tracks"`，返回 `{tracks, more}`。`offset` 是从 0 开始的结果偏移，不是页号，按上次返回条数推进。无结果时返回空数组和 `more: false`，不要让分页重复或卡住。 |
| `stream({id, quality})` | 用曲目 `id` 解析当前可播放的媒体，返回 `{url, type, quality?, headers?}`。`url` 是直达媒体的 HTTPS 地址，不是详情页；`type` 必须对应真实音频格式；若返回 `quality`，用实际拿到的档位。需鉴权时返回播放必需的头；不要缓存过期签名地址或用空 URL 假装成功。 |
| 可操作的内容入口 | 实现 `home()` 返回 `{sections:[{title, tracks}]}`，或声明 `navigation` 的自定义 `page` 并在 `browse({page})` 返回可操作内容。安卓、iOS、桌面各自实测相应入口；不能用一个空页交差。 |
| 一致的数据和失败行为 | 曲目至少给 `id`、`name`、毫秒整数 `duration`。同一曲目从首页、搜索或歌单进来须使用相同且稳定的字符串 `id`；有作者、专辑和封面时返回 `artists: [{id, name}]`、`album: {id, name, imageUrl?}`。曲目的 `url` 是可选分享页，和 `stream` 的媒体地址不是同一个字段。对错误给出可读原因，不回传伪数据。 |
| 权限和实测记录 | 只允许实际用到的 API、图片和媒体域名；使用已核对的 `host` 能力及平台允许访问的资源。提交仓库、Release 和通过验证的客户端版本；未测的平台明确标「未验证」。 |

## 按平台实现：有就做完整，没有就别声明

- **视频平台**：提供 `video({id, quality}) → {url, headers?}`，视频和音频用同一个曲目 ID 并对应同一时间轴。若目标宿主支持独立视频搜索，再提供 `searchVideos({query, offset}) → {tracks, more}`；支持横版卡片的页面可在分区使用 `trackLayout: "videos"`。提供平台真实的浏览数据和可操作入口，不把普通音乐列表冒充视频页。不支持视频的宿主上，搜索和音频仍应可用。
- **平台要求登录或插件宣称支持登录**：提供 `signIn()`、`account()`、`signOut()`；为交互式登录提供 `cancelSignIn()`，取消后停止本次操作并丢弃迟到结果。支持扫码的宿主用 `host.signInPrompt({qr, text})`。凭据只通过 `host.storage` 存在本地插件数据中，不写源码、日志或发布包，也不假设社区插件有节点账号同步权限。
- **歌词、收藏、歌单和历史**：按平台实况添加，不导出空壳。`lyrics({id})` 可返回 `{lrc, translation?}` 或 `{lines:[{start,end,text,words?}]}`；结构化时间统一为毫秒。
- **兼容性**：同一个 ID、同一份 Release 包。需要分端时，按目标宿主源码验证能力和行为后在插件内部降级，不在 MB 主程序按你的插件 ID 写特判。网络、持久化和平台转换由插件负责；队列、解码和播放控制由宿主负责。

## 发布前验收

- [ ] 桌面、iOS、Android 分别用发版 ZIP 安装：能打开内容入口，搜索有/无结果，翻到下一页，能点播、切换、暂停和拖动；每端记录 MB 版本和测试结果。
- [ ] 提供视频或账号时，分别验证视频模式搜索/播放/同步，以及登录、取消、重启恢复、退出。未实测的宿主或能力不要写成已支持。
- [ ] 干净安装及同 ID 升级都通过；ZIP 无测试素材、凭据、临时数据或 `node_modules`，并可从 Release 下载。
- [ ] 申请收录时到 [MB 主仓 Issues](https://github.com/xTreeRoot/MB/issues) 提交仓库和 Release 链接、目标平台、已验证功能、已知限制及复现步骤。

接口以目标宿主源码为准：[桌面插件契约](https://github.com/xTreeRoot/MB/blob/main/plugins/README.md) · [iOS](https://github.com/xTreeRoot/MB/tree/ios/ios/Sources/MBFoundation)。模板自带的试听用固定版本的 HTTPS 地址；开发自己的插件时换成自己的平台媒体解析，不要直接把模板作为成品提交。
