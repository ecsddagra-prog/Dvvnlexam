import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

export async function generateCertificatePDF(data) {
  const { employeeName, examTitle, score, percentage, rank, date, certificateNumber, settings, logoBuffer, signatureBuffer } = data;

  return new Promise(async (resolve, reject) => {
    try {
      // PDFKit built-in fonts
      const validFonts = [
        'Courier', 'Courier-Bold', 'Courier-Oblique', 'Courier-BoldOblique',
        'Helvetica', 'Helvetica-Bold', 'Helvetica-Oblique', 'Helvetica-BoldOblique',
        'Times-Roman', 'Times-Bold', 'Times-Italic', 'Times-BoldItalic',
        'Symbol', 'ZapfDingbats'
      ];

      // Helper function to validate and fix font
      const validateFont = (font, fallback) => {
        if (!font || !validFonts.includes(font)) {
          return fallback;
        }
        return font;
      };

      // Use custom settings or defaults
      let certSettings = settings || {
        pageSize: 'A4',
        orientation: 'landscape',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        customWidth: null,
        customHeight: null,
        title: 'CERTIFICATE OF COMPLETION',
        subtitle: 'This is to certify that',
        recipientText: '{employee_name}',
        achievementText: 'has successfully completed the',
        examText: '{exam_title}',
        scoreText: 'with a score of {percentage}%',
        rankText: 'Rank: {rank}',
        dateText: 'Date: {date}',
        signatureText: 'Authorized Signature',
        titleFont: 'Helvetica-Bold',
        titleSize: 40,
        titleColor: '#1e40af',
        bodyFont: 'Helvetica',
        bodySize: 14,
        bodyColor: '#666',
        backgroundColor: '#ffffff',
        borderColor: '#000000',
        accentColor: '#1e40af',
        logoUrl: '',
        logoPosition: 'top-center',
        logoWidth: 150,
        logoHeight: 80,
        signatureUrl: '',
        signaturePosition: 'bottom-center',
        signatureWidth: 120,
        signatureHeight: 60,
        showBorder: true,
        showSignature: true,
        showDate: true,
        showScore: true,
        showRank: true
      };

      // Validate and fix fonts
      certSettings.titleFont = validateFont(certSettings.titleFont, 'Helvetica-Bold');
      certSettings.bodyFont = validateFont(certSettings.bodyFont, 'Helvetica');

      // Define page sizes in points (1 inch = 72 points, 1 cm = 28.35 points)
      const pageSizes = {
        'A4': [595.28, 841.89],
        'A3': [841.89, 1190.55],
        'A5': [420.94, 595.28],
        'Letter': [612, 792],
        'Legal': [612, 1008],
        'Executive': [522, 756],
        'Folio': [612, 936],
        'Tabloid': [792, 1224],
        'Custom': certSettings.customWidth && certSettings.customHeight ?
          [certSettings.customWidth * 28.35, certSettings.customHeight * 28.35] : [595.28, 841.89]
      };

      const selectedSize = pageSizes[certSettings.pageSize] || pageSizes['A4'];
      const pageSize = certSettings.orientation === 'landscape' ? [selectedSize[1], selectedSize[0]] : selectedSize;

      const doc = new PDFDocument({
        size: pageSize,
        margin: certSettings.margins?.top || 50
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Set background color
      if (certSettings.backgroundColor && certSettings.backgroundColor !== '#ffffff') {
        doc.rect(0, 0, doc.page.width, doc.page.height).fill(certSettings.backgroundColor);
      }

      // Border
      if (certSettings.showBorder) {
        doc.strokeColor(certSettings.borderColor || '#000000');
        doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60).stroke();
        doc.rect(35, 35, doc.page.width - 70, doc.page.height - 70).stroke();
      }

      let currentY = 100;

      // Logo
      if (logoBuffer) {
        try {
          const logoX = (doc.page.width - (certSettings.logoWidth || 150)) / 2; // Center horizontally
          doc.image(logoBuffer, logoX, currentY, {
            width: certSettings.logoWidth || 150,
            height: certSettings.logoHeight || 80
          });
          currentY += (certSettings.logoHeight || 80) + 20;
        } catch (error) {
          console.log('Logo rendering failed:', error.message);
          currentY += 100; // Skip space even if logo fails
        }
      }

      // Title
      doc.font(certSettings.titleFont || 'Helvetica-Bold')
         .fontSize(certSettings.titleSize || 40)
         .fillColor(certSettings.titleColor || '#1e40af')
         .text(certSettings.title || 'CERTIFICATE OF COMPLETION', 0, currentY, { align: 'center' });

      currentY += 80;

      // Subtitle
      doc.font(certSettings.bodyFont || 'Helvetica')
         .fontSize(certSettings.bodySize || 14)
         .fillColor(certSettings.bodyColor || '#666')
         .text(certSettings.subtitle || 'This is to certify that', 0, currentY, { align: 'center' });

      currentY += 30;

      // Employee Name
      const recipientText = (certSettings.recipientText || '{employee_name}').replace('{employee_name}', employeeName);
      doc.font(certSettings.titleFont || 'Helvetica-Bold')
         .fontSize((certSettings.titleSize || 40) - 8)
         .fillColor(certSettings.accentColor || '#1e40af')
         .text(recipientText, 0, currentY, { align: 'center' });

      currentY += 40;

      // Achievement Text
      doc.font(certSettings.bodyFont || 'Helvetica')
         .fontSize(certSettings.bodySize || 14)
         .fillColor(certSettings.bodyColor || '#666')
         .text(certSettings.achievementText || 'has successfully completed the', 0, currentY, { align: 'center' });

      currentY += 30;

      // Exam Title
      const examText = (certSettings.examText || '{exam_title}').replace('{exam_title}', examTitle);
      doc.font(certSettings.titleFont || 'Helvetica-Bold')
         .fontSize((certSettings.titleSize || 40) - 16)
         .fillColor(certSettings.accentColor || '#1e40af')
         .text(examText, 0, currentY, { align: 'center' });

      currentY += 50;

      // Score Details
      if (certSettings.showScore) {
        const scoreText = (certSettings.scoreText || 'with a score of {percentage}%')
          .replace('{percentage}', percentage)
          .replace('{score}', score);
        doc.font(certSettings.bodyFont || 'Helvetica')
           .fontSize((certSettings.bodySize || 14) + 2)
           .fillColor(certSettings.bodyColor || '#000')
           .text(scoreText, 0, currentY, { align: 'center' });
        currentY += 30;
      }

      // Rank
      if (certSettings.showRank && rank) {
        const rankText = (certSettings.rankText || 'Rank: {rank}').replace('{rank}', rank);
        doc.font(certSettings.bodyFont || 'Helvetica')
           .fontSize(certSettings.bodySize || 14)
           .fillColor(certSettings.bodyColor || '#666')
           .text(rankText, 0, currentY, { align: 'center' });
        currentY += 30;
      }

      // Date
      if (certSettings.showDate) {
        const dateText = (certSettings.dateText || 'Date: {date}').replace('{date}', new Date(date).toLocaleDateString('en-IN'));
        doc.font(certSettings.bodyFont || 'Helvetica')
           .fontSize((certSettings.bodySize || 14) - 2)
           .fillColor(certSettings.bodyColor || '#666')
           .text(dateText, 0, currentY, { align: 'center' });
        currentY += 40;
      }

      // Signature Image
      if (signatureBuffer && certSettings.showSignature) {
        try {
          const signatureX = (doc.page.width - (certSettings.signatureWidth || 120)) / 2; // Center horizontally
          const signatureY = doc.page.height - 140; // Position near bottom
          doc.image(signatureBuffer, signatureX, signatureY, {
            width: certSettings.signatureWidth || 120,
            height: certSettings.signatureHeight || 60
          });
        } catch (error) {
          console.log('Signature rendering failed:', error.message);
          // Fallback to signature line if image fails
          doc.strokeColor(certSettings.borderColor || '#000000');
          doc.moveTo(100, doc.page.height - 120).lineTo(250, doc.page.height - 120).stroke();
          doc.font(certSettings.bodyFont || 'Helvetica')
             .fontSize((certSettings.bodySize || 14) - 4)
             .fillColor(certSettings.bodyColor || '#666')
             .text(certSettings.signatureText || 'Authorized Signature', 100, doc.page.height - 110);
        }
      }

      // QR Code
      try {
        const qrData = `Certificate: ${certificateNumber}\nName: ${employeeName}\nExam: ${examTitle}\nScore: ${percentage}%`;
        const qrImage = await QRCode.toDataURL(qrData);
        const qrBuffer = Buffer.from(qrImage.split(',')[1], 'base64');
        doc.image(qrBuffer, doc.page.width - 150, doc.page.height - 150, { width: 100 });
      } catch (qrError) {
        console.log('QR Code generation failed:', qrError.message);
      }

      // Certificate Number
      doc.font(certSettings.bodyFont || 'Helvetica')
         .fontSize((certSettings.bodySize || 14) - 4)
         .fillColor('#999')
         .text(`Certificate No: ${certificateNumber}`, 50, doc.page.height - 80);

      // Signature Line (only if no signature image)
      if (certSettings.showSignature && !certSettings.signatureUrl) {
        doc.strokeColor(certSettings.borderColor || '#000000');
        doc.moveTo(100, doc.page.height - 120).lineTo(250, doc.page.height - 120).stroke();
        doc.font(certSettings.bodyFont || 'Helvetica')
           .fontSize((certSettings.bodySize || 14) - 4)
           .fillColor(certSettings.bodyColor || '#666')
           .text(certSettings.signatureText || 'Authorized Signature', 100, doc.page.height - 110);
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
