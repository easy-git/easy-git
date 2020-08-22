easy-git, 是基于HBuilderX API开发的可视化图形Git插件，界面参考vscode源代码管理器。

## 安装

[HBuilderX easy-git插件下载地址: https://ext.dcloud.net.cn/plugin?name=easy-git](https://ext.dcloud.net.cn/plugin?name=easy-git)

Mac, 安装此插件可直接使用。

Windows需要电脑本机安装`git-bash`。[git-bash下载地址](https://git-scm.com/download/win)

## 界面预览

![插件预览.jpg](https://upload-images.jianshu.io/upload_images/1534169-4f25d36ebd7fb1f5.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

在项目管理器，选中`Git`项目，右键菜单，点击【easy-git】【源代码管理】即可打开`git视图`

![image](https://upload-images.jianshu.io/upload_images/1534169-69b263353c29a671.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

## Git仓库克隆

点击菜单【工具】【Git: 克隆仓库】，即可打开克隆界面

![Git克隆.jpg](https://upload-images.jianshu.io/upload_images/1534169-8991fce5e730e340.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


## Git文件视图

- `打开文件`, `刷新当前项目`
- `文件暂存`,`暂存所有更改`,`撤销更改`,`取消暂存` 
- `commit` 
- `pull`, `push`
- `push`
- `分支查看`,`分支切换`, `打开log`等

![image](https://upload-images.jianshu.io/upload_images/1534169-763f7e17f9fad35d.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

## 分支管理

包含：`分支切换`, `分支创建并推送`, `删除分支`, `合并分支`, `创建tag`，`分支和tag搜索`等 

点击本地分支名称，即可快速切换分支 。

![image](https://upload-images.jianshu.io/upload_images/1534169-f8305ac600f9eaa3.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

## 查看log

- 默认显示最近100条log, 如需查看更多数据，请使用-n 
- 支持搜索，多个搜索条件用逗号隔开
- 搜索条件，即git log参数

|搜索				|说明										|例子				|
|--					|--											|--					|
|--author			|按作者搜索									|--author='name'	|
|--after; --since	|搜索xx日期之后								|--after='2020-7-1'	|
|--before; --until	|搜索xx日期之前								|--before='2020-7-1'|
|-n					|仅显示最近的 n 条提交						| -n 10				|
|--grep				|用 --grep 选项搜索提交说明中的关键字		|--grep xxxx		|
| 文件名称			|按文件查看log, 直接输入文件名即可			|					|
| -S				|仅显示添加或删除内容匹配指定字符串的提交	| -S xxxx			|
|--committer		| 仅显示提交者匹配指定字符串的提交			|--committer=xxxx	|

> 更多见：[http://git-scm.com/docs/git-log](http://git-scm.com/docs/git-log)


![image](https://upload-images.jianshu.io/upload_images/1534169-ac966376406f1a07.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

## 更多功能

![image](https://upload-images.jianshu.io/upload_images/1534169-e69c95a8f7893df5.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

## 快捷键

easy-git, 支持通过快捷键打开git视图。

点击菜单【工具】【自定义快捷键】，可自定义快捷键。

```json

// 打开Git文件视图
{
    "key":"",
    "command": "EasyGit.main"
}
 
// 查看日志
{
    "key": "",
    "command": "EasyGit.log"
}

// Git克隆
{
    "key": "",
    "command": "EasyGit.clone"
}

// Git pull --rebase
{
    "key": "",
    "command": "EasyGit.pull"
}

// Git stash 储藏
{
    "key": "",
    "command": "EasyGit.stash"
}

// Git stash 储藏全部(包含未跟踪的)
{
    "key": "",
    "command": "EasyGit.stashAll"
}

// Git stash 弹出储藏
{
    "key": "",
    "command": "EasyGit.stashPop"
}

// Git stash 弹出最新储藏
{
    "key": "",
    "command": "EasyGit.stashPopNew"
}
```

## 设置

菜单【设置】【插件配置】【easy-git】功能

![image](https://upload-images.jianshu.io/upload_images/1534169-81515e8a13810d1e.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

## 目前存在的问题

注意：

- easy-git，webview引用了外部资源（`bootstrap.css`和`vue.js`），所以在`没有网络`的电脑上无法使用。
- 已适配HBuilderX 绿柔主题、酷黑主题、雅蓝主题