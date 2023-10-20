import { PLATFORM } from './const';
import { Make } from './lib';

(async () => {
    const [platform] = process.argv.slice(2);

    if (!Object.values(PLATFORM).includes(platform as PLATFORM)) {
        console.error(`${platform} not support, need ${Object.keys(PLATFORM)}`);
        throw new Error('not support');
    }
    const m = new Make(platform as PLATFORM);
    await m.makeManifest();
    m.copyStatic();
    m.makeRules();
})();
