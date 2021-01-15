
easy-git, 是基于HBuilderX API开发的可视化图形Git插件，界面参考vscode源代码管理器。

## 安装

[HBuilderX easy-git插件下载地址: https://ext.dcloud.net.cn/plugin?name=easy-git](https://ext.dcloud.net.cn/plugin?name=easy-git)

Mac, 安装此插件可直接使用。

Windows需要电脑本机安装`git-bash`。[git-bash下载地址](https://git-scm.com/download/win)

## 简介

![插件预览.jpg](https://img-cdn-tc.dcloud.net.cn/uploads/article/20210104/b39599067d50eb46b12e3b280454ad1d.gif)

在项目管理器，选中`Git`项目，右键菜单，点击【easy-git】【源代码管理】即可打开`git视图`


## 数据统计

为了更好的的改进插件，上报了`当天插件是否启动`、`电脑操作系统信息（字段内容windows、mac）`。

如不希望上传如上信息, 请在【设置】【源码视图】内，增加如下字段:

```js
"EasyGit.isShareUsageData": false
```


## 设置

菜单【设置】【插件配置】【easy-git】功能

![](https://img-cdn-qiniu.dcloud.net.cn/uploads/questions/20200808/08fb87da3924ee29b723f0e5162d1377.jpg)

## `问题`

### Q1: Error: git: 'restore' is not a git command

原因：

1. `git restore` 是Git新版本`2.23` 引入的新命令。 并且`2.23`已发布近一年，所以作者使用了此命令。请升级本地Git解决此问题。


## 文档目录

1. [主页](https://easy-git.gitee.io/)
2. [插件安装](https://easy-git.gitee.io/home/install)
3. 插件设置
    - [插件设置](https://easy-git.gitee.io/setting)
    - [设置快捷键](https://easy-git.gitee.io/setting/keyboard)
    - [语音提示](https://easy-git.gitee.io/setting/voice)
4. Git 克隆/连接
    - [了解克隆](https://easy-git.gitee.io/connecting)
    - [开始克隆](https://easy-git.gitee.io/connecting/clone)
    - [初始化](https://easy-git.gitee.io/connecting/init)
5. 源代码管理器
    - [概览](https://easy-git.gitee.io/docs/file)
    - [拉取 - pull](https://easy-git.gitee.io/docs/file/pull)
    - [暂存 - add](https://easy-git.gitee.io/docs/file/add)
    - [提交 - commit](https://easy-git.gitee.io/docs/file/commit)
    - [推送 - push](https://easy-git.gitee.io/docs/file/push)
6. 日志视图
    - [概览](https://easy-git.gitee.io/docs/log)
    - [查看log详情](https://easy-git.gitee.io/docs/log/details)
    - [搜索](https://easy-git.gitee.io/docs/log/search)
7. 分支
    - [简介](https://easy-git.gitee.io/docs/refs)
    - [分支切换](https://easy-git.gitee.io/docs/refs/branch/switch)
    - [分支创建](https://easy-git.gitee.io/docs/refs/branch/create)
8. 命令面板
    - [概览](https://easy-git.gitee.io/CommandPanel)
9. 身份认证
    - [检查现有 SSH 密钥](https://easy-git.gitee.io/auth/ssh-check)
    - [生成新的 SSH 密钥](https://easy-git.gitee.io/auth/ssh-generate)
    - [Git配置多个SSH-Key](https://easy-git.gitee.io/auth/ssh-more)
    - [windows: 记住Git凭据](https://easy-git.gitee.io/auth/http)