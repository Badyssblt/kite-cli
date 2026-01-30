export const useProjects = () => {
    const headers = useRequestHeaders(['cookie'])

    const getProjects = () => {
        return useFetch('/api/projects', {
            key: 'projects',
            headers,
        })
    }

    return {
        getProjects,
    }
}