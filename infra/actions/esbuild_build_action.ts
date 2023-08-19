import fs from 'node:fs'
import path from 'node:path'

import * as esbuild from 'esbuild'

import { DIST_DIR } from '../config.js';
import { formatFileSize } from '../utils/format_utils.js';
import { EsbuildBaseAction } from "./esbuild_base_action.js";

class EsbuildBuildAction extends EsbuildBaseAction {
    async run(): Promise<void> {
        const results = await esbuild.build(this.options)
        fs.mkdirSync(DIST_DIR, { recursive: true })
        fs.writeFileSync(path.join(DIST_DIR, 'meta.json'), JSON.stringify(results.metafile, null, 2))

        for (const output in results.metafile?.outputs) {
            const file = results.metafile?.outputs[output]
            if (file.entryPoint) {
                console.log(`Built ${output} (${formatFileSize(file.bytes)})`)
                file.imports.forEach((imported) => {
                    console.log(`  ${imported.path} (${this.getFileSize(imported.path)})`)
                })
            }
        }
    }

    private getFileSize(path: string): string {
        const stats = fs.statSync(path)
        const fileSizeInBytes = stats.size
        const fileSizeInKB = fileSizeInBytes / 1024
        return `${fileSizeInKB.toFixed(2)} KB`
    }
}

export default function(): Promise<void> {
    const action = new EsbuildBuildAction()
    return action.run()
}