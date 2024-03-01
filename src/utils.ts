import fs from 'node:fs';
import path from 'node:path';

import { OUT_DIR } from './const';
export function w(f: string, data: object) {
    fs.writeFileSync(f, JSON.stringify(data, null, 4), 'utf-8');
}

export function readSrcJson(f: string) {
    return JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf-8'));
}
