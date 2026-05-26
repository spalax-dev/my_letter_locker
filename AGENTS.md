# Project Rules for AI Agents

## 1. Never Use Markdown
This project does NOT use Markdown syntax (like `**bold**`, `*italic*`, `# headings`, etc.).
- The editor uses **custom commands** with `$command$value$` syntax
- Available commands:
  - `$bold$text$` for bold
  - `$italic$text$` for italic
  - `$title:N$` for titles (N = level 1-6, e.g. `$title:1$`)
  - `$pass$secret$` for password protection
- Always use these custom commands, NOT Markdown

## 2. Use Custom Regex Patterns
The project has custom automaton/matchers in `src/core/matchers/`:
- `CommandMatcher` - handles the `$command$` syntax
- `UrlMatcher` - detects URLs
- `EmailMatcher` - detects emails
- etc.

When adding features that involve text parsing, use these matchers, NOT standard regex.

## 3. Always Use Tailwind CSS
All styling must use Tailwind CSS utility classes:
- Use `@apply` in CSS files for complex utilities
- Use direct Tailwind classes in HTML templates
- Do NOT write raw CSS for layout/styling unless absolutely necessary
- Exception: CSS variables and custom theme colors can be defined in `:root` or `@theme`