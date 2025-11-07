import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { supabase } from './supabase.js';

export async function generateCertificate(result) {
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape' });
  const chunks = [];

  doc.on('data', chunk => chunks.push(chunk));

  return new Promise(async (resolve, reject) => {
    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(chunks);
      const fileName = `certificate_${result.user_id}_${result.exam_id}_${Date.now()}.pdf`;

      const { data, error } = await supabase.storage
        .from('certificates')
        .upload(fileName, pdfBuffer, { contentType: 'application/pdf' });

      if (error) return reject(error);

      const { data: urlData } = supabase.storage
        .from('certificates')
        .getPublicUrl(fileName);

      resolve(urlData.publicUrl);
    });

    const qrData = await QRCode.toDataURL(`${process.env.SUPABASE_URL}/verify/${result.id}`);

    doc.fontSize(30).text('CERTIFICATE OF COMPLETION', { align: 'center' });
    doc.moveDown();
    doc.fontSize(16).text(`This is to certify that`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(24).text(result.users.name, { align: 'center', underline: true });
    doc.moveDown();
    doc.fontSize(16).text(`Employee ID: ${result.users.employee_id}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Has successfully completed the examination with`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(20).text(`Score: ${result.percentage.toFixed(2)}% | Rank: ${result.rank}`, { align: 'center' });
    doc.moveDown(2);
    doc.image(qrData, doc.page.width / 2 - 50, doc.y, { width: 100 });

    doc.end();
  });
}
