import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { DealResults, DealInputs, DealType, ComparisonData } from '@/types/deal-types';

interface PDFOptions {
  includeAssumptions: boolean;
  includeCashFlow: boolean;
  includeCharts: boolean;
  includeBranding: boolean;
  reportTitle: string;
  logoUrl?: string;
}

/**
 * Generate comprehensive PDF report with charts and tables
 */
export async function exportToPDF(
  comparisons: ComparisonData[],
  selectedDealType: DealType,
  inputs: DealInputs,
  options: PDFOptions
): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  // Add header with branding
  if (options.includeBranding) {
    pdf.setFontSize(20);
    pdf.setTextColor(59, 130, 246); // Primary blue
    pdf.text('Deal Structure Calculator', margin, yPosition);
    yPosition += 10;
    
    pdf.setFontSize(12);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Small Business Acquisition Analysis', margin, yPosition);
    yPosition += 15;
  }

  // Report title
  pdf.setFontSize(16);
  pdf.setTextColor(0, 0, 0);
  pdf.text(options.reportTitle, margin, yPosition);
  yPosition += 15;

  // Add date
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, yPosition);
  yPosition += 20;

  // Input assumptions table
  if (options.includeAssumptions) {
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Input Assumptions', margin, yPosition);
    yPosition += 10;

    const assumptions = [
      ['Purchase Price', `$${inputs.purchasePrice.toLocaleString()}`],
      ['Term Length', `${inputs.termLength} years`],
      ['Interest Rate', `${inputs.interestRate}%`],
      ['Tax Rate', `${inputs.taxRate}%`],
      ['Equity Retained', `${inputs.equityRetained}%`]
    ];

    assumptions.forEach(([label, value]) => {
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text(label + ':', margin, yPosition);
      pdf.text(value, margin + 60, yPosition);
      yPosition += 6;
    });

    yPosition += 15;
  }

  // Deal comparison summary
  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Deal Structure Comparison', margin, yPosition);
  yPosition += 15;

  // Create comparison table
  const tableData = [
    ['Deal Type', 'Investment', 'Net Proceeds', 'ROI', 'IRR']
  ];

  comparisons.forEach(comparison => {
    tableData.push([
      comparison.label,
      `$${comparison.results.totalInvestment.toLocaleString()}`,
      `$${comparison.results.netProceeds.toLocaleString()}`,
      `${comparison.results.roi.toFixed(1)}%`,
      `${comparison.results.irr.toFixed(1)}%`
    ]);
  });

  // Draw table
  const cellHeight = 8;
  const colWidths = [40, 30, 30, 20, 20];
  let tableY = yPosition;

  tableData.forEach((row, rowIndex) => {
    let cellX = margin;
    
    row.forEach((cell, colIndex) => {
      // Draw cell border
      pdf.rect(cellX, tableY, colWidths[colIndex], cellHeight);
      
      // Set font style for header
      if (rowIndex === 0) {
        pdf.setFontSize(9);
        pdf.setFont(undefined, 'bold');
      } else {
        pdf.setFontSize(8);
        pdf.setFont(undefined, 'normal');
      }
      
      // Add text
      pdf.text(cell, cellX + 2, tableY + 5);
      cellX += colWidths[colIndex];
    });
    
    tableY += cellHeight;
  });

  yPosition = tableY + 20;

  // Check if we need a new page
  if (yPosition > pageHeight - 50) {
    pdf.addPage();
    yPosition = margin;
  }

  // Cash flow table for selected deal
  if (options.includeCashFlow) {
    const selectedComparison = comparisons.find(c => c.dealType === selectedDealType);
    if (selectedComparison) {
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`${selectedComparison.label} - Detailed Cash Flow`, margin, yPosition);
      yPosition += 15;

      const cashFlowHeaders = ['Year', 'Principal', 'Interest', 'Tax Impact', 'Net Cash Flow', 'Cumulative'];
      const cashFlowData = [cashFlowHeaders];

      selectedComparison.results.cashFlow.forEach(row => {
        cashFlowData.push([
          row.year.toString(),
          `$${Math.round(row.principal).toLocaleString()}`,
          `$${Math.round(row.interest).toLocaleString()}`,
          `$${Math.round(row.taxImpact).toLocaleString()}`,
          `$${Math.round(row.netCashFlow).toLocaleString()}`,
          `$${Math.round(row.cumulative).toLocaleString()}`
        ]);
      });

      // Draw cash flow table
      const cashFlowColWidths = [15, 25, 25, 25, 25, 25];
      let cashFlowY = yPosition;

      cashFlowData.forEach((row, rowIndex) => {
        let cellX = margin;
        
        row.forEach((cell, colIndex) => {
          pdf.rect(cellX, cashFlowY, cashFlowColWidths[colIndex], cellHeight);
          
          if (rowIndex === 0) {
            pdf.setFontSize(8);
            pdf.setFont(undefined, 'bold');
          } else {
            pdf.setFontSize(7);
            pdf.setFont(undefined, 'normal');
          }
          
          pdf.text(cell, cellX + 1, cashFlowY + 5);
          cellX += cashFlowColWidths[colIndex];
        });
        
        cashFlowY += cellHeight;
      });

      yPosition = cashFlowY + 20;
    }
  }

  // Capture and include charts
  if (options.includeCharts) {
    try {
      const chartElement = document.getElementById('comparison-chart');
      if (chartElement) {
        const canvas = await html2canvas(chartElement, {
          backgroundColor: '#ffffff',
          scale: 2
        });
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - (margin * 2);
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Check if we need a new page for the chart
        if (yPosition + imgHeight > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Cash Flow Comparison Chart', margin, yPosition);
        yPosition += 10;
        
        pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 15;
      }
    } catch (error) {
      console.warn('Could not capture chart for PDF:', error);
    }
  }

  // Add footer
  const pageCount = pdf.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - margin - 20,
      pageHeight - 10
    );
    pdf.text(
      'Generated by Deal Structure Calculator',
      margin,
      pageHeight - 10
    );
  }

  // Save the PDF
  const fileName = `deal-structure-analysis-${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
}

/**
 * Simplified PDF export for mobile
 */
export async function exportMobilePDF(
  selectedComparison: ComparisonData,
  inputs: DealInputs
): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const margin = 15;
  let yPosition = margin;

  // Header
  pdf.setFontSize(16);
  pdf.setTextColor(59, 130, 246);
  pdf.text('Deal Analysis Summary', margin, yPosition);
  yPosition += 15;

  // Key metrics
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  pdf.text(`Deal Type: ${selectedComparison.label}`, margin, yPosition);
  yPosition += 8;
  pdf.text(`Investment: $${selectedComparison.results.totalInvestment.toLocaleString()}`, margin, yPosition);
  yPosition += 8;
  pdf.text(`Net Proceeds: $${selectedComparison.results.netProceeds.toLocaleString()}`, margin, yPosition);
  yPosition += 8;
  pdf.text(`ROI: ${selectedComparison.results.roi.toFixed(1)}%`, margin, yPosition);
  yPosition += 15;

  // Save
  pdf.save(`${selectedComparison.dealType}-analysis.pdf`);
}
