/*global chrome*/

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

import { w } from './utils';

import { PLATFORM, FILE_RULE, OUT_DIR, ResourceType, WECHAT_HEADERS, WECHAT_URLS } from './const';
import { readSrcJson } from './utils';

export class Make {
    platform: PLATFORM = PLATFORM.chrome;
    manifest: chrome.runtime.ManifestV3 = readSrcJson('./manifest.json');

    outDir: string = '';

    constructor(platform: PLATFORM = PLATFORM.chrome) {
        this.platform = platform;
        this.outDir = OUT_DIR(this.platform);

        if (fs.existsSync(this.outDir)) {
            fs.rmSync(this.outDir, { recursive: true, force: true });
        }
        fs.mkdirSync(this.outDir);
    }

    async makeManifest() {
        const pkg = readSrcJson('../package.json');
        const m = this.manifest;
        m.version = pkg.version;
        m.host_permissions = WECHAT_URLS as string[];
        m.declarative_net_request.rule_resources.push({
            id: 'wx',
            enabled: true,
            path: FILE_RULE,
        });

        m.icons = await this.makeIcons();

        if (this.platform === PLATFORM.firefox) {
            m.permissions!.push('scripting');
            m.content_scripts = [
                {
                    matches: [...WECHAT_URLS],
                    run_at: 'document_start',
                    js: ['firefox.js'],
                },
            ];
        }

        switch (this.platform) {
            case PLATFORM.chrome:
                m.minimum_chrome_version = '88';
                break;
            case PLATFORM.firefox:
                m.browser_specific_settings = {
                    gecko: {
                        id: 'wechat-need-web@lqzh',
                        strict_min_version: '113.0',
                    },
                };
                break;

            default:
                break;
        }

        w(path.join(this.outDir, 'manifest.json'), m);
    }

    makeRules() {
        const rules: chrome.declarativeNetRequest.Rule[] = [];

        rules.push({
            id: -1,
            priority: 2,
            action: {
                type: 'modifyHeaders' as chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
                requestHeaders: Object.entries(WECHAT_HEADERS).map(([k, v]) => ({
                    operation: 'set' as chrome.declarativeNetRequest.HeaderOperation.SET,
                    header: k,
                    value: v,
                })),
            },
            condition: {
                urlFilter: '*',
                resourceTypes: Object.values(ResourceType),
            },
        });

        // firefox 不能同时匹配多条
        // https://github.com/lqzhgood/wechat-need-web/issues/5
        if (this.platform !== PLATFORM.firefox) {
            // 所有请求加上 target=t 的 query
            rules.push({
                id: -1,
                priority: 1,
                action: {
                    type: 'redirect' as chrome.declarativeNetRequest.RuleActionType.REDIRECT,
                    redirect: {
                        transform: {
                            queryTransform: {
                                addOrReplaceParams: [{ key: 'target', value: 't' }],
                            },
                        },
                    },
                },
                condition: {
                    urlFilter: '*',
                    resourceTypes: [ResourceType.MAIN_FRAME],
                    //  不包含 target=t 的 re2 正则不会写……  https://github.com/google/re2/wiki/Syntax
                    // 浏览器好像会自动判断 query 是否包含， 不会重复两个 target=t 所以也不影响
                    // regexFilter: "^(?!.*[&?]target=t($|&)).+$",
                },
            });
        }

        rules.forEach((o: any, i) => {
            o.id = i + 1;
        });

        w(path.join(this.outDir, FILE_RULE), rules);
    }

    async makeIcons() {
        const icon_dir = 'icons';
        if (!fs.existsSync(path.join(this.outDir, icon_dir))) {
            fs.mkdirSync(path.join(this.outDir, icon_dir));
        }

        const icons: { [key: number]: string } = {};
        const sizes = [16, 32, 48, 128];
        for (let i = 0; i < sizes.length; i++) {
            const s = sizes[i];
            const f = `./${icon_dir}/icon_${s}.png`;
            await sharp(path.join(__dirname, './assets/logo.png')).resize(s).toFile(path.join(this.outDir, f));

            icons[s] = f;
        }
        return icons;
    }

    copyStatic() {
        const src = path.join(__dirname, `./assets/static/${this.platform}`);
        if (!fs.existsSync(src)) {
            return;
        }
        const dist = path.join(this.outDir, './');
        fs.cpSync(src, dist, { recursive: true });
    }
}
