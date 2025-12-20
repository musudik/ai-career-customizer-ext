// CoverGen  - Consent Manager
export class ConsentManager {
    constructor() {
        this.storage = chrome.storage.local;
        this.consentVersion = '1.0';
    }

    async getConsentStatus() {
        const result = await this.storage.get('consent');
        return result.consent || {
            given: false,
            version: null,
            timestamp: null,
            types: {
                apiKey: false,
                resume: false,
                profiles: false
            }
        };
    }

    async hasConsent(type = null) {
        const consent = await this.getConsentStatus();

        if (!consent.given) return false;
        if (consent.version !== this.consentVersion) return false;

        if (type) {
            return consent.types[type] === true;
        }

        return true;
    }

    async giveConsent(types = ['apiKey', 'resume', 'profiles']) {
        const consentTypes = {
            apiKey: types.includes('apiKey'),
            resume: types.includes('resume'),
            profiles: types.includes('profiles')
        };

        const consent = {
            given: true,
            version: this.consentVersion,
            timestamp: new Date().toISOString(),
            types: consentTypes
        };

        await this.storage.set({ consent });
        return consent;
    }

    async revokeConsent(clearData = false) {
        if (clearData) {
            await this.storage.clear();
        } else {
            await this.storage.remove('consent');
        }
    }

    async updateConsentType(type, value) {
        const consent = await this.getConsentStatus();
        consent.types[type] = value;
        consent.timestamp = new Date().toISOString();
        await this.storage.set({ consent });
    }

    // Check if consent is needed before storing data
    async requiresConsent() {
        const consent = await this.getConsentStatus();
        return !consent.given || consent.version !== this.consentVersion;
    }

    // Get consent modal HTML
    getConsentModalHTML() {
        return `
      <div class="consent-modal-overlay" id="consentModal">
        <div class="consent-modal">
          <div class="consent-header">
            <span class="consent-icon">🔒</span>
            <h2>Data Storage Consent</h2>
          </div>
          <div class="consent-body">
            <p>CoverGen  needs your permission to store data locally in your browser. This data never leaves your device and is not sent to any servers except the AI provider you choose.</p>
            
            <div class="consent-options">
              <label class="consent-option">
                <input type="checkbox" id="consentApiKey" checked>
                <span class="checkmark"></span>
                <div class="option-content">
                  <strong>API Key</strong>
                  <small>Store your AI provider API key for generating documents</small>
                </div>
              </label>
              
              <label class="consent-option">
                <input type="checkbox" id="consentResume" checked>
                <span class="checkmark"></span>
                <div class="option-content">
                  <strong>Resume Data</strong>
                  <small>Store your resume content for document generation</small>
                </div>
              </label>
              
              <label class="consent-option">
                <input type="checkbox" id="consentProfiles" checked>
                <span class="checkmark"></span>
                <div class="option-content">
                  <strong>Profiles</strong>
                  <small>Save multiple resume profiles for different applications</small>
                </div>
              </label>
            </div>
            
            <p class="consent-note">
              <strong>Note:</strong> When generating documents, your resume and job posting data will be sent to your selected AI provider (OpenAI, Anthropic, or Google) via their API. Please review their privacy policies.
            </p>
          </div>
          <div class="consent-footer">
            <button class="btn btn-secondary" id="consentDecline">Decline</button>
            <button class="btn btn-primary" id="consentAccept">Accept & Continue</button>
          </div>
        </div>
      </div>
    `;
    }

    // Get consent modal CSS
    getConsentModalCSS() {
        return `
      .consent-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
      }
      
      .consent-modal {
        background: var(--bg-card, #1e293b);
        border-radius: 16px;
        max-width: 480px;
        width: 100%;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        animation: modalSlideIn 0.3s ease;
      }
      
      @keyframes modalSlideIn {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .consent-header {
        padding: 24px 24px 0;
        text-align: center;
      }
      
      .consent-icon {
        font-size: 48px;
        display: block;
        margin-bottom: 12px;
      }
      
      .consent-header h2 {
        font-size: 20px;
        font-weight: 700;
        color: var(--text-primary, #f8fafc);
        margin: 0;
      }
      
      .consent-body {
        padding: 20px 24px;
      }
      
      .consent-body p {
        font-size: 14px;
        color: var(--text-secondary, #94a3b8);
        line-height: 1.6;
        margin-bottom: 16px;
      }
      
      .consent-options {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 16px;
      }
      
      .consent-option {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 12px;
        background: var(--bg-dark, #0f172a);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .consent-option:hover {
        background: var(--bg-hover, #334155);
      }
      
      .consent-option input {
        display: none;
      }
      
      .consent-option .checkmark {
        width: 20px;
        height: 20px;
        min-width: 20px;
        border: 2px solid var(--border, #334155);
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: 2px;
      }
      
      .consent-option input:checked + .checkmark {
        background: var(--primary, #6366f1);
        border-color: var(--primary, #6366f1);
      }
      
      .consent-option input:checked + .checkmark::after {
        content: '✓';
        color: white;
        font-size: 12px;
      }
      
      .option-content strong {
        display: block;
        font-size: 14px;
        color: var(--text-primary, #f8fafc);
        margin-bottom: 4px;
      }
      
      .option-content small {
        font-size: 12px;
        color: var(--text-muted, #64748b);
      }
      
      .consent-note {
        background: rgba(245, 158, 11, 0.1);
        border: 1px solid rgba(245, 158, 11, 0.3);
        border-radius: 8px;
        padding: 12px;
        font-size: 12px !important;
      }
      
      .consent-footer {
        display: flex;
        gap: 12px;
        padding: 20px 24px 24px;
        border-top: 1px solid var(--border, #334155);
      }
      
      .consent-footer .btn {
        flex: 1;
        padding: 12px 20px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .consent-footer .btn-secondary {
        background: var(--bg-dark, #0f172a);
        color: var(--text-secondary, #94a3b8);
      }
      
      .consent-footer .btn-primary {
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        color: white;
      }
      
      .consent-footer .btn:hover {
        transform: translateY(-1px);
      }
    `;
    }
}
