import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const repoRoot = resolve(__dirname, '../..');
const editorRoot = resolve(repoRoot, 'packages/editor');
const parserRoot = resolve(repoRoot, 'packages/parser');

export default defineConfig(({ command }) => {
  const useWorkspaceSource = command === 'serve';

  return {
    server: {
      port: 5454,
    },
    resolve: useWorkspaceSource
      ? {
          alias: {
            '@toastwrite/editor/style.css': resolve(editorRoot, 'src/package-styles.css'),
            '@toastwrite/editor': resolve(editorRoot, 'src/dev-entry.ts'),
            '@toastwrite/parser': resolve(parserRoot, 'src/index.ts'),
          },
        }
      : undefined,
  };
});
