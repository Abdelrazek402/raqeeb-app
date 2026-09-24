/**
 * Client-side file downloader helper
 * Safely creates blobs and initiates browser download with Data URI & Clipboard fallbacks
 */

export function downloadTextFile(fileName: string, content: string, mimeType: string = 'text/plain;charset=utf-8'): void {
  try {
    // Standard Blob approach
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  } catch (error) {
    console.warn('Blob download failed, trying Data URI fallback:', fileName, error);
    try {
      const encodedUri = 'data:' + mimeType + ',' + encodeURIComponent(content);
      const link = document.createElement('a');
      link.href = encodedUri;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e2) {
      console.error('Data URI download failed, copying to clipboard:', e2);
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(content);
        alert(`تم نسخ محتوى ملف (${fileName}) إلى حافظة جهازك بنجاح.`);
      }
    }
  }
}

