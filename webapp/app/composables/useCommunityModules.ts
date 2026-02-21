import type { CommunityModulePayload, CommunityModuleResponse } from '~~/types/type'

export const useCommunityModules = () => {
  const headers = useRequestHeaders(['cookie'])

  const getMyModules = () => {
    return useFetch<CommunityModuleResponse[]>('/api/community/modules', {
      key: 'community-modules',
      headers,
    })
  }

  const getModule = (id: string) => {
    return useFetch<CommunityModuleResponse>(`/api/community/modules/${id}`, {
      key: `community-module-${id}`,
      headers,
    })
  }

  const createModule = (data: CommunityModulePayload) => {
    return $fetch<CommunityModuleResponse>('/api/community/modules', {
      method: 'POST',
      body: data,
    })
  }

  const updateModule = (id: string, data: CommunityModulePayload) => {
    return $fetch<CommunityModuleResponse>(`/api/community/modules/${id}`, {
      method: 'PUT',
      body: data,
    })
  }

  const deleteModule = (id: string) => {
    return $fetch<{ success: boolean }>(`/api/community/modules/${id}`, {
      method: 'DELETE',
    })
  }

  return {
    getMyModules,
    getModule,
    createModule,
    updateModule,
    deleteModule,
  }
}
