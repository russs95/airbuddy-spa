export default defineEventHandler(async (event) => {
    const url = getRequestURL(event)
    if (!url.pathname.startsWith('/api/')) return

    const target = 'https://air2.earthen.io'
    return proxyRequest(event, `${target}${url.pathname}${url.search}`)
})