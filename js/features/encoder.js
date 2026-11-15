// 编码 / 解码
import { codeInput, getSelectionOrNull } from '../editor/codemirror.js';
import { syncActiveFile } from '../editor/editor-state.js';

function htmlEncode(s) { return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]); }
function htmlDecode(s) { const el = document.createElement('textarea'); el.innerHTML = s; return el.value; }
function b64Encode(s) {
  const bytes = new TextEncoder().encode(s);
  let bin = ''; bytes.forEach(b => bin += String.fromCharCode(b));
  return btoa(bin);
}
function b64Decode(s) {
  const bin = atob(s.trim());
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}
function jsonEncodeStr(s) { return JSON.stringify(s).slice(1, -1); }
function jsonDecodeStr(s) { return JSON.parse('"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"'); }

export function doEncodeDecode(kind) {
  const sel = getSelectionOrNull();
  if (!sel) { alert('请先在编辑器中选中要处理的文本'); return; }
  let result, err = null;
  try {
    switch (kind) {
      case 'html-encode': result = htmlEncode(sel.text); break;
      case 'html-decode': result = htmlDecode(sel.text); break;
      case 'url-encode': result = encodeURIComponent(sel.text); break;
      case 'url-decode': result = decodeURIComponent(sel.text); break;
      case 'b64-encode': result = b64Encode(sel.text); break;
      case 'b64-decode': result = b64Decode(sel.text); break;
      case 'json-encode': result = jsonEncodeStr(sel.text); break;
      case 'json-decode': result = jsonDecodeStr(sel.text); break;
    }
  } catch (e) { err = e; }
  if (err) { alert('处理失败：' + err.message); return; }
  codeInput.replaceRange(sel.start, sel.end, result);
  syncActiveFile();
}
