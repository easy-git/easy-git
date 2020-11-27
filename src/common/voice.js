const {
    exec
} = require('child_process');

const os = require('os');
const osName = os.platform();

const hx = require('hbuilderx');

let config = hx.workspace.getConfiguration();
let VoiceBroadcast = config.get('EasyGit.VoiceBroadcast');
let VoiceBroadcastLanguage = config.get('EasyGit.VoiceBroadcastLanguage');


const voiceData = {
    "pull": "代码拉取成功",
    "push.success": "代码推送成功 你是最棒的",
    "merge.conflict": "我的天啊 合并代码出现了冲突 同志快醒醒吧",
    "branch.switch.success": "分支切换成功"
};


async function getUserSetting() {

};

async function voiceSay(actionType, otherText = '') {
    if (!VoiceBroadcast) {
        return;
    };

    if (osName != 'darwin' || actionType == undefined || actionType == '') {
        return;
    };

    if (voiceData[actionType] == undefined) {
        return;
    };

    let cmd = "say " + voiceData[actionType] + otherText;
    if (VoiceBroadcastLanguage == '粤语') {
        cmd = "say --voice=Sin-ji " + voiceData[actionType] + otherText;
    };
    
    exec(cmd, function(error, stdout, stderr) {});
};

module.exports = voiceSay;
