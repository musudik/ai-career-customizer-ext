// AI Career Customizer - Resume Parser
export class ResumeParser {
    constructor() {
        // PDF.js will be loaded dynamically if needed
        this.pdfLoaded = false;
    }

    async parseFile(file) {
        const fileType = file.type;
        const fileName = file.name.toLowerCase();

        if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
            return await this.parsePDF(file);
        } else if (
            fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            fileName.endsWith('.docx')
        ) {
            return await this.parseDOCX(file);
        } else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
            return await this.parseText(file);
        } else {
            throw new Error('Unsupported file format. Please use PDF, DOCX, or TXT.');
        }
    }

    async parseText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Error reading text file'));
            reader.readAsText(file);
        });
    }

    async parsePDF(file) {
        // Load PDF.js if not already loaded
        if (!window.pdfjsLib) {
            await this.loadPDFJS();
        }

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const typedArray = new Uint8Array(e.target.result);
                    const pdf = await window.pdfjsLib.getDocument(typedArray).promise;

                    let fullText = '';

                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items
                            .map(item => item.str)
                            .join(' ');
                        fullText += pageText + '\n\n';
                    }

                    resolve(fullText.trim());
                } catch (error) {
                    reject(new Error('Error parsing PDF: ' + error.message));
                }
            };
            reader.onerror = () => reject(new Error('Error reading PDF file'));
            reader.readAsArrayBuffer(file);
        });
    }

    async loadPDFJS() {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (window.pdfjsLib) {
                resolve();
                return;
            }

            // For Chrome extension, we'll use a CDN fallback
            // In production, bundle PDF.js with the extension
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            script.onload = () => {
                window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                this.pdfLoaded = true;
                resolve();
            };
            script.onerror = () => reject(new Error('Failed to load PDF.js'));
            document.head.appendChild(script);
        });
    }

    async parseDOCX(file) {
        // Load mammoth.js if not already loaded
        if (!window.mammoth) {
            await this.loadMammoth();
        }

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const result = await window.mammoth.extractRawText({
                        arrayBuffer: e.target.result
                    });
                    resolve(result.value);
                } catch (error) {
                    reject(new Error('Error parsing DOCX: ' + error.message));
                }
            };
            reader.onerror = () => reject(new Error('Error reading DOCX file'));
            reader.readAsArrayBuffer(file);
        });
    }

    async loadMammoth() {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (window.mammoth) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Mammoth.js'));
            document.head.appendChild(script);
        });
    }

    // Extract structured sections from resume text
    extractSections(text) {
        const sections = {
            contact: '',
            summary: '',
            experience: '',
            education: '',
            skills: '',
            certifications: '',
            projects: '',
            other: ''
        };

        // Common section headers
        const sectionPatterns = {
            contact: /^(contact|personal\s*info)/im,
            summary: /^(summary|objective|profile|about)/im,
            experience: /^(experience|work\s*history|employment|professional\s*experience)/im,
            education: /^(education|academic|qualifications)/im,
            skills: /^(skills|technical\s*skills|competencies|expertise)/im,
            certifications: /^(certifications?|licenses?|credentials)/im,
            projects: /^(projects|portfolio|work\s*samples)/im
        };

        const lines = text.split('\n');
        let currentSection = 'other';

        for (const line of lines) {
            const trimmedLine = line.trim();

            // Check if this line is a section header
            let foundSection = false;
            for (const [section, pattern] of Object.entries(sectionPatterns)) {
                if (pattern.test(trimmedLine)) {
                    currentSection = section;
                    foundSection = true;
                    break;
                }
            }

            if (!foundSection && trimmedLine) {
                sections[currentSection] += trimmedLine + '\n';
            }
        }

        // Clean up sections
        for (const key of Object.keys(sections)) {
            sections[key] = sections[key].trim();
        }

        return sections;
    }
}
