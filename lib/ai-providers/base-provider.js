// AI Career Customizer - Base Provider Class
export class BaseProvider {
    constructor(apiKey, model) {
        this.apiKey = apiKey;
        this.model = model;
    }

    async analyzeJobPosting(jobData) {
        throw new Error('analyzeJobPosting must be implemented by subclass');
    }

    async rewriteResume(resume, jobAnalysis, options = {}) {
        throw new Error('rewriteResume must be implemented by subclass');
    }

    async generateCoverLetter(resume, jobAnalysis, options = {}) {
        throw new Error('generateCoverLetter must be implemented by subclass');
    }

    getSystemPrompt(type) {
        const prompts = {
            analyze: `You are an expert job analyst. Analyze the job posting and extract:
1. Job title and company
2. Required skills and qualifications
3. Preferred/nice-to-have skills
4. Key responsibilities
5. Important keywords for ATS optimization
6. Company culture indicators
7. Salary range if mentioned

Respond in JSON format with these exact keys:
{
  "title": "",
  "company": "",
  "requiredSkills": [],
  "preferredSkills": [],
  "responsibilities": [],
  "keywords": [],
  "culture": "",
  "salary": ""
}`,

            resume: `You are an expert resume writer and ATS optimization specialist. Your task is to rewrite and optimize a resume for a specific job posting.

Guidelines:
- Maintain truthfulness - only rephrase, don't invent experience
- Use keywords from the job posting naturally
- Quantify achievements where possible
- Use action verbs and strong language
- Keep formatting clean and ATS-friendly
- Prioritize relevant experience
- Match the job posting's language and terminology

Output a clean, professional resume in markdown format.`,

            coverLetter: `You are an expert cover letter writer. Create a compelling, personalized cover letter in proper business letter format.

IMPORTANT FORMATTING RULES:
- Use proper business letter structure with clear paragraph breaks
- Start with a professional greeting (Dear Hiring Manager / Dear [Company] Team)
- Include 3-4 well-structured paragraphs with blank lines between them
- Paragraph 1: Strong opening hook showing genuine interest in the specific role
- Paragraph 2: Connect candidate's experience directly to job requirements with specific examples
- Paragraph 3: Highlight 2-3 key achievements that are relevant to this role
- Paragraph 4: Brief closing with call to action and enthusiasm
- End with professional sign-off and signature block

OUTPUT FORMAT:
Do NOT use markdown headers, code blocks, or horizontal rules.
Do NOT use bullet points or lists.
Write in flowing paragraph form like a real business letter.
Leave a blank line between paragraphs.

Example structure:
Dear Hiring Manager,

[Opening paragraph...]

[Body paragraph 1...]

[Body paragraph 2...]

[Closing paragraph...]

Sincerely,

[Candidate Name]
[Email]
[Phone]`
        };

        return prompts[type] || '';
    }

    buildAnalyzePrompt(jobData) {
        return `Analyze this job posting:

Title: ${jobData.title || 'Not specified'}
Company: ${jobData.company || 'Not specified'}
Location: ${jobData.location || 'Not specified'}

Job Description:
${jobData.description || 'No description available'}

URL: ${jobData.url || 'Not provided'}`;
    }

    buildResumePrompt(resume, jobAnalysis, options = {}) {
        const emphasisInstructions = options.emphasis
            ? `\n\nEmphasis Instructions:\n${Object.entries(options.emphasis)
                .map(([section, level]) => `- ${section}: ${level}`)
                .join('\n')}`
            : '';

        const languageInstruction = options.language === 'de'
            ? '\n\nIMPORTANT: Write the entire resume in German (Deutsch). Use professional German business language.'
            : '\n\nIMPORTANT: Write the entire resume in English. Use professional business English.';

        return `Rewrite this resume for the following job:

JOB ANALYSIS:
${JSON.stringify(jobAnalysis, null, 2)}

ORIGINAL RESUME:
${resume.text}
${emphasisInstructions}
${languageInstruction}

Create an optimized version that highlights relevant experience and uses job-specific keywords.`;
    }

    buildCoverLetterPrompt(resume, jobAnalysis, options = {}) {
        const languageInstruction = options.language === 'de'
            ? '\n\nIMPORTANT: Write the entire cover letter in German (Deutsch). Use formal German business letter format with "Sehr geehrte Damen und Herren" greeting and "Mit freundlichen Grüßen" closing.'
            : '\n\nIMPORTANT: Write the entire cover letter in English. Use professional business English.';

        return `Write a cover letter for this job application:

JOB DETAILS:
- Title: ${jobAnalysis.title}
- Company: ${jobAnalysis.company}
- Key Requirements: ${jobAnalysis.requiredSkills?.join(', ') || 'Not specified'}
- Key Responsibilities: ${jobAnalysis.responsibilities?.join(', ') || 'Not specified'}

CANDIDATE RESUME:
${resume.text}

${options.tone ? `Tone: ${options.tone}` : 'Tone: Professional yet personable'}
${options.focus ? `Focus Areas: ${options.focus.join(', ')}` : ''}
${languageInstruction}`;
    }

    handleError(error) {
        console.error('Provider error:', error);

        if (error.status === 401) {
            throw new Error('Invalid API key. Please check your settings.');
        } else if (error.status === 429) {
            throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        } else if (error.status === 500) {
            throw new Error('AI service temporarily unavailable. Please try again later.');
        } else {
            throw new Error(error.message || 'An error occurred while processing your request.');
        }
    }
}
