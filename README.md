easy-git, 是基于HBuilderX API开发的可视化图形Git插件，界面参考vscode源代码管理器。

## 安装

[HBuilderX easy-git插件下载地址: https://ext.dcloud.net.cn/plugin?name=easy-git](https://ext.dcloud.net.cn/plugin?name=easy-git)

Mac, 安装此插件可直接使用。

Windows需要电脑本机安装`git-bash`。[git-bash下载地址](https://git-scm.com/download/win)

## 界面预览

![插件预览.jpg](https://img-cdn-qiniu.dcloud.net.cn/uploads/questions/20200823/01e5e92f365f34d11460574ceaad7b91.jpg)

在项目管理器，选中`Git`项目，右键菜单，点击【easy-git】【源代码管理】即可打开`git视图`

![](https://img-cdn-qiniu.dcloud.net.cn/uploads/questions/20200808/f0ca4bd0510bfbddeb2ba7f85d8dc114.png)

## Git仓库克隆

点击菜单【工具】【Git: 克隆仓库】，即可打开克隆界面

![Git克隆.jpg](https://img-cdn-qiniu.dcloud.net.cn/uploads/questions/20200823/a275dd462d976ea98f4024e8589a1e1e.jpg)


## Git文件视图

- `打开文件`, `刷新当前项目`
- `文件暂存`,`暂存所有更改`,`撤销更改`,`取消暂存` 
- `commit` 
- `pull`, `push`
- `push`
- `分支查看`,`分支切换`, `打开log`等

![](https://img-cdn-qiniu.dcloud.net.cn/uploads/questions/20200808/d342084a4516c60bf0f2b2035954c769.jpg)


## 分支管理

包含：`分支切换`, `分支创建并推送`, `删除分支`, `合并分支`, `创建tag`，`分支和tag搜索`等 

点击本地分支名称，即可快速切换分支 。

![](https://img-cdn-qiniu.dcloud.net.cn/uploads/questions/20200808/10df7f3442c244b05bd8e3e2d5458726.jpg)

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

![](https://img-cdn-qiniu.dcloud.net.cn/uploads/questions/20200808/08fb87da3924ee29b723f0e5162d1377.jpg)

## 更多功能

![image](https://img-cdn-qiniu.dcloud.net.cn/uploads/questions/20200823/0761a4b004cccaf8b9daa9bbe7bbbeb9.png)

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

// Git stash 删除所有储藏
{
    "key": "",
    "command": "EasyGit.stashClear"
}
```

## 设置

菜单【设置】【插件配置】【easy-git】功能

![](https://img-cdn-qiniu.dcloud.net.cn/uploads/questions/20200808/08fb87da3924ee29b723f0e5162d1377.jpg)

## 目前存在的问题

注意：

- easy-git，webview引用了外部资源（`bootstrap.css`和`vue.js`），所以在`没有网络`的电脑上无法使用。
- 已适配HBuilderX 绿柔主题、酷黑主题、雅蓝主题