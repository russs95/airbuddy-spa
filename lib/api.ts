export async function getHealth() {
    return await $fetch('/api/health')
}

export async function getLatest(deviceId: string) {
    return await $fetch(`/api/device/${deviceId}/latest`)
}

export async function getSeries(deviceId: string) {
    return await $fetch(`/api/device/${deviceId}/series`)
}