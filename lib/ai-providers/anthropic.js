// CoverGen  - Anthropic Provider
import { BaseProvider } from './base-provider.js';

export class AnthropicProvider extends BaseProvider {
    constructor(apiKey, model = 'claude-3-5-sonnet-latest') {
        super(apiKey, model);
        this.baseUrl = 'https://api.anthropic.com/v1/messages';
    }

    async makeRequest(systemPrompt, userMessage, options = {}) {
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify({
                model: this.model,
                max_tokens: options.maxTokens || 4096,
                system: systemPrompt,
                messages: [
                    { role: 'user', content: userMessage }
                ]
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            error.status = response.status;
            this.handleError(error);
        }

        const data = await response.json();
        return data.content[0].text;
    }

    async analyzeJobPosting(jobData) {
        const response = await this.makeRequest(
            this.getSystemPrompt('analyze'),
            this.buildAnalyzePrompt(jobData)
        );

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
        return await this.makeRequest(
            this.getSystemPrompt('resume'),
            this.buildResumePrompt(resume, jobAnalysis, options)
        );
    }

    async generateCoverLetter(resume, jobAnalysis, options = {}) {
        return await this.makeRequest(
            this.getSystemPrompt('coverLetter'),
            this.buildCoverLetterPrompt(resume, jobAnalysis, options)
        );
    }

    async generateCompletion(prompt, options = {}) {
        return await this.makeRequest(
            'You are a professional translator. Translate accurately while maintaining formatting and tone.',
            prompt,
            options
        );
    }
}
