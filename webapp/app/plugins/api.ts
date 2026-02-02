interface ApiOptions {
  headers?: Record<string, string>
}

interface ApiResponse<T> {
  data: T | null
  error: string | null
  status: number
}

export default defineNuxtPlugin(() => {
  const request = async <TResponse = unknown, TBody = unknown>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    endpoint: string,
    body?: TBody,
    options: ApiOptions = {}
  ): Promise<ApiResponse<TResponse>> => {
    const { headers = {} } = options

    try {
      const response = await $fetch<TResponse>(endpoint, {
        method,
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      })

      return {
        data: response,
        error: null,
        status: 200
      }
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string }
      return {
        data: null,
        error: error.message || 'Une erreur est survenue',
        status: error.statusCode || 500
      }
    }
  }

  const api = {
    get: <T = unknown>(endpoint: string, options?: ApiOptions) =>
      request<T>('GET', endpoint, undefined, options),

    post: <T = unknown, B = unknown>(endpoint: string, body?: B, options?: ApiOptions) =>
      request<T, B>('POST', endpoint, body, options),

    put: <T = unknown, B = unknown>(endpoint: string, body?: B, options?: ApiOptions) =>
      request<T, B>('PUT', endpoint, body, options),

    patch: <T = unknown, B = unknown>(endpoint: string, body?: B, options?: ApiOptions) =>
      request<T, B>('PATCH', endpoint, body, options),

    delete: <T = unknown>(endpoint: string, options?: ApiOptions) =>
      request<T>('DELETE', endpoint, undefined, options)
  }

  return {
    provide: {
      api
    }
  }
})
