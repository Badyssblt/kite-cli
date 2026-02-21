import type { Preset } from '~/components/features/project-creator/types';
import type { PresetType } from '~~/types/type';

export const usePresets = () => {
  const getPresets = () => {
    return useFetch<Preset[]>('/api/cli/presets', {
      key: 'presets',
    });
  };

  const getPresetsByFramework = (frameworkId: string) => {
    return useFetch<Preset[]>('/api/cli/presets', {
      key: `presets-${frameworkId}`,
      transform: (presets) => presets.filter((p) => p.frameworks.includes(frameworkId)),
    });
  };

  const createPreset = async (presetData: PresetType) => {
    return await $fetch('/api/cli/presets', {
      method: 'POST',
      body: presetData,
    });
  };

  return { getPresets, getPresetsByFramework, createPreset };
};
