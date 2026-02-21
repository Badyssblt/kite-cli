import type { Framework } from '~/components/features/project-creator/types';

export const useFrameworks = () => {
  const getFrameworks = () => {
    return useFetch<Framework[]>('/api/cli/frameworks', {
      key: 'frameworks',
    });
  };

  return { getFrameworks };
};
