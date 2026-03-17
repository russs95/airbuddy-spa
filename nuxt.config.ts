// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,

  modules: ['@nuxt/ui'],

  css: ['~/assets/css/main.css'],

  ui: {
    fonts: false, // existing pages use CSS vars for fonts; don't load @nuxt/fonts
    theme: {
      prefix: 'lp', // must match prefix(lp) in main.css
    },
  },

  vite: {
    // ECharts performs its own internal lazy-loading — exclude from Vite's
    // pre-bundling so it resolves cleanly in both dev and build.
    optimizeDeps: {
      exclude: ['echarts', 'vue-echarts'],
    },
  },
})