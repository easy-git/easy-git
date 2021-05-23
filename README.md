
## `作者利用业余时间开发，维护, 下载请给个好评或收藏`

## `有问题给5星后留言可得到及时的解答`

easy-git, 是基于HBuilderX API开发的可视化图形Git插件，界面参考vscode源代码管理器。

easy-git, 支持连接Github、gitee账号，支持搜索github，支持命令面板，支持克隆、提交/更新/拉取、分支/tag管理、日志、文件对比、储藏等操作。

## 安装

[HBuilderX easy-git插件下载地址: https://ext.dcloud.net.cn/plugin?name=easy-git](https://ext.dcloud.net.cn/plugin?name=easy-git)

Mac, 安装此插件可直接使用。

Windows需要电脑本机安装`git-bash`。[git-bash下载地址](https://git-scm.com/download/win)

## 简介

![插件预览.jpg](https://easy-git.github.io/static/intro.gif)

1. 在项目管理器，选中`Git`项目，右键菜单，点击【easy-git】【源代码管理】即可打开`git视图`
2. 点击顶部菜单【工具】，即可看到easy-git相关操作菜单。

## 数据统计

与大多数应用一样，本插件也需要统计某些功能点的使用情况；获取数据的目的，是为了决定是否强化或下线本软件的某些功能；将来本插件趋于完善之后，将停止统计。

关于统计数据，上报了`当天插件是否启动`、`电脑操作系统信息（字段内容windows、mac）`。

如不希望上传操作系统信息, 请在【设置】【源码视图】内，增加如下字段:

```js
"EasyGit.isShareUsageData": false
```


## 设置

菜单【设置】【插件配置】【easy-git】功能

更多介绍见：[插件设置](https://easy-git.github.io/setting/)

## `问题`

### Q1: Error: git: 'restore' is not a git command

原因：

1. `git restore` 是Git新版本`2.23` 引入的新命令。 并且`2.23`已发布近一年，所以作者使用了此命令。请升级本地Git解决此问题。


## 文档目录

1. [主页](https://easy-git.github.io/)
2. [插件安装](https://easy-git.github.io/home/install)
3. [OAuth授权](https://easy-git.github.io/oauth)
4. 插件设置
 - [插件设置](https://easy-git.github.io/setting)
 - [设置快捷键](https://easy-git.github.io/setting/keyboard)
 - [语音提示](https://easy-git.github.io/setting/voice)
 - [自动刷新](https://easy-git.github.io/setting/autoRefresh)
5. Git 克隆/连接
 - [前言](https://easy-git.github.io/connecting)
 - [开始克隆](https://easy-git.github.io/connecting/clone)
 - [搜索Github存储库](https://easy-git.github.io/connecting/github-search)
 - [初始化](https://easy-git.github.io/connecting/init)
6. 源代码管理器
 - [概览](https://easy-git.github.io/docs/file)
 - [拉取 - pull](https://easy-git.github.io/docs/file/pull)
 - [提交 - commit](https://easy-git.github.io/docs/file/commit)
 - [推送 - push](https://easy-git.github.io/docs/file/push)
 - [暂存 - add](https://easy-git.github.io/docs/file/add)
 - [取消暂存 - restore](https://easy-git.github.io/docs/file/cancel_add)
 - [撤销修改 - restore](https://easy-git.github.io/docs/file/cancel_change)
7. 储藏 (stash)
 - [储藏](https://easy-git.github.io/docs/stash/stash)
 - [弹出储藏](https://easy-git.github.io/docs/stash/pop)
 - [查看储藏](https://easy-git.github.io/docs/stash/show)
8. 日志视图
 - [概览](https://easy-git.github.io/docs/log)
 - [查看log详情](https://easy-git.github.io/docs/log/details)
 - [搜索](https://easy-git.github.io/docs/log/search)
9. 分支/标签
 - [简介](https://easy-git.github.io/docs/refs)
 - [分支切换](https://easy-git.github.io/docs/refs/branch/switch)
 - [分支创建](https://easy-git.github.io/docs/refs/branch/create)
 - [标签创建 - tag](https://easy-git.github.io/docs/refs/tag/create)
10. 命令面板
 - [概览](https://easy-git.github.io/CommandPanel)
11. Git技巧
 - [查看当前行最后一次修改信息](https://easy-git.github.io/docs/blame)
 - [用提交信息标注文件中的每一行](https://easy-git.github.io/docs/annotate)
 - [查看文件的某个历史版本内容](https://easy-git.github.io/docs/fileHistory)
12. 身份认证
 - [生成新的 SSH 密钥](https://easy-git.github.io/auth/ssh-generate)
 - [检查现有 SSH 密钥](https://easy-git.github.io/auth/ssh-check)
 - [Git配置多个SSH-Key](https://easy-git.github.io/auth/ssh-more)
 - [windows: 记住Git凭据](https://easy-git.github.io/auth/http)
13. 问题
 - [Q1: 中文乱码问题](https://easy-git.github.io/question/quote)

## 赞助

如果您觉得easy-git帮到了您，请小小的打个赏赞助一下，让我们全力以赴，做更好的工具！

![](https://easy-git.github.io/static/pay.png)