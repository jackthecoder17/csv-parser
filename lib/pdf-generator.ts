import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PropertyUnit } from './csv-parser';
import { formatCurrency } from './utils';

// Default image placeholder
const DEFAULT_IMAGE_URL = '/images/property-placeholder.jpg';

/**
 * Generate a professional PDF report for a list of properties
 */
export const generatePropertiesReport = async (
  properties: PropertyUnit[],
  title: string = 'Property Listings Report'
): Promise<jsPDF> => {
  // Create a new PDF document in portrait orientation
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  // Define common colors
  const primaryColor = [41, 98, 255]; // RGB for primary blue
  const secondaryColor = [100, 100, 100]; // RGB for dark gray
  
  // Set document properties for metadata
  doc.setProperties({
    title: title,
    subject: 'Property Listings',
    author: 'Property Management System',
    keywords: 'properties, real estate, listings',
    creator: 'Property Management PDF Generator',
  });
  
  // Add cover page
  addCoverPage(doc, title, primaryColor, properties.length);
  
  // For each property, add a dedicated page
  for (let i = 0; i < properties.length; i++) {
    const property = properties[i];
    
    // Add a new page for each property (except first one after cover)
    if (i > 0) {
      doc.addPage();
    }
    
    // Add property details
    await addPropertyPage(doc, property, i + 1, primaryColor, secondaryColor);
  }
  
  // Add summary table at the end
  doc.addPage();
  addSummaryTable(doc, properties, primaryColor);
  
  // Add page numbers (except on cover)
  const pageCount = doc.getNumberOfPages();
  for (let i = 2; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Page ${i - 1} of ${pageCount - 1}`, doc.internal.pageSize.getWidth() - 28, doc.internal.pageSize.getHeight() - 10);
  }
  
  return doc;
};

/**
 * Add a professionally designed cover page
 */
const addCoverPage = (doc: jsPDF, title: string, primaryColor: number[], propertyCount: number): void => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Add background color bar at top
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  // Add company logo/name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('PROPERTY MANAGEMENT', pageWidth / 2, 25, { align: 'center' });
  
  // Add report title
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth / 2, 70, { align: 'center' });
  
  // Add decorative element
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(1);
  doc.line(pageWidth / 4, 80, pageWidth - pageWidth / 4, 80);
  
  // Add report details
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  doc.text(`Generated on: ${formattedDate}`, pageWidth / 2, 100, { align: 'center' });
  doc.text(`Total Properties: ${propertyCount}`, pageWidth / 2, 110, { align: 'center' });
  
  // Add footer with disclaimer
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('This document contains confidential property information.', pageWidth / 2, pageHeight - 20, { align: 'center' });
  doc.text('For internal use and authorized clients only.', pageWidth / 2, pageHeight - 15, { align: 'center' });
};

/**
 * Add a property details page
 */
const addPropertyPage = async (
  doc: jsPDF, 
  property: PropertyUnit, 
  index: number,
  primaryColor: number[],
  secondaryColor: number[]
): Promise<void> => {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Page header with property name
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 25, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  const propertyName = property['Unit Name'] || `Property #${index}`;
  doc.text(propertyName, 10, 15);
  
  // Try to add property image
  let imageHeight = 60;
  try {
    // In a real implementation, we would fetch actual property images
    // For now, use the default placeholder image
    const imageUrl = DEFAULT_IMAGE_URL;
    
    // For browser environments, we need to handle image loading properly
    if (typeof window !== 'undefined') {
      // We'll use our helper function that properly handles image loading
      await addImageToPdf(doc, imageUrl, 10, 30, 90, imageHeight);
    } else {
      // Fallback for non-browser environments
      await addPlaceholderImage(doc, 10, 30, 90, imageHeight);
    }
  } catch (error) {
    console.error('Failed to load property image:', error);
    // If image loading fails, reduce the image area
    imageHeight = 20;
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFontSize(12);
    doc.text('[Image not available]', 55, 50);
  }
  
  // Property details section
  const startY = 30 + imageHeight + 10;
  
  // Section title
  doc.setFillColor(245, 245, 245);
  doc.rect(10, startY, pageWidth - 20, 10, 'F');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Property Details', 15, startY + 7);
  
  // Details content
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  const detailsY = startY + 20;
  const col1X = 15;
  const col2X = pageWidth / 2 + 5;
  const lineHeight = 8;
  
  // Column 1
  doc.setFont('helvetica', 'bold');
  doc.text('Location:', col1X, detailsY);
  doc.text('Type:', col1X, detailsY + lineHeight * 1);
  doc.text('Status:', col1X, detailsY + lineHeight * 2);
  doc.text('Price:', col1X, detailsY + lineHeight * 3);
  doc.text('Area:', col1X, detailsY + lineHeight * 4);
  doc.text('Bedrooms:', col1X, detailsY + lineHeight * 5);
  
  // Column 1 values
  doc.setFont('helvetica', 'normal');
  doc.text(property['Phase: Phase Name'] || 'N/A', col1X + 25, detailsY);
  doc.text(property['Unit Type'] || 'N/A', col1X + 25, detailsY + lineHeight * 1);
  doc.text(property['Unit Status'] || 'N/A', col1X + 25, detailsY + lineHeight * 2);
  const price = property['Unit Price'] || property['Final Total Unit Price'] || 0;
  doc.text(formatCurrency(Number(price)), col1X + 25, detailsY + lineHeight * 3);
  const area = property['Unit Gross Area'];
  doc.text(area ? `${area} m²` : 'N/A', col1X + 25, detailsY + lineHeight * 4);
  doc.text(property['Number of rooms']?.toString() || 'N/A', col1X + 25, detailsY + lineHeight * 5);
  
  // Column 2
  doc.setFont('helvetica', 'bold');
  doc.text('Building:', col2X, detailsY);
  doc.text('Floor:', col2X, detailsY + lineHeight * 1);
  doc.text('Unit Number:', col2X, detailsY + lineHeight * 2);

  // Column 2 values
  doc.setFont('helvetica', 'normal');
  doc.text(property['Building Name'] || 'N/A', col2X + 30, detailsY);
  doc.text(property['Floor No.']?.toString() || 'N/A', col2X + 30, detailsY + lineHeight * 1);
  doc.text(property['Unit No.']?.toString() || 'N/A', col2X + 30, detailsY + lineHeight * 2);

  // Add description/notes section
  const descY = detailsY + lineHeight * 7;
  doc.setFillColor(245, 245, 245);
  doc.rect(10, descY, pageWidth - 20, 10, 'F');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Notes', 15, descY + 7);
  
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'italic');
  const description = "This property is part of our premium collection. Contact your agent for more information about viewing options and availability.";
  
  const splitText = doc.splitTextToSize(description, pageWidth - 30);
  doc.text(splitText, 15, descY + 20);
  
  // Add agent contact box at bottom
  const contactY = descY + 40;
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(1);
  doc.rect(10, contactY, pageWidth - 20, 30);
  
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Contact Information', 15, contactY + 10);
  
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Email: sales@propertymanagement.com', 15, contactY + 20);
  doc.text('Phone: +1 (555) 123-4567', pageWidth - 70, contactY + 20);
};

