## Q1: 中文乱码

```
# git status 中文乱码
git config --global core.quotepath false

# 设置commit信息utf-8编码
git config --global i18n.logoutputencoding utf-8

# 设置输出 log utf-8 编码
git config --global i18n.commitencoding utf-8 
```

## Q2: 每次输入账号密码

```
git config credential.helper store
```

## Q3: Windows: 关于 CRLF 问题的通常做法

```
git config --global core.autocrlf true
```

## Q4: Win Git Bash 启用 http/https 协议时设置

```
git config --global credential.helper wincred
```

## Q5: 设置大小写敏感，保持 Mac/Win/Linux一致性

```
git config --global core.ignorecase false
```
