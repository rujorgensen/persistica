import { watch } from 'node:fs';
import path from 'node:path';
import { $ } from 'bun';

console.log(path.join(import.meta.dir, 'src'),);
watch(
    path.join(import.meta.dir, 'src'),
    {
        recursive: true,
    },
    async (event, filename) => {
        console.log(`Detected ${event} in ${filename}`);

        if (!filename?.includes('dist')) {
            // 
            //    await $`persistica --configuration=./demo/schema/todo.persistica`;

            // Clear dist folder
            await $`rm -rf ./demo/dist`;

            // Rebuild
            await build();
        }
    });

const build = async () => {
    // await Bun.build({
    //     entrypoints: [
    //         './demo/src/client/index.html',
    //     ],
    //     // sourcemap: 'inline',
    //     outdir: './demo/dist',
    //     minify: false,
    // });

    await $`persistica --configuration=./demo/schema/todo.persistica`;
}
