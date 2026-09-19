import { fileURLToPath } from 'node:url';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()],

    resolve: {
      dedupe: ['react', 'react-dom', 'three'],
      alias: {
        // jszip's browser field maps "./lib/index" to the UMD dist build, which
        // exposes no ESM default. Point at the CJS entry so bundlers interop it.
        jszip: fileURLToPath(new URL('./node_modules/jszip/lib/index.js', import.meta.url)),
      },
    },

    environments: {
      client: {
        optimizeDeps: {
          noDiscovery: true,
          include: [
            'react',
            'react-dom',
            'react-dom/client',
            'react/jsx-runtime',
            'react/jsx-dev-runtime',
            '@react-three/fiber',
            '@react-three/drei',
            'three',
            'jszip',
          ],
          rolldownOptions: {
            treeshake: false,
          },
        },
      },
    },

    // CJS wrapper locates bin/${os.type()}/FBX2glTF via __dirname. Bundling
    // would rewrite that path; keep the package on the Node module graph.
    // libassimp resolves its WASM (and optional NAPI addon) at runtime the same way.
    ssr: {
      external: ['fbx2gltf', 'libassimp'],
    },
  },

  adapter: vercel({
    // NFT cannot see the dynamic spawn / WASM locate path. include/exclude are
    // exact files (the adapter does not recurse directories or glob these lists).
    includeFiles: [
      './node_modules/fbx2gltf/bin/Linux/FBX2glTF',
      // US-36: GLB → FBX via libassimp WASM (Assimp). Always present on every
      // host — unlike optional `libassimp-*-*.node` addons (Linux-only on Vercel).
      './node_modules/libassimp/dist/wasm/libassimp.wasm',
    ],
    excludeFiles: [
      './node_modules/fbx2gltf/bin/Darwin/FBX2glTF',
      './node_modules/fbx2gltf/bin/Windows_NT/FBX2glTF.exe',
      // Drop optional native addons from the serverless bundle (WASM is enough).
      './node_modules/libassimp-darwin-arm64/libassimp.darwin-arm64.node',
      './node_modules/libassimp-linux-x64-gnu/libassimp.linux-x64-gnu.node',
      './node_modules/libassimp-win32-x64-msvc/libassimp.win32-x64-msvc.node',
    ],
    maxDuration: 60,
  }),
});
