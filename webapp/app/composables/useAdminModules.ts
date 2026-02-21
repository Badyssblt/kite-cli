import type { CommunityModuleResponse } from '~~/types/type'

export const useAdminModules = () => {
  const headers = useRequestHeaders(['cookie'])

  const getPendingModules = (status: Ref<string> | string) => {
    return useFetch<CommunityModuleResponse[]>('/api/admin/modules', {
      headers,
      query: { status },
      watch: [isRef(status) ? status : false].filter(Boolean),
    })
  }

  const reviewModule = (id: string, action: 'approve' | 'reject', reason?: string) => {
    return $fetch(`/api/admin/modules/${id}/review`, {
      method: 'POST',
      body: { action, reason },
    })
  }

  return {
    getPendingModules,
    reviewModule,
  }
}
