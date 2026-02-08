export const getPresets = async () => {
    const { $api } = useNuxtApp();

    try {
        const { data, error } = await $api.get('/api/cli/presets');
        console.log(error);

        return data;
    } catch (error) {
        console.log(error);
    }
}
