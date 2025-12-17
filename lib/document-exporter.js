// AI Career Customizer - Document Exporter
// Handles PDF and DOCX export functionality (CSP-compliant for Chrome Extensions)

export class DocumentExporter {
    constructor() {
        // No external dependencies needed
    }

    // ===== PDF Export =====
    async exportToPdf(content, filename, title = '') {
        const htmlContent = this.markdownToHtml(content);

        // Debug: log content
        console.log('PDF Export - Content length:', content?.length);
        console.log('PDF Export - HTML Content length:', htmlContent?.length);

        const fullHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${this.escapeHtml(title || filename)}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #1a1a1a;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
            background: white;
        }
        
        h1 {
            font-size: 20pt;
            font-weight: 700;
            margin-bottom: 12pt;
            color: #111;
            border-bottom: 2px solid #333;
            padding-bottom: 6pt;
        }
        
        h2 {
            font-size: 14pt;
            font-weight: 600;
            margin-top: 16pt;
            margin-bottom: 8pt;
            color: #222;
            border-bottom: 1px solid #ddd;
            padding-bottom: 4pt;
        }
        
        h3 {
            font-size: 12pt;
            font-weight: 600;
            margin-top: 12pt;
            margin-bottom: 6pt;
            color: #333;
        }
        
        p { margin-bottom: 10pt; }
        ul, ol { margin-left: 20pt; margin-bottom: 10pt; }
        li { margin-bottom: 4pt; }
        strong { font-weight: 600; }
        em { font-style: italic; }
        
        .toolbar {
            position: fixed;
            top: 0; left: 0; right: 0;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            color: white;
            padding: 15px 25px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 1000;
            box-shadow: 0 2px 15px rgba(0,0,0,0.2);
        }
        
        .toolbar-text { font-size: 14px; }
        
        .toolbar-btn {
            background: white;
            color: #6366f1;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .toolbar-btn:hover { background: #f0f0f0; transform: scale(1.02); }
        
        .content { margin-top: 70px; }
        
        @media print {
            .toolbar { display: none !important; }
            .content { margin-top: 0; }
            body { padding: 0; }
        }
    </style>
</head>
<body>
    <div class="toolbar">
        <span class="toolbar-text">📄 Use Ctrl+P (Cmd+P on Mac) or click the button to save as PDF</span>
        <button class="toolbar-btn" id="printBtn">🖨️ Print / Save PDF</button>
    </div>
    <div class="content">
        ${htmlContent || '<p>No content available</p>'}
    </div>
    <script>
        document.getElementById('printBtn').addEventListener('click', function() {
            window.print();
        });
        
        // Also listen for keyboard shortcut
        document.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                // Let the browser handle it
            }
        });
    </script>
