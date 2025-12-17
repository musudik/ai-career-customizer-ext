# AI Career Customizer

A Chrome extension that uses AI to generate tailored resumes and cover letters for job applications.

![AI Career Customizer](icons/icon128.svg)

## ✨ Features

- **🎯 Smart Job Capture** - Extract job details from any job posting page or URL
- **📄 Tailored Resume** - AI-powered resume customization for each job application
- **✉️ Cover Letter** - Generate personalized cover letters instantly
- **🌍 Multi-language** - Output in German (DE) or English (EN)
- **🤖 Multiple AI Providers** - OpenAI, Anthropic Claude, Google Gemini, OpenRouter, Perplexity
- **🔒 Privacy First** - Your data stays on your device, API calls go directly to providers
- **📥 Export Options** - Download as PDF or DOCX

## 🚀 Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked" and select the extension folder
5. The extension icon will appear in your toolbar

## ⚙️ Setup

### 1. Configure API Key

1. Click the extension icon → **Settings**
2. Select your preferred AI provider (OpenAI, Anthropic, Gemini, etc.)
3. Enter your API key
4. Click **Save**

### 2. Upload Your Resume

1. Go to **Settings** → **Resume** section
2. Upload your resume (PDF, DOCX, or TXT)
3. The extension will parse and store it locally

## 📖 Usage

### Capture a Job Posting

1. Navigate to any job posting page
2. Click the extension icon
3. Click **Capture Job** to extract job details
4. Alternatively, paste a job URL and capture from that

### Generate Documents

1. After capturing a job, select what to generate:
   - ✅ Tailored Resume
   - ✅ Cover Letter
2. Choose output language (DE/EN)
3. Click **Generate**
4. View, edit, and download your customized documents

### Export Options

- **PDF** - Opens in new tab, use Print → Save as PDF
- **DOCX** - Downloads directly, opens in Word/Google Docs

## 🔧 Customization

In the results page sidebar, you can:

- Adjust **emphasis** for Experience, Skills, Education, Projects
- Select **cover letter tone** (Professional, Enthusiastic, Confident, Creative)
- **Regenerate** documents with new settings

## 🏗️ Project Structure

```
ai-career-customizer-ext/
├── manifest.json          # Extension manifest
├── popup/                  # Extension popup UI
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── results/                # Results page (generated documents)
│   ├── results.html
│   ├── results.css
│   └── results.js
├── settings/               # Settings page
│   ├── settings.html
│   ├── settings.css
│   └── settings.js
├── privacy/                # Privacy policy page
├── content/                # Content scripts
│   └── job-capture.js      # Job extraction logic
├── background/             # Service worker
│   └── service-worker.js
├── lib/                    # Shared libraries
│   ├── storage.js          # Chrome storage wrapper
│   ├── consent.js          # User consent management
│   ├── pii-filter.js       # PII anonymization
│   ├── resume-parser.js    # Resume parsing
│   ├── document-exporter.js # PDF/DOCX export
│   └── ai-providers/       # AI provider implementations
│       ├── base-provider.js
│       ├── provider-factory.js
│       ├── openai.js
│       ├── anthropic.js
│       ├── gemini.js
│       ├── openrouter.js
│       └── perplexity.js
└── icons/                  # Extension icons
```

## 🔐 Privacy & Security

- **Local Storage Only** - Resume and settings stored in Chrome's local storage
- **Direct API Calls** - No intermediary servers, API calls go directly to your chosen provider
- **No Tracking** - No analytics or data collection
- **PII Filtering** - Optional anonymization before sending to AI

## 🛠️ Supported AI Providers

| Provider | Model Selection | Notes |
|----------|-----------------|-------|
| OpenAI | GPT-4, GPT-4 Turbo, GPT-3.5 Turbo | Recommended |
| Anthropic | Claude 3.5, Claude 3 | Great for nuanced writing |
| Google Gemini | Gemini Pro, Gemini Flash | Fast and capable |
| OpenRouter | Various models | Access to many models |
| Perplexity | pplx-70b, pplx-7b | Good for research |

## 📝 License

MIT License - See [LICENSE](LICENSE) for details.

## 🤝 Contributing

Contributions welcome! Please read the contributing guidelines before submitting PRs.

---

**Made with ❤️ for job seekers everywhere**
