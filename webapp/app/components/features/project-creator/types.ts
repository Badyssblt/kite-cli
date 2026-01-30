export interface TreeNode {
  name: string;
  type: 'file' | 'folder';
  source?: string;
  children?: TreeNode[];
}

export interface OpenFile {
  path: string;
  name: string;
  content: string;
  language: string;
  source?: string;
}

export interface Module {
  id: string;
  name: string;
  description?: string;
}

export interface Framework {
  id: string;
  name: string;
  description?: string;
  modules: Module[];
}

export const MODULE_COLORS: Record<string, { text: string; bg: string }> = {
  prisma: { text: 'text-emerald-400', bg: 'bg-emerald-500' },
  tailwind: { text: 'text-cyan-400', bg: 'bg-cyan-500' },
  'better-auth': { text: 'text-violet-400', bg: 'bg-violet-500' },
  stripe: { text: 'text-purple-400', bg: 'bg-purple-500' },
  docker: { text: 'text-blue-400', bg: 'bg-blue-500' },
  shadcn: { text: 'text-orange-400', bg: 'bg-orange-500' },
  'nuxt-ui': { text: 'text-green-400', bg: 'bg-green-500' },
  pinia: { text: 'text-yellow-400', bg: 'bg-yellow-500' },
  i18n: { text: 'text-pink-400', bg: 'bg-pink-500' },
  eslint: { text: 'text-indigo-400', bg: 'bg-indigo-500' },
  vitest: { text: 'text-lime-400', bg: 'bg-lime-500' },
  supabase: { text: 'text-teal-400', bg: 'bg-teal-500' },
};
