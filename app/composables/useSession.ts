// ── Session / auth ────────────────────────────────────────────────────────────
// Wraps GET /api/me (cookie session) and the Buwana login/logout flow. Shares a
// single keyed fetch so calling this in both the layout and the page does not
// double-request. Replaces the /api/me pattern copy-pasted across pages.

import type { SessionResponse } from '~/types/airbuddy'

export function useSession() {
  const { data: me, pending, refresh } = useFetch<SessionResponse>('/api/me', {
    credentials: 'include',
    headers: { 'Cache-Control': 'no-cache' },
    key: 'session-me',
  })

  const isAuthed = computed(() => !!me.value?.ok)
  const colorMode = useColorMode()

  function login(mode?: string) {
    const m = mode ?? (colorMode.value || 'light')
    window.location.href = `/api/auth/login?mode=${encodeURIComponent(m)}`
  }

  async function logout() {
    try {
      await useAirbuddyApi().logout()
      await refresh()
      await navigateTo('/')
    } catch (e) {
      console.error('logout failed:', e)
    }
  }

  return { me, pending, isAuthed, refresh, login, logout }
}
