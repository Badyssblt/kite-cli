export type ModuleType = {
  id: string;
  name: string;
  description?: string;
  frameworkId?: string;
  framework?: {
    id: string;
    name: string;
    description: string;
  };
}

export type CommunityModuleFile = {
  path: string
  content: string
}

export type CommunityModuleDependency = {
  name: string
  isDev: boolean
}

export type CommunityModuleEnvVar = {
  key: string
  defaultValue: string
  description?: string
}

export type CommunityModulePrompt = {
  id: string
  type: 'select' | 'input' | 'confirm'
  message: string
  choices?: string[]
  default?: string | boolean
}

export type CommunityModulePayload = {
  name: string
  description: string
  frameworkId: string
  category: string
  files: CommunityModuleFile[]
  dependencies: CommunityModuleDependency[]
  envVars: CommunityModuleEnvVar[]
  prompts: CommunityModulePrompt[]
}

export type CommunityModuleResponse = {
  id: string
  name: string
  description: string
  frameworkId: string
  category: string
  isCommunity: boolean
  authorId: string
  prompts: CommunityModulePrompt[] | null
  framework: {
    id: string
    name: string
    description: string
  }
  author: {
    id: string
    name: string
    image: string | null
  } | null
  status: {
    status: string
    reason: string | null
    updatedAt: string
  } | null
  files: CommunityModuleFile[]
  dependencies: CommunityModuleDependency[]
  envVars: CommunityModuleEnvVar[]
}

export type PresetType = {
  name: string;
  description?: string;
  framework: string;
  modules: string[];
  answers?: Record<string, Record<string, string | boolean>>;
}
