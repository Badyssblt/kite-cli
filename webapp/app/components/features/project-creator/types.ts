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

export interface ModulePromptChoice {
  name: string;
  value: string;
  description?: string;
}

export interface ModulePrompt {
  id: string;
  type: 'select' | 'confirm' | 'input';
  message: string;
  choices?: ModulePromptChoice[];
  default?: string | boolean;
}

export interface Module {
  id: string;
  name: string;
  description?: string;
  category?: string;
  isCommunity?: boolean;
  prompts?: ModulePrompt[];
}

export interface Framework {
  id: string;
  name: string;
  description?: string;
  modules: Module[];
}

export interface Preset {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  frameworks: string[];
  modules: string[];
  answers?: Record<string, Record<string, string | boolean>> | null;
}

export const MODULE_CATEGORIES: Record<string, { label: string; order: number }> = {
  database: { label: 'Base de données', order: 1 },
  auth: { label: 'Authentification', order: 2 },
  ui: { label: 'Interface', order: 3 },
  state: { label: 'État', order: 4 },
  testing: { label: 'Tests', order: 5 },
  devops: { label: 'DevOps', order: 6 },
  i18n: { label: 'Internationalisation', order: 7 },
  payment: { label: 'Paiement', order: 8 },
  email: { label: 'Email', order: 9 },
  other: { label: 'Autre', order: 99 },
};

export const FRAMEWORK_VISUAL: Record<string, { iconBg: string; iconText: string }> = {
  nuxt: { iconBg: 'bg-green-500/10', iconText: 'text-green-500' },
  nextjs: { iconBg: 'bg-neutral-500/10', iconText: 'text-neutral-300' },
};

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
  email: { text: 'text-red-400', bg: 'bg-red-500' },
};
