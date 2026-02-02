export const getFrameworks = async () => {
    const { $api } = useNuxtApp();

    try {
        const { data, error } = await $api.get('/api/cli/frameworks');
        console.log(error);

        return data
    } catch (error) {
        console.log(error);

    }
}