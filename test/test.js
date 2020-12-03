const git = require('simple-git');


/**
 * @description 获取git文件列表
 * @param {String} workingDir Git工作目录
 */
async function gitFileList(workingDir) {
    try {
        let data = {
            'msg': 'success',
            'conflicted_list': [],
            'staged_list': [],
            'not_staged_list': []
        };
        await git(workingDir).raw(['status', '-s', '-u'])
            .then((res) => {
                let files = res.split('\n');
                for (let s of files) {
                    if (s != '') {
                        let tag = s.slice(0,2);
                        let fpath = s.slice(3);
                        if (tag == 'UU' || tag == 'AA') {
                            data.conflicted_list.push({'tag': 'C', 'path': fpath})
                        }else if (tag.slice(0,1) == ' ' || tag == '??') {
                            data.not_staged_list.push({'tag': tag.trim(), 'path': fpath})
                        } else if (tag.slice(1,2) == ' ') {
                            data.staged_list.push({'tag': tag.trim(), 'path': fpath})
                        }
                    };
                };
            })
            .catch((err) => {
                data.msg = 'error';
            });
    } catch (e) {
        data.msg = 'error';
    };
    return data;
};

gitRaw();


let b = "12344";

// console.log(b.slice(0,1))