/**
 * Add an image to the PDF with proper loading
 */
const addImageToPdf = (
  doc: jsPDF, 
  imageUrl: string, 
  x: number, 
  y: number, 
  width: number, 
  height: number
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      try {
        // Add the loaded image to the PDF
        const imgData = getImageDataUrl(img);
        doc.addImage(imgData, 'JPEG', x, y, width, height);
        resolve();
      } catch (err) {
        console.error('Error adding image to PDF:', err);
        // If adding image fails, create a placeholder
        addPlaceholderImage(doc, x, y, width, height)
          .then(resolve)
          .catch(reject);
      }
    };
    
    img.onerror = (err) => {
      console.error('Error loading image:', err);
      // If loading fails, create a placeholder
      addPlaceholderImage(doc, x, y, width, height)
        .then(resolve)
        .catch(reject);
    };
    
    // Set the image src to trigger loading
    img.src = imageUrl;
    
    // For safety, set a timeout in case the image load hangs
    setTimeout(() => {
      if (!img.complete) {
        img.src = '';
        addPlaceholderImage(doc, x, y, width, height)
          .then(resolve)
          .catch(reject);
      }
    }, 3000);
  });
};

/**
 * Convert an image element to a data URL
 */
const getImageDataUrl = (img: HTMLImageElement): string => {
  // Create a canvas element to draw the image
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  
  // Draw the image to the canvas
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');
  
  ctx.drawImage(img, 0, 0, img.width, img.height);
  
  // Get the data URL from the canvas
  return canvas.toDataURL('image/jpeg');
};

/**
 * Add a summary table of all properties
 */
const addSummaryTable = (doc: jsPDF, properties: PropertyUnit[], primaryColor: number[]): void => {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Add title
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 20, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary of Properties', pageWidth / 2, 13, { align: 'center' });
  
  // Prepare data for table
  const tableData = properties.map(property => [
    property['Unit Name'] || 'N/A',
    property['Phase: Phase Name'] || 'N/A',
    property['Unit Type'] || 'N/A',
    property['Number of rooms']?.toString() || 'N/A',
    formatCurrency(Number(property['Unit Price'] || property['Final Total Unit Price'] || 0)),
    property['Unit Status'] || 'N/A',
  ]);
  
  // Add table
  autoTable(doc, {
    startY: 30,
    head: [['Property', 'Location', 'Type', 'Rooms', 'Price', 'Status']],
    body: tableData,
    headStyles: {
      fillColor: [primaryColor[0], primaryColor[1], primaryColor[2]],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { top: 30 },
  });
};

/**
 * Add a placeholder image for the property
 */
const addPlaceholderImage = async (
  doc: jsPDF, 
  x: number, 
  y: number, 
  width: number, 
  height: number
): Promise<void> => {
  // Create a colored rectangle as a placeholder
  doc.setFillColor(230, 230, 230);
  doc.rect(x, y, width, height, 'F');
  
  // Add placeholder text
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'italic');
  doc.text('Property Image', x + width/2, y + height/2, { align: 'center' });
};
