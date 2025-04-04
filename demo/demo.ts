import { watch } from 'node:fs';
import { $ } from 'bun';

const clearAndBuild = async (

) => {
    console.log('Rebuilding...');
    // Clear dist folder
    await $`rm -rf ./demo/dist`;

    // Rebuild
    await buildFrontend();

}
// await $`bun --hot run ./demo/server.ts`;
// Create a Set to store all connected WebSocket clients
const clients: Set<ReadableStreamDirectController> = new Set();

/**
 * Watch files for changes, and rebuild and reload server
 */
const watcher = watch(
    import.meta.dir,
    {
        recursive: true,
    },
    async (event, filename) => {
        console.log(`Detected ${event} in ${filename}`);

        if (!filename?.includes('dist')) {
            // 
            //    await $`persistica --configuration=./demo/schema/todo.persistica`;

            await clearAndBuild();

            console.log('Reloading server...');

            // Restart server
            server?.reload(serverConf);

            // Send reload signal to clients
            console.log(`Refreshing ${clients.size} clients...`);
            for await (const client of clients) {
                console.log('Emitting to client');
                await client.write('data:reload\n\n');
                await client.flush();
            }
        }
    });

process.on('SIGINT', () => {
    // close watcher when Ctrl-C is pressed
    console.log('Closing watcher...');
    watcher.close();

    process.exit(0);
});

const buildFrontend = async () => {
    console.log('Rebuilding...');
    await Bun.build({
        entrypoints: [
            './demo/src/client/index.html',
        ],
        // sourcemap: 'inline',
        outdir: './demo/dist/frontend',
        minify: false,
    });
}

const serverConf = {
    port: 3000,
    idleTimeout: 0, // Never drop the connection https://github.com/oven-sh/bun/issues/13392
    fetch: async (request: Request) => {
        const url = new URL(request.url);
        // Serve index.html for root
        const pathname = url.pathname === '/' ? '/index.html' : url.pathname;
        try {
            if (url.pathname === '/__bun_live_reload') {
                const signal = request.signal;

                return new Response(
                    new ReadableStream({
                        type: 'direct',
                        pull: async (
                            controller: ReadableStreamDirectController,
                        ) => {
                            clients.add(controller);

                            while (!signal.aborted) {
                                //   await controller.write(`data:reload\n\n`);
                                //    await controller.flush();
                                await Bun.sleep(500);
                            }

                            clients.delete(controller);
                            controller.close();
                        },
                    }),
                    { status: 200, headers: { 'Content-Type': 'text/event-stream' } },
                );
            }

            const file = Bun.file(`./demo/dist/frontend${pathname}`);

            if (pathname === '/index.html') {
                const text = await file.text();

                const injectedHtml = text.replace('</head>', `<script>
                    new EventSource('/__bun_live_reload').onmessage = (e) => {
                        if (e.data === 'reload') {
                            location.reload();
                        }
                    };
                    </script></head>`);
                // // Inject the script tag
                return new Response(injectedHtml, { status: 200, headers: { 'Content-Type': 'text/html' } });
            }

            return new Response(file);
        } catch {
            return new Response('404 Not Found', { status: 404 });
        }
    },
};

await clearAndBuild();

// Don't await, as it will never resolve
$`bun --hot run ./demo/src/server/server.ts`
    .then(() => {
        console.log('Server exited');
    })
    .catch((error) => {
        console.error('Server error', error);
    });


server = Bun.serve(serverConf);
console.log(`🚀 Demo server running on http://localhost:${serverConf.port}`);