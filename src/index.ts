import { Make } from "./lib";

(async () => {
    const m = new Make();
    await m.makeManifest();
    m.makeRules();
})();
