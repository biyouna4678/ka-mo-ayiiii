// 正则表达式测试
import { codeInput } from '../editor/codemirror.js';

const regexSheet = document.getElementById('regexSheet');
const regexPattern = document.getElementById('regexPattern');
const regexFlags = document.getElementById('regexFlags');
const regexText = document.getElementById('regexText');
const regexHint = document.getElementById('regexHint');
const regexResult = document.getElementById('regexResult');

export function openRegexSheet() {
  regexSheet.classList.add('show');
  regexText.value = codeInput.value;
  runRegex();
}

function runRegex() {
  regexResult.textContent = '';
  const pattern = regexPattern.value;
  const flags = regexFlags.value || 'g';
  const text = regexText.value;
  if (!pattern) { regexHint.textContent = ''; regexResult.textContent = '等待输入…'; return; }
  let re;
  try { re = new RegExp(pattern, flags.indexOf('g') !== -1 ? flags : flags + 'g'); }
  catch (e) { regexHint.textContent = '正则表达式无效'; regexResult.textContent = e.message; return; }
  const matches = Array.from(text.matchAll(re));
  regexHint.textContent = '匹配 ' + matches.length + ' 处';
  if (!matches.length) { regexResult.textContent = '无匹配'; return; }
  const frag = document.createDocumentFragment();
  let cursor = 0;
  matches.forEach(m => {
    const idx = m.index;
    if (idx > cursor) frag.appendChild(document.createTextNode(text.slice(cursor, idx)));
    const span = document.createElement('span');
    span.className = 'hit'; span.textContent = m[0];
    frag.appendChild(span);
    cursor = idx + m[0].length;
  });
  if (cursor < text.length) frag.appendChild(document.createTextNode(text.slice(cursor)));
  regexResult.appendChild(frag);
}

regexPattern.addEventListener('input', runRegex);
regexFlags.addEventListener('input', runRegex);
regexText.addEventListener('input', runRegex);
