import { jsPDF } from 'jspdf';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import type { Inspeccion } from '../types';
import { getRoomArea, isFachadaOCierre } from './areaHelper';

/**
 * Generates a professional, branded PDF report for a given inspection.
 * This is runs 100% offline in the browser.
 */
export function generateInspeccionPDF(inspeccion: Inspeccion): jsPDF {
  // Create PDF document (A4, portrait, dimensions in mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2); // 170mm
  let y = 20;

  // Colors
  const primaryColor = [16, 185, 129]; // Emerald (#10b981)
  const primaryDark = [6, 78, 59];    // Dark Emerald
  const textDark = [15, 23, 42];       // Slate 900
  const textGray = [71, 85, 105];     // Slate 600
  const bgLight = [248, 250, 252];     // Slate 50
  const borderLight = [226, 232, 240]; // Slate 200

  // Helper to add footer to all pages
  const addFooter = (currentPage: number, totalPages: number) => {
    doc.setPage(currentPage);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate 400
    
    // Line above footer
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    
    // Left text
    doc.text('Reporte de Inspección - Asesorías El Trébol', margin, pageHeight - 10);
    
    // Right page number
    const pageStr = `Página ${currentPage} de ${totalPages}`;
    doc.text(pageStr, pageWidth - margin - doc.getTextWidth(pageStr), pageHeight - 10);
  };

  // Helper to check vertical space and add new page if needed
  const checkSpace = (heightNeeded: number) => {
    if (y + heightNeeded > pageHeight - 25) {
      doc.addPage();
      y = 20;
      drawSubsequentHeader();
    }
  };

  // Minimal header for subsequent pages
  const drawSubsequentHeader = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text(`Reporte de Inspección - Asesorías El Trébol - Cliente: ${inspeccion.nombreCliente || 'Sin nombre'}`, margin, 12);
    
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, 14, pageWidth - margin, 14);
    
    y = 20; // reset y to start of page content
  };

  // --- FIRST PAGE HEADER ---
  
  // 1. Vector Clover Emblem (4-Leaf Clover)
  // Stem (slightly curved)
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(1.0);
  doc.line(26, 28.5, 25.5, 31);
  doc.line(25.5, 31, 24.5, 33.5);
  // 4 Leaves
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.circle(26, 25.3, 2.1, 'F');   // Top
  doc.circle(26, 29.7, 2.1, 'F');   // Bottom
  doc.circle(23.8, 27.5, 2.1, 'F');  // Left
  doc.circle(28.2, 27.5, 2.1, 'F');  // Right

  // Corporate Brand Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  doc.text('Asesorías El Trébol', 35, 28);

  // Subtitle & Slogan
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  doc.text('Evaluaciones de Confianza para tu Crédito Hipotecario', 35, 33);
  
  const docSubtitle = inspeccion.tipo === 'pre_inspeccion' 
    ? 'Reporte de Pre-Inspección de Crédito Hipotecario' 
    : 'Control de Inspecciones de Seguros';
  doc.text(docSubtitle, 35, 37);

  if (inspeccion.folioNumber) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
    const folioStr = `FOLIO #${String(inspeccion.folioNumber).padStart(3, '0')}`;
    doc.text(folioStr, pageWidth - margin - doc.getTextWidth(folioStr), 28);
  }

  // Decorative header line
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(1);
  doc.line(margin, 40, pageWidth - margin, 40);

  y = 48;

  // --- CLIENT METADATA BLOCK ---
  const isPreInspeccion = inspeccion.tipo === 'pre_inspeccion';
  const boxHeight = isPreInspeccion ? 38 : 51;

  checkSpace(boxHeight + 6);
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, contentWidth, boxHeight, 4, 4, 'FD');

  // Metadata title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  doc.text('DATOS GENERALES DE LA INSPECCIÓN', margin + 6, y + 6);

  // Left Column
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  
  doc.text('Banco:', margin + 6, y + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(inspeccion.banco || 'Sin banco', margin + 28, y + 14);

  doc.setFont('helvetica', 'bold');
  doc.text('Cliente:', margin + 6, y + 21);
  doc.setFont('helvetica', 'normal');
  doc.text(inspeccion.nombreCliente || 'Sin nombre', margin + 28, y + 21);

  if (isPreInspeccion) {
    doc.setFont('helvetica', 'bold');
    doc.text('Siniestro:', margin + 6, y + 28);
    doc.setFont('helvetica', 'normal');
    doc.text(inspeccion.siniestro || 'Sin siniestro', margin + 28, y + 28);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.text('RUT:', margin + 6, y + 28);
    doc.setFont('helvetica', 'normal');
    doc.text(inspeccion.rut || 'No registrado', margin + 28, y + 28);

    doc.setFont('helvetica', 'bold');
    doc.text('Dirección:', margin + 6, y + 35);
    doc.setFont('helvetica', 'normal');
    const addressLines = doc.splitTextToSize(inspeccion.direccion || 'No registrada', contentWidth - 110);
    doc.text(addressLines, margin + 28, y + 35);

    doc.setFont('helvetica', 'bold');
    doc.text('Siniestro:', margin + 6, y + 42);
    doc.setFont('helvetica', 'normal');
    doc.text(inspeccion.siniestro || 'Sin siniestro', margin + 28, y + 42);
  }

  // Right Column
  doc.setFont('helvetica', 'bold');
  doc.text('Fecha:', margin + 105, y + 14);
  doc.setFont('helvetica', 'normal');
  
  let formattedDate = inspeccion.fecha;
  try {
    const [year, month, day] = inspeccion.fecha.split('-');
    if (year && month && day) {
      formattedDate = `${day}/${month}/${year}`;
    }
  } catch (e) {}
  doc.text(formattedDate, margin + 122, y + 14);

  if (!isPreInspeccion) {
    doc.setFont('helvetica', 'bold');
    doc.text('Correo:', margin + 105, y + 21);
    doc.setFont('helvetica', 'normal');
    doc.text(inspeccion.correo || 'No registrado', margin + 122, y + 21);
  }

  const estadoY = isPreInspeccion ? 21 : 28;
  doc.setFont('helvetica', 'bold');
  doc.text('Estado:', margin + 105, y + estadoY);
  
  const isFinalizada = inspeccion.estado === 'finalizada';
  doc.setFont('helvetica', 'bold');
  if (isFinalizada) {
    doc.setTextColor(16, 185, 129); // green
    doc.text('COMPLETADA', margin + 122, y + estadoY);
  } else {
    doc.setTextColor(245, 158, 11); // amber
    doc.text('BORRADOR', margin + 122, y + estadoY);
  }
  doc.setTextColor(textDark[0], textDark[1], textDark[2]); // reset

  const servicioY = isPreInspeccion ? 28 : 35;
  doc.setFont('helvetica', 'bold');
  doc.text('Servicio:', margin + 105, y + servicioY);
  doc.setFont('helvetica', 'bold');
  if (isPreInspeccion) {
    doc.setTextColor(56, 189, 248); // sky blue
    doc.text('PRE-INSPECCIÓN', margin + 122, y + servicioY);
  } else {
    doc.setTextColor(16, 185, 129); // emerald green
    doc.text('INS. SEGURO', margin + 122, y + servicioY);
  }
  doc.setTextColor(textDark[0], textDark[1], textDark[2]); // reset

  y += (boxHeight + 10); // Spacing after metadata box

  // --- SUMMARY TABLE ---
  if (inspeccion.dependencias && inspeccion.dependencias.length > 0) {
    checkSpace(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
    doc.text('RESUMEN DE DEPENDENCIAS', margin, y);
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.4);
    doc.line(margin, y + 2, pageWidth - margin, y + 2);
    y += 8;

    // Table header row
    const colN = margin;
    const colName = margin + 8;
    const colMed = margin + 90;
    const colArea = pageWidth - margin - 18;

    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('#', colN + 1, y + 5);
    doc.text('Dependencia', colName, y + 5);
    doc.text('Medidas', colMed, y + 5);
    doc.text('M²', colArea, y + 5);
    y += 7;

    // Table rows
    let totalM2Summary = 0;
    inspeccion.dependencias.forEach((dep, idx) => {
      checkSpace(7);
      const area = getRoomArea(dep.largo, dep.ancho, dep.alto, dep.nombre);
      totalM2Summary += area;
      const rowBg = idx % 2 === 0 ? bgLight : [255, 255, 255];
      doc.setFillColor(rowBg[0], rowBg[1], rowBg[2]);
      doc.rect(margin, y, contentWidth, 6.5, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.text(String(idx + 1), colN + 1, y + 4.5);
      
      const nameText = doc.splitTextToSize(dep.nombre, 78)[0]; // truncate if too long
      doc.text(nameText, colName, y + 4.5);

      const medStr = dep.largo === 0 ? `${dep.ancho}x${dep.alto}cm` :
                     dep.ancho === 0 ? `${dep.largo}x${dep.alto}cm` :
                     `${dep.largo}x${dep.ancho}x${dep.alto}cm`;
      doc.text(medStr, colMed, y + 4.5);

      const isFachada = isFachadaOCierre(dep.nombre);
      if (isFachada) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(textGray[0], textGray[1], textGray[2]);
        doc.text('-', colArea + 2, y + 4.5);
      } else {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
        doc.text(area.toFixed(2), colArea, y + 4.5);
      }
      
      // Damage count chip
      if (dep.danos && dep.danos.length > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(185, 28, 28);
        doc.text(`⚠ ${dep.danos.length} daño${dep.danos.length > 1 ? 's' : ''}`, colMed + 38, y + 4.5);
      }
      
      y += 6.5;
    });

    // Totals row
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text('TOTAL SUPERFICIE', colName, y + 5);
    doc.text(totalM2Summary.toFixed(2) + ' M²', colArea - 8, y + 5);
    y += 14;
  }

  // --- DEPENDENCIES (DEPENDENCIAS) ---
  
  // Sections Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('DETALLE DE DEPENDENCIAS E INSPECCIÓN', margin, y);
  
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.3);
  doc.line(margin, y + 2, pageWidth - margin, y + 2);
  
  y += 10;

  if (inspeccion.dependencias.length === 0) {
    checkSpace(20);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(textGray[0], textGray[1], textGray[2]);
    doc.text('No se registraron dependencias en esta inspección.', margin, y);
    y += 15;
  } else {
    inspeccion.dependencias.forEach((dep, index) => {
      // Title of Dependency
      checkSpace(25);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
      doc.text(`${index + 1}. ${dep.nombre}`, margin, y);

      // Area calculations
      const areaM2 = getRoomArea(dep.largo, dep.ancho, dep.alto, dep.nombre);
      
      // Dimensions
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      
      let dimsStr = `Dimensiones: ${dep.largo} x ${dep.ancho} x ${dep.alto} cm (Largo x Ancho x Alto)`;
      if (dep.largo === 0 || isNaN(dep.largo)) {
        dimsStr = `Dimensiones: ${dep.ancho} x ${dep.alto} cm (Ancho x Alto)`;
      } else if (dep.ancho === 0 || isNaN(dep.ancho)) {
        dimsStr = `Dimensiones: ${dep.largo} x ${dep.alto} cm (Largo x Alto)`;
      }
      const isFachada = isFachadaOCierre(dep.nombre);
      if (isFachada) {
        doc.text(`${dimsStr}   |   (Fachada / Cierre)`, margin, y + 6);
      } else {
        const areaStr = `Área: ${areaM2.toFixed(2)} M²`;
        doc.text(`${dimsStr}   |   ${areaStr}`, margin, y + 6);
      }
      
      y += 12;

      // Render General Photos
      if (dep.fotosGenerales && dep.fotosGenerales.length > 0) {
        checkSpace(15);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(textGray[0], textGray[1], textGray[2]);
        doc.text('Fotos Generales de Referencia:', margin, y);
        y += 5;

        const boxWidth = 80;
        const boxHeight = 60;
        const gap = 8;
        
        for (let i = 0; i < dep.fotosGenerales.length; i += 2) {
          checkSpace(boxHeight + 10);
          
          // Image 1
          try {
            const imgProperties = doc.getImageProperties(dep.fotosGenerales[i]);
            const originalWidth = imgProperties.width;
            const originalHeight = imgProperties.height;
            const aspectRatio = originalWidth / originalHeight;

            let displayWidth = boxWidth;
            let displayHeight = boxHeight;

            if (aspectRatio > (boxWidth / boxHeight)) {
              displayWidth = boxWidth;
              displayHeight = boxWidth / aspectRatio;
            } else {
              displayHeight = boxHeight;
              displayWidth = boxHeight * aspectRatio;
            }

            const xOffset = (boxWidth - displayWidth) / 2;
            const yOffset = (boxHeight - displayHeight) / 2;

            doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
            doc.setLineWidth(0.1);
            doc.rect(margin, y, boxWidth, boxHeight);

            doc.addImage(dep.fotosGenerales[i], dep.fotosGenerales[i].includes('png') ? 'PNG' : 'JPEG', margin + xOffset, y + yOffset, displayWidth, displayHeight);
          } catch (e) {
            console.error('Error drawing general image 1:', e);
          }

          // Image 2
          if (i + 1 < dep.fotosGenerales.length) {
            try {
              const imgProperties = doc.getImageProperties(dep.fotosGenerales[i + 1]);
              const originalWidth = imgProperties.width;
              const originalHeight = imgProperties.height;
              const aspectRatio = originalWidth / originalHeight;

              let displayWidth = boxWidth;
              let displayHeight = boxHeight;

              if (aspectRatio > (boxWidth / boxHeight)) {
                displayWidth = boxWidth;
                displayHeight = boxWidth / aspectRatio;
              } else {
                displayHeight = boxHeight;
                displayWidth = boxHeight * aspectRatio;
              }

              const xOffset = (boxWidth - displayWidth) / 2;
              const yOffset = (boxHeight - displayHeight) / 2;

              doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
              doc.setLineWidth(0.1);
              doc.rect(margin + boxWidth + gap, y, boxWidth, boxHeight);

              doc.addImage(dep.fotosGenerales[i + 1], dep.fotosGenerales[i + 1].includes('png') ? 'PNG' : 'JPEG', margin + boxWidth + gap + xOffset, y + yOffset, displayWidth, displayHeight);
            } catch (e) {
              console.error('Error drawing general image 2:', e);
            }
          }

          y += boxHeight + gap;
        }
        y += 2;
      }

      // Render Structured Damages
      if (dep.danos && dep.danos.length > 0) {
        checkSpace(12);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(185, 28, 28); // Dark Red
        doc.text('Registro de Daños Detectados:', margin, y);
        y += 5;

         dep.danos.forEach((d) => {
           const labelPrefix = d.ubicacion ? `Daño [Ubicación: ${d.ubicacion.toUpperCase()}]: ` : 'Daño: ';
           const damagesStr = `${labelPrefix}${d.descripcion}`;
           const damagesLines = doc.splitTextToSize(damagesStr, contentWidth - 8);
           const textHeight = damagesLines.length * 5;

          checkSpace(textHeight + 10);

          // Draw damage box callout
          doc.setFillColor(254, 242, 242); // very light red/pink
          doc.setDrawColor(239, 68, 68);    // red border accent
          doc.setLineWidth(0.8);
          doc.rect(margin, y, contentWidth, textHeight + 4, 'F');
          doc.line(margin, y, margin, y + textHeight + 4);
          
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(185, 28, 28); // Dark Red
          doc.text(damagesLines, margin + 4, y + 5);
          
          y += textHeight + 8;

          // Render photos of this specific damage
          if (d.fotos && d.fotos.length > 0) {
            const boxWidth = 80;
            const boxHeight = 60;
            const gap = 8;
            
            for (let j = 0; j < d.fotos.length; j += 2) {
              checkSpace(boxHeight + 10);
              
              // Image 1
              try {
                const imgProperties = doc.getImageProperties(d.fotos[j]);
                const originalWidth = imgProperties.width;
                const originalHeight = imgProperties.height;
                const aspectRatio = originalWidth / originalHeight;

                let displayWidth = boxWidth;
                let displayHeight = boxHeight;

                if (aspectRatio > (boxWidth / boxHeight)) {
                  displayWidth = boxWidth;
                  displayHeight = boxWidth / aspectRatio;
                } else {
                  displayHeight = boxHeight;
                  displayWidth = boxHeight * aspectRatio;
                }

                const xOffset = (boxWidth - displayWidth) / 2;
                const yOffset = (boxHeight - displayHeight) / 2;

                doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
                doc.setLineWidth(0.1);
                doc.rect(margin, y, boxWidth, boxHeight);

                doc.addImage(d.fotos[j], d.fotos[j].includes('png') ? 'PNG' : 'JPEG', margin + xOffset, y + yOffset, displayWidth, displayHeight);
              } catch (e) {
                console.error('Error drawing damage image 1:', e);
              }

              // Image 2
              if (j + 1 < d.fotos.length) {
                try {
                  const imgProperties = doc.getImageProperties(d.fotos[j + 1]);
                  const originalWidth = imgProperties.width;
                  const originalHeight = imgProperties.height;
                  const aspectRatio = originalWidth / originalHeight;

                  let displayWidth = boxWidth;
                  let displayHeight = boxHeight;

                  if (aspectRatio > (boxWidth / boxHeight)) {
                    displayWidth = boxWidth;
                    displayHeight = boxWidth / aspectRatio;
                  } else {
                    displayHeight = boxHeight;
                    displayWidth = boxHeight * aspectRatio;
                  }

                  const xOffset = (boxWidth - displayWidth) / 2;
                  const yOffset = (boxHeight - displayHeight) / 2;

                  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
                  doc.setLineWidth(0.1);
                  doc.rect(margin + boxWidth + gap, y, boxWidth, boxHeight);

                  doc.addImage(d.fotos[j + 1], d.fotos[j + 1].includes('png') ? 'PNG' : 'JPEG', margin + boxWidth + gap + xOffset, y + yOffset, displayWidth, displayHeight);
                } catch (e) {
                  console.error('Error drawing damage image 2:', e);
                }
              }

              y += boxHeight + gap;
            }
            y += 2; // small spacer between damages
          }
        });
        
        y += 4;
      } else {
        // No damages in this room
        checkSpace(12);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(textGray[0], textGray[1], textGray[2]);
        doc.text('Sin registro de daños estructurales o cosméticos.', margin, y);
        y += 8;
      }
    });
  }

  checkSpace(32);
  
  // Highlight box for final totals
  doc.setFillColor(209, 250, 229); // light green (#d1fae5)
  doc.setDrawColor(16, 185, 129);   // emerald border (#10b981)
  doc.setLineWidth(1);
  doc.roundedRect(margin, y, contentWidth, 22, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  
  const totalM2Text = `TOTAL DE METROS CUADRADOS DE LA VIVIENDA: ${(inspeccion.metrosCuadradosTotales ?? 0).toFixed(2)} M²`;
  
  // Center text in box
  const textWidth = doc.getTextWidth(totalM2Text);
  const textX = margin + (contentWidth - textWidth) / 2;
  doc.text(totalM2Text, textX, y + 13);

  // Signatures / Closing statement
  y += 32;
  checkSpace(25);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  
  const disclaimerText = 'Este reporte fue generado de forma 100% digital y local por el sistema de inspecciones de Asesorías El Trébol. Los datos contenidos representan fielmente el estado físico del inmueble inspeccionado.';
  const disclaimerLines = doc.splitTextToSize(disclaimerText, contentWidth);
  doc.text(disclaimerLines, margin, y);

  // Apply footer page numbers & watermarks to all pages
  const totalPages = doc.getNumberOfPages();
  const isDraft = inspeccion.estado !== 'finalizada';

  for (let i = 1; i <= totalPages; i++) {
    addFooter(i, totalPages);

    if (isDraft) {
      doc.setPage(i);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(50);
      doc.setTextColor(252, 165, 165); // soft red watermark
      // Draw watermark text in center of page
      doc.text('BORRADOR', pageWidth / 2, pageHeight / 2, { angle: 45, align: 'center' });
    }
  }

  return doc;
}

/**
 * Share PDF report via Web Share API or trigger standard download.
 */
export async function shareOrDownloadPDF(inspeccion: Inspeccion, doc: jsPDF) {
  const clientName = inspeccion?.nombreCliente || 'Cliente';
  const dateStr = inspeccion?.fecha || 'fecha';
  const cleanClientName = clientName.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Reporte_Trebol_${cleanClientName}_${dateStr}.pdf`;

  // 1. Check if running as a Native App (Capacitor Android/iOS)
  if (Capacitor.isNativePlatform()) {
    try {
      // jsPDF datauristring is like "data:application/pdf;filename=generated.pdf;base64,JVBER..."
      const pdfDataUri = doc.output('datauristring');
      const base64Data = pdfDataUri.split(',')[1];
      
      // Write to the temporary cache directory on the phone
      const result = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Cache
      });

      // Share file natively (opens Android system sheet for WhatsApp, Email, etc.)
      try {
        await Share.share({
          title: `Reporte de Inspección - ${clientName}`,
          text: `Adjunto reporte de inspección de seguros de créditos hipotecarios por Asesorías El Trébol.`,
          url: result.uri // Pass native file URI
        });
      } catch (shareErr) {
        const errStr = String(shareErr).toLowerCase();
        if (errStr.includes('cancel') || errStr.includes('abort') || (shareErr as Error).name === 'AbortError') {
          console.log('User cancelled native share dialog.');
          return;
        }
        console.error('Share dialog failed, file was saved to cache:', shareErr);
      }
      return;
    } catch (error) {
      const errStr = String(error).toLowerCase();
      if (errStr.includes('cancel') || errStr.includes('abort') || (error as Error).name === 'AbortError') {
        console.log('User cancelled share operation.');
        return;
      }
      console.error('Error sharing natively via Capacitor:', error);
      alert('Error al generar o compartir el reporte PDF: ' + (error instanceof Error ? error.message : String(error)));
      return;
    }
  }

  // 2. Web browser fallback (PWA / desktop browser)
  const pdfBlob = doc.output('blob');
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([pdfBlob], filename, { type: 'application/pdf' })] })) {
    try {
      const file = new File([pdfBlob], filename, { type: 'application/pdf' });
      await navigator.share({
        files: [file],
        title: `Reporte de Inspección - ${inspeccion.nombreCliente}`,
        text: `Adjunto reporte de inspección de seguros de créditos hipotecarios para ${inspeccion.nombreCliente} por Asesorías El Trébol.`
      });
      console.log('PDF compartido exitosamente via Web Share.');
      return;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('El usuario canceló la opción de compartir.');
        return;
      }
      console.error('Error al compartir mediante Web Share API:', error);
    }
  }

  // Fallback: Trigger direct file download in browser
  const downloadUrl = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);
}
export default generateInspeccionPDF;
