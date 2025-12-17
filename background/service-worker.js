// AI Career Customizer - Background Service Worker
import { StorageManager } from '../lib/storage.js';

const storage = new StorageManager();

// Listen for installation
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        // Open settings page on first install
        chrome.tabs.create({ url: chrome.runtime.getURL('settings/settings.html') });
    }
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    handleMessage(request, sender, sendResponse);
    return true; // Keep channel open for async
});

async function handleMessage(request, sender, sendResponse) {
    try {
        switch (request.action) {
            case 'getConfiguration':
                const config = await storage.getConfiguration();
                sendResponse({ success: true, data: config });
                break;

            case 'saveApiKey':
                await storage.saveApiKey(request.apiKey, request.provider, request.model);
                sendResponse({ success: true });
                break;

            case 'saveResume':
                await storage.saveResume(request.resume);
                sendResponse({ success: true });
                break;

            case 'getJobData':
                const jobData = await storage.getTempJobData();
                sendResponse({ success: true, data: jobData });
                break;

            case 'generate':
                // This will be handled by the results page directly
                // keeping here for potential future background processing
                sendResponse({ success: true });
                break;

            default:
                sendResponse({ success: false, error: 'Unknown action' });
        }
    } catch (error) {
        console.error('Background script error:', error);
        sendResponse({ success: false, error: error.message });
    }
}
