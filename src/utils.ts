import fs from "node:fs";
import path from "node:path";

import { OUT_DIR } from "./const";
export function w(f: string, data: object) {
    fs.writeFileSync(
        path.join(OUT_DIR, f),
        JSON.stringify(data, null, 4),
        "utf-8"
    );
}

export function readSrcJson(f: string) {
    return JSON.parse(fs.readFileSync(path.join(__dirname, f), "utf-8"));
}
export function deleteFolderRecursive(p: string) {
    if (fs.existsSync(p)) {
        fs.readdirSync(p).forEach(function (file) {
            const curPath = p + "/" + file;
            if (fs.lstatSync(curPath).isDirectory()) {
                // 递归删除子目录
                deleteFolderRecursive(curPath);
            } else {
                // 删除文件
                fs.unlinkSync(curPath);
            }
        });
        // 删除空目录
        fs.rmdirSync(p);
    }
}
