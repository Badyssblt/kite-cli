export const fetchFramework = async () => {
    const { $api } = useNuxtApp()
    const { data, error } = await $api.get('/api/projects')

    return data
}