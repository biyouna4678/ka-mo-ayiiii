// Prettier 格式化
import { project, getActiveFile } from '../core/store.js';
import { codeInput } from '../editor/codemirror.js';
import { syncActiveFile, updateStatus } from '../editor/editor-state.js';
import { showToast, loadScriptOnce } from '../core/utils.js';
import { editorTabSize } from './settings.js';

const PRETTIER_BASE = 'https://cdn.jsdelivr.net/npm/prettier@2.8.8';
const PLUGIN_URLS = {
  babel: PRETTIER_BASE + '/parser-babel.js',
  html: PRETTIER_BASE + '/parser-html.js',
  postcss: PRETTIER_BASE + '/parser-postcss.js',
  markdown: PRETTIER_BASE + '/parser-markdown.js'
};

async function ensurePrettier(pluginName) {
  await loadScriptOnce(PRETTIER_BASE + '/standalone.js');
  window.prettierPlugins = window.prettierPlugins || {};
  if (pluginName && PLUGIN_URLS[pluginName] && !window.prettierPlugins[pluginName]) {
    await loadScriptOnce(PLUGIN_URLS[pluginName]);
  }
}

function parserInfoForExt(ext) {
  const map = {
    html: { parser: 'html', plugin: 'html' }, htm: { parser: 'html', plugin: 'html' },
    vue: { parser: 'vue', plugin: 'html' },
    css: { parser: 'css', plugin: 'postcss' }, scss: { parser: 'scss', plugin: 'postcss' }, less: { parser: 'less', plugin: 'postcss' },
    js: { parser: 'babel', plugin: 'babel' }, jsx: { parser: 'babel', plugin: 'babel' },
    mjs: { parser: 'babel', plugin: 'babel' }, cjs: { parser: 'babel', plugin: 'babel' },
    json: { parser: 'json', plugin: null },
    md: { parser: 'markdown', plugin: 'markdown' }, markdown: { parser: 'markdown', plugin: 'markdown' }
  };
  return map[ext] || null;
}

let isFormatting = false;
export async function formatDocument() {
  if (isFormatting || !project) return;
  const f = getActiveFile();
  if (!f) return;
  const ext = (f.name.split('.').pop() || '').toLowerCase();
  const info = parserInfoForExt(ext);
  if (!info) { showToast('暂不支持格式化 .' + ext + ' 文件'); return; }
  isFormatting = true;
  showToast('正在格式化…', 0);
  try {
    await ensurePrettier(info.plugin);
    const code = codeInput.value;
    const formatted = window.prettier.format(code, {
      parser: info.parser,
      plugins: window.prettierPlugins,
      tabWidth: editorTabSize,
      printWidth: 80,
      semi: true,
      singleQuote: false,
      trailingComma: 'es5'
    });
    if (formatted === code) { showToast('已是最新格式'); return; }
    codeInput.value = formatted;
    syncActiveFile(); updateStatus();
    showToast('已格式化');
  } catch (e) {
    showToast('格式化失败：' + (e && e.message ? e.message : e), 2600);
  } finally {
    isFormatting = false;
  }
}
