// 所有 SVG 图标 + 按文件名映射
export const ICON_HTML = `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <path fill="#E34F26" d="M107 48h298l-27 306L256 464 134 354z"/>
  <path fill="#EF652A" d="M256 48v416l122-110 27-306z"/>
  <path fill="#fff" d="M256 192h-75l-5-56h80v-40H135l11 136h110z"/>
  <path fill="#fff" d="M256 328l-58-16-4-40h-42l7 76 97 27z"/>
  <path fill="#fff" d="M256 192v40h73l-7 84-66 18v42l104-29 7-90zM256 96v40h118l4-40z"/>
</svg>`;

export const ICON_CSS = `<svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
  <rect x="20" y="20" width="120" height="120" rx="22" fill="#663399"/>
  <text x="80" y="82" font-family="Arial Black, sans-serif" font-weight="900" font-size="44" fill="#fff" text-anchor="middle" dominant-baseline="middle">CSS</text>
</svg>`;

export const ICON_JS = `<svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
  <rect x="20" y="20" width="120" height="120" rx="22" fill="#F7DF1E"/>
  <text x="80" y="82" font-family="Arial Black, sans-serif" font-weight="900" font-size="48" fill="#222" text-anchor="middle" dominant-baseline="middle">JS</text>
</svg>`;

export const ICON_MD = `<svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
  <rect x="20" y="20" width="120" height="120" rx="22" fill="#2C3E50"/>
  <text x="80" y="82" font-family="Arial Black, sans-serif" font-weight="900" font-size="38" fill="#fff" text-anchor="middle" dominant-baseline="middle">MD</text>
</svg>`;

export const ICON_JSON = `<svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
  <rect x="20" y="20" width="120" height="120" rx="22" fill="#E8A300"/>
  <text x="80" y="86" font-family="Arial Black, sans-serif" font-weight="900" font-size="34" fill="#fff" text-anchor="middle" dominant-baseline="middle">{}</text>
</svg>`;

export const ICON_FILE = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#8E8E93" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
  <path d="M28 6H14a4 4 0 0 0-4 4v28a4 4 0 0 0 4 4h20a4 4 0 0 0 4-4V16z"/>
  <polyline points="28 6 28 16 38 16"/>
</svg>`;

export const ICON_FOLDER_BLUE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
</svg>`;

export const HOME_MARK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10"/></svg>`;
export const PIN_MARK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14l-1.5-3V6a1 1 0 0 0-1-1H7.5a1 1 0 0 0-1 1v8z"/></svg>`;
export const ARROW_RIGHT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"/></svg>`;
export const CHECK_WHITE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 12 10 17 19 7"/></svg>`;

export const ICON_CTX = {
  rename: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`,
  newfile: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="14 3 14 9 20 9"/><line x1="12" y1="12" x2="12" y2="18"/><line x1="9" y1="15" x2="15" y2="15"/></svg>`,
  import: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><polyline points="7 10 12 15 17 10"/><path d="M4 19h16"/></svg>`,
  duplicate: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>`,
  export: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  pin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14l-1.5-3V6a1 1 0 0 0-1-1H7.5a1 1 0 0 0-1 1v8z"/></svg>`,
  unpin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14l-1.5-3V6a1 1 0 0 0-1-1H7.5a1 1 0 0 0-1 1v8z"/><line x1="3" y1="3" x2="21" y2="21"/></svg>`,
  delete: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`,
  entry: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10"/></svg>`,
  unentry: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10"/><line x1="3" y1="3" x2="21" y2="21"/></svg>`,
  move: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="14 3 14 9 20 9"/><line x1="9" y1="15" x2="15" y2="15"/><polyline points="13 12 16 15 13 18"/></svg>`,
  copyto: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/><line x1="11" y1="14" x2="17" y2="14"/><polyline points="14 11 17 14 14 17"/></svg>`,
  copycontent: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
  info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="8.01"/></svg>`
};

export function iconForFile(name) {
  const ext = (name.split('.').pop() || '').toLowerCase();
  if (ext === 'html' || ext === 'htm') return ICON_HTML;
  if (ext === 'css' || ext === 'scss' || ext === 'less') return ICON_CSS;
  if (ext === 'js' || ext === 'jsx' || ext === 'mjs' || ext === 'cjs' || ext === 'ts' || ext === 'tsx') return ICON_JS;
  if (ext === 'md' || ext === 'markdown') return ICON_MD;
  if (ext === 'json') return ICON_JSON;
  return ICON_FILE;
}
