// CoverGen  - Content Script for Job Capture
(function () {
    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'extractJobData') {
            const jobData = extractJobData();
            sendResponse({ success: true, data: jobData });
        }
        return true; // Keep channel open for async response
    });

    function extractJobData() {
        const url = window.location.href;
        const hostname = window.location.hostname;

        // Try site-specific extractors first
        let data = null;

        if (hostname.includes('linkedin.com')) {
            data = extractLinkedIn();
        } else if (hostname.includes('indeed.com')) {
            data = extractIndeed();
        } else if (hostname.includes('glassdoor.com')) {
            data = extractGlassdoor();
        } else if (hostname.includes('monster.com')) {
            data = extractMonster();
        } else if (hostname.includes('ziprecruiter.com')) {
            data = extractZipRecruiter();
        } else if (hostname.includes('payback.group') || hostname.includes('jobs.payback')) {
            data = extractPayback();
        }

        // Fallback to generic extraction
        if (!data || !data.title) {
            data = extractGeneric();
        }

        // Add URL and timestamp
        data.url = url;
        data.capturedAt = new Date().toISOString();

        return data;
    }

    // ===== LinkedIn Extractor =====
    function extractLinkedIn() {
        const title = document.querySelector('.job-details-jobs-unified-top-card__job-title h1, .jobs-unified-top-card__job-title')?.textContent?.trim();
        const company = document.querySelector('.job-details-jobs-unified-top-card__company-name a, .jobs-unified-top-card__company-name')?.textContent?.trim();
        const location = document.querySelector('.job-details-jobs-unified-top-card__bullet, .jobs-unified-top-card__bullet')?.textContent?.trim();

        const descriptionEl = document.querySelector('.jobs-description-content__text, .jobs-description__content');
        const description = descriptionEl?.textContent?.trim();

        return { title, company, location, description, source: 'linkedin' };
    }

    // ===== Indeed Extractor =====
    function extractIndeed() {
        const title = document.querySelector('.jobsearch-JobInfoHeader-title, [data-testid="jobsearch-JobInfoHeader-title"]')?.textContent?.trim();
        const company = document.querySelector('[data-testid="inlineHeader-companyName"], .jobsearch-InlineCompanyRating-companyHeader')?.textContent?.trim();
        const location = document.querySelector('[data-testid="jobsearch-JobInfoHeader-companyLocation"], .jobsearch-JobInfoHeader-subtitle > div:last-child')?.textContent?.trim();

        const descriptionEl = document.querySelector('#jobDescriptionText, .jobsearch-jobDescriptionText');
        const description = descriptionEl?.textContent?.trim();

        return { title, company, location, description, source: 'indeed' };
    }

    // ===== Glassdoor Extractor =====
    function extractGlassdoor() {
        const title = document.querySelector('[data-test="job-title"], .job-title')?.textContent?.trim();
        const company = document.querySelector('[data-test="employerName"], .employer-name')?.textContent?.trim();
        const location = document.querySelector('[data-test="location"], .location')?.textContent?.trim();

        const descriptionEl = document.querySelector('.jobDescriptionContent, [data-test="description"]');
        const description = descriptionEl?.textContent?.trim();

        return { title, company, location, description, source: 'glassdoor' };
    }

    // ===== Monster Extractor =====
    function extractMonster() {
        const title = document.querySelector('.job-title, h1[class*="title"]')?.textContent?.trim();
        const company = document.querySelector('.company-name, [class*="company"]')?.textContent?.trim();
        const location = document.querySelector('.location, [class*="location"]')?.textContent?.trim();

        const descriptionEl = document.querySelector('.job-description, [class*="description"]');
        const description = descriptionEl?.textContent?.trim();

        return { title, company, location, description, source: 'monster' };
    }

    // ===== ZipRecruiter Extractor =====
    function extractZipRecruiter() {
        const title = document.querySelector('.job_title, h1[class*="title"]')?.textContent?.trim();
        const company = document.querySelector('.hiring_company, [class*="company"]')?.textContent?.trim();
        const location = document.querySelector('.location, [class*="location"]')?.textContent?.trim();

        const descriptionEl = document.querySelector('.job_description, [class*="description"]');
        const description = descriptionEl?.textContent?.trim();

        return { title, company, location, description, source: 'ziprecruiter' };
    }

    // ===== PAYBACK Group Extractor =====
    function extractPayback() {
        // PAYBACK career site uses specific patterns
        const title =
            document.querySelector('.job-title, h1.title, .jobTitle, [data-automation-id="jobPostingTitle"]')?.textContent?.trim() ||
            document.querySelector('h1')?.textContent?.trim() ||
            document.querySelector('.job-header h1, .job-details h1')?.textContent?.trim();

        // Company is always PAYBACK
        const company = 'PAYBACK GmbH';

        const location =
            document.querySelector('.job-location, .location, [data-automation-id="jobPostingLocation"]')?.textContent?.trim() ||
            document.querySelector('[class*="location"]')?.textContent?.trim();

        // Get all text from the main content area
        const descriptionEl = document.querySelector('.job-description, .job-details, [data-automation-id="jobPostingDescription"], main, article');
        const description = descriptionEl?.textContent?.trim() || document.body.textContent?.substring(0, 15000);

        return { title, company, location, description: cleanDescription(description), source: 'payback' };
    }

    // ===== Generic Extractor =====
    function extractGeneric() {
        // Try common patterns
        const title =
            document.querySelector('h1')?.textContent?.trim() ||
            document.querySelector('[class*="job-title"], [class*="jobTitle"], [class*="position"]')?.textContent?.trim() ||
            document.title.split('|')[0]?.trim() ||
            document.title.split('-')[0]?.trim();

        const company =
            document.querySelector('[class*="company"], [class*="employer"], [class*="organization"]')?.textContent?.trim() ||
            extractFromMeta('og:site_name');

        const location =
            document.querySelector('[class*="location"], [class*="city"], [class*="address"]')?.textContent?.trim();

        // Get main content area for description
        const mainContent = document.querySelector('main, article, [role="main"], .content, #content');
        const description = mainContent?.textContent?.trim() || document.body.textContent?.substring(0, 10000);

        return {
            title,
            company,
            location,
            description: cleanDescription(description),
            source: 'generic'
        };
    }

    function extractFromMeta(property) {
        const meta = document.querySelector(`meta[property="${property}"], meta[name="${property}"]`);
        return meta?.getAttribute('content');
    }

    function cleanDescription(text) {
        if (!text) return '';

        // Remove excessive whitespace
        return text
            .replace(/\s+/g, ' ')
            .replace(/\n\s*\n/g, '\n\n')
            .trim()
            .substring(0, 15000); // Limit size
    }
})();
