# Course Re-writer

A Next.js application for rewriting Canvas LMS course content to match a model course's DesignTools/DesignPLUS styling using Azure OpenAI.

## Features

- **5-Step Workflow**:
  1. **Connect + Load**: Connect to Canvas LMS and load pages, assignments, and discussions
  2. **Model Course**: Analyze a model course to extract DesignTools styling patterns
  3. **Rewrite**: Batch rewrite content using AI with validation
  4. **Review**: Side-by-side preview and approval of changes
  5. **Publish**: Push approved changes back to Canvas

- **AI-Powered Rewriting**: Uses Azure OpenAI to intelligently transform content while preserving instructional text
- **DesignTools Validation**: Ensures output maintains proper DesignPLUS HTML structure
- **Auto-Repair**: Automatically attempts to fix validation errors

## Prerequisites

- Node.js 18+
- Azure OpenAI deployment (gpt-4o recommended)
- Canvas LMS API token

## Setup

1. **Install dependencies**:
   ```bash
   cd Course-Rewriter-Next
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your Azure OpenAI credentials:
   ```
   AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
   AZURE_OPENAI_API_KEY=your_api_key
   AZURE_OPENAI_DEPLOYMENT=gpt-4o
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Open** [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Enter your Canvas URL and API token on the Connect page
2. Enter your target course ID (to rewrite) and model course ID (style reference)
3. Load items and proceed through the workflow
4. Review and approve changes before publishing

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand with session storage persistence
- **LLM**: Azure OpenAI via Vercel AI SDK

## Project Structure

```
src/
├── app/
│   ├── (workflow)/          # 5-step workflow pages
│   │   ├── connect/
│   │   ├── model/
│   │   ├── rewrite/
│   │   ├── review/
│   │   └── publish/
│   └── api/
│       ├── canvas/          # Canvas API proxy
│       ├── llm/             # LLM routes
│       └── validate/        # HTML validation
├── components/
│   ├── ui/                  # shadcn/ui components
│   └── layout/              # Layout components
├── lib/
│   ├── store/               # Zustand store
│   ├── llm/                 # LLM client
│   └── validation/          # DesignTools validation
├── types/                   # TypeScript types
└── config/                  # DesignTools prompts
```

## Canvas API Token

To generate a Canvas API token:
1. Log into Canvas
2. Go to Account > Settings
3. Scroll to "Approved Integrations"
4. Click "+ New Access Token"
5. Copy the token (it's only shown once!)

## License

MIT
