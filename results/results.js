// CoverGen  - Results Page Script
import { StorageManager } from '../lib/storage.js';
import { ProviderFactory } from '../lib/ai-providers/provider-factory.js';
import { PIIFilter } from '../lib/pii-filter.js';
import { DocumentExporter } from '../lib/document-exporter.js';

class ResultsController {
    constructor() {
        this.storage = new StorageManager();
        this.piiFilter = new PIIFilter();
        this.exporter = new DocumentExporter();
        this.provider = null;
        this.jobData = null;
        this.jobAnalysis = null;
        this.resume = null;
        this.generatedResume = null;
        this.generatedCoverLetter = null;
        this.isEditing = { resume: false, coverLetter: false };

        // Translation state - keeps original for export
        this.originalResume = null;
        this.originalCoverLetter = null;
        this.originalLanguage = 'de'; // Will be set from generation options
        this.currentLang = { resume: null, coverLetter: null }; // null = original, 'de' or 'en' = translated
        this.isTranslating = { resume: false, coverLetter: false };

        this.init();
    }

    async init() {
        try {
            await this.loadData();
            this.bindEvents();
            await this.generateDocuments();
        } catch (error) {
            console.error('Initialization error:', error);
            this.showError(error.message);
        }
    }

    async loadData() {
        // Load configuration
        const config = await this.storage.getConfiguration();

        if (!config.apiKey || !config.provider) {
            throw new Error('Please configure your API settings first.');
        }

        // Create provider
        this.provider = ProviderFactory.getProvider(
            config.provider,
            config.apiKey,
            config.model
        );

        // Load resume
        this.resume = config.resume;
        if (!this.resume) {
            throw new Error('Please upload your resume first.');
        }

        // Load job data
        this.jobData = await this.storage.getTempJobData();
        if (!this.jobData) {
            throw new Error('No job data found. Please capture a job posting first.');
        }

        // Check for PII anonymization setting
        const settings = await this.storage.getSettings();
        if (settings.piiAnonymization) {
            this.resume = {
                ...this.resume,
                text: this.piiFilter.anonymize(this.resume.text)
            };
        }

        // Update header with job info
        this.updateHeaderJobInfo();
    }

    updateHeaderJobInfo() {
        const title = this.jobAnalysis?.title || this.jobData?.title || 'Job Position';
        const company = this.jobAnalysis?.company || this.jobData?.company || '';

        document.getElementById('headerJobTitle').textContent = title;
        document.getElementById('headerJobCompany').textContent = company;
    }

