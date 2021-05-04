#!/bin/bash

cli_dir="/Applications/HBuilderX.app/Contents/MacOS/"
plugin_dir="/Applications/HBuilderX.app/Contents/HBuilderX/plugins/"
easyGitSourceDir="/Users/xiaohutu/Github/easy-git"

# 杀死相关进程
ps -ef | grep HBuilderX.app | grep -v grep | awk '{print $3}' | xargs kill -9

# 复制插件
cd $easyGitSourceDir && rm -rf easy-git.zip
zip -r easy-git.zip . -x /.git/* /src/common/mix.source.js /src/common/oauth.source.js /run.sh /tar.sh /.gitignore /.gitattributes
cp easy-git.zip $plugin_dir
cd $plugin_dir && rm -rf easy-git && unzip easy-git.zip -d easy-git

# 重新启动
$cli_dir"cli" open
