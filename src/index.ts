/// <reference types="chrome"/>

import { isSupportedPlatform } from './utils';
import { PLATFORM } from './const';
import { Make } from './lib';

(async () => {
    const [platform] = process.argv.slice(2);

    if (!isSupportedPlatform(platform)) {
        console.error(`${platform} not support, need ${Object.keys(PLATFORM)}`);
        throw new Error('not support');
    }
    const m = new Make(platform);
    await m.makeManifest();
    m.copyStatic();
    m.makeRules();
})();
