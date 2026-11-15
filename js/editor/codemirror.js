// CodeMirror 6 初始化 + 类 textarea 代理
import { EditorState, Compartment } from 'https://esm.sh/@codemirror/state@6';
import {
  EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter,
  drawSelection, dropCursor, rectangularSelection, crosshairCursor,
  highlightSpecialChars
} from 'https://esm.sh/@codemirror/view@6';
import { defaultKeymap, history, historyKeymap, indentWithTab } from 'https://esm.sh/@codemirror/commands@6';
import {
  syntaxHighlighting, defaultHighlightStyle, bracketMatching, indentOnInput,
  foldGutter, foldKeymap
} from 'https://esm.sh/@codemirror/language@6';
import { searchKeymap, highlightSelectionMatches } from 'https://esm.sh/@codemirror/search@6';
import {
  autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap
} from 'https://esm.sh/@codemirror/autocomplete@6';
import { html as langHtml } from 'https://esm.sh/@codemirror/lang-html@6';
import { css as langCss } from 'https://esm.sh/@codemirror/lang-css@6';
import { javascript as langJs } from 'https://esm.sh/@codemirror/lang-javascript@6';
import { json as langJson } from 'https://esm.sh/@codemirror/lang-json@6';
import { markdown as langMd } from 'https://esm.sh/@codemirror/lang-markdown@6';
import { python as langPy } from 'https://esm.sh/@codemirror/lang-python@6';
import { sql as langSql } from 'https://esm.sh/@codemirror/lang-sql@6';
import { xml as langXml } from 'https://esm.sh/@codemirror/lang-xml@6';

const editorContainer = document.getElementById('editorContainer');
editorContainer.innerHTML = '';

const langCompartment = new Compartment();
const cmListeners = { input: [], keyup: [], click: [], keydown: [] };
let isSettingValue = false;

export const cmView = new EditorView({
  state: EditorState.create({
    doc: '',
    extensions: [
      lineNumbers(), highlightActiveLineGutter(), highlightSpecialChars(),
      history(), foldGutter(), drawSelection(), dropCursor(),
      EditorState.allowMultipleSelections.of(true),
      EditorState.tabSize.of(2),
      indentOnInput(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      bracketMatching(), closeBrackets(), autocompletion(),
      rectangularSelection(), crosshairCursor(), highlightActiveLine(),
      highlightSelectionMatches(),
      keymap.of([
        ...closeBracketsKeymap, ...defaultKeymap, ...searchKeymap,
        ...historyKeymap, ...foldKeymap, ...completionKeymap, indentWithTab
      ]),
      langCompartment.of([]),
      EditorView.updateListener.of((update) => {
        if (update.docChanged && !isSettingValue) {
          cmListeners.input.forEach(fn => { try { fn({ type: 'input' }); } catch(e){} });
        }
      }),
      EditorView.lineWrapping
    ]
  }),
  parent: editorContainer
});

cmView.dom.addEventListener('keyup', (e) => { cmListeners.keyup.forEach(fn => { try { fn(e); } catch(err){} }); });
cmView.dom.addEventListener('click', (e) => { cmListeners.click.forEach(fn => { try { fn(e); } catch(err){} }); });
cmView.dom.addEventListener('keydown', (e) => { cmListeners.keydown.forEach(fn => { try { fn(e); } catch(err){} }); });

export const codeInput = {
  get view() { return cmView; },
  get value() { return cmView.state.doc.toString(); },
  set value(v) {
    v = v == null ? '' : String(v);
    if (v === cmView.state.doc.toString()) return;
    isSettingValue = true;
    cmView.dispatch({ changes: { from: 0, to: cmView.state.doc.length, insert: v } });
    isSettingValue = false;
  },
  get selectionStart() { return cmView.state.selection.main.from; },
  get selectionEnd() { return cmView.state.selection.main.to; },
  setSelectionRange(from, to) {
    const max = cmView.state.doc.length;
    if (from > max) from = max;
    if (to > max) to = max;
    cmView.dispatch({ selection: { anchor: from, head: to } });
  },
  focus() { cmView.focus(); },
  blur() { cmView.contentDOM.blur(); },
  select() { cmView.dispatch({ selection: { anchor: 0, head: cmView.state.doc.length } }); },
  addEventListener(type, fn) { if (cmListeners[type]) cmListeners[type].push(fn); },
  insertAtCursor(text) {
    const { from, to } = cmView.state.selection.main;
    cmView.dispatch({ changes: { from, to, insert: text }, selection: { anchor: from + text.length } });
    cmView.focus();
  },
  reconfigureLanguage(ext) { cmView.dispatch({ effects: langCompartment.reconfigure(ext) }); },
  replaceRange(from, to, text) {
    cmView.dispatch({ changes: { from, to, insert: text }, selection: { anchor: from + text.length } });
    cmView.focus();
  }
};

export function langExtForFile(ext) {
  switch (ext) {
    case 'html': case 'htm': return langHtml();
    case 'css': case 'scss': case 'less': return langCss();
    case 'js': case 'mjs': case 'cjs': return langJs();
    case 'jsx': return langJs({ jsx: true });
    case 'ts': return langJs({ typescript: true });
    case 'tsx': return langJs({ typescript: true, jsx: true });
    case 'json': return langJson();
    case 'md': case 'markdown': return langMd();
    case 'py': return langPy();
    case 'sql': return langSql();
    case 'xml': case 'svg': return langXml();
    default: return [];
  }
}

export function getSelectionOrNull() {
  const s = codeInput.selectionStart;
  const e = codeInput.selectionEnd;
  if (s === e) return null;
  return { start: s, end: e, text: codeInput.value.slice(s, e) };
}
