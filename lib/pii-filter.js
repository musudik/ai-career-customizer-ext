// CoverGen  - PII Filter
export class PIIFilter {
    constructor() {
        // Patterns for detecting PII
        this.patterns = {
            email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
            phone: /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
            ssn: /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/g,
            address: /\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|court|ct|way|circle|cir)\.?(?:\s+(?:apt|apartment|unit|suite|ste|#)\s*\d+)?/gi,
            zipcode: /\b\d{5}(?:-\d{4})?\b/g
        };

        // Replacement templates
        this.replacements = {
            email: '[EMAIL]',
            phone: '[PHONE]',
            ssn: '[SSN]',
            address: '[ADDRESS]',
            zipcode: '[ZIP]'
        };
    }

    anonymize(text, options = {}) {
        if (!text) return '';

        const filterTypes = options.types || Object.keys(this.patterns);
        let result = text;

        for (const type of filterTypes) {
            if (this.patterns[type]) {
                result = result.replace(this.patterns[type], this.replacements[type]);
            }
        }

        return result;
    }

    detectPII(text) {
        const detected = {};

        for (const [type, pattern] of Object.entries(this.patterns)) {
            const matches = text.match(pattern);
            if (matches && matches.length > 0) {
                detected[type] = matches;
            }
        }

        return detected;
    }

    hasPII(text) {
        const detected = this.detectPII(text);
        return Object.keys(detected).length > 0;
    }

    // Get a summary of detected PII
    getPIISummary(text) {
        const detected = this.detectPII(text);
        const summary = [];

        for (const [type, matches] of Object.entries(detected)) {
            summary.push({
                type,
                count: matches.length,
                samples: matches.slice(0, 2).map(m => this.maskPartial(m, type))
            });
        }

        return summary;
    }

    // Partially mask detected PII for display
    maskPartial(value, type) {
        switch (type) {
            case 'email':
                const [user, domain] = value.split('@');
                return `${user.charAt(0)}***@${domain}`;
            case 'phone':
                return value.replace(/\d(?=\d{4})/g, '*');
            case 'ssn':
                return '***-**-' + value.slice(-4);
            case 'address':
                return value.substring(0, 10) + '***';
            default:
                return '***';
        }
    }

    // Restore PII from a map (for future enhancement)
    restore(anonymizedText, piiMap) {
        let result = anonymizedText;

        for (const [placeholder, original] of Object.entries(piiMap)) {
            result = result.replace(placeholder, original);
        }

        return result;
    }

    // Create a map of PII for potential restoration
    createPIIMap(text) {
        const map = {};
        let counter = 0;

        for (const [type, pattern] of Object.entries(this.patterns)) {
            const matches = text.match(pattern) || [];
            for (const match of matches) {
                const placeholder = `[${type.toUpperCase()}_${counter}]`;
                map[placeholder] = match;
                counter++;
            }
        }

        return map;
    }
}
