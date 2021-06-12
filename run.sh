#!/bin/bash

hxVersion="HBuilderX.app"

if [ "$1" == "release" ];then
    hxVersion='HBuilderX.app'
fi

if [ "$1" == "alpha" ];then
    hxVersion='HBuilderX-Alpha.app'
fi

cli_dir="/Applications/$hxVersion/Contents/MacOS/"
plugin_dir="/Applications/$hxVersion/Contents/HBuilderX/plugins/"
easyGitSourceDir="$HOME/Github/easy-git"

# 杀死相关进程
ps -ef | grep $hxVersion | grep -v grep | awk '{print $3}' | xargs kill -9

# 复制插件
cd $easyGitSourceDir && rm -rf easy-git.zip
zip -q -r easy-git.zip . -x /.git/* /src/common/mix.source.js /src/common/oauth.source.js /run.sh /tar.sh /.editorconfig /.gitignore /.gitattributes
cp easy-git.zip $plugin_dir
cd $plugin_dir && rm -rf easy-git && unzip -q easy-git.zip -d easy-git

# 重新启动
$cli_dir"cli" open
