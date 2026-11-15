// 预览文档构建：多文件内联 + CSS/JS 演示文档
import { escapeHtmlText } from '../core/utils.js';

function isExternalUrl(url) {
  if (!url) return true;
  const t = url.trim();
  return /^(https?:|data:|blob:|mailto:|tel:|javascript:|#|\/\/|\/)/i.test(t);
}
function resolveLocalFileName(href) {
  let p = href.split('?')[0].split('#')[0];
  p = p.replace(/^\.\//, '');
  const parts = p.split('/');
  return parts[parts.length - 1];
}
function escapeStyleContent(s) { return s.replace(/<\/style>/gi, '<\\/style>'); }
function escapeScriptContent(s) { return s.replace(/<\/script>/gi, '<\\/script>'); }

export function inlineResources(html, proj) {
  const fileMap = new Map();
  proj.files.forEach(f => fileMap.set(f.name, f.content));
  const inlined = [];

  html = html.replace(/<link\b[^>]*>/gi, (tag) => {
    if (!/rel\s*=\s*["']?stylesheet/i.test(tag)) return tag;
    const m = tag.match(/href\s*=\s*["']([^"']+)["']/i);
    if (!m) return tag;
    const href = m[1];
    if (isExternalUrl(href)) return tag;
    const name = resolveLocalFileName(href);
    const content = fileMap.get(name);
    if (content === undefined) return tag;
    inlined.push(name);
    return '<style data-cv-inline="' + escapeHtmlText(name) + '">\n' + escapeStyleContent(content) + '\n</style>';
  });

  html = html.replace(/<script\b([^>]*?)\bsrc\s*=\s*["']([^"']+)["']([^>]*?)>\s*<\/script>/gi, (tag, pre, src, post) => {
    if (isExternalUrl(src)) return tag;
    const name = resolveLocalFileName(src);
    const content = fileMap.get(name);
    if (content === undefined) return tag;
    inlined.push(name);
    const attrs = ((pre || '') + ' ' + (post || '')).replace(/\s+/g, ' ').trim();
    const attrStr = attrs ? ' ' + attrs : '';
    return '<scr' + 'ipt' + attrStr + ' data-cv-inline="' + escapeHtmlText(name) + '">\n' + escapeScriptContent(content) + '\n</scr' + 'ipt>';
  });

  html = html.replace(/<img\b([^>]*?)\bsrc\s*=\s*["']([^"']+)["']([^>]*?)>/gi, (tag, pre, src, post) => {
    if (isExternalUrl(src)) return tag;
    const name = resolveLocalFileName(src);
    if (!/\.svg$/i.test(name)) return tag;
    const content = fileMap.get(name);
    if (content === undefined) return tag;
    inlined.push(name);
    try {
      const encoded = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(content)));
      return '<img' + pre + ' src="' + encoded + '"' + post + '>';
    } catch (e) { return tag; }
  });

  return { html, inlined };
}

export function buildCssDemoDoc(css) {
  return '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>CSS 预览</title>' +
    '<style>' +
    'body { margin: 0; padding: 16px; font-family: -apple-system, sans-serif; }' +
    '.demo section { margin-bottom: 24px; }' +
    '.demo h1 { margin: 0 0 8px; } .demo h2 { margin: 16px 0 8px; } .demo h3 { margin: 12px 0 6px; }' +
    '.demo button, .demo input, .demo textarea, .demo select { font-family: inherit; font-size: 14px; padding: 8px 12px; margin: 4px 4px 4px 0; }' +
    '.demo table { border-collapse: collapse; width: 100%; }' +
    '.demo th, .demo td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }' +
    '.demo blockquote { margin: 8px 0; padding: 8px 14px; border-left: 3px solid #ccc; color: #555; }' +
    '.demo code { background: #f2f2f2; padding: 2px 6px; border-radius: 4px; font-size: 13px; }' +
    '</style><style>' + css + '</style></head>' +
    '<body><div class="demo">' +
    '<h1>Heading 1 一级标题</h1><h2>Heading 2 二级标题</h2><h3>Heading 3 三级标题</h3>' +
    '<section><p>普通段落，<strong>粗体</strong>，<em>斜体</em>，<a href="#">链接</a>，<code>inline code</code>。</p><blockquote>引用文字。</blockquote></section>' +
    '<section><ul><li>无序列表项一</li><li>无序列表项二</li></ul><ol><li>有序列表项一</li><li>有序列表项二</li></ol></section>' +
    '<section><button type="button">按钮 Button</button><input type="text" placeholder="输入框 Input"><textarea placeholder="多行文本"></textarea><select><option>选项 1</option><option>选项 2</option></select></section>' +
    '<section><div class="card"><h3>卡片 Card</h3><p>卡片内容。</p></div></section>' +
    '<section><table><thead><tr><th>列 1</th><th>列 2</th></tr></thead><tbody><tr><td>数据 1</td><td>数据 2</td></tr></tbody></table></section>' +
    '</div></body></html>';
}

export function buildJsDemoDoc(js) {
  return '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>JS 预览</title>' +
    '<style>body{margin:0;padding:16px;font-family:-apple-system,sans-serif;}#output{margin-top:12px;font-family:ui-monospace,monospace;font-size:13px;background:#f5f5f7;padding:12px;border-radius:8px;white-space:pre-wrap;}</style></head>' +
    '<body><h1>JS 预览</h1><div id="output"></div>' +
    '<scr' + 'ipt>(function(){var out=document.getElementById("output");var log=console.log;console.log=function(){var args=Array.prototype.slice.call(arguments).map(function(a){try{return typeof a==="object"?JSON.stringify(a):String(a);}catch(e){return String(a);}});out.textContent+=args.join(" ")+"\\n";log.apply(console,arguments);};try{' + js + '}catch(err){out.textContent+="[error] "+err.message+"\\n";}})();</scr' + 'ipt></body></html>';
}

export function buildPreviewDocForProject(proj, fileName, content) {
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  if (ext === 'html' || ext === 'htm') {
    if (proj && proj.files && proj.files.length > 1) {
      return inlineResources(content, proj).html;
    }
    return content;
  }
  if (ext === 'css') return buildCssDemoDoc(content);
  if (ext === 'js') return buildJsDemoDoc(content);
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>' +
    'body { font-family: -apple-system, sans-serif; padding: 16px; color: #666; }' +
    'pre { white-space: pre-wrap; word-break: break-word; font-family: ui-monospace, monospace; }' +
    '</style></head><body><pre>' + escapeHtmlText(content) + '</pre></body></html>';
}
