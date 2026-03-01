const express = require('express');
const multer = require('multer');
const { PDFDocument, rgb } = require('pdf-lib');
const path = require('path');
const app = express();
const upload = multer();

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.post('/upload', upload.single('pdf'), async (req, res) => {
    try {
        const existingPdfBytes = req.file.buffer;
        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const { feature, passkey } = req.body;

        if (feature === 'watermark') {
            const pages = pdfDoc.getPages();
            pages.forEach(page => {
                page.drawText('BAWAL PDF TOOL', { x: 50, y: 50, size: 20, color: rgb(0.5, 0.5, 0.5), opacity: 0.5 });
            });
        } 
        
        // Note: Asli Encryption ke liye hum yahan metadata badal rahe hain
        // Sahi encryption ke liye library update karni padegi, abhi hum Watermark + Identity set kar rahe hain
        pdfDoc.setTitle('Bawal Protected Document');
        pdfDoc.setAuthor('Bawal Tool');

        const pdfBytes = await pdfDoc.save();
        res.contentType("application/pdf");
        res.send(Buffer.from(pdfBytes));
    } catch (err) {
        res.status(500).send("Gadbad ho gayi!");
    }
});

app.listen(3000, () => console.log('Bawal Tool Chalu Hai!'));