</body>
</html>`;

        // Use data URL which allows inline scripts (unlike blob: URLs)
        const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(fullHtml);

        // Use chrome.tabs API if available
        if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
            await chrome.tabs.create({ url: dataUrl });
        } else {
            window.open(dataUrl, '_blank');
        }
    }

    // ===== DOCX Export =====
    async exportToDocx(content, filename, title = '') {
        // Create a simple DOCX-compatible XML structure
        // This is a minimal DOCX implementation that works without external libraries
        const docxContent = this.createDocxContent(content, title);
        const blob = await this.createDocxBlob(docxContent);
        this.downloadBlob(blob, `${filename}.docx`);
    }

    createDocxContent(markdown, title) {
        // Parse markdown and create document.xml content
        const lines = markdown.split('\n');
        let bodyContent = '';

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            if (trimmed.startsWith('### ')) {
                bodyContent += this.createDocxHeading(trimmed.substring(4), 3);
            } else if (trimmed.startsWith('## ')) {
                bodyContent += this.createDocxHeading(trimmed.substring(3), 2);
            } else if (trimmed.startsWith('# ')) {
                bodyContent += this.createDocxHeading(trimmed.substring(2), 1);
            } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                bodyContent += this.createDocxBullet(this.parseDocxText(trimmed.substring(2)));
            } else {
                bodyContent += this.createDocxParagraph(this.parseDocxText(trimmed));
            }
        }

        return bodyContent;
    }

    createDocxHeading(text, level) {
        const styleMap = { 1: 'Heading1', 2: 'Heading2', 3: 'Heading3' };
        return `<w:p><w:pPr><w:pStyle w:val="${styleMap[level]}"/></w:pPr><w:r><w:t>${this.escapeXml(text)}</w:t></w:r></w:p>`;
    }

    createDocxParagraph(textContent) {
        return `<w:p>${textContent}</w:p>`;
    }

    createDocxBullet(textContent) {
        return `<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr>${textContent}</w:p>`;
    }

    parseDocxText(text) {
        // First, strip any remaining markdown that shouldn't be there
        let cleanText = this.stripMarkdownSymbols(text);

        let result = '';
        let i = 0;
        let currentText = '';

        while (i < cleanText.length) {
            // Bold: **text**
            if (cleanText.substring(i, i + 2) === '**') {
                if (currentText) {
                    result += `<w:r><w:t xml:space="preserve">${this.escapeXml(currentText)}</w:t></w:r>`;
                    currentText = '';
                }
                const endIndex = cleanText.indexOf('**', i + 2);
                if (endIndex !== -1) {
                    const boldText = cleanText.substring(i + 2, endIndex);
                    result += `<w:r><w:rPr><w:b/></w:rPr><w:t>${this.escapeXml(boldText)}</w:t></w:r>`;
                    i = endIndex + 2;
                    continue;
                }
            }
            // Italic: *text* (but not **)
            else if (cleanText[i] === '*' && cleanText[i + 1] !== '*' && (i === 0 || cleanText[i - 1] !== '*')) {
                if (currentText) {
                    result += `<w:r><w:t xml:space="preserve">${this.escapeXml(currentText)}</w:t></w:r>`;
                    currentText = '';
                }
                const endIndex = cleanText.indexOf('*', i + 1);
                if (endIndex !== -1 && cleanText[endIndex + 1] !== '*') {
                    const italicText = cleanText.substring(i + 1, endIndex);
                    result += `<w:r><w:rPr><w:i/></w:rPr><w:t>${this.escapeXml(italicText)}</w:t></w:r>`;
                    i = endIndex + 1;
                    continue;
                }
            }

            currentText += cleanText[i];
            i++;
        }

        if (currentText) {
            result += `<w:r><w:t xml:space="preserve">${this.escapeXml(currentText)}</w:t></w:r>`;
        }

        // If no runs were created, just return plain text
        if (!result) {
            return `<w:r><w:t>${this.escapeXml(this.stripMarkdownSymbols(text))}</w:t></w:r>`;
        }

        return result;
    }

    // Strip markdown symbols from text for plain text output
    stripMarkdownSymbols(text) {
        return text
            // Remove bold markers but keep content
            .replace(/\*\*([^*]+)\*\*/g, '$1')
            // Remove italic markers but keep content
            .replace(/\*([^*]+)\*/g, '$1')
            // Remove inline code markers
            .replace(/`([^`]+)`/g, '$1')
            // Remove link syntax [text](url) -> text
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            // Remove any remaining stray asterisks at start/end
            .replace(/^\*+|\*+$/g, '')
            // Clean up double spaces
            .replace(/\s+/g, ' ')
            .trim();
    }

    async createDocxBlob(bodyContent) {
        // Minimal DOCX structure using JSZip-like approach with Blob
        const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="xml" ContentType="application/xml"/>
    <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
    <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
    <Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
</Types>`;

        const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

        const documentRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
    <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
</Relationships>`;

        const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <w:body>
        ${bodyContent}
    </w:body>
</w:document>`;

        const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <w:style w:type="paragraph" w:styleId="Heading1">
        <w:name w:val="Heading 1"/>
        <w:pPr><w:spacing w:before="240" w:after="120"/></w:pPr>
        <w:rPr><w:b/><w:sz w:val="32"/></w:rPr>
    </w:style>
    <w:style w:type="paragraph" w:styleId="Heading2">
        <w:name w:val="Heading 2"/>
        <w:pPr><w:spacing w:before="200" w:after="100"/></w:pPr>
        <w:rPr><w:b/><w:sz w:val="28"/></w:rPr>
    </w:style>
    <w:style w:type="paragraph" w:styleId="Heading3">
        <w:name w:val="Heading 3"/>
        <w:pPr><w:spacing w:before="160" w:after="80"/></w:pPr>
        <w:rPr><w:b/><w:sz w:val="24"/></w:rPr>
    </w:style>
</w:styles>`;

        const numbering = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <w:abstractNum w:abstractNumId="0">
        <w:lvl w:ilvl="0">
            <w:start w:val="1"/>
            <w:numFmt w:val="bullet"/>
            <w:lvlText w:val="•"/>
            <w:lvlJc w:val="left"/>
            <w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr>
        </w:lvl>
    </w:abstractNum>
    <w:num w:numId="1">
        <w:abstractNumId w:val="0"/>
    </w:num>
</w:numbering>`;

        // Create ZIP file manually using the minimal approach
        const zip = new ZipWriter();
        zip.addFile('[Content_Types].xml', contentTypes);
        zip.addFile('_rels/.rels', rels);
        zip.addFile('word/_rels/document.xml.rels', documentRels);
        zip.addFile('word/document.xml', document);
        zip.addFile('word/styles.xml', styles);
        zip.addFile('word/numbering.xml', numbering);

        return zip.generate();
    }

    // ===== Utility Methods =====
    escapeXml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    markdownToHtml(markdown) {
        if (!markdown) return '';

        return markdown
            // Remove code blocks (```)
            .replace(/```[\s\S]*?```/g, '')
            // Remove inline code (`text`)
            .replace(/`([^`]+)`/g, '$1')
            // Remove horizontal rules (---, ***, ___)
            .replace(/^[-*_]{3,}\s*$/gm, '')
            // Headers
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            // Bold
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Italic
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Unordered lists
            .replace(/^\s*[-*]\s+(.*$)/gm, '<li>$1</li>')
            // Wrap consecutive li elements
            .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
            // Clean up multiple newlines
            .replace(/\n{3,}/g, '\n\n')
            // Paragraphs (lines that aren't headers or lists)
            .replace(/^(?!<[hul])(.*$)/gm, (match) => {
                if (match.trim() && !match.startsWith('<')) {
                    return `<p>${match}</p>`;
                }
                return match;
            })
            // Clean up empty paragraphs
            .replace(/<p><\/p>/g, '')
            // Clean up empty lines
            .replace(/<p>\s*<\/p>/g, '')
            // Line breaks
            .replace(/\n/g, '');
    }

    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Generate safe filename
    generateFilename(type, jobTitle, company) {
        const sanitize = (str) => (str || 'document')
            .replace(/[^a-zA-Z0-9\s-]/g, '')
            .replace(/\s+/g, '_')
            .substring(0, 30);

        const date = new Date().toISOString().split('T')[0];
        const job = sanitize(jobTitle);
        const comp = sanitize(company);

        return `${type}_${job}_${comp}_${date}`;
    }
}

// Minimal ZIP file writer (no external dependencies)
class ZipWriter {
    constructor() {
        this.files = [];
    }

    addFile(path, content) {
        const encoder = new TextEncoder();
        const data = encoder.encode(content);
        this.files.push({ path, data });
    }

    generate() {
        // Create a minimal ZIP file structure
        const parts = [];
        const centralDirectory = [];
        let offset = 0;

        for (const file of this.files) {
            // Local file header
            const header = this.createLocalFileHeader(file.path, file.data);
            parts.push(header);

            // Central directory entry
            centralDirectory.push(this.createCentralDirectoryEntry(file.path, file.data, offset));

            offset += header.byteLength + file.data.byteLength;
            parts.push(file.data);
        }

        // Central directory
        const centralDirStart = offset;
        for (const entry of centralDirectory) {
            parts.push(entry);
            offset += entry.byteLength;
        }

        // End of central directory
        const endOfCentralDir = this.createEndOfCentralDirectory(
            this.files.length,
            offset - centralDirStart,
            centralDirStart
        );
        parts.push(endOfCentralDir);

        return new Blob(parts, { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    }

    createLocalFileHeader(filename, data) {
        const encoder = new TextEncoder();
        const nameBytes = encoder.encode(filename);
        const crc = this.crc32(data);

        const buffer = new ArrayBuffer(30 + nameBytes.length);
        const view = new DataView(buffer);

        view.setUint32(0, 0x04034b50, true); // Signature
        view.setUint16(4, 20, true); // Version needed
        view.setUint16(6, 0, true); // Flags
        view.setUint16(8, 0, true); // Compression method (stored)
        view.setUint16(10, 0, true); // Mod time
        view.setUint16(12, 0, true); // Mod date
        view.setUint32(14, crc, true); // CRC32
        view.setUint32(18, data.byteLength, true); // Compressed size
        view.setUint32(22, data.byteLength, true); // Uncompressed size
        view.setUint16(26, nameBytes.length, true); // Filename length
        view.setUint16(28, 0, true); // Extra field length

        new Uint8Array(buffer, 30).set(nameBytes);

        return new Uint8Array(buffer);
    }

    createCentralDirectoryEntry(filename, data, localHeaderOffset) {
        const encoder = new TextEncoder();
        const nameBytes = encoder.encode(filename);
        const crc = this.crc32(data);

        const buffer = new ArrayBuffer(46 + nameBytes.length);
        const view = new DataView(buffer);

        view.setUint32(0, 0x02014b50, true); // Signature
        view.setUint16(4, 20, true); // Version made by
        view.setUint16(6, 20, true); // Version needed
        view.setUint16(8, 0, true); // Flags
        view.setUint16(10, 0, true); // Compression method
        view.setUint16(12, 0, true); // Mod time
        view.setUint16(14, 0, true); // Mod date
        view.setUint32(16, crc, true); // CRC32
        view.setUint32(20, data.byteLength, true); // Compressed size
        view.setUint32(24, data.byteLength, true); // Uncompressed size
        view.setUint16(28, nameBytes.length, true); // Filename length
        view.setUint16(30, 0, true); // Extra field length
        view.setUint16(32, 0, true); // Comment length
        view.setUint16(34, 0, true); // Disk number
        view.setUint16(36, 0, true); // Internal attrs
        view.setUint32(38, 0, true); // External attrs
        view.setUint32(42, localHeaderOffset, true); // Offset

        new Uint8Array(buffer, 46).set(nameBytes);

        return new Uint8Array(buffer);
    }

    createEndOfCentralDirectory(numEntries, centralDirSize, centralDirOffset) {
        const buffer = new ArrayBuffer(22);
        const view = new DataView(buffer);

        view.setUint32(0, 0x06054b50, true); // Signature
        view.setUint16(4, 0, true); // Disk number
        view.setUint16(6, 0, true); // Central dir disk
        view.setUint16(8, numEntries, true); // Entries on this disk
        view.setUint16(10, numEntries, true); // Total entries
        view.setUint32(12, centralDirSize, true); // Central dir size
        view.setUint32(16, centralDirOffset, true); // Central dir offset
        view.setUint16(20, 0, true); // Comment length

        return new Uint8Array(buffer);
    }

    crc32(data) {
        let crc = 0xFFFFFFFF;
        const table = this.getCrc32Table();

        for (let i = 0; i < data.length; i++) {
            crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xFF];
        }

        return (crc ^ 0xFFFFFFFF) >>> 0;
    }

    getCrc32Table() {
        if (this._crc32Table) return this._crc32Table;

        const table = new Uint32Array(256);
        for (let i = 0; i < 256; i++) {
            let c = i;
            for (let j = 0; j < 8; j++) {
                c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
            }
            table[i] = c;
        }

        this._crc32Table = table;
        return table;
    }
}

