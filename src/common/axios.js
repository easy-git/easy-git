const axios = require('axios');

/**
 * @description axios post请求
 */
function axiosPost(url, params = {}, customHeader = {}) {
    let headers = {
        "Accept": "application/json",
        "content-type": "application/json"
    };
    if (JSON.stringify(customHeader) != "{}") {
        headers = Object.assign(headers, customHeader);
    };
    const instance = axios.create({
        timeout: 20000,
        headers: headers
    });
    return new Promise((resolve, reject) => {
        instance.post(url, params).then((res) => {
            resolve(res.data);
        }).catch((err) => {
            if (err.response) {
                console.error("[easy-git] axios request ::", err.response.data, err.response.status);
                reject(err.response.data);
            } else {
                if (err.code == 'ECONNABORTED') {
                    reject("ETIMEDOUT");
                } else {
                    reject("fail");
                };
            };
        });
    }).catch((error) => {
        return error;
    });
};

/**
 * @description  axios get请求
 * @param {Object} url
 */
function axiosGet(url, headers={}) {
    const instance = axios.create({
        timeout: 5000,
        headers: headers
    });
    return new Promise((resolve, reject) => {
        instance.get(url).then((res) => {
            resolve(res.data);
        }).catch((err) => {
            reject("fail");
        });
    }).catch((error) => {
        return error;
    });
};


module.exports = {
    axiosGet,
    axiosPost
}
