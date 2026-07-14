import { defineConfig } from 'vite';

export default defineConfig({
    define: {
        // Injects the package.json version as a global string literal
        __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    },
});
