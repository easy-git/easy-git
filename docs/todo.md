<!--
 * @Author: your name
 * @Date: 2020-11-02 21:20:01
 * @LastEditTime: 2020-11-02 21:50:45
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /easy-git/docs/todo.md
-->

## 文件对比视图

- 优化：文件对比，采用文件整体对比
- 优化：文件对比、有冲突的文件，滚动条打标记
- 新增：文件对比视图，增加查看日志入口
- 提供使用外部对比工具的入口

## 源代码管理器

- 文件排序
- 文件，增加右键菜单
- 当焦点、或通过tab切换到源代码管理器、日志视图，自动刷新

## 日志视图

- 右键菜单：归档

## 分支视图

- 分支合并：采用传入的更改、采用现有更改 （包含源代码管理器、文件对比）

## 克隆

- 增加用户使用说明

## 命令面板

- 优化命令面板样式
- 日志视图、源代码管理器右上角、文件对比视图，增加命令面板入口
- 归档
- 变基
- tag删除、推送
- 恢复文件到指定版本 git checkout <commit_id> <filename>
- 重置暂存区与工作区 git reset --hard
- git revert
- git reset --hard HEAD 回到上一次提交的状态