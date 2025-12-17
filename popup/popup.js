// AI Career Customizer - Popup Script
import { StorageManager } from '../lib/storage.js';
import { ConsentManager } from '../lib/consent.js';

class PopupController {
  constructor() {
    this.storage = new StorageManager();
    this.consent = new ConsentManager();
    this.jobData = null;
    this.init();
  }

  async init() {
    await this.checkConfiguration();
    this.bindEvents();
    await this.loadCachedJobData();
  }

  async checkConfiguration() {
    const config = await this.storage.getConfiguration();

    // Update API Key status
    const apiKeyStatus = document.getElementById('apiKeyStatus');
    if (config.apiKey && config.provider) {
      apiKeyStatus.classList.add('configured');
      apiKeyStatus.classList.remove('not-configured');
      apiKeyStatus.querySelector('.status-icon').textContent = '●';
      apiKeyStatus.querySelector('.status-text').textContent = `${this.getProviderName(config.provider)} configured`;
    } else {
      apiKeyStatus.classList.add('not-configured');
      apiKeyStatus.classList.remove('configured');
      apiKeyStatus.querySelector('.status-icon').textContent = '○';
      apiKeyStatus.querySelector('.status-text').textContent = 'API Key not configured';
    }

    // Update Resume status
    const resumeStatus = document.getElementById('resumeStatus');
    if (config.resume) {
      resumeStatus.classList.add('configured');
      resumeStatus.classList.remove('not-configured');
      resumeStatus.querySelector('.status-icon').textContent = '●';
      resumeStatus.querySelector('.status-text').textContent = 'Resume uploaded';
    } else {
      resumeStatus.classList.add('not-configured');
      resumeStatus.classList.remove('configured');
      resumeStatus.querySelector('.status-icon').textContent = '○';
      resumeStatus.querySelector('.status-text').textContent = 'Resume not uploaded';
    }

    // Enable/disable capture button
    const captureBtn = document.getElementById('captureBtn');
    captureBtn.disabled = !(config.apiKey && config.resume);
  }

  getProviderName(provider) {
    const names = {
      'openai': 'OpenAI',
      'anthropic': 'Anthropic',
      'gemini': 'Google Gemini',
      'openrouter': 'OpenRouter',
      'perplexity': 'Perplexity'
    };
    return names[provider] || provider;
  }

  bindEvents() {
    // Capture Job Post button
    document.getElementById('captureBtn').addEventListener('click', () => this.captureJobPost());

    // Generate Documents button
    document.getElementById('generateBtn').addEventListener('click', () => this.generateDocuments());

    // Clear URL button
    document.getElementById('clearUrlBtn').addEventListener('click', () => {
      document.getElementById('jobUrl').value = '';
    });

    // Clear cached job data button
    document.getElementById('clearJobBtn').addEventListener('click', () => this.clearJobData());

    // Help modal toggle
    const helpOverlay = document.getElementById('helpOverlay');
    document.getElementById('helpBtn').addEventListener('click', () => {
      helpOverlay.classList.add('active');
    });
    document.getElementById('helpClose').addEventListener('click', () => {
      helpOverlay.classList.remove('active');
    });
    helpOverlay.addEventListener('click', (e) => {
      if (e.target === helpOverlay) {
        helpOverlay.classList.remove('active');
      }
    });

    // Footer buttons
    document.getElementById('settingsBtn').addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('settings/settings.html') });
    });

    document.getElementById('profilesBtn').addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('settings/settings.html#profiles') });
    });

    document.getElementById('privacyBtn').addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('privacy/privacy.html') });
    });

    // Checkbox change events
    document.getElementById('generateResume').addEventListener('change', () => this.updateGenerateButton());
    document.getElementById('generateCoverLetter').addEventListener('change', () => this.updateGenerateButton());
  }

  updateGenerateButton() {
    const generateResume = document.getElementById('generateResume').checked;
    const generateCoverLetter = document.getElementById('generateCoverLetter').checked;
    const generateBtn = document.getElementById('generateBtn');

    generateBtn.disabled = !generateResume && !generateCoverLetter;
  }

  async captureJobPost() {
    const captureBtn = document.getElementById('captureBtn');
    captureBtn.classList.add('loading');
    captureBtn.disabled = true;

    const jobUrl = document.getElementById('jobUrl').value.trim();

    try {
      let jobData;

      // ALWAYS clear cached data first when capturing
      await this.storage.clearTempJobData();
      this.jobData = null;

      if (jobUrl) {
        // Fetch job data from URL - this is a fresh fetch
        console.log('Fetching job from URL:', jobUrl);
        jobData = await this.fetchJobFromUrl(jobUrl);
      } else {
        // Get current tab and extract job data
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        // Inject content script first
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content/job-capture.js']
          });
        } catch (e) {
          // Script might already be injected
          console.log('Content script may already be injected:', e.message);
        }

        // Wait a bit for script to initialize
        await new Promise(resolve => setTimeout(resolve, 300));

        // Send message to content script to extract job data
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractJobData' });

        if (response && response.success) {
          jobData = response.data;
        } else {
          this.showError('Could not extract job data from this page. Please try on a job posting page or paste a job URL.');
          return;
        }
      }

      if (jobData) {
        this.jobData = jobData;
        await this.storage.saveTempJobData(this.jobData);
        this.displayJobPreview();
        console.log('Job captured:', jobData.title, '-', jobData.company);
      }
    } catch (error) {
      console.error('Error capturing job:', error);
      this.showError('Error capturing job post: ' + error.message);
    } finally {
      captureBtn.classList.remove('loading');
      captureBtn.disabled = false;
    }
  }

  async fetchJobFromUrl(url) {
    try {
      console.log('Opening URL to extract job data:', url);

      // Open the URL in a new tab
      const tab = await chrome.tabs.create({ url: url, active: false });

      // Wait for page to load
      await new Promise(resolve => setTimeout(resolve, 4000));

      // Execute content script
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content/job-capture.js']
        });
      } catch (e) {
        console.log('Script injection note:', e.message);
      }

      // Wait a bit for script to initialize
      await new Promise(resolve => setTimeout(resolve, 500));

      // Extract job data
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractJobData' });

      // Close the tab
      await chrome.tabs.remove(tab.id);

      if (response && response.success) {
        console.log('Successfully extracted job from URL');
        return response.data;
      } else {
        throw new Error('Could not extract job data from URL');
      }
    } catch (error) {
      console.error('Error fetching from URL:', error);
      throw error;
    }
  }

  async clearJobData() {
    await this.storage.clearTempJobData();
    this.jobData = null;
    document.getElementById('jobPreview').style.display = 'none';
    document.getElementById('generateBtn').style.display = 'none';
    document.getElementById('jobUrl').value = '';
  }

  displayJobPreview() {
    const jobPreview = document.getElementById('jobPreview');
    const jobTitle = document.getElementById('jobTitle');
    const jobCompany = document.getElementById('jobCompany');
    const generateBtn = document.getElementById('generateBtn');

    jobTitle.textContent = this.jobData.title || 'Job Title';
    jobCompany.textContent = this.jobData.company || 'Company';

    jobPreview.style.display = 'block';
    generateBtn.style.display = 'flex';
  }

  async loadCachedJobData() {
    const cachedData = await this.storage.getTempJobData();
    if (cachedData) {
      this.jobData = cachedData;
      this.displayJobPreview();
    }
  }

  async generateDocuments() {
    const generateResume = document.getElementById('generateResume').checked;
    const generateCoverLetter = document.getElementById('generateCoverLetter').checked;
    const language = document.querySelector('input[name="language"]:checked').value;

    if (!generateResume && !generateCoverLetter) {
      this.showError('Please select at least one document to generate.');
      return;
    }

    // Store generation options including language
    await this.storage.saveGenerationOptions({
      resume: generateResume,
      coverLetter: generateCoverLetter,
      language: language
    });

    // Open results page
    chrome.tabs.create({
      url: chrome.runtime.getURL('results/results.html')
    });
  }

  showError(message) {
    // Simple alert for now, can be enhanced with custom modal
    alert(message);
  }
}

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});
