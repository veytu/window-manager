import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { dependencies, peerDependencies, version, devDependencies } from "../package.json"
export default defineConfig({
    server: {
        port: 4000
    },
    plugins: [
        svelte({
            emitCss: false,
            experimental: {
                useVitePreprocess: true,
            },
        })
    ],
    define: {
        __APP_VERSION__: JSON.stringify(version),
        __APP_DEPENDENCIES__: JSON.stringify({
            dependencies, peerDependencies, devDependencies
        }),
    },
});
