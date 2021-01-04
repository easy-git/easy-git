# SSH


### 使用SSH连接到Github

[使用SSH连接到Github](https://docs.github.com/cn/free-pro-team@latest/github/authenticating-to-github/connecting-to-github-with-ssh)


### 检查现有 SSH 密钥

在生成 SSH 密钥之前，您可以检查是否有任何现有的 SSH 密钥。

1. 打开 Terminal（终端）Terminal（终端）Git Bash。
2. 输入 `ls -al ~/.ssh` 以查看是否存在现有 SSH 密钥：

```
$ ls -al ~/.ssh
```

3. 检查目录列表以查看是否已经有 SSH 公钥。 默认情况下，公钥的文件名是以下之一：

```
id_rsa.pub
id_ecdsa.pub
id_ed25519.pub
```

如果您没有现有的公钥和私钥对，或者不想使用任何可用于连接到 GitHub 的密钥对，则生成新的 SSH 密钥。


### 生成新的 SSH 密钥

1. 打开 Terminal（终端）或Git Bash。
2. 粘贴下面的文本（替换为您的 GitHub 电子邮件地址）。

```
$ ssh-keygen -t ed25519 -C "your_email@example.com"
```

注：如果您使用的是不支持 Ed25519 算法的旧系统，请使用以下命令：
```
$ ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
```

3. 提示您“Enter a file in which to save the key（输入要保存密钥的文件）”时，按 Enter 键。 这将接受默认文件位置。

```
> Enter a file in which to save the key (/Users/you/.ssh/id_ed25519): [Press enter]
```

## Git配置多个SSH-Key

当有多个git账号时，比如：

a. 一个gitee，用于公司内部的工作开发；
b. 一个github，用于自己进行一些开发活动；

解决方法

1. 生成一个公司用的SSH-Key

```
$ ssh-keygen -t rsa -C 'xxxxx@company.com' -f ~/.ssh/gitee_id_rsa
```

2. 生成一个github用的SSH-Key

```
$ ssh-keygen -t rsa -C 'xxxxx@qq.com' -f ~/.ssh/github_id_rsa
```

3. 在 ~/.ssh 目录下新建一个config文件，添加如下内容（其中Host和HostName填写git服务器的域名，IdentityFile指定私钥的路径）

```
# gitee
Host gitee.com
HostName gitee.com
PreferredAuthentications publickey
IdentityFile ~/.ssh/gitee_id_rsa
# github
Host github.com
HostName github.com
PreferredAuthentications publickey
IdentityFile ~/.ssh/github_id_rsa
```

4.用ssh命令分别测试

```
$ ssh -T git@gitee.com
$ ssh -T git@github.com
```