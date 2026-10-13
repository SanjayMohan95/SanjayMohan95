// Builds CraveOS as a single self-contained HTML page (for claude.ai Artifact hosting).
import { build } from 'esbuild';
import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const out = path.join(root, 'dist-artifact');
mkdirSync(out, { recursive: true });

const result = await build({
  entryPoints: [path.join(here, 'main.tsx')],
  bundle: true,
  minify: true,
  write: false,
  format: 'iife',
  target: 'es2020',
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"production"', 'process.env.NEXT_PUBLIC_ARTIFACT_BUILD': '"1"' },
  alias: {
    '@': path.join(root, 'src'),
    'next/link': path.join(here, 'shims/next-link.tsx'),
    'next/image': path.join(here, 'shims/next-image.tsx'),
    'next/navigation': path.join(here, 'shims/next-navigation.ts'),
  },
  logLevel: 'warning',
});
const js = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');

execSync(`npx tailwindcss -i src/app/globals.css -c tailwind.config.ts -o dist-artifact/app.css --minify --content "./src/**/*.{ts,tsx},./spa/**/*.{ts,tsx}"`, { cwd: root, stdio: 'inherit' });
const css = readFileSync(path.join(out, 'app.css'), 'utf8');

const html = `<title>CraveOS</title>
<meta name="description" content="Multi-restaurant food ordering demo">
<style>${css}
:root{color-scheme:light}html,body{background:#fbfaf8;color:#141519}</style>
<div id="root"></div>
<script>${js}</script>
`;
writeFileSync(path.join(out, 'index.html'), html);
console.log(`dist-artifact/index.html ${(html.length / 1024).toFixed(0)} KB`);
