import type { Module } from '~/components/features/project-creator/types';

export interface ModuleWithFramework extends Module {
  frameworkId: string;
  framework: {
    id: string;
    name: string;
    description: string;
  };
}

export const useModules = () => {
  // Pour usage dans <script setup> top-level (SSR compatible)
  const getModules = () => {
    return useFetch<ModuleWithFramework[]>('/api/cli/modules', {
      key: 'modules',
    });
  };

  const getModulesByFramework = (frameworkId: string) => {
    return useFetch<ModuleWithFramework[]>('/api/cli/modules', {
      key: `modules-${frameworkId}`,
      transform: (modules) => modules.filter((m) => m.frameworkId === frameworkId),
    });
  };

  // Pour usage dans des handlers / onMounted / fonctions async
  const fetchModules = () => $fetch<ModuleWithFramework[]>('/api/cli/modules');

  const fetchModulesByFramework = async (frameworkId: string) => {
    const modules = await $fetch<ModuleWithFramework[]>('/api/cli/modules');
    return modules.filter((m) => m.frameworkId === frameworkId);
  };

  return { getModules, getModulesByFramework, fetchModules, fetchModulesByFramework };
};
