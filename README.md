
## 前言

- `作者利用业余时间开发，维护, 下载请给个好评或收藏`
- `有问题给5星后留言可得到及时的解答`

easy-git, 是基于HBuilderX API开发的可视化图形Git插件，界面参考vscode源代码管理器。

easy-git, 支持连接Github、gitee账号，支持搜索github，支持命令面板，支持克隆、提交/更新/拉取、分支/tag管理、日志、文件对比、储藏等操作。

## 安装

[HBuilderX easy-git插件下载地址: https://ext.dcloud.net.cn/plugin?name=easy-git](https://ext.dcloud.net.cn/plugin?name=easy-git)

Mac, 安装此插件可直接使用。

Windows需要电脑本机安装`git-bash`。[git-bash下载地址](https://git-scm.com/download/win)

## 使用文档

> easy-git文档是采用的Github pages，某些地区可能无法访问，如果无法访问，修改dns试试。

[easy-git文档地址](https://easy-git.github.io/)


## 插件预览

1. 在项目管理器，选中`Git`项目，右键菜单，点击【easy-git】【源代码管理】即可打开`git视图`
2. 点击顶部菜单【工具】，即可看到easy-git相关操作菜单。

![插件预览.jpg](https://easy-git.github.io/static/intro.gif)


## 数据统计

与大多数应用一样，本插件也需要统计某些功能点的使用情况；获取数据的目的，是为了决定是否强化或下线本软件的某些功能；将来本插件趋于完善之后，将停止统计。

关于统计数据，上报了`当天插件是否启动`、`电脑操作系统信息（字段内容windows、mac）`，具体如下：

```js
{
    'viewname': "",             # 本插件某个功能名称
    'hxVersion': "",            # hx版本号
    'hxTheme': "",              # hx主题
    'pluginVersion': "",        # 本插件版本
    'osName': "",               # 操作系统
}
```

如不希望上传操作系统信息, 请在【设置】【源码视图】内，增加如下字段:

```js
"EasyGit.isShareUsageData": false
```

2022-11-27, 发布1.9.0版本。此版本已去除所有数据统计。

## easy-git历史版本

easy-git [1.5.1](https://ext-resource-aliyun.dcloud.net.cn/marketplace/6dd3ab20-d963-11ea-bde4-b179a75bf332/1.5.1/plugin.zip?v=1627393994), 可用于在HBuilderX 3.2.6以下版本使用。
