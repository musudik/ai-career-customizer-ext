// CoverGen  - OpenRouter Provider
import { BaseProvider } from './base-provider.js';

export class OpenRouterProvider extends BaseProvider {
    constructor(apiKey, model = 'anthropic/claude-3.5-sonnet') {
        super(apiKey, model);
        this.baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
    }

    async makeRequest(messages, options = {}) {
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
                'HTTP-Referer': chrome.runtime.getURL(''),
                'X-Title': 'CoverGen '
            },
            body: JSON.stringify({
                model: this.model,
                messages,
                temperature: options.temperature || 0.7,
                max_tokens: options.maxTokens || 4096
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            error.status = response.status;
            this.handleError(error);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    async analyzeJobPosting(jobData) {
        const messages = [
            { role: 'system', content: this.getSystemPrompt('analyze') },
            { role: 'user', content: this.buildAnalyzePrompt(jobData) }
        ];

        const response = await this.makeRequest(messages, { temperature: 0.3 });

        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Invalid response format');
        } catch (e) {
            console.error('Error parsing job analysis:', e);
            return {
                title: jobData.title,
                company: jobData.company,
                requiredSkills: [],
                preferredSkills: [],
                responsibilities: [],
                keywords: [],
                culture: '',
                salary: ''
            };
        }
    }

    async rewriteResume(resume, jobAnalysis, options = {}) {
        const messages = [
            { role: 'system', content: this.getSystemPrompt('resume') },
            { role: 'user', content: this.buildResumePrompt(resume, jobAnalysis, options) }
        ];

        return await this.makeRequest(messages);
    }

    async generateCoverLetter(resume, jobAnalysis, options = {}) {
        const messages = [
            { role: 'system', content: this.getSystemPrompt('coverLetter') },
            { role: 'user', content: this.buildCoverLetterPrompt(resume, jobAnalysis, options) }
        ];

        return await this.makeRequest(messages);
    }

    async generateCompletion(prompt, options = {}) {
        const messages = [
            { role: 'system', content: 'You are a professional translator. Translate accurately while maintaining formatting and tone.' },
            { role: 'user', content: prompt }
        ];

        return await this.makeRequest(messages, options);
    }
}
