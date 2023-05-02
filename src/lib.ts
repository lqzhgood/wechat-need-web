import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

import { deleteFolderRecursive, w } from "./utils";

import {
    FILE_RULE,
    OUT_DIR,
    ResourceType,
    WECHAT_HEADERS,
    WECHAT_URLS,
} from "./const";
import { readSrcJson } from "./utils";

export class Make {
    manifest: chrome.runtime.ManifestV3 = readSrcJson("./manifest.json");

    constructor() {
        if (fs.existsSync(OUT_DIR)) {
            deleteFolderRecursive(OUT_DIR);
        }
        fs.mkdirSync(OUT_DIR);
    }

    async makeManifest() {
        const pkg = readSrcJson("../package.json");
        const m = this.manifest;
        m.version = pkg.version;
        m.host_permissions = WECHAT_URLS as string[];
        m.declarative_net_request.rule_resources.push({
            id: "wx",
            enabled: true,
            path: FILE_RULE,
        });

        m.icons = await this.makeIcons();

        w("manifest.json", m);
    }

    makeRules() {
        const rules: chrome.declarativeNetRequest.Rule[] = [];
        // 所有请求加上 target=t 的 query
        rules.push({
            id: -1,
            action: {
                type: "redirect" as chrome.declarativeNetRequest.RuleActionType.REDIRECT,
                redirect: {
                    transform: {
                        queryTransform: {
                            addOrReplaceParams: [{ key: "target", value: "t" }],
                        },
                    },
                },
            },
            condition: {
                //  不包含 target=t 的 re2 正则不会写……  https://github.com/google/re2/wiki/Syntax
                // 浏览器好像会自动判断 query 是否包含， 不会重复两个 target=t 所以也不影响
                // regexFilter: "^(?!.*[&?]target=t($|&)).+$",
            },
        });

        rules.push({
            id: -1,
            action: {
                type: "modifyHeaders" as chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
                requestHeaders: Object.entries(WECHAT_HEADERS).map(
                    ([k, v]) => ({
                        operation:
                            "set" as chrome.declarativeNetRequest.HeaderOperation.SET,
                        header: k,
                        value: v,
                    })
                ),
            },
            condition: {},
        });

        rules.forEach((o: any, i) => {
            o.id = i + 1;
            o.priority = 1;
            o.condition.resourceTypes = Object.values(ResourceType);
            // o.condition.resourceTypes = Object.values(
            //     chrome.declarativeNetRequest.ResourceType
            // );
        });

        w(FILE_RULE, rules);
    }

    async makeIcons() {
        const icon_dir = "icons";
        if (!fs.existsSync(path.join(OUT_DIR, icon_dir))) {
            fs.mkdirSync(path.join(OUT_DIR, icon_dir));
        }

        const icons: { [key: number]: string } = {};
        const sizes = [16, 32, 48, 128];
        for (let i = 0; i < sizes.length; i++) {
            const s = sizes[i];
            const f = `./${icon_dir}/icon_${s}.png`;
            await sharp(path.join(__dirname, "./assets/logo.png"))
                .resize(s)
                .toFile(path.join(OUT_DIR, f));

            icons[s] = f;
        }
        return icons;
    }
}
