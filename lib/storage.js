// AI Career Customizer - Storage Manager
export class StorageManager {
    constructor() {
        this.storage = chrome.storage.local;
    }

    // ===== Configuration =====
    async getConfiguration() {
        const result = await this.storage.get(['apiKey', 'provider', 'model', 'resume', 'settings']);
        return {
            apiKey: result.apiKey || null,
            provider: result.provider || null,
            model: result.model || null,
            resume: result.resume || null,
            settings: result.settings || {}
        };
    }

    async saveApiKey(apiKey, provider, model) {
        await this.storage.set({ apiKey, provider, model });
    }

    async getApiKey() {
        const result = await this.storage.get(['apiKey', 'provider', 'model']);
        return {
            apiKey: result.apiKey || null,
            provider: result.provider || null,
            model: result.model || null
        };
    }

    async clearApiKey() {
        await this.storage.remove(['apiKey', 'provider', 'model']);
    }

    // ===== Resume =====
    async saveResume(resumeData) {
        await this.storage.set({ resume: resumeData });
    }

    async getResume() {
        const result = await this.storage.get('resume');
        return result.resume || null;
    }

    async clearResume() {
        await this.storage.remove('resume');
    }

    // ===== Settings =====
    async saveSettings(settings) {
        await this.storage.set({ settings });
    }

    async getSettings() {
        const result = await this.storage.get('settings');
        return result.settings || {
            piiAnonymization: false,
            theme: 'dark'
        };
    }

    // ===== Profiles =====
    async getProfiles() {
        const result = await this.storage.get('profiles');
        return result.profiles || [];
    }

    async saveProfile(profile) {
        const profiles = await this.getProfiles();
        const existingIndex = profiles.findIndex(p => p.id === profile.id);

        if (existingIndex >= 0) {
            profiles[existingIndex] = profile;
        } else {
            profile.id = Date.now().toString();
            profile.createdAt = new Date().toISOString();
            profiles.push(profile);
        }

        profile.updatedAt = new Date().toISOString();
        await this.storage.set({ profiles });
        return profile;
    }

    async deleteProfile(profileId) {
        const profiles = await this.getProfiles();
        const filtered = profiles.filter(p => p.id !== profileId);
        await this.storage.set({ profiles: filtered });
    }

    async loadProfile(profileId) {
        const profiles = await this.getProfiles();
        return profiles.find(p => p.id === profileId) || null;
    }

    // ===== Temporary Data =====
    async saveTempJobData(jobData) {
        await this.storage.set({ tempJobData: jobData });
    }

    async getTempJobData() {
        const result = await this.storage.get('tempJobData');
        return result.tempJobData || null;
    }

    async clearTempJobData() {
        await this.storage.remove('tempJobData');
    }

    async saveGenerationOptions(options) {
        await this.storage.set({ generationOptions: options });
    }

    async getGenerationOptions() {
        const result = await this.storage.get('generationOptions');
        return result.generationOptions || { resume: true, coverLetter: true };
    }

    // ===== Clear All Data =====
    async clearAllData() {
        await this.storage.clear();
    }
}
