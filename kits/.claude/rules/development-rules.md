# Development Rules

**IMPORTANT:** Analyze the skills catalog and activate the skills that are needed for the task during the process.
**IMPORTANT:** You ALWAYS follow these principles: **YAGNI (You Aren't Gonna Need It) - KISS (Keep It Simple, Stupid) -
DRY (Don't Repeat Yourself)**

## General

- **File Naming**:
    - **TypeScript/JavaScript source files, CSS modules, and folders inside `packages/`**: use **camelCase** (e.g.
      `createFormContext.tsx`, `useFieldArray.ts`, `scopePathUtils.ts`, `settings.module.css`, `hooks/`, `utils/`).
    - **All other files** (bash scripts, config files, markdown): use **kebab-case**.
    - File names must be descriptive so LLMs reading them via Grep/Glob understand the purpose without opening the file.
- **File Size Management**: Keep individual code files under 200 lines for optimal context management
    - Split large files into smaller, focused components/modules
    - Use composition over inheritance for complex widgets
    - Extract utility functions into separate modules
    - Create dedicated service classes for business logic
- When looking for docs, activate `docs-seeker` skill (`context7` reference) for exploring latest docs.
- Use `gh` bash command to interact with Github features if needed
- Use `psql` bash command to query Postgres database for debugging if needed
- Use `ai-multimodal` skill for describing details of images, videos, documents, etc. if needed
- Use `ai-multimodal` skill and `imagemagick` skill for generating and editing images, videos, documents, etc. if needed
- Use `sequential-thinking` and `debug` skills for sequential thinking, analyzing code, debugging, etc. if needed
- **[IMPORTANT]** Follow the codebase structure and code standards in `./docs` during implementation.
- **[IMPORTANT]** Do not just simulate the implementation or mocking them, always implement the real code.

## Code Quality Guidelines

- Read and follow codebase structure and code standards in `./docs`
- Don't be too harsh on code linting, but **make sure there are no syntax errors and code are compilable**
- Prioritize functionality and readability over strict style enforcement and code formatting
- Use reasonable code quality standards that enhance developer productivity
- Use try catch error handling & cover security standards
- Use `code-reviewer` agent to review code after every implementation

## Pre-commit/Push Rules

- Run linting before commit
- Run tests before push (DO NOT ignore failed tests just to pass the build or github actions)
- Keep commits focused on the actual code changes
- **DO NOT** commit and push any confidential information (such as dotenv files, API keys, database credentials, etc.)
  to git repository!
- Create clean, professional commit messages without AI references. Use conventional commit format.

## Code Implementation

- Write clean, readable, and maintainable code
- Follow established architectural patterns
- Implement features according to specifications
- Handle edge cases and error scenarios
- **DO NOT** create new enhanced files, update to the existing files directly.

## Visual Aids

- Use `/ck:preview --explain` when explaining unfamiliar code patterns or complex logic
- Use `/ck:preview --diagram` for architecture diagrams and data flow visualization
- Use `/ck:preview --slides` for step-by-step walkthroughs and presentations
- Use `/ck:preview --ascii` for terminal-friendly diagrams (no browser needed to understand)
- Add `--html` to any generation flag for self-contained HTML output (opens in browser, no server needed)
- **Plan context:** Active plan determined from `## Plan Context` in hook injection; visuals save to
  `{plan_dir}/visuals/`
- If no active plan, fallback to `plans/visuals/` directory
- For Mermaid diagrams, use `/mermaidjs-v11` skill for v11 syntax rules
- See `primary-workflow.md` → Step 6 for workflow integration
