// @ts-check
const { build } = require('esbuild');

const handlers = ['exam-create', 'exam-finish'];

Promise.all(
  handlers.map(name =>
    build({
      entryPoints: [`src/handlers/${name}.handler.ts`],
      bundle: true,
      platform: 'node',
      target: 'node20',
      outfile: `dist/${name}.handler.js`,
      sourcemap: false,
      minify: false,
    })
  )
).catch(() => process.exit(1));
