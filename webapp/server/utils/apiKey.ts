export const validateApiKey = (event: any) => {
    const config = useRuntimeConfig()
    const apiKey = getHeader(event, 'x-api-key')

    if(!apiKey || apiKey !== config.kiteApiKey) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }
    
}