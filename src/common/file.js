const hx = require('hbuilderx');
const fs = require('fs');
const path = require('path');

/**
 * @description 获取hx编辑器的路径
 * @param {Object} parm
 */
function getPath(parm) {
    var fsPath, workspaceFolder, currentDir;
    try {
        try {
            fsPath = parm.document.uri.fsPath;
            workspaceFolder = parm.document.workspaceFolder.uri.fsPath;
        } catch (e) {
            fsPath = parm.fsPath;
            workspaceFolder = parm.workspaceFolder.uri.fsPath;
        }
        let state = fs.statSync(fsPath);
        if (state.isFile()) {
            currentDir = path.dirname(fsPath);
        } else {
            currentDir = fsPath;
        };
    } catch (e) {
        hx.window.showErrorMessage('插件运行异常' + e);
        return {
            fsPath,
            workspaceFolder,
            currentDir
        };
    }
    return currentDir
};

/**
 * @description 创建文件
 * @param {Object} args
 * @returns {String} exist(已存在) | fail(失败) | success(成功)
 */
async function create(args) {
    let currentDir = '';

    // param: 焦点在项目管理器、编辑器时，获取的文件信息
    let { filename, projectPath, param, isOpenFile } = args;

    // isOpenFile==undefined时,自动打开文件
    if (isOpenFile == undefined) {
        isOpenFile = true;
    };

    if (param != undefined && projectPath == undefined) {
       currentDir = getPath(param);
    };
    if (projectPath != undefined) {
        currentDir = projectPath;
    };

    // template path
    let template_path = path.join(path.resolve(__dirname, '..'), 'template', filename.slice(1));

    // target path
    let target_path = path.join(currentDir, filename);
    if (fs.existsSync(target_path)) {
        if (isOpenFile) {
            hx.workspace.openTextDocument(target_path);
        };
        return "exist";
    };

    // copy file to target dir
    return new Promise((resolve, reject) => {
        fs.copyFile(template_path, target_path, (err) => {
            if (err) {
                hx.window.showErrorMessage(filename + '创建失败!');
                reject('fail');
            } else {
                if (isOpenFile) {
                    hx.workspace.openTextDocument(target_path);
                };
                resolve('success');
            };
        });
    });
};

/**
 * @description 创建.gitignore
 */
function gitignore(args) {
    if (args == null) {
        return hx.window.showErrorMessage('easy-git: 请在项目管理器选中项目后再试。', ['我知道了']);
    };
    let {projectPath} = args;
    let data = Object.assign({'param': args},{
        'filename': '.gitignore',
        'projectPath': projectPath
    });
    create(data);
};


/**
 * @description 用于在项目管理器选中文件或编辑器存在已打开的文件时
 * @description 创建.gitattributes
 */
function gitattributes(args) {
    if (args == null) {
        return hx.window.showErrorMessage('easy-git: 请在项目管理器选中项目后再试。', ['我知道了']);
    };
    let {projectPath} = args;
    let data = Object.assign({'param': args},{
        'filename': '.gitattributes',
        'projectPath': projectPath
    });
    create(data);
};


/**
 * @description 文件删除
 */
async function remove(filepath,filename) {
    let status = hx.window.showErrorMessage(`确定要删除${filename}吗？删除后无法恢复!`,['确定删除','取消']).then((result) => {
        if (result == '确定删除') {
            try {
                fs.unlinkSync(filepath)
                hx.window.setStatusBarMessage(`${filename}删除成功!`,5000,'info');
                return true;
            } catch(err) {
                hx.window.setStatusBarMessage(`${filename}删除失败!`,5000,'error');
                return false;
            };
        };
    })
    return status;
};

/**
 * @description 文件夹清空
 */
function deleteFolderRecursive(path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function(file,
            index) {
            var curPath = path + "/" + file;
            if (fs.lstatSync(curPath).isDirectory()) {
                deleteFolderRecursive(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};

module.exports = {
    create,
    remove,
    gitignore,
    gitattributes
}
