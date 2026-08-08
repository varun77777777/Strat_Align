import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Captures the dashboard DOM element as an image and exports it as a PDF.
 * @param {React.RefObject} dashboardRef - Ref to the dashboard container element
 * @param {string} fileName - Base filename (without extension)
 */
export const generateDashboardPDF = async (dashboardRef, fileName = 'strat-align-report') => {
  if (!dashboardRef?.current) {
    console.error('generateDashboardPDF: dashboardRef.current is null');
    return;
  }

  const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
  const fullFileName = `${fileName}-${timestamp}.pdf`;

  // Capture the dashboard as a canvas
  const canvas = await html2canvas(dashboardRef.current, {
    backgroundColor: '#07090e',
    scale: 1.5,          // 1.5x resolution for crisp output
    useCORS: true,
    logging: false,
    scrollX: 0,
    scrollY: -window.scrollY,
    windowWidth: dashboardRef.current.scrollWidth,
    windowHeight: dashboardRef.current.scrollHeight,
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.92);
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;

  // A4 landscape for wide dashboards
  const pdf = new jsPDF({
    orientation: imgWidth > imgHeight ? 'landscape' : 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const headerHeight = 50;
  const footerHeight = 30;
  const contentHeight = pageHeight - headerHeight - footerHeight;

  // ── Header bar ──────────────────────────────────────────────
  pdf.setFillColor(7, 9, 14);          // --bg-primary
  pdf.rect(0, 0, pageWidth, headerHeight, 'F');

  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('STRAT-ALIGN — Strategic Alignment Report', 24, 32);

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(160, 174, 192);
  pdf.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - 24, 32, { align: 'right' });

  // ── Dashboard screenshot ─────────────────────────────────────
  const ratio = Math.min(pageWidth / imgWidth, contentHeight / imgHeight);
  const drawW = imgWidth * ratio;
  const drawH = imgHeight * ratio;
  const xOffset = (pageWidth - drawW) / 2;

  pdf.addImage(imgData, 'JPEG', xOffset, headerHeight, drawW, drawH);

  // ── Footer ───────────────────────────────────────────────────
  const footerY = pageHeight - footerHeight + 12;
  pdf.setFontSize(8);
  pdf.setTextColor(113, 128, 150);
  pdf.text('Confidential — Strategic Alignment Drift Detection Platform', 24, footerY);
  pdf.text(`Page 1`, pageWidth - 24, footerY, { align: 'right' });

  pdf.save(fullFileName);
};
