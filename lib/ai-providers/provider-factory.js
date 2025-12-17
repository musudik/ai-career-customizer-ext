// AI Career Customizer - Provider Factory
import { OpenAIProvider } from './openai.js';
import { AnthropicProvider } from './anthropic.js';
import { GeminiProvider } from './gemini.js';
import { OpenRouterProvider } from './openrouter.js';
import { PerplexityProvider } from './perplexity.js';

export class ProviderFactory {
    static getProvider(providerName, apiKey, model) {
        switch (providerName) {
            case 'openai':
                return new OpenAIProvider(apiKey, model);
            case 'anthropic':
                return new AnthropicProvider(apiKey, model);
            case 'gemini':
                return new GeminiProvider(apiKey, model);
            case 'openrouter':
                return new OpenRouterProvider(apiKey, model);
            case 'perplexity':
                return new PerplexityProvider(apiKey, model);
            default:
                throw new Error(`Unknown provider: ${providerName}`);
        }
    }

    static getAvailableProviders() {
        return [
            {
                id: 'openai',
                name: 'OpenAI',
                models: [
                    { id: 'gpt-4o', name: 'GPT-4o (Recommended)' },
                    { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Faster)' },
                    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' }
                ]
            },
            {
                id: 'anthropic',
                name: 'Anthropic',
                models: [
                    { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet (Recommended)' },
                    { id: 'claude-3-5-haiku-latest', name: 'Claude 3.5 Haiku (Faster)' },
                    { id: 'claude-3-opus-latest', name: 'Claude 3 Opus (Most Capable)' }
                ]
            },
            {
                id: 'gemini',
                name: 'Google Gemini',
                models: [
                    { id: 'gemini-1.5-pro-latest', name: 'Gemini 1.5 Pro (Recommended)' },
                    { id: 'gemini-1.5-flash-latest', name: 'Gemini 1.5 Flash (Faster)' },
                    { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (Experimental)' }
                ]
            },
            {
                id: 'openrouter',
                name: 'OpenRouter',
                models: [
                    { id: 'mistralai/devstral-2512:free', name: 'Devstral 2 (Free)' },
                    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
                    { id: 'openai/gpt-4o', name: 'GPT-4o' },
                    { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5' },
                    { id: 'meta-llama/llama-3.1-405b-instruct', name: 'Llama 3.1 405B' },
                    { id: 'mistralai/mistral-large', name: 'Mistral Large' }
                ]
            },
            {
                id: 'perplexity',
                name: 'Perplexity',
                models: [
                    { id: 'llama-3.1-sonar-large-128k-online', name: 'Sonar Large (Online)' },
                    { id: 'llama-3.1-sonar-small-128k-online', name: 'Sonar Small (Online)' },
                    { id: 'llama-3.1-sonar-huge-128k-online', name: 'Sonar Huge (Online)' }
                ]
            }
        ];
    }
}
