// 导出项目为 ZIP
import { projects } from '../core/store.js';
import { showToast, loadScriptOnce } from '../core/utils.js';

let isExporting = false;
export async function exportProjectZipById(projectId) {
  const p = projects.find(x => x.id === projectId);
  if (!p) return;
  if (isExporting) return;
  isExporting = true;
  showToast('正在打包…', 0);
  try {
    await loadScriptOnce('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js');
    if (typeof JSZip === 'undefined') throw new Error('JSZip 未加载');
    const zip = new JSZip();
    const folderName = (p.name || 'project').replace(/[\\/:*?"<>|]/g, '_');
    const folder = zip.folder(folderName);
    p.files.forEach(file => {
      const safeName = file.name.replace(/[\\/:*?"<>|]/g, '_');
      folder.file(safeName, file.content);
    });
    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
    const fileName = folderName + '.zip';
    const zipFile = new File([blob], fileName, { type: 'application/zip' });
    if (navigator.canShare && navigator.canShare({ files: [zipFile] })) {
      try { await navigator.share({ files: [zipFile], title: fileName }); showToast('已导出'); return; } catch (e) {}
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = fileName;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    showToast('已导出 ' + fileName);
  } catch (e) {
    showToast('导出失败：' + (e && e.message ? e.message : e), 2600);
  } finally {
    isExporting = false;
  }
}
