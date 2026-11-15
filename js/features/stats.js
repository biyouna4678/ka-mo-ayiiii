// 文档统计
import { codeInput } from '../editor/codemirror.js';

const statsSheet = document.getElementById('statsSheet');
const statsGrid = document.getElementById('statsGrid');

export function openStatsSheet() {
  statsSheet.classList.add('show');
  statsGrid.innerHTML = '';
  const text = codeInput.value;
  const rows = [
    ['字符数（含空格）', text.length],
    ['字符数（不含空格）', text.replace(/\s/g, '').length],
    ['行数', text.split('\n').length],
    ['非空行数', text.split('\n').filter(l => l.trim()).length],
    ['中文字符数', (text.match(/[\u4e00-\u9fa5]/g) || []).length],
    ['HTML 标签数', (text.match(/<\/?[a-zA-Z][^>]*>/g) || []).length],
    ['CSS 规则数（粗估）', (text.match(/(^|\n)\s*[.#]?[\w-]+(\s*,\s*[.#]?[\w-]+)*\s*\{/g) || []).length],
    ['JS 函数/箭头函数数', (text.match(/function\s|=>\s*\{|=>\s*[^\{]/g) || []).length]
  ];
  rows.forEach(([k, v]) => {
    const kEl = document.createElement('div'); kEl.className = 'k'; kEl.textContent = k;
    const vEl = document.createElement('div'); vEl.className = 'v'; vEl.textContent = v;
    statsGrid.appendChild(kEl); statsGrid.appendChild(vEl);
  });
}
