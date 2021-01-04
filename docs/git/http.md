
如果您 使用 HTTPS 克隆 GitHub 仓库，您可以使用凭据小助手告诉 Git 记住您的凭据。


## Windows: 在 Git 中缓存 GitHub 凭据

使用 Windows 版 Git 时，在命令行中运行以下内容将存储凭据：

```
$ git config --global credential.helper wincred
```

## Mac: 在 Git 中缓存 GitHub 凭据

[osxkeychain](https://docs.github.com/cn/free-pro-team@latest/github/using-git/caching-your-github-credentials-in-git)

提示：

- 您需要 Git 1.7.10 或更高版本才能使用 osxkeychain 凭据小助手。
- 如果您使用 Homebrew 安装了 Git，则已经安装了 osxkeychain 助手。
- 如果您运行 Mac OS X 10.7 及更高版本，并且通过 Apple 的 Xcode 命令行工具安装了 Git，则 osxkeychain 助手自动包含在您的 Git 安装中。

安装 Git 和 osxkeychain 助手并告诉 Git 使用它。

1. 核实是否已安装 Git 和 osxkeychain 助手：

```
$ git credential-osxkeychain
# Test for the cred helper
> Usage: git credential-osxkeychain <get|store|erase>
```

2.如果 osxkeychain helpper 尚未安装，而您使用的是 OS X 10.9 或更高版本，您的计算机会提示您将其下载为 Xcode Command Line 工具的一部分：

```
$ git credential-osxkeychain
 > xcode-select: note: no developer tools were found at '/Applications/Xcode.app',
 > requesting install. Choose an option in the dialog to download the command line developer tools.
```

或者，您也可以使用 Homebrew 安装 Git 和 osxkeychain helper：

```
$ brew install git
```

3. 使用 global credential.helper config 指示 Git 使用 osxkeychain helper：

```
$ git config --global credential.helper osxkeychain
# Set git to use the osxkeychain credential helper
```

下次克隆需要身份验证的 HTTPS URL 时，Git 会提示您输入用户名和密码。

验证成功后，您的凭据存储在 macOS 密钥链中，每次克隆 HTTPS URL 时都会使用。 除非更改凭据，否则无需在 Git 中再次键入凭据。

