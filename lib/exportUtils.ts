import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';

export const shareFile = async (file: File, title: string, text: string) => {
  if (navigator.share && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title,
        text,
      });
      return true;
    } catch (error) {
      console.warn('Share failed:', error);
      return false;
    }
  }
  return false;
};

export const downloadFile = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const generateSectionImage = async (sectionId: string, sectionTitle: string) => {
  const element = document.getElementById(sectionId);
  if (!element) return;

  try {
    const canvas = await html2canvas(element, {
      scale: 2, // Retain high quality
      backgroundColor: '#282117',
      useCORS: true,
      logging: false,
      width: element.scrollWidth,
      height: element.scrollHeight,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      onclone: (clonedDoc) => {
        // Optional: ensure cloned element has visible overflow?
        const clonedEl = clonedDoc.getElementById(sectionId);
        if (clonedEl) {
          clonedEl.style.overflow = 'visible';
          clonedEl.style.height = 'auto'; // Force auto height
        }
      }
    });

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const filename = `GrowthRockstar_${sectionTitle.replace(/\s+/g, '_')}.png`;
      const file = new File([blob], filename, { type: 'image/png' });

      const shared = await shareFile(file, `Growth Rockstar: ${sectionTitle}`, 'Aquí tienes mi avance del Canvas.');
      if (!shared) {
        downloadFile(blob, filename);
      }
    }, 'image/png');

  } catch (error) {
    console.error('Error generating image:', error);
  }
};

export const generateFullPDF = async (projectTitle: string) => {
  // We target the main canvas container
  const element = document.getElementById('main-canvas-container');
  if (!element) {
    console.error("Main canvas container not found");
    return;
  }

  // Add a loading class or notification if possible?

  try {
    const canvas = await html2canvas(element, {
      scale: 3, // Increased scale for better quality
      backgroundColor: '#1E1E20', // Matches app background usually
      useCORS: true,
      logging: false,
      width: element.scrollWidth,
      height: element.scrollHeight,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight
    });

    const imgData = canvas.toDataURL('image/png');

    // Calculate dimensions
    // User wants ONE page with custom height.
    // Let's base width on a standard A4 width (210mm) to keep text legible physically if needed, 
    // or just proportional. 
    // Actually, usually users want digital PDF.

    // Let's use 210mm width as standard.
    const pdfWidth = 210;
    const imgProps = { width: canvas.width, height: canvas.height };
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: [pdfWidth, pdfHeight], // Custom single page size
    });

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    const filename = `GrowthRockstar_${projectTitle.replace(/\s+/g, '_')}.pdf`;

    // Convert PDF to blob for sharing
    const pdfBlob = pdf.output('blob');
    const file = new File([pdfBlob], filename, { type: 'application/pdf' });

    const shared = await shareFile(file, projectTitle, 'Mi Growth Rockstar Canvas Completo.');
    if (!shared) {
      pdf.save(filename);
    }

  } catch (error) {
    console.error("Error generating PDF", error);
  }
}
