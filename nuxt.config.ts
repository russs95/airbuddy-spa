// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,

  modules: ['@nuxt/ui'],

  app: {
    head: {
      meta: [
        // OSM tile servers return 403 ("Referrer is required") when the browser
        // sends no Referer. Pin the document referrer policy so map tiles load
        // regardless of any stricter policy set by the serving layer.
        { name: 'referrer', content: 'strict-origin-when-cross-origin' },
      ],
      script: [
        // FontAwesome Kit (shared with hopeturtles.org account) — enables the
        // `fa-solid fa-*` icon classes used in the dashboard & profile views.
        { src: 'https://kit.fontawesome.com/735e38ff98.js', crossorigin: 'anonymous' },
      ],
    },
  },

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