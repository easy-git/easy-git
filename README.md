# easy-git

## 简介

easy-git，是采用webview api创建的可视化图形Git工具。

注意：

- easy-git webview引用了外部资源（`bootstrap.css`和`vue.js`），所以在`没有网络`的电脑上无法使用。
- 已适配HBuilderX绿柔主题、酷黑主题、雅蓝主题

## 安装

Mac, 安装此插件可直接使用。

Windows需要电脑本机安装git-bash。[git-bash下载地址](https://git-scm.com/download/win)

在项目管理器，选中`Git`项目，右键菜单，点击【easy-git】【源代码管理】即可打开`git视图`

![](https://img-cdn-qiniu.dcloud.net.cn/uploads/questions/20200808/f0ca4bd0510bfbddeb2ba7f85d8dc114.png)

## 基础功能

- `打开文件`, `刷新当前项目`
- `文件暂存`,`暂存所有更改`,`撤销更改`,`取消暂存` 
- `commit` 
- `pull`, `push`
- `push`
- `分支查看`,`分支切换`, `打开log`等

![](https://img-cdn-qiniu.dcloud.net.cn/uploads/questions/20200808/d342084a4516c60bf0f2b2035954c769.jpg)

## 分支管理

包含：`分支切换`, `分支创建并推送`, `删除分支`, `合并分支`, `创建tag`等 

![](https://img-cdn-qiniu.dcloud.net.cn/uploads/questions/20200808/10df7f3442c244b05bd8e3e2d5458726.jpg)

## 查看log

- c默认显示最近100条log
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


![](https://img-cdn-qiniu.dcloud.net.cn/uploads/questions/20200808/e4213df52a4faf5e3d3f43a673e1c42c.jpg)

## 更多功能

![](https://img-cdn-qiniu.dcloud.net.cn/uploads/questions/20200808/fd89625651fd15be3b3c3596c73a396c.jpg)

## 快捷键

easy-git, 支持通过快捷键打开git视图。

点击菜单【工具】【自定义快捷键】，可自定义快捷键。

```json
{
    "key":"",
    "command": "extension.EasyGitMain"
}
```

## 设置

菜单【设置】【插件配置】【easy-git】功能

![](https://img-cdn-qiniu.dcloud.net.cn/uploads/questions/20200808/08fb87da3924ee29b723f0e5162d1377.jpg)