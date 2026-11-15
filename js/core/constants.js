// 固定常量：默认模板、语言列表、符号栏、回收站保留天数
export const DEFAULT_TEMPLATE = [
'<!DOCTYPE html>', '<html lang="zh-CN">', '<head>',
'  <meta charset="UTF-8">',
'  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
'  <title>示例</title>',
'  <style>',
'    body { font-family: -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f7f9fc; }',
'    .card { background: #fff; padding: 32px; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); text-align: center; max-width: 320px; }',
'    h1 { margin: 0 0 12px; font-size: 22px; }',
'    p { color: #666; font-size: 14px; line-height: 1.5; margin: 0 0 20px; }',
'    code { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-size: 13px; }',
'    button { background: #FE592D; color: #fff; border: none; padding: 10px 24px; border-radius: 999px; font-size: 15px; font-weight: 600; cursor: pointer; }',
'  </style>',
'</head>', '<body>',
'  <main class="card">',
'    <h1>Hello, 示例!</h1>',
'    <p>编辑这个 <code>index.html</code> 开始你的项目。</p>',
'    <button id="cta" type="button">Click me</button>',
'  </main>',
'  <scr' + 'ipt>',
'    document.getElementById("cta").addEventListener("click", function() { alert("按钮被点击了！"); });',
'  </scr' + 'ipt>',
'</body>', '</html>'
].join('\n');

export const TRASH_RETENTION_DAYS = 30;

export const LANGUAGES = [
  { name: 'HTML', ext: '.html' }, { name: 'CSS', ext: '.css' },
  { name: 'JavaScript', ext: '.js' }, { name: 'TypeScript', ext: '.ts' },
  { name: 'JSX', ext: '.jsx' }, { name: 'TSX', ext: '.tsx' },
  { name: 'JSON', ext: '.json' }, { name: 'Markdown', ext: '.md' },
  { name: 'SVG', ext: '.svg' }, { name: 'Vue', ext: '.vue' },
  { name: 'Svelte', ext: '.svelte' }, { name: 'Python', ext: '.py' },
  { name: 'Ruby', ext: '.rb' }, { name: 'Go', ext: '.go' },
  { name: 'Rust', ext: '.rs' }, { name: 'Java', ext: '.java' },
  { name: 'C', ext: '.c' }, { name: 'C++', ext: '.cpp' },
  { name: 'PHP', ext: '.php' }, { name: 'SQL', ext: '.sql' },
  { name: 'Shell', ext: '.sh' }, { name: 'YAML', ext: '.yml' },
  { name: 'XML', ext: '.xml' }, { name: '纯文本', ext: '.txt' }
];

export const SYMBOLS = [
  '<', '>', '/', '"', "'", '=', '{', '}', '(', ')', '[', ']',
  ';', ':', '&', '|', '-', '_', '+', '*', '.', ',', '`', '!', '?'
];
