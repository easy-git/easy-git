/**
 * @description 比较版本号
 * @param {Object} a
 * @param {Object} b
 */
function cmp_hx_version(a, b) {
    let i = 0;
    const arr1 = a.split('.');
    const arr2 = b.split('.');
    while (true) {
        const s1 = arr1[i];
        const s2 = arr2[i++];
        if (s1 === undefined || s2 === undefined) {
            return arr2.length - arr1.length;
        }
        if (s1 === s2) continue;
        return s2 - s1;
    }
};


module.exports = {
    cmp_hx_version
}