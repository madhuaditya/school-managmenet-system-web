import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const waitForFrameReady = (iframe, doc) =>
  new Promise((resolve) => {
    const complete = () => setTimeout(resolve, 300);
    if (doc.readyState === 'complete') {
      complete();
      return;
    }
    iframe.onload = complete;
  });

export const convertHtmlToPdfBlob = async (html, { filename = 'document.pdf', orientation = 'portrait' } = {}) => {
  if (!html || typeof html !== 'string') {
    throw new Error('HTML content is required for PDF generation');
  }

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-10000px';
  iframe.style.top = '0';
  iframe.style.width = '1200px';
  iframe.style.height = '2000px';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  try {
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      throw new Error('Unable to create PDF preview frame');
    }

    doc.open();
    doc.write(html);
    doc.close();

    await waitForFrameReady(iframe, doc);

    const target = doc.body;
    const canvas = await html2canvas(target, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      windowWidth: doc.documentElement.scrollWidth,
      windowHeight: doc.documentElement.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgProps = pdf.getImageProperties(imgData);
    const imgWidth = pageWidth;
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    return {
      filename,
      blob: pdf.output('blob'),
    };
  } finally {
    document.body.removeChild(iframe);
  }
};

export const triggerPdfDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

export const downloadHtmlAsPdf = async (html, options = {}) => {
  const { blob, filename } = await convertHtmlToPdfBlob(html, options);
  triggerPdfDownload(blob, filename);
};
