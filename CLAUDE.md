# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm run dev          # Start Vite dev server on 0.0.0.0:5173
npm run build        # TypeScript compile + Vite production build
npm run preview      # Preview production build locally
```

### Quality Assurance
```bash
npm run lint         # TypeScript type checking (tsc --noEmit)
npm test            # Run all Vitest tests
npm run test:ui     # Open Vitest UI for interactive testing
npm run test:coverage # Generate test coverage report
```

### Testing Individual Files
```bash
npm test -- path/to/test.spec.ts    # Run specific test file
npm test -- --watch                 # Run tests in watch mode
```

## High-Level Architecture

This is an EBIOS RM (Risk Manager) AI Assistant application implementing the French ANSSI cybersecurity risk assessment methodology across 5 workshops.

### Core Architecture Pattern
The application uses a **multi-provider LLM abstraction layer** with service-based architecture:

1. **LLM Service Layer** (`services/llmService.ts`): Factory pattern providing unified interface for 10 LLM providers (Google Gemini, Mistral, Claude, DeepSeek, Qwen, Grok, Groq, OpenAI, Ollama, LM Studio)

2. **Agent Orchestrator** (`services/agentOrchestrator.ts`): Manages specialized AI agents for each EBIOS workshop with domain-specific prompting for cybersecurity, MITRE ATT&CK, and risk assessment

3. **State Management** (`context/ProjectContext.tsx`): React Context API managing the entire EbiosProject state across all 5 workshops with localStorage persistence

4. **Component Structure**: Step-based workflow components (`components/steps/Step[1-3]*.tsx`) corresponding to EBIOS workshops, with shared UI components for settings, chat, and export functionality

### EBIOS RM Workflow Implementation
The application orchestrates 5 sequential workshops:
- **Atelier 1**: Context definition and security baseline
- **Atelier 2**: Risk sources identification
- **Atelier 3**: Strategic scenarios creation
- **Atelier 4**: Operational scenarios with MITRE ATT&CK mapping
- **Atelier 5**: Security measures and risk treatment

Each workshop has dedicated AI agents with specialized prompts stored in `services/agentOrchestrator.ts`.

### Critical Security Considerations
The current architecture stores API keys client-side in localStorage with XOR encryption (`utils/encryption.ts`). This is identified as a security risk - future implementations should use:
- Backend API proxy for LLM calls
- Server-side API key management
- Proper authentication/authorization layer

### Key Technical Details
- **Build Target**: ESNext with esbuild minification and vendor/GenAI chunk splitting
- **Path Alias**: `@/` maps to `./src/` directory
- **Testing**: Vitest with jsdom environment, React Testing Library
- **TypeScript**: Strict mode enabled with target ES2020
- **Export Functionality**: PDF generation via jspdf, Excel via xlsx (`services/exportService.ts`)