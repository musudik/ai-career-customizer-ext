// CoverGen  - Settings Page Script
import { StorageManager } from '../lib/storage.js';
import { ConsentManager } from '../lib/consent.js';
import { ResumeParser } from '../lib/resume-parser.js';

class SettingsController {
    constructor() {
        this.storage = new StorageManager();
        this.consent = new ConsentManager();
        this.resumeParser = new ResumeParser();

        // Model options per provider
        this.models = {
            openai: [
                { value: 'gpt-4o', label: 'GPT-4o (Recommended)' },
                { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Faster)' },
                { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' }
            ],
            anthropic: [
                { value: 'claude-3-5-sonnet-latest', label: 'Claude 3.5 Sonnet (Recommended)' },
                { value: 'claude-3-5-haiku-latest', label: 'Claude 3.5 Haiku (Faster)' },
                { value: 'claude-3-opus-latest', label: 'Claude 3 Opus (Most Capable)' }
            ],
            gemini: [
                { value: 'gemini-1.5-pro-latest', label: 'Gemini 1.5 Pro (Recommended)' },
                { value: 'gemini-1.5-flash-latest', label: 'Gemini 1.5 Flash (Faster)' },
                { value: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash (Experimental)' }
            ],
            openrouter: [
                { value: 'mistralai/devstral-2512:free', label: 'Devstral 2 (Free)' },
                { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
                { value: 'openai/gpt-4o', label: 'GPT-4o' },
                { value: 'google/gemini-pro-1.5', label: 'Gemini Pro 1.5' },
                { value: 'meta-llama/llama-3.1-405b-instruct', label: 'Llama 3.1 405B' },
                { value: 'mistralai/mistral-large', label: 'Mistral Large' }
            ],
            perplexity: [
                { value: 'llama-3.1-sonar-large-128k-online', label: 'Sonar Large (Online)' },
                { value: 'llama-3.1-sonar-small-128k-online', label: 'Sonar Small (Online)' },
                { value: 'llama-3.1-sonar-huge-128k-online', label: 'Sonar Huge (Online)' }
            ]
        };

        this.apiKeyHints = {
            openai: 'Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank">OpenAI Dashboard</a>',
            anthropic: 'Get your API key from <a href="https://console.anthropic.com/settings/keys" target="_blank">Anthropic Console</a>',
            gemini: 'Get your API key from <a href="https://aistudio.google.com/app/apikey" target="_blank">Google AI Studio</a>',
            openrouter: 'Get your API key from <a href="https://openrouter.ai/keys" target="_blank">OpenRouter Dashboard</a>',
            perplexity: 'Get your API key from <a href="https://www.perplexity.ai/settings/api" target="_blank">Perplexity Settings</a>'
        };

        this.init();
    }

    async init() {
        await this.checkConsent();
        await this.loadConfiguration();
        this.bindEvents();
    }

    async checkConsent() {
        const needsConsent = await this.consent.requiresConsent();
        if (needsConsent) {
            this.showConsentModal();
        }
    }

    showConsentModal() {
        const container = document.getElementById('consentContainer');

        // Add CSS
        const style = document.createElement('style');
        style.textContent = this.consent.getConsentModalCSS();
        document.head.appendChild(style);

        // Add HTML
        container.innerHTML = this.consent.getConsentModalHTML();

        // Bind consent events
        document.getElementById('consentAccept').addEventListener('click', async () => {
            const types = [];
            if (document.getElementById('consentApiKey').checked) types.push('apiKey');
            if (document.getElementById('consentResume').checked) types.push('resume');
            if (document.getElementById('consentProfiles').checked) types.push('profiles');

            await this.consent.giveConsent(types);
            container.innerHTML = '';
            this.showToast('Consent saved successfully', 'success');
        });

        document.getElementById('consentDecline').addEventListener('click', () => {
            container.innerHTML = '';
            this.showToast('Some features may be limited without consent', 'error');
        });
    }

    async loadConfiguration() {
        const config = await this.storage.getConfiguration();

        // Load provider and model
        if (config.provider) {
            document.getElementById('provider').value = config.provider;
            this.updateModels(config.provider);

            if (config.model) {
                document.getElementById('model').value = config.model;
            }
        }

        // Load API key
        if (config.apiKey) {
            document.getElementById('apiKey').value = config.apiKey;
        }

        // Show/hide fields based on provider selection
        if (config.provider) {
            document.getElementById('modelGroup').style.display = 'block';
            document.getElementById('apiKeyGroup').style.display = 'block';
            document.getElementById('saveApiBtn').style.display = 'inline-flex';
            document.getElementById('apiKeyHint').innerHTML = this.apiKeyHints[config.provider];
        }

        // Load resume status
        if (config.resume) {
            document.getElementById('resumeUploadArea').style.display = 'none';
            document.getElementById('resumeStatus').style.display = 'flex';
            document.getElementById('resumeFileName').textContent = config.resume.fileName || 'Resume loaded';
            document.getElementById('resumeText').value = config.resume.text || '';
        }

        // Load settings
        const settings = await this.storage.getSettings();
        document.getElementById('piiAnonymization').checked = settings.piiAnonymization || false;

        // Load profiles
        await this.loadProfiles();
    }

    updateModels(provider) {
        const modelSelect = document.getElementById('model');
        modelSelect.innerHTML = '<option value="">Choose a model...</option>';

        if (this.models[provider]) {
            this.models[provider].forEach(model => {
                const option = document.createElement('option');
                option.value = model.value;
                option.textContent = model.label;
                modelSelect.appendChild(option);
            });
        }
    }

    bindEvents() {
        // Back button
        document.getElementById('backBtn').addEventListener('click', (e) => {
            e.preventDefault();
            window.close();
        });

        // Provider change
        document.getElementById('provider').addEventListener('change', (e) => {
            const provider = e.target.value;

            if (provider) {
                this.updateModels(provider);
                document.getElementById('modelGroup').style.display = 'block';
                document.getElementById('apiKeyGroup').style.display = 'block';
                document.getElementById('saveApiBtn').style.display = 'inline-flex';
                document.getElementById('apiKeyHint').innerHTML = this.apiKeyHints[provider];
            } else {
                document.getElementById('modelGroup').style.display = 'none';
                document.getElementById('apiKeyGroup').style.display = 'none';
                document.getElementById('saveApiBtn').style.display = 'none';
            }
        });

        // Toggle API key visibility
        document.getElementById('toggleApiKey').addEventListener('click', () => {
            const input = document.getElementById('apiKey');
            const btn = document.getElementById('toggleApiKey');

            if (input.type === 'password') {
                input.type = 'text';
                btn.textContent = '🙈';
            } else {
                input.type = 'password';
                btn.textContent = '👁️';
            }
        });

        // Save API settings
        document.getElementById('saveApiBtn').addEventListener('click', async () => {
            await this.saveApiSettings();
        });

        // Resume upload area
        const uploadArea = document.getElementById('resumeUploadArea');
        const fileInput = document.getElementById('resumeFile');

        uploadArea.addEventListener('click', () => fileInput.click());

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', async (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file) await this.handleResumeFile(file);
        });

        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) await this.handleResumeFile(file);
        });

        // Clear resume
        document.getElementById('clearResume').addEventListener('click', async () => {
            await this.storage.clearResume();
            document.getElementById('resumeUploadArea').style.display = 'block';
            document.getElementById('resumeStatus').style.display = 'none';
            document.getElementById('resumeText').value = '';
            this.showToast('Resume cleared', 'success');
        });

        // Save resume text
        document.getElementById('saveResumeBtn').addEventListener('click', async () => {
            await this.saveResumeText();
        });

        // Save profile
        document.getElementById('saveProfileBtn').addEventListener('click', async () => {
            await this.saveCurrentAsProfile();
        });

        // PII anonymization toggle
        document.getElementById('piiAnonymization').addEventListener('change', async (e) => {
            const settings = await this.storage.getSettings();
            settings.piiAnonymization = e.target.checked;
            await this.storage.saveSettings(settings);
            this.showToast('Settings saved', 'success');
        });

        // Clear all data
        document.getElementById('clearAllData').addEventListener('click', async () => {
            if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
                await this.storage.clearAllData();
                location.reload();
            }
        });

        // Revoke consent
        document.getElementById('revokeConsent').addEventListener('click', async () => {
            if (confirm('Revoke consent and clear all stored data?')) {
                await this.consent.revokeConsent(true);
                location.reload();
            }
        });
    }

    async saveApiSettings() {
        const provider = document.getElementById('provider').value;
        const model = document.getElementById('model').value;
        const apiKey = document.getElementById('apiKey').value.trim();

        if (!provider || !model || !apiKey) {
            this.showToast('Please fill in all API settings', 'error');
            return;
        }

        // Check consent
        const hasConsent = await this.consent.hasConsent('apiKey');
        if (!hasConsent) {
            this.showConsentModal();
            return;
        }

        await this.storage.saveApiKey(apiKey, provider, model);
        this.showToast('API settings saved successfully', 'success');
    }

    async handleResumeFile(file) {
        try {
            const text = await this.resumeParser.parseFile(file);

            const resumeData = {
                fileName: file.name,
                fileType: file.type,
                text: text,
                uploadedAt: new Date().toISOString()
            };

            // Check consent
            const hasConsent = await this.consent.hasConsent('resume');
            if (!hasConsent) {
                this.showConsentModal();
                return;
            }

            await this.storage.saveResume(resumeData);

            document.getElementById('resumeUploadArea').style.display = 'none';
            document.getElementById('resumeStatus').style.display = 'flex';
            document.getElementById('resumeFileName').textContent = file.name;
            document.getElementById('resumeText').value = text;

            this.showToast('Resume uploaded successfully', 'success');
        } catch (error) {
            console.error('Error parsing resume:', error);
            this.showToast('Error parsing resume file', 'error');
        }
    }

    async saveResumeText() {
        const text = document.getElementById('resumeText').value.trim();

        if (!text) {
            this.showToast('Please enter resume text', 'error');
            return;
        }

        // Check consent
        const hasConsent = await this.consent.hasConsent('resume');
        if (!hasConsent) {
            this.showConsentModal();
            return;
        }

        const resumeData = {
            fileName: 'Pasted Text',
            fileType: 'text/plain',
            text: text,
            uploadedAt: new Date().toISOString()
        };

        await this.storage.saveResume(resumeData);

        document.getElementById('resumeUploadArea').style.display = 'none';
        document.getElementById('resumeStatus').style.display = 'flex';
        document.getElementById('resumeFileName').textContent = 'Pasted Text';

        this.showToast('Resume saved successfully', 'success');
    }

    async loadProfiles() {
        const profiles = await this.storage.getProfiles();
        const list = document.getElementById('profilesList');

        if (profiles.length === 0) {
            list.innerHTML = '<p class="empty-state">No profiles saved yet</p>';
            return;
        }

        list.innerHTML = profiles.map(profile => `
      <div class="profile-item" data-id="${profile.id}">
        <div>
          <span class="profile-name">${profile.name}</span>
          <span class="profile-date">${new Date(profile.createdAt).toLocaleDateString()}</span>
        </div>
        <div>
          <button class="btn-icon-only load-profile" data-id="${profile.id}">📥</button>
          <button class="btn-icon-only delete-profile" data-id="${profile.id}">🗑️</button>
        </div>
      </div>
    `).join('');

        // Bind profile events
        list.querySelectorAll('.load-profile').forEach(btn => {
            btn.addEventListener('click', async () => {
                const profile = await this.storage.loadProfile(btn.dataset.id);
                if (profile) {
                    await this.applyProfile(profile);
                }
            });
        });

        list.querySelectorAll('.delete-profile').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm('Delete this profile?')) {
                    await this.storage.deleteProfile(btn.dataset.id);
                    await this.loadProfiles();
                    this.showToast('Profile deleted', 'success');
                }
            });
        });
    }

    async applyProfile(profile) {
        if (profile.provider) {
            document.getElementById('provider').value = profile.provider;
            this.updateModels(profile.provider);
            document.getElementById('modelGroup').style.display = 'block';
            document.getElementById('apiKeyGroup').style.display = 'block';
            document.getElementById('saveApiBtn').style.display = 'inline-flex';
        }

        if (profile.model) {
            document.getElementById('model').value = profile.model;
        }

        if (profile.resume) {
            await this.storage.saveResume(profile.resume);
            document.getElementById('resumeUploadArea').style.display = 'none';
            document.getElementById('resumeStatus').style.display = 'flex';
            document.getElementById('resumeFileName').textContent = profile.resume.fileName;
            document.getElementById('resumeText').value = profile.resume.text || '';
        }

        this.showToast(`Profile "${profile.name}" loaded`, 'success');
    }

    async saveCurrentAsProfile() {
        const name = document.getElementById('profileName').value.trim();

        if (!name) {
            this.showToast('Please enter a profile name', 'error');
            return;
        }

        // Check consent
        const hasConsent = await this.consent.hasConsent('profiles');
        if (!hasConsent) {
            this.showConsentModal();
            return;
        }

        const config = await this.storage.getConfiguration();

        const profile = {
            name,
            provider: config.provider,
            model: config.model,
            resume: config.resume
        };

        await this.storage.saveProfile(profile);
        await this.loadProfiles();

        document.getElementById('profileName').value = '';
        this.showToast(`Profile "${name}" saved`, 'success');
    }

    showToast(message, type = 'success') {
        // Remove existing toasts
        document.querySelectorAll('.toast').forEach(t => t.remove());

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
      <span>${type === 'success' ? '✓' : '✕'}</span>
      <span>${message}</span>
    `;

        document.body.appendChild(toast);

        setTimeout(() => toast.remove(), 3000);
    }
}

// Initialize settings
document.addEventListener('DOMContentLoaded', () => {
    new SettingsController();
});
