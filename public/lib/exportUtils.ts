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

export const generateSectionImage = async (sectionId: string, sectionTitle: string, customText?: string) => {
  const element = document.getElementById(sectionId);
  if (!element) return;

  try {
    const rect = element.getBoundingClientRect();
    const canvas = await html2canvas(element, {
      scale: 2, // Retain high quality
      backgroundColor: '#f2f2f2',
      useCORS: true,
      logging: false,
      width: rect.width,
      height: element.scrollHeight,
      windowWidth: rect.width,
      windowHeight: element.scrollHeight,
      onclone: (clonedDoc) => {
        // Optional: ensure cloned element has visible overflow?
        const clonedEl = clonedDoc.getElementById(sectionId);
        if (clonedEl) {
          clonedEl.style.overflow = 'visible';
          clonedEl.style.height = 'auto'; // Force auto height
          // Ensure it doesn't try to expand
          clonedEl.style.width = `${rect.width}px`;
          clonedEl.style.maxWidth = '100%';
        }

        // --- FIX: Handle Iframes (Maps, Embeds) for Section Image ---
        const iframes = clonedDoc.querySelectorAll('iframe');
        iframes.forEach((iframe) => {
          const iframeRect = iframe.getBoundingClientRect();
          const placeholder = clonedDoc.createElement('div');

          placeholder.style.width = iframe.style.width || `${iframeRect.width}px` || '100%';
          placeholder.style.height = iframe.style.height || `${iframeRect.height}px` || '300px';
          placeholder.style.backgroundColor = '#f9f9f9'; // Lighter for PDF
          placeholder.style.border = '1px dashed #ccc';
          placeholder.style.display = 'flex';
          placeholder.style.flexDirection = 'column';
          placeholder.style.alignItems = 'center';
          placeholder.style.justifyContent = 'center';
          placeholder.style.color = '#999';
          placeholder.style.padding = '10px';

          const src = iframe.getAttribute('src') || '';
          let text = 'Embed Externo';
          if (src.includes('google.com/maps')) text = 'Mapa';

          placeholder.innerHTML = `
             <div style="font-weight: bold; font-family: sans-serif; font-size: 12px;">[${text}]</div>
             <div style="font-size: 10px;">${src}</div>
           `;

          if (iframe.parentNode) {
            iframe.parentNode.replaceChild(placeholder, iframe);
          }
        });
      }
    });

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const filename = `GrowthRockstar_${sectionTitle.replace(/\s+/g, '_')}.png`;
      const file = new File([blob], filename, { type: 'image/png' });

      const textToShare = customText || 'Aquí tienes mi avance del Canvas.';
      const shared = await shareFile(file, `Growth Rockstar: ${sectionTitle}`, textToShare);
      if (!shared) {
        downloadFile(blob, filename);
        // Maybe copy text to clipboard if share failed?
        if (customText) {
          try {
            await navigator.clipboard.writeText(customText);
            alert("Imagen descargada. Texto copiado al portapapeles (WhatsApp Web no soporta envío directo de imagen + texto desde web).");
          } catch (e) {
            // Ignore
          }
        }
      }
    }, 'image/png');

  } catch (error) {
    console.error('Error generating image:', error);
  }
};

export const generateFullPDF = async (projectTitle: string, requestedScale: number = 2) => {
  // We target the main canvas container
  const element = document.getElementById('main-canvas-container');
  if (!element) {
    console.error("Main canvas container not found");
    return;
  }

  try {
    const rect = element.getBoundingClientRect();
    const scrollHeight = element.scrollHeight;
    
    // Browser Canvas Safety Limits (approx 32,767px height usually, or area limits)
    // We'll set a safe height limit of 25,000px to be conservative across browsers.
    const MAX_CANVAS_HEIGHT = 25000;
    const MAX_CANVAS_AREA = 10000 * 10000; // 100 megapixels roughly safe

    // Calculate effective scale to avoid breaking the canvas
    let scale = requestedScale;
    
    // Check Height Limit
    if (scrollHeight * scale > MAX_CANVAS_HEIGHT) {
        scale = MAX_CANVAS_HEIGHT / scrollHeight;
        console.warn(`PDF Export: Auto-reducing scale from ${requestedScale} to ${scale.toFixed(2)} to fit browser canvas limits.`);
    }

    // Check Area Limit (Width * Height * Scale^2)
    const estimatedArea = (rect.width * scale) * (scrollHeight * scale);
    if (estimatedArea > MAX_CANVAS_AREA) {
        const reductionFactor = Math.sqrt(MAX_CANVAS_AREA / estimatedArea);
        scale = scale * reductionFactor;
        console.warn(`PDF Export: Auto-reducing scale to ${scale.toFixed(2)} to fit area limits.`);
    }

    // Ensure scale is at least 1 unless content is absolutely massive
    if (scale < 1) scale = 1;

    const canvas = await html2canvas(element, {
      scale: scale, 
      backgroundColor: '#f2f2f2', 
      useCORS: true,
      logging: false,
      width: rect.width,
      height: scrollHeight,
      windowWidth: rect.width,
      windowHeight: scrollHeight,
      onclone: (clonedDoc) => {
        const clonedEl = clonedDoc.getElementById('main-canvas-container');
        if (clonedEl) {
           clonedEl.style.width = `${rect.width}px`;
        }

        // --- FIX: Handle Iframes (Maps, Embeds) for Full PDF ---

        const iframes = clonedDoc.querySelectorAll('iframe');
        iframes.forEach((iframe) => {
          const iframeRect = iframe.getBoundingClientRect();
          const placeholder = clonedDoc.createElement('div');

          placeholder.style.width = iframe.style.width || `${iframeRect.width}px` || '100%';
          placeholder.style.height = iframe.style.height || `${iframeRect.height}px` || '300px';
          placeholder.style.backgroundColor = '#f9f9f9'; // Lighter for PDF
          placeholder.style.border = '1px dashed #ccc';
          placeholder.style.display = 'flex';
          placeholder.style.flexDirection = 'column';
          placeholder.style.alignItems = 'center';
          placeholder.style.justifyContent = 'center';
          placeholder.style.color = '#999';
          placeholder.style.padding = '10px';

          const src = iframe.getAttribute('src') || '';
          let text = 'Embed Externo';
          if (src.includes('google.com/maps')) text = 'Mapa';

          placeholder.innerHTML = `
             <div style="font-weight: bold; font-family: sans-serif; font-size: 12px;">[${text}]</div>
             <div style="font-size: 10px;">${src}</div>
           `;

          if (iframe.parentNode) {
            iframe.parentNode.replaceChild(placeholder, iframe);
          }
        });

        // --- FIX: Handle SVGs/Recharts Issues ---
        const svgs = clonedDoc.querySelectorAll('svg');
        svgs.forEach((svg) => {
          svg.style.fontFamily = 'Arial, sans-serif'; // Force safe font
        });
      }
    });

    const imgData = canvas.toDataURL('image/png');

    // Calculate dimensions
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
    // Check for pointer type safely
    const isMobile = typeof window !== 'undefined' && window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    
    if (!shared || !isMobile) {
      pdf.save(filename);
    }

  } catch (error) {
    console.error("Error generating PDF", error);
  }
};
