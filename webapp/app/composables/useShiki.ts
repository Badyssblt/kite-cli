import { createHighlighter, type Highlighter } from 'shiki';

let highlighterPromise: Promise<Highlighter> | null = null;

const SUPPORTED_LANGUAGES = [
  'typescript',
  'javascript',
  'vue',
  'json',
  'css',
  'html',
  'markdown',
  'yaml',
  'shell',
  'prisma',
  'tsx',
  'jsx',
  'scss',
] as const;

export function useShiki() {
  const getHighlighter = async (): Promise<Highlighter> => {
    if (!highlighterPromise) {
      highlighterPromise = createHighlighter({
        themes: ['github-light'],
        langs: [...SUPPORTED_LANGUAGES],
      });
    }
    return highlighterPromise;
  };

  const highlight = async (code: string, language: string): Promise<string> => {
    const highlighter = await getHighlighter();

    // Fallback to text if language not supported
    const lang = SUPPORTED_LANGUAGES.includes(language as any) ? language : 'text';

    try {
      return highlighter.codeToHtml(code, {
        lang,
        theme: 'github-light',
      });
    } catch {
      // If highlighting fails, return escaped code
      return `<pre><code>${escapeHtml(code)}</code></pre>`;
    }
  };

  return { highlight };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
