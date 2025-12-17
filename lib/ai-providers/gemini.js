// AI Career Customizer - Google Gemini Provider
import { BaseProvider } from './base-provider.js';

export class GeminiProvider extends BaseProvider {
    constructor(apiKey, model = 'gemini-1.5-pro-latest') {
        super(apiKey, model);
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
    }

    async makeRequest(systemPrompt, userMessage, options = {}) {
        const maxRetries = options.maxRetries || 3;
        let lastError = null;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const url = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;

                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contents: [
                            {
                                role: 'user',
                                parts: [{ text: `${systemPrompt}\n\n${userMessage}` }]
                            }
                        ],
                        generationConfig: {
                            temperature: options.temperature || 0.7,
                            maxOutputTokens: options.maxTokens || 4096
                        }
                    })
                });

                if (response.status === 429) {
                    const errorData = await response.json().catch(() => ({}));
                    const retryMatch = errorData.error?.message?.match(/retry in (\d+\.?\d*)s/i);
                    const retryDelay = retryMatch ? parseFloat(retryMatch[1]) * 1000 : Math.pow(2, attempt + 1) * 1000;

                    console.log(`Rate limited. Retrying in ${retryDelay / 1000}s... (attempt ${attempt + 1}/${maxRetries})`);

                    if (attempt < maxRetries - 1) {
                        await this.sleep(retryDelay);
                        continue;
                    }

                    throw new Error(
                        `Rate limit exceeded. Your Gemini API quota is exhausted.\n\n` +
                        `Options:\n` +
                        `1. Wait a few minutes and try again\n` +
                        `2. Switch to gemini-1.5-flash (higher free tier limits)\n` +
                        `3. Use OpenAI or Anthropic instead\n` +
                        `4. Upgrade to a paid Gemini plan`
                    );
                }

                if (!response.ok) {
                    const error = await response.json().catch(() => ({}));
                    error.status = response.status;
                    this.handleError(error);
                }

                const data = await response.json();

                if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                    return data.candidates[0].content.parts[0].text;
                }

                throw new Error('Invalid response from Gemini API');

            } catch (error) {
                lastError = error;
                if (error.message.includes('Rate limit')) {
                    throw error;
                }
                if (attempt === maxRetries - 1) {
                    throw error;
                }
            }
        }

        throw lastError;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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
}