    bindEvents() {
        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        // Copy buttons
        document.getElementById('copyResume').addEventListener('click', () => {
            this.copyToClipboard(this.generatedResume, 'Resume');
        });

        document.getElementById('copyCoverLetter').addEventListener('click', () => {
            this.copyToClipboard(this.generatedCoverLetter, 'Cover letter');
        });

        // Edit buttons
        document.getElementById('editResume').addEventListener('click', () => {
            this.toggleEdit('resume');
        });

        document.getElementById('editCoverLetter').addEventListener('click', () => {
            this.toggleEdit('coverLetter');
        });

        // Export buttons - Resume
        document.getElementById('downloadResumePdf').addEventListener('click', () => {
            this.exportDocument('resume', 'pdf');
        });

        document.getElementById('downloadResumeDocx').addEventListener('click', () => {
            this.exportDocument('resume', 'docx');
        });

        // Export buttons - Cover Letter
        document.getElementById('downloadCoverLetterPdf').addEventListener('click', () => {
            this.exportDocument('coverLetter', 'pdf');
        });

        document.getElementById('downloadCoverLetterDocx').addEventListener('click', () => {
            this.exportDocument('coverLetter', 'docx');
        });

        // Header buttons
        document.getElementById('regenerateBtn').addEventListener('click', () => {
            this.regenerate();
        });

        document.getElementById('newJobBtn').addEventListener('click', () => {
            window.close();
        });

        document.getElementById('retryBtn').addEventListener('click', () => {
            location.reload();
        });

        // Sidebar toggle
        document.getElementById('toggleSidebar').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('collapsed');
        });

        // Apply customization
        document.getElementById('applyCustomization').addEventListener('click', () => {
            this.applyCustomization();
        });

        // Translate buttons
        document.getElementById('translateResume').addEventListener('click', () => {
            this.toggleTranslation('resume');
        });

        document.getElementById('translateCoverLetter').addEventListener('click', () => {
            this.toggleTranslation('coverLetter');
        });
    }

    async generateDocuments() {
        const options = await this.storage.getGenerationOptions();

        // Store original language for translation toggle
        this.originalLanguage = options.language || 'de';

        this.updateProgress(10, 'Analyzing job posting...');

        try {
            // Step 1: Analyze job posting
            this.jobAnalysis = await this.provider.analyzeJobPosting(this.jobData);
            this.updateProgress(30, 'Job analysis complete...');
            this.displayAnalysis();

            // Update header with proper job title from analysis
            this.updateHeaderJobInfo();

            // Step 2: Generate resume if selected
            if (options.resume) {
                this.updateProgress(50, 'Generating tailored resume...');
                this.generatedResume = await this.provider.rewriteResume(
                    this.resume,
                    this.jobAnalysis,
                    { ...this.getEmphasisOptions(), language: options.language || 'de' }
                );
                // Store original for export
                this.originalResume = this.generatedResume;
                this.currentLang.resume = null; // null means showing original
                this.updateProgress(70, 'Resume generated...');
                this.displayResume();
            }

            // Step 3: Generate cover letter if selected
            if (options.coverLetter) {
                this.updateProgress(80, 'Generating cover letter...');
                this.generatedCoverLetter = await this.provider.generateCoverLetter(
                    this.resume,
                    this.jobAnalysis,
                    {
                        tone: document.getElementById('coverLetterTone').value,
                        language: options.language || 'de'
                    }
                );
                // Store original for export
                this.originalCoverLetter = this.generatedCoverLetter;
                this.currentLang.coverLetter = null; // null means showing original
                this.updateProgress(95, 'Cover letter generated...');
                this.displayCoverLetter();
            }

            // Complete
            this.updateProgress(100, 'Done!');
            setTimeout(() => this.showResults(), 500);

        } catch (error) {
            console.error('Generation error:', error);
            this.showError(error.message);
        }
    }

    updateProgress(percent, text) {
        document.getElementById('progressBar').style.width = `${percent}%`;
        document.getElementById('loadingText').textContent = text;
    }

    showResults() {
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('resultsContent').style.display = 'block';
    }

    showError(message) {
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('errorState').style.display = 'flex';
        document.getElementById('errorMessage').textContent = message;
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `${tabName}Panel`);
        });
    }

    displayResume() {
        const content = document.getElementById('resumeContent');
        content.innerHTML = this.markdownToHtml(this.generatedResume);
    }

    displayCoverLetter() {
        const content = document.getElementById('coverLetterContent');
        content.innerHTML = this.markdownToHtml(this.generatedCoverLetter);
    }

    displayAnalysis() {
        const content = document.getElementById('analysisContent');

        content.innerHTML = `
      <div class="analysis-section">
        <h4>Required Skills</h4>
        <div class="analysis-tags">
          ${(this.jobAnalysis.requiredSkills || [])
                .map(skill => `<span class="analysis-tag required">${skill}</span>`)
                .join('')}
        </div>
      </div>
      
      <div class="analysis-section">
        <h4>Preferred Skills</h4>
        <div class="analysis-tags">
          ${(this.jobAnalysis.preferredSkills || [])
                .map(skill => `<span class="analysis-tag preferred">${skill}</span>`)
                .join('')}
        </div>
      </div>
      
      <div class="analysis-section">
        <h4>Key Responsibilities</h4>
        <div class="analysis-tags">
          ${(this.jobAnalysis.responsibilities || [])
                .map(resp => `<span class="analysis-tag">${resp}</span>`)
                .join('')}
        </div>
      </div>
      
      <div class="analysis-section">
        <h4>ATS Keywords</h4>
        <div class="analysis-tags">
          ${(this.jobAnalysis.keywords || [])
                .map(keyword => `<span class="analysis-tag">${keyword}</span>`)
                .join('')}
        </div>
      </div>
      
      ${this.jobAnalysis.salary ? `
        <div class="analysis-section">
          <h4>Salary</h4>
          <p>${this.jobAnalysis.salary}</p>
        </div>
      ` : ''}
      
      ${this.jobAnalysis.culture ? `
        <div class="analysis-section">
          <h4>Company Culture</h4>
          <p>${this.jobAnalysis.culture}</p>
        </div>
      ` : ''}
    `;
    }

    markdownToHtml(markdown) {
        if (!markdown) return '';

        return markdown
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
            // Wrap consecutive li elements in ul
            .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
            // Paragraphs
            .replace(/\n\n/g, '</p><p>')
            // Line breaks
            .replace(/\n/g, '<br>')
            // Wrap in paragraph
            .replace(/^(.+)$/, '<p>$1</p>');
    }

    toggleEdit(type) {
        const contentEl = document.getElementById(`${type}Content`);
        const editEl = document.getElementById(`${type}Edit`);
        const btn = document.getElementById(`edit${type.charAt(0).toUpperCase() + type.slice(1)}`);

        this.isEditing[type] = !this.isEditing[type];

        if (this.isEditing[type]) {
            contentEl.style.display = 'none';
            editEl.style.display = 'block';
            editEl.value = type === 'resume' ? this.generatedResume : this.generatedCoverLetter;
            btn.textContent = '✓';
        } else {
            contentEl.style.display = 'block';
            editEl.style.display = 'none';

            // Save changes
            if (type === 'resume') {
                this.generatedResume = editEl.value;
                this.displayResume();
            } else {
                this.generatedCoverLetter = editEl.value;
                this.displayCoverLetter();
            }

            btn.textContent = '✏️';
            this.showToast('Changes saved', 'success');
        }
    }

    async copyToClipboard(text, label) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast(`${label} copied to clipboard`, 'success');
        } catch (error) {
            this.showToast('Failed to copy', 'error');
        }
    }

    getEmphasisOptions() {
        return {
            emphasis: {
                experience: document.getElementById('emphasisExperience').value,
                skills: document.getElementById('emphasisSkills').value,
                education: document.getElementById('emphasisEducation').value,
                projects: document.getElementById('emphasisProjects').value
            }
        };
    }

    async applyCustomization() {
        const options = await this.storage.getGenerationOptions();

        document.getElementById('resultsContent').style.display = 'none';
        document.getElementById('loadingState').style.display = 'flex';

        try {
            if (options.resume) {
                this.updateProgress(30, 'Regenerating resume with new settings...');
                this.generatedResume = await this.provider.rewriteResume(
                    this.resume,
                    this.jobAnalysis,
                    this.getEmphasisOptions()
                );
                this.displayResume();
            }

            if (options.coverLetter) {
                this.updateProgress(70, 'Regenerating cover letter...');
                this.generatedCoverLetter = await this.provider.generateCoverLetter(
                    this.resume,
                    this.jobAnalysis,
                    { tone: document.getElementById('coverLetterTone').value }
                );
                this.displayCoverLetter();
            }

            this.updateProgress(100, 'Done!');
            setTimeout(() => this.showResults(), 300);
            this.showToast('Documents regenerated', 'success');

        } catch (error) {
            this.showError(error.message);
        }
    }

    async exportDocument(type, format) {
        // Always export ORIGINAL content, not translated
        const content = type === 'resume'
            ? (this.originalResume || this.generatedResume)
            : (this.originalCoverLetter || this.generatedCoverLetter);
        const docType = type === 'resume' ? 'Resume' : 'CoverLetter';

        if (!content) {
            this.showToast(`No ${type} to export`, 'error');
            return;
        }

        try {
            const filename = this.exporter.generateFilename(
                docType,
                this.jobData?.title,
                this.jobData?.company
            );

            const title = type === 'resume'
                ? `Resume - ${this.jobData?.title || 'Application'}`
                : `Cover Letter - ${this.jobData?.company || 'Application'}`;

            if (format === 'pdf') {
                await this.exporter.exportToPdf(content, filename, title);
                this.showToast('PDF opened in new tab - use Print → Save as PDF', 'success');
            } else if (format === 'docx') {
                await this.exporter.exportToDocx(content, filename, title);
                this.showToast(`${docType} downloaded as DOCX`, 'success');
            }
        } catch (error) {
            console.error('Export error:', error);
            this.showToast(`Failed to export: ${error.message}`, 'error');
        }
    }

    async regenerate() {
        document.getElementById('resultsContent').style.display = 'none';
        document.getElementById('loadingState').style.display = 'flex';
        await this.generateDocuments();
    }

    async toggleTranslation(type) {
        // Prevent multiple simultaneous translations
        if (this.isTranslating[type]) return;

        const content = type === 'resume' ? this.generatedResume : this.generatedCoverLetter;
        const original = type === 'resume' ? this.originalResume : this.originalCoverLetter;
        const btn = document.getElementById(type === 'resume' ? 'translateResume' : 'translateCoverLetter');

        if (!content) {
            this.showToast(`No ${type} to translate`, 'error');
            return;
        }

        // If currently showing translated version, revert to original
        if (this.currentLang[type] !== null) {
            if (type === 'resume') {
                this.generatedResume = this.originalResume;
                this.displayResume();
            } else {
                this.generatedCoverLetter = this.originalCoverLetter;
                this.displayCoverLetter();
            }
            this.currentLang[type] = null;
            btn.classList.remove('active');
            btn.title = 'Translate DE↔EN';
            this.showToast(`Showing original ${type === 'resume' ? 'resume' : 'cover letter'}`, 'success');
            return;
        }

        // Translate to opposite language
        const targetLang = this.originalLanguage === 'de' ? 'en' : 'de';
        const targetLangName = targetLang === 'de' ? 'German' : 'English';

        this.isTranslating[type] = true;
        btn.classList.add('loading');
        btn.innerHTML = '⏳';

        try {
            const translationPrompt = `Translate the following ${type === 'resume' ? 'resume' : 'cover letter'} to ${targetLangName}. 
Keep the same formatting, structure, and professional tone. Only translate the text, do not add or remove any content.

${original}`;

            const translated = await this.provider.generateCompletion(translationPrompt);

            if (type === 'resume') {
                this.generatedResume = translated;
                this.displayResume();
            } else {
                this.generatedCoverLetter = translated;
                this.displayCoverLetter();
            }

            this.currentLang[type] = targetLang;
            btn.classList.add('active');
            btn.title = `Showing ${targetLangName} - Click to show original`;
            this.showToast(`Translated to ${targetLangName}`, 'success');

        } catch (error) {
            console.error('Translation error:', error);
            this.showToast(`Translation failed: ${error.message}`, 'error');
        } finally {
            this.isTranslating[type] = false;
            btn.classList.remove('loading');
            btn.innerHTML = '🌐';
        }
    }

    showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
      <span>${type === 'success' ? '✓' : '✕'}</span>
      <span>${message}</span>
    `;

        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new ResultsController();
});
