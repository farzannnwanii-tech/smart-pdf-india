const express = require('express');
const multer = require('multer');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const path = require('path');
const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Main Processing Route
app.post('/process', upload.fields([{ name: 'pdfs' }, { name: 'signature' }]), async (req, res) => {
    try {
        const pdfFiles = req.files['pdfs'];
        const signatureFile = req.files['signature'] ? req.files['signature'][0] : null;
        const { watermarkText, password } = req.body;

        if (!pdfFiles) return res.status(400).send('No PDF files uploaded.');

        // 1. Initialize merged PDF
        const mergedPdf = await PDFDocument.create();

        // 2. Loop through all uploaded PDFs (Merge Feature)
        for (const file of pdfFiles) {
            const pdf = await PDFDocument.load(file.buffer);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
        }

        const pages = mergedPdf.getPages();

        // 3. Add Custom Watermark (Logic)
        if (watermarkText) {
            const font = await mergedPdf.embedFont(StandardFonts.HelveticaBold);
            pages.forEach(page => {
                page.drawText(watermarkText, {
                    x: page.getWidth() / 2 - 100,
                    y: 50,
                    size: 25,
                    font: font,
                    color: rgb(0.7, 0.7, 0.7),
                    opacity: 0.5,
                });
            });
        }

        // 4. Add Digital Seal/Signature (Image Logic)
        if (signatureFile) {
            const sigImage = await mergedPdf.embedPng(signatureFile.buffer).catch(() => mergedPdf.embedJpg(signatureFile.buffer));
            const sigDims = sigImage.scale(0.3);
            const lastPage = pages[pages.length - 1]; // Sign on last page
            lastPage.drawImage(sigImage, {
                x: lastPage.getWidth() - sigDims.width - 50,
                y: 50,
                width: sigDims.width,
                height: sigDims.height,
            });
        }

        // 5. Apply Smart Metadata
        mergedPdf.setTitle('Processed by Smart PDF India');
        mergedPdf.setProducer('Smart PDF India Engine');

        // 6. Final Save
        const pdfBytes = await mergedPdf.save();

        // Send file to User
        res.contentType("application/pdf");
        res.setHeader('Content-Disposition', 'attachment; filename=SmartPDF_India_Result.pdf');
        res.send(Buffer.from(pdfBytes));

    } catch (err) {
        console.error(err);
        res.status(500).send("Processing Error: " + err.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Smart PDF India running on port ${PORT}`));
