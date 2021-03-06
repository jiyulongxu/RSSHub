const axios = require('../../utils/axios');
const config = require('../../config');

const cacheLength = 5;
const cacheDays = 30;

module.exports = async (ctx) => {
    const { type = 'release', device } = ctx.params;
    const releaseType = type === 'release' ? 'F' : 'X';
    const localeTypeName = type === 'release' ? '稳定版' : '开发版';
    const cacheName = `RSSHubMIUIUpdate|${device}|${releaseType}`;

    const response = await axios({
        method: 'get',
        baseURL: 'http://update.miui.com',
        url: '/updates/miota-fullrom.php',
        headers: {
            'User-Agent': config.ua,
        },
        params: {
            d: device,
            b: releaseType,
            r: 'cn',
            l: 'zh_CN',
            n: '',
        },
    });

    const responseData = response.data;
    let oldPosts = [];
    try {
        oldPosts = JSON.parse(await ctx.cache.get(cacheName));
    } catch (_e) {
        /** no need handle here: parseError */
    }

    let item = oldPosts;

    if (oldPosts.length === 0 || oldPosts[0].description !== responseData.LatestFullRom.filename) {
        item = [
            {
                title: `${device} 有新的 ${localeTypeName}本: ${responseData.LatestFullRom.version}`,
                guid: responseData.LatestFullRom.md5,
                description: responseData.LatestFullRom.filename,
                link: responseData.LatestFullRom.descriptionUrl,
            },
            ...oldPosts,
        ];

        await ctx.cache.set(cacheName, item.slice(0, cacheLength), cacheDays * 24 * 60 * 60);
    }

    ctx.state.data = {
        title: `MIUI 更新 - ${device} - ${type === 'release' ? '稳定版' : '开发版'}`,
        link: 'http://www.miui.com/download.html',
        item,
    };
};
