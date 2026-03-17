<script setup lang="ts">
definePageMeta({ layout: 'landing' })

// ─── Language switcher ────────────────────────────────────────────────────────
// UI-only; migrate to useI18n().t() later by replacing copy.value.x with t('x')
// and moving the objects below into locale JSON files.
const lang = ref<'en' | 'id'>('en')

const en = {
  nav: {
    features: 'Features',
    howItWorks: 'How It Works',
    openSource: 'Open Source',
    buildYourOwn: 'Build Your Own',
  },
  hero: {
    headline: 'Open Source Air Quality Monitoring',
    title: 'Know thy air.',
    description:
      'AirBuddy is an open source air quality monitor you can build yourself. Track CO₂, temperature, humidity, and VOCs in your home and community. Understand your air. Own what you build.',
    ctaBuild: 'Build Your Own',
    ctaDashboard: 'Register Account',
    valueStrip: ['Affordable', 'Hackable', 'Open Source', 'Community-Deployable'],
    valuePara:
      'Industrial air quality monitors cost thousands of dollars. AirBuddy brings the same capability to your home for a fraction of the price.',
  },
  whyAir: {
    headline: 'Why It Matters',
    title: 'Air quality affects everything.',
    para1:
      'Most of us spend over 90% of our time indoors, yet indoor air can be 2–5× more polluted than outdoor air. Elevated CO₂ causes fatigue and reduced focus. High VOCs from cleaning products, paint, and furniture damage health over time. Humidity swings encourage mould growth.',
    para2:
      'Outdoor air isn\'t safe either — household burning, vehicle exhaust, and industrial sources create localised pollution hotspots invisible to national monitoring networks. Communities need hyper-local data to act. AirBuddy puts that data in your hands.',
  },
  features: {
    headline: 'What AirBuddy Does',
    title: 'A complete air quality picture.',
    description:
      'AirBuddy measures the metrics that matter most for indoor and community air health.',
    items: [
      {
        icon: 'i-lucide-wind',
        title: 'CO₂ (eCO₂)',
        description:
          'Track equivalent CO₂ levels. High CO₂ = stuffy rooms, poor sleep, and reduced cognitive performance.',
      },
      {
        icon: 'i-lucide-thermometer',
        title: 'Temperature',
        description:
          'Dual sensor readout (main + RTC) for accurate ambient temperature monitoring.',
      },
      {
        icon: 'i-lucide-droplets',
        title: 'Humidity',
        description:
          'Stay in the healthy 40–60% RH range. Catch conditions that breed mould and dust mites.',
      },
      {
        icon: 'i-lucide-flask-conical',
        title: 'TVOC',
        description:
          'Total Volatile Organic Compounds. Detect off-gassing from furniture, paint, cleaning products, and cooking.',
      },
      {
        icon: 'i-lucide-monitor',
        title: 'Live Dashboard',
        description:
          'View telemetry in real-time from any browser. Historical trends, threshold bands, and multi-device views.',
      },
      {
        icon: 'i-lucide-puzzle',
        title: 'Fully Hackable',
        description:
          'Open firmware on RP2040/Pico. Add sensors, change intervals, integrate your own backend — it\'s all yours.',
      },
    ],
  },
  howItWorks: {
    headline: 'How It Works',
    title: 'Three steps from kit to insight.',
    steps: [
      {
        number: '01',
        title: 'Build the device',
        description:
          'Follow our open hardware guide. Solder a few components onto a Raspberry Pi Pico, flash the MicroPython firmware, and you\'re ready.',
      },
      {
        number: '02',
        title: 'Register & connect',
        description:
          'Sign in with your Buwana account, register your device in the dashboard, and point the firmware at the AirBuddy API. Data starts flowing immediately.',
      },
      {
        number: '03',
        title: 'Read & share',
        description:
          'Your air data is visible in real-time charts. Opt into community mode to contribute anonymised readings to a shared map.',
      },
    ],
  },
  different: {
    headline: 'Why AirBuddy',
    title: 'Different by design.',
    description:
      'Consumer air monitors are closed, expensive, and send your data to someone else\'s cloud. AirBuddy is built on different principles.',
    items: [
      {
        icon: 'i-lucide-code-2',
        title: 'Open Source',
        description:
          'Firmware, backend, and frontend are all public. Audit everything. Fork anything.',
      },
      {
        icon: 'i-lucide-wrench',
        title: 'Accessible to Build',
        description:
          'Basic soldering + a €15–€30 component kit. No proprietary PCBs, no exclusive components.',
      },
      {
        icon: 'i-lucide-home',
        title: 'Home-First',
        description:
          'Designed for the places where you actually live and breathe — bedrooms, kitchens, home offices.',
      },
      {
        icon: 'i-lucide-users',
        title: 'Community-Scalable',
        description:
          'Deploy one device or hundreds. A neighbourhood of AirBuddys creates a hyper-local pollution map.',
      },
      {
        icon: 'i-lucide-settings-2',
        title: 'Hackable',
        description:
          'Add more sensors, change the polling interval, integrate your own data pipeline. The hardware and software belong to you.',
      },
    ],
  },
  dashboard: {
    headline: 'Dashboard Preview',
    title: 'Your air data, beautifully visualised.',
    description:
      'The AirBuddy dashboard gives you real-time and historical views of every metric, across all your devices and homes.',
    bullets: [
      'Real-time CO₂, temperature, humidity, and TVOC',
      'Time-series charts with comfort/safety threshold bands',
      'Multi-device & multi-home management',
      'Device registration and secure key management',
      'Accessible from any browser, no app install needed',
    ],
  },
  community: {
    headline: 'Community Insight',
    title: 'Your data is yours. Sharing is optional.',
    description:
      'AirBuddy never forces your data into a shared pool. But if you choose to contribute anonymised readings, your device helps build a hyper-local picture of air quality in your neighbourhood — data that no national network captures.',
  },
  openSource: {
    headline: 'Open Source',
    title: 'Built in the open, for everyone.',
    description:
      'All three components — firmware, backend API, and this SPA — are available on GitHub. Read the code, suggest improvements, or deploy your own private instance.',
    cta: 'View on GitHub',
  },
  vision: {
    headline: 'Our Vision',
    title: 'Air quality as a community right.',
    description:
      'We believe every household deserves to know what\'s in the air it breathes — without paying a premium or surrendering its data. AirBuddy is a step toward a world where air quality monitoring is as normal as checking the weather: free, local, and owned by the people who use it.',
    closing:
      'Join us in building that future — one device at a time.',
  },
  finalCta: {
    title: 'Ready to breathe smarter?',
    description: 'Build your AirBuddy today or explore the live dashboard.',
    ctaBuild: 'Build Your Own',
    ctaDashboard: 'Open the Dashboard',
  },
  footer: {
    tagline: 'Home-first air intelligence. Open source, always.',
    links: [
      { label: 'Dashboard', to: '/' },
      { label: 'GitHub', to: 'https://github.com/russs95/airbuddy-spa', target: '_blank' },
    ],
    legal: 'Open source. Built with ❤️ for clean air.',
  },
}

const id = {
  nav: {
    features: 'Fitur',
    howItWorks: 'Cara Kerja',
    openSource: 'Open Source',
    buildYourOwn: 'Buat Sendiri',
  },
  hero: {
    headline: 'Pemantauan Kualitas Udara Open Source',
    title: 'Kenali udaramu.',
    description:
      'AirBuddy adalah monitor kualitas udara open source yang bisa Anda bangun sendiri. Pantau CO₂, suhu, kelembaban, dan VOC di rumah dan komunitas Anda. Pahami udara Anda. Miliki apa yang Anda bangun.',
    ctaBuild: 'Buat Sendiri',
    ctaDashboard: 'Daftar Akun',
    valueStrip: ['Terjangkau', 'Hackable', 'Open Source', 'Untuk Komunitas'],
    valuePara:
      'Monitor kualitas udara industri berharga jutaan rupiah. AirBuddy menghadirkan kemampuan yang sama untuk rumah Anda dengan biaya jauh lebih murah.',
  },
  whyAir: {
    headline: 'Mengapa Penting',
    title: 'Kualitas udara mempengaruhi segalanya.',
    para1:
      'Kebanyakan dari kita menghabiskan lebih dari 90% waktu di dalam ruangan, namun udara dalam ruangan bisa 2–5× lebih tercemar dari udara luar. CO₂ tinggi menyebabkan kelelahan dan konsentrasi menurun. VOC dari produk pembersih, cat, dan perabot merusak kesehatan dalam jangka panjang. Fluktuasi kelembaban mendorong pertumbuhan jamur.',
    para2:
      'Udara luar juga tidak selalu aman — pembakaran rumah tangga, knalpot kendaraan, dan sumber industri menciptakan titik polusi lokal yang tidak terlihat oleh jaringan pemantauan nasional. Komunitas membutuhkan data hiper-lokal untuk bertindak. AirBuddy menempatkan data itu di tangan Anda.',
  },
  features: {
    headline: 'Apa yang Dilakukan AirBuddy',
    title: 'Gambaran kualitas udara yang lengkap.',
    description:
      'AirBuddy mengukur metrik yang paling penting untuk kesehatan udara dalam ruangan dan komunitas.',
    items: [
      {
        icon: 'i-lucide-wind',
        title: 'CO₂ (eCO₂)',
        description:
          'Pantau kadar CO₂ ekuivalen. CO₂ tinggi = ruangan pengap, tidur buruk, dan kinerja kognitif menurun.',
      },
      {
        icon: 'i-lucide-thermometer',
        title: 'Suhu',
        description:
          'Pembacaan sensor ganda (utama + RTC) untuk pemantauan suhu ambien yang akurat.',
      },
      {
        icon: 'i-lucide-droplets',
        title: 'Kelembaban',
        description:
          'Tetap di kisaran RH 40–60% yang sehat. Deteksi kondisi yang menumbuhkan jamur dan tungau debu.',
      },
      {
        icon: 'i-lucide-flask-conical',
        title: 'TVOC',
        description:
          'Total Volatile Organic Compounds. Deteksi gas dari perabot, cat, produk pembersih, dan memasak.',
      },
      {
        icon: 'i-lucide-monitor',
        title: 'Dasbor Langsung',
        description:
          'Lihat telemetri secara real-time dari browser mana pun. Tren historis, band ambang batas, dan tampilan multi-perangkat.',
      },
      {
        icon: 'i-lucide-puzzle',
        title: 'Sepenuhnya Hackable',
        description:
          'Firmware open source di RP2040/Pico. Tambahkan sensor, ubah interval, integrasikan backend Anda sendiri.',
      },
    ],
  },
  howItWorks: {
    headline: 'Cara Kerja',
    title: 'Tiga langkah dari kit ke wawasan.',
    steps: [
      {
        number: '01',
        title: 'Bangun perangkat',
        description:
          'Ikuti panduan hardware open kami. Solder beberapa komponen ke Raspberry Pi Pico, flash firmware MicroPython, dan Anda siap.',
      },
      {
        number: '02',
        title: 'Daftarkan & hubungkan',
        description:
          'Masuk dengan akun Buwana, daftarkan perangkat di dasbor, dan arahkan firmware ke API AirBuddy. Data langsung mengalir.',
      },
      {
        number: '03',
        title: 'Baca & bagikan',
        description:
          'Data udara Anda terlihat dalam grafik real-time. Aktifkan mode komunitas untuk berkontribusi pembacaan anonim ke peta bersama.',
      },
    ],
  },
  different: {
    headline: 'Mengapa AirBuddy',
    title: 'Berbeda dari desainnya.',
    description:
      'Monitor udara konsumen tertutup, mahal, dan mengirim data Anda ke cloud orang lain. AirBuddy dibangun di atas prinsip yang berbeda.',
    items: [
      {
        icon: 'i-lucide-code-2',
        title: 'Open Source',
        description:
          'Firmware, backend, dan frontend semuanya publik. Audit semuanya. Fork apa saja.',
      },
      {
        icon: 'i-lucide-wrench',
        title: 'Mudah Dibangun',
        description:
          'Solder dasar + kit komponen seharga €15–€30. Tidak ada PCB eksklusif atau komponen khusus.',
      },
      {
        icon: 'i-lucide-home',
        title: 'Untuk Rumah',
        description:
          'Dirancang untuk tempat Anda benar-benar tinggal dan bernapas — kamar tidur, dapur, kantor rumah.',
      },
      {
        icon: 'i-lucide-users',
        title: 'Skalabel untuk Komunitas',
        description:
          'Deploy satu perangkat atau ratusan. Satu lingkungan AirBuddy menciptakan peta polusi hiper-lokal.',
      },
      {
        icon: 'i-lucide-settings-2',
        title: 'Hackable',
        description:
          'Tambahkan sensor, ubah interval polling, integrasikan pipeline data Anda sendiri. Hardware dan software milik Anda.',
      },
    ],
  },
  dashboard: {
    headline: 'Pratinjau Dasbor',
    title: 'Data udara Anda, divisualisasikan dengan indah.',
    description:
      'Dasbor AirBuddy memberikan tampilan real-time dan historis dari setiap metrik, di semua perangkat dan rumah Anda.',
    bullets: [
      'CO₂, suhu, kelembaban, dan TVOC real-time',
      'Grafik time-series dengan band ambang kenyamanan/keamanan',
      'Manajemen multi-perangkat & multi-rumah',
      'Registrasi perangkat dan manajemen kunci yang aman',
      'Dapat diakses dari browser mana pun, tanpa perlu install aplikasi',
    ],
  },
  community: {
    headline: 'Wawasan Komunitas',
    title: 'Data Anda milik Anda. Berbagi bersifat opsional.',
    description:
      'AirBuddy tidak pernah memaksa data Anda masuk ke kumpulan bersama. Namun jika Anda memilih untuk berkontribusi pembacaan anonim, perangkat Anda membantu membangun gambaran kualitas udara hiper-lokal di lingkungan Anda.',
  },
  openSource: {
    headline: 'Open Source',
    title: 'Dibangun secara terbuka, untuk semua orang.',
    description:
      'Ketiga komponen — firmware, backend API, dan SPA ini — tersedia di GitHub. Baca kodenya, usulkan perbaikan, atau deploy instance pribadi Anda sendiri.',
    cta: 'Lihat di GitHub',
  },
  vision: {
    headline: 'Visi Kami',
    title: 'Kualitas udara sebagai hak komunitas.',
    description:
      'Kami percaya setiap rumah tangga berhak mengetahui apa yang ada di udara yang dihirupnya — tanpa membayar mahal atau menyerahkan datanya. AirBuddy adalah langkah menuju dunia di mana pemantauan kualitas udara sepormal mengecek cuaca: gratis, lokal, dan dimiliki oleh orang-orang yang menggunakannya.',
    closing: 'Bergabunglah dengan kami dalam membangun masa depan itu — satu perangkat pada satu waktu.',
  },
  finalCta: {
    title: 'Siap bernapas lebih cerdas?',
    description: 'Bangun AirBuddy Anda hari ini atau jelajahi dasbor langsung.',
    ctaBuild: 'Buat Sendiri',
    ctaDashboard: 'Buka Dasbor',
  },
  footer: {
    tagline: 'Kecerdasan udara untuk rumah. Open source, selalu.',
    links: [
      { label: 'Dasbor', to: '/' },
      { label: 'GitHub', to: 'https://github.com/russs95/airbuddy-spa', target: '_blank' },
    ],
    legal: 'Open source. Dibangun dengan ❤️ untuk udara bersih.',
  },
}

const copy = computed(() => lang.value === 'id' ? id : en)

// ─── Color mode ───────────────────────────────────────────────────────────────
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')
function toggleDark() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
<div class="lp-landing-page">
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- HEADER                                                                  -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <UHeader :to="'/landing-beta'" :title="'AirBuddy'">
    <template #title>
      <img src="/airbuddy-logo.svg" alt="AirBuddy" class="lp:h-8 lp:w-auto" />
    </template>

    <!-- Centre nav (desktop) -->
    <template #default>
      <nav class="lp:hidden lp:lg:flex lp:items-center lp:gap-6">
        <a href="#features" class="lp:text-sm lp:text-gray-600 dark:lp:text-gray-300 lp:hover:text-cyan-400 lp:transition-colors">
          {{ copy.nav.features }}
        </a>
        <a href="#how-it-works" class="lp:text-sm lp:text-gray-600 dark:lp:text-gray-300 lp:hover:text-cyan-400 lp:transition-colors">
          {{ copy.nav.howItWorks }}
        </a>
        <a href="#open-source" class="lp:text-sm lp:text-gray-600 dark:lp:text-gray-300 lp:hover:text-cyan-400 lp:transition-colors">
          {{ copy.nav.openSource }}
        </a>
      </nav>
    </template>

    <!-- Right slot -->
    <template #right>
      <div class="lp:flex lp:items-center lp:gap-2">
        <!-- Language toggle -->
        <div class="lp:flex lp:rounded-lg lp:border lp:border-gray-200 dark:lp:border-gray-700 lp:overflow-hidden">
          <UButton
            :variant="lang === 'en' ? 'solid' : 'ghost'"
            color="primary"
            size="xs"
            @click="lang = 'en'"
          >EN</UButton>
          <UButton
            :variant="lang === 'id' ? 'solid' : 'ghost'"
            color="primary"
            size="xs"
            @click="lang = 'id'"
          >ID</UButton>
        </div>

        <!-- Dark mode toggle -->
        <UButton
          :icon="isDark ? 'i-lucide-moon' : 'i-lucide-sun'"
          color="neutral"
          variant="ghost"
          size="sm"
          @click="toggleDark"
        />

        <!-- Login button -->
        <UButton
          to="https://air2.earthen.io/api/auth/login"
          color="neutral"
          variant="outline"
          size="sm"
          icon="i-lucide-log-in"
        >
          Login
        </UButton>

        <!-- GitHub CTA -->
        <UButton
          to="https://github.com/russs95/airbuddy_v2"
          target="_blank"
          color="primary"
          variant="solid"
          size="sm"
          icon="i-lucide-github"
          class="lp:hidden lp:sm:flex"
        >
          {{ copy.nav.buildYourOwn }}
        </UButton>
      </div>
    </template>

    <!-- Mobile hamburger panel -->
    <template #panel>
      <nav class="lp:flex lp:flex-col lp:gap-1 lp:p-4">
        <p class="lp:text-xs lp:font-semibold lp:uppercase lp:tracking-widest lp:text-gray-400 dark:lp:text-gray-500 lp:px-3 lp:pb-2 lp:pt-1">
          Project Links
        </p>
        <a href="https://github.com/russs95/airbuddy_v2" target="_blank"
          class="lp:flex lp:items-center lp:gap-3 lp:px-3 lp:py-2.5 lp:rounded-lg lp:text-sm lp:text-gray-700 dark:lp:text-gray-200 lp:hover:bg-gray-100 dark:lp:hover:bg-gray-800 lp:transition-colors">
          <UIcon name="i-lucide-cpu" class="lp:w-4 lp:h-4 lp:text-orange-400 lp:flex-shrink-0" />
          Firmware Repo
        </a>
        <a href="https://github.com/russs95/airbuddy-spa" target="_blank"
          class="lp:flex lp:items-center lp:gap-3 lp:px-3 lp:py-2.5 lp:rounded-lg lp:text-sm lp:text-gray-700 dark:lp:text-gray-200 lp:hover:bg-gray-100 dark:lp:hover:bg-gray-800 lp:transition-colors">
          <UIcon name="i-lucide-globe" class="lp:w-4 lp:h-4 lp:text-cyan-400 lp:flex-shrink-0" />
          Site Repo
        </a>
        <a href="https://github.com/russs95/airbuddy-online" target="_blank"
          class="lp:flex lp:items-center lp:gap-3 lp:px-3 lp:py-2.5 lp:rounded-lg lp:text-sm lp:text-gray-700 dark:lp:text-gray-200 lp:hover:bg-gray-100 dark:lp:hover:bg-gray-800 lp:transition-colors">
          <UIcon name="i-lucide-server" class="lp:w-4 lp:h-4 lp:text-cyan-400 lp:flex-shrink-0" />
          API Repo
        </a>
        <a href="https://air2.earthen.io/dashboard" target="_blank"
          class="lp:flex lp:items-center lp:gap-3 lp:px-3 lp:py-2.5 lp:rounded-lg lp:text-sm lp:text-gray-700 dark:lp:text-gray-200 lp:hover:bg-gray-100 dark:lp:hover:bg-gray-800 lp:transition-colors">
          <UIcon name="i-lucide-layout-dashboard" class="lp:w-4 lp:h-4 lp:text-orange-400 lp:flex-shrink-0" />
          Dashboard
        </a>
        <a href="https://buwana.ecobricks.org/en/signup-1.php?app=airb_ca090536efc8&id=150" target="_blank"
          class="lp:flex lp:items-center lp:gap-3 lp:px-3 lp:py-2.5 lp:rounded-lg lp:text-sm lp:text-gray-700 dark:lp:text-gray-200 lp:hover:bg-gray-100 dark:lp:hover:bg-gray-800 lp:transition-colors">
          <UIcon name="i-lucide-user-plus" class="lp:w-4 lp:h-4 lp:text-cyan-400 lp:flex-shrink-0" />
          AB Account Registration
        </a>
        <a href="https://github.com/russs95/airbuddy_v2/wiki/Pico-Wiring" target="_blank"
          class="lp:flex lp:items-center lp:gap-3 lp:px-3 lp:py-2.5 lp:rounded-lg lp:text-sm lp:text-gray-700 dark:lp:text-gray-200 lp:hover:bg-gray-100 dark:lp:hover:bg-gray-800 lp:transition-colors">
          <UIcon name="i-lucide-cable" class="lp:w-4 lp:h-4 lp:text-orange-400 lp:flex-shrink-0" />
          Wiring Wiki
        </a>
        <a href="https://github.com/russs95/airbuddy_v2/wiki/AirBuddy-First%E2%80%90Time-Setup-Guide" target="_blank"
          class="lp:flex lp:items-center lp:gap-3 lp:px-3 lp:py-2.5 lp:rounded-lg lp:text-sm lp:text-gray-700 dark:lp:text-gray-200 lp:hover:bg-gray-100 dark:lp:hover:bg-gray-800 lp:transition-colors">
          <UIcon name="i-lucide-book-open" class="lp:w-4 lp:h-4 lp:text-orange-400 lp:flex-shrink-0" />
          First Time Setup
        </a>
      </nav>
    </template>
  </UHeader>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- HERO                                                                    -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <section class="lp-hero">
    <!-- Animated blur background -->
    <div class="lp-hero-bg" aria-hidden="true">
      <div class="lp-blob lp-blob-cyan-a"></div>
      <div class="lp-blob lp-blob-white"></div>
      <div class="lp-blob lp-blob-orange"></div>
      <div class="lp-blob lp-blob-cyan-b"></div>
    </div>

    <!-- Hero content -->
    <div class="lp:relative lp:z-10 lp:text-center lp:max-w-4xl lp:mx-auto lp:px-6">
      <p class="lp-hero-eyebrow lp:text-xs lp:font-semibold lp:uppercase lp:tracking-widest lp:mb-6 lp:text-cyan-500 dark:lp:text-cyan-400">
        {{ copy.hero.headline }}
      </p>
      <h1 class="lp-hero-title lp:font-bold lp:mb-8 lp:text-gray-900">
        {{ copy.hero.title }}
      </h1>
      <p class="lp-hero-desc lp:text-lg lp:md:text-xl lp:leading-relaxed lp:mb-10 lp:text-gray-600 dark:lp:text-gray-300 lp:max-w-2xl lp:mx-auto">
        {{ copy.hero.description }}
      </p>

      <!-- CTA buttons -->
      <div class="lp:flex lp:flex-wrap lp:justify-center lp:gap-4 lp:mb-12">
        <UButton
          to="https://github.com/russs95/airbuddy_v2"
          target="_blank"
          color="primary"
          size="xl"
          icon="i-lucide-hammer"
        >
          {{ copy.hero.ctaBuild }}
        </UButton>
        <UButton
          to="https://buwana.ecobricks.org/en/signup-1.php?app=airb_ca090536efc8"
          target="_blank"
          color="neutral"
          variant="outline"
          size="xl"
          icon="i-lucide-user-plus"
        >
          {{ copy.hero.ctaDashboard }}
        </UButton>
      </div>

      <!-- Value strip -->
      <div class="lp:flex lp:flex-wrap lp:justify-center lp:gap-3">
        <span
          v-for="value in copy.hero.valueStrip"
          :key="value"
          class="lp:inline-flex lp:items-center lp:gap-1.5 lp:px-3 lp:py-1.5 lp:rounded-full lp:text-sm lp:font-medium lp:bg-white/60 dark:lp:bg-slate-800/60 lp:text-cyan-700 dark:lp:text-cyan-300 lp:border lp:border-cyan-200 dark:lp:border-cyan-800 lp:backdrop-blur-sm"
        >
          <UIcon name="i-lucide-check" class="lp:w-3.5 lp:h-3.5" />
          {{ value }}
        </span>
      </div>
      <p class="lp-hero-desc lp:mt-5 lp:text-sm lp:text-gray-500 dark:lp:text-gray-400">
        {{ copy.hero.valuePara }}
      </p>
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- WHY AIR MATTERS                                                         -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <section class="lp-why-air">
    <div class="lp-why-air-bg" aria-hidden="true">
      <div class="lp-wblob lp-wblob-a"></div>
      <div class="lp-wblob lp-wblob-b"></div>
    </div>
    <div class="lp:relative lp:z-10 lp:max-w-5xl lp:mx-auto lp:px-6 lp:text-center">
      <UIcon name="i-lucide-cloud" class="lp:w-8 lp:h-8 lp:mx-auto lp:mb-4 lp:opacity-50" style="color: #FF6400" />
      <p class="lp:text-xs lp:font-semibold lp:uppercase lp:tracking-widest lp:mb-4 lp:opacity-60" style="color: #33E6E6; font-family: 'Mulish', sans-serif;">
        {{ copy.whyAir.headline }}
      </p>
      <h2 class="lp:text-3xl lp:md:text-5xl lp:font-bold lp:text-white lp:mb-12">
        {{ copy.whyAir.title }}
      </h2>
      <div class="lp:grid lp:md:grid-cols-2 lp:gap-10 lp:text-base lp:leading-relaxed lp:text-left" style="color: #94a3b8; font-family: 'Mulish', sans-serif;">
        <p>{{ copy.whyAir.para1 }}</p>
        <p>{{ copy.whyAir.para2 }}</p>
      </div>
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- HOW IT WORKS                                                            -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <UPageSection
    id="how-it-works"
    :headline="copy.howItWorks.headline"
    :title="copy.howItWorks.title"
    icon="i-lucide-list-ordered"
  >
    <div class="lp:grid lp:md:grid-cols-3 lp:gap-8 lp:mt-8">
      <!-- Step 01 — Build the device -->
      <div class="lp:relative lp:flex lp:flex-col lp:gap-4 lp:p-6 lp:rounded-2xl lp:border lp:border-gray-200 dark:lp:border-gray-800 lp:bg-white dark:lp:bg-gray-900">
        <span class="lp:text-4xl lp:font-black lp:text-orange-200 dark:lp:text-orange-900 lp:leading-none lp:select-none">
          {{ copy.howItWorks.steps[0].number }}
        </span>
        <h3 class="lp:text-lg lp:font-semibold lp:text-gray-900 dark:lp:text-white">
          {{ copy.howItWorks.steps[0].title }}
        </h3>
        <p class="lp:text-sm lp:text-gray-600 dark:lp:text-gray-400 lp:leading-relaxed lp:flex-1">
          {{ copy.howItWorks.steps[0].description }}
        </p>
        <UButton
          to="https://github.com/russs95/airbuddy_v2"
          target="_blank"
          color="primary"
          variant="solid"
          size="sm"
          icon="i-lucide-hammer"
          class="lp:self-start"
        >
          Build Yours
        </UButton>
      </div>

      <!-- Step 02 — Register & connect -->
      <div class="lp:relative lp:flex lp:flex-col lp:gap-4 lp:p-6 lp:rounded-2xl lp:border lp:border-gray-200 dark:lp:border-gray-800 lp:bg-white dark:lp:bg-gray-900">
        <span class="lp:text-4xl lp:font-black lp:text-orange-200 dark:lp:text-orange-900 lp:leading-none lp:select-none">
          {{ copy.howItWorks.steps[1].number }}
        </span>
        <h3 class="lp:text-lg lp:font-semibold lp:text-gray-900 dark:lp:text-white">
          {{ copy.howItWorks.steps[1].title }}
        </h3>
        <p class="lp:text-sm lp:text-gray-600 dark:lp:text-gray-400 lp:leading-relaxed lp:flex-1">
          {{ copy.howItWorks.steps[1].description }}
        </p>
        <UButton
          to="https://buwana.ecobricks.org/en/signup-1.php?app=airb_ca090536efc8&id=150"
          target="_blank"
          color="sky"
          variant="solid"
          size="sm"
          icon="i-lucide-user-plus"
          class="lp:self-start"
        >
          Sign Up
        </UButton>
      </div>

      <!-- Step 03 — Read & share -->
      <div class="lp:relative lp:flex lp:flex-col lp:gap-4 lp:p-6 lp:rounded-2xl lp:border lp:border-gray-200 dark:lp:border-gray-800 lp:bg-white dark:lp:bg-gray-900">
        <span class="lp:text-4xl lp:font-black lp:text-orange-200 dark:lp:text-orange-900 lp:leading-none lp:select-none">
          {{ copy.howItWorks.steps[2].number }}
        </span>
        <h3 class="lp:text-lg lp:font-semibold lp:text-gray-900 dark:lp:text-white">
          {{ copy.howItWorks.steps[2].title }}
        </h3>
        <p class="lp:text-sm lp:text-gray-600 dark:lp:text-gray-400 lp:leading-relaxed lp:flex-1">
          {{ copy.howItWorks.steps[2].description }}
        </p>
        <UButton
          to="https://air2.earthen.io/dashboard"
          target="_blank"
          color="neutral"
          variant="solid"
          size="sm"
          icon="i-lucide-layout-dashboard"
          class="lp:self-start"
        >
          View Dashboard
        </UButton>
      </div>
    </div>
  </UPageSection>

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- SECTIONS TEMPORARILY HIDDEN — uncomment to restore                     -->
  <!-- Features, Why Different, Dashboard Preview,                            -->
  <!-- Community Insight, Open Source, Vision, Final CTA                     -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!--
  <div class="lp-features-wrap">
    <div class="lp-features-bg" aria-hidden="true">
      <div class="lp-fblob lp-fblob-orange"></div>
      <div class="lp-fblob lp-fblob-white"></div>
      <div class="lp-fblob lp-fblob-sky"></div>
    </div>
    <UPageSection
      id="features"
      :headline="copy.features.headline"
      :title="copy.features.title"
      :description="copy.features.description"
    >
      <UPageGrid>
        <UPageCard
          v-for="feature in copy.features.items"
          :key="feature.title"
          :icon="feature.icon"
          :title="feature.title"
          :description="feature.description"
          variant="soft"
          spotlight
          spotlight-color="primary"
        />
      </UPageGrid>
    </UPageSection>
  </div>

  <UPageSection
    :headline="copy.different.headline"
    :title="copy.different.title"
    :description="copy.different.description"
    icon="i-lucide-layers"
  >
    <UPageGrid class="lp:mt-6">
      <UPageCard
        v-for="item in copy.different.items"
        :key="item.title"
        :icon="item.icon"
        :title="item.title"
        :description="item.description"
        variant="outline"
        highlight
        highlight-color="primary"
      />
    </UPageGrid>
  </UPageSection>

  <UPageSection
    :headline="copy.dashboard.headline"
    :title="copy.dashboard.title"
    :description="copy.dashboard.description"
    icon="i-lucide-bar-chart-2"
    orientation="horizontal"
  >
    <div class="lp:w-full lp:rounded-2xl lp:border lp:border-gray-200 dark:lp:border-gray-700 lp:bg-gray-50 dark:lp:bg-gray-900 lp:aspect-video lp:flex lp:items-center lp:justify-center lp:overflow-hidden">
      <div class="lp:text-center lp:p-8">
        <UIcon name="i-lucide-monitor" class="lp:w-16 lp:h-16 lp:text-orange-300 dark:lp:text-orange-700 lp:mx-auto lp:mb-4" />
        <p class="lp:text-sm lp:text-gray-400 dark:lp:text-gray-500">Dashboard screenshot coming soon</p>
        <UButton to="/" variant="outline" color="primary" size="sm" class="lp:mt-4" icon="i-lucide-external-link">
          Open Live Dashboard
        </UButton>
      </div>
    </div>
    <template #description>
      <p class="lp:text-base lp:text-gray-600 dark:lp:text-gray-300">{{ copy.dashboard.description }}</p>
      <ul class="lp:mt-4 lp:space-y-2">
        <li v-for="bullet in copy.dashboard.bullets" :key="bullet" class="lp:flex lp:items-start lp:gap-2 lp:text-sm lp:text-gray-600 dark:lp:text-gray-300">
          <UIcon name="i-lucide-check-circle-2" class="lp:w-4 lp:h-4 lp:mt-0.5 lp:flex-shrink-0 lp:text-cyan-400" />
          {{ bullet }}
        </li>
      </ul>
    </template>
  </UPageSection>

  <UPageSection :headline="copy.community.headline" :title="copy.community.title" :description="copy.community.description" icon="i-lucide-globe" />

  <UPageSection
    id="open-source"
    :headline="copy.openSource.headline"
    :title="copy.openSource.title"
    :description="copy.openSource.description"
    icon="i-lucide-github"
    :links="[{ label: copy.openSource.cta, to: 'https://github.com/russs95/airbuddy-spa', target: '_blank', color: 'neutral', variant: 'solid', icon: 'i-lucide-github', size: 'lg' }]"
  />

  <UPageSection :headline="copy.vision.headline" :title="copy.vision.title" icon="i-lucide-heart-handshake">
    <div class="lp:max-w-3xl lp:mx-auto lp:text-center lp:space-y-4">
      <p class="lp:text-base lp:leading-relaxed lp:text-gray-600 dark:lp:text-gray-300">{{ copy.vision.description }}</p>
      <p class="lp:text-base lp:font-medium lp:text-cyan-500 dark:lp:text-cyan-400">{{ copy.vision.closing }}</p>
    </div>
  </UPageSection>

  <UPageSection
    :title="copy.finalCta.title"
    :description="copy.finalCta.description"
    :links="[
      { label: copy.finalCta.ctaBuild, to: 'https://github.com/russs95/airbuddy_v2', target: '_blank', color: 'primary', size: 'xl', icon: 'i-lucide-hammer' },
      { label: copy.finalCta.ctaDashboard, to: '/', color: 'neutral', variant: 'outline', size: 'xl', icon: 'i-lucide-layout-dashboard' },
    ]"
  />
  -->

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- FOOTER                                                                  -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <UFooter>
    <template #left>
      <div class="lp:flex lp:items-center lp:gap-3">
        <img src="/airbuddy-logo.svg" alt="AirBuddy" class="lp:h-6 lp:w-auto" />
        <span class="lp:text-sm lp:text-gray-500 dark:lp:text-gray-400">
          {{ copy.footer.tagline }}
        </span>
      </div>
    </template>

    <template #default>
      <nav class="lp:flex lp:items-center lp:gap-4">
        <NuxtLink
          v-for="link in copy.footer.links"
          :key="link.label"
          :to="link.to"
          :target="link.target"
          class="lp:text-sm lp:text-gray-500 dark:lp:text-gray-400 lp:hover:text-cyan-400 lp:transition-colors"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>
    </template>

    <template #right>
      <span class="lp:text-xs lp:text-gray-400 dark:lp:text-gray-500">
        {{ copy.footer.legal }}
      </span>
    </template>
  </UFooter>
</div>
</template>

<style>
/* ─── Landing page font foundation ─────────────────────────────────────── */
/* Wrapping div .lp-landing-page scopes these rules to this page only       */
.lp-landing-page {
  font-family: 'Mulish', system-ui, sans-serif;
}
.lp-landing-page h1,
.lp-landing-page h2,
.lp-landing-page h3 {
  font-family: 'Arvo', Georgia, serif;
}

/* ─── Hero fold ─────────────────────────────────────────────────────────── */
.lp-hero {
  position: relative;
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 6rem 1.5rem 4rem;
  background: #f0fefe;
}
.dark .lp-hero {
  background: #030d10;
}

/* ─── Blob background ───────────────────────────────────────────────────── */
.lp-hero-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}
.lp-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(72px);
}

.lp-blob-cyan-a {
  width: min(65vw, 680px);
  height: min(65vw, 680px);
  background: radial-gradient(circle, #ffffff 0%, #7dd3fc 40%, #38bdf8 68%, transparent 90%);
  top: -18%;
  left: -12%;
  opacity: 0.55;
  animation: lp-drift-1 14s ease-in-out infinite;
}
.dark .lp-blob-cyan-a {
  background: radial-gradient(circle, rgba(255,255,255,0.12) 0%, #38bdf8 45%, #0ea5e9 70%, transparent 90%);
  opacity: 0.22;
}

.lp-blob-white {
  width: min(55vw, 600px);
  height: min(55vw, 600px);
  background: radial-gradient(circle, rgba(255, 255, 255, 0.92) 0%, transparent 65%);
  top: 15%;
  left: 22%;
  opacity: 0.75;
  animation: lp-drift-2 17s ease-in-out infinite;
}
.dark .lp-blob-white {
  background: radial-gradient(circle, rgba(255, 255, 255, 0.07) 0%, transparent 65%);
  opacity: 1;
}

.lp-blob-orange {
  width: min(48vw, 520px);
  height: min(48vw, 520px);
  background: radial-gradient(circle, #00dede 0%, transparent 65%);
  bottom: -12%;
  right: -8%;
  opacity: 0.15;
  animation: lp-drift-3 20s ease-in-out infinite;
}
.dark .lp-blob-orange { opacity: 0.20; }

.lp-blob-cyan-b {
  width: min(40vw, 440px);
  height: min(40vw, 440px);
  background: radial-gradient(circle, #FF6400 0%, transparent 65%);
  bottom: 8%;
  right: 18%;
  opacity: 0.14;
  animation: lp-drift-1 22s ease-in-out infinite reverse;
}
.dark .lp-blob-cyan-b { opacity: 0.10; }

@keyframes lp-drift-1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25%       { transform: translate(45px, -35px) scale(1.07); }
  50%       { transform: translate(15px, 50px) scale(0.95); }
  75%       { transform: translate(-35px, -15px) scale(1.04); }
}
@keyframes lp-drift-2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33%       { transform: translate(-55px, 35px) scale(1.06); }
  66%       { transform: translate(35px, -45px) scale(0.96); }
}
@keyframes lp-drift-3 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  40%       { transform: translate(-45px, -55px) scale(1.10); }
  80%       { transform: translate(25px, 35px) scale(0.92); }
}

/* ─── Hero typography ───────────────────────────────────────────────────── */
.lp-hero-title {
  font-family: 'Arvo', Georgia, serif;
  white-space: nowrap;
  font-size: clamp(2.4rem, 9vw, 5.5rem);
  line-height: 1.1;
}
/* Explicit dark-mode colour — bypasses any Tailwind prefix/cascade issues */
.dark .lp-hero-title {
  color: #ffffff;
}
.lp-hero-eyebrow,
.lp-hero-desc {
  font-family: 'Mulish', system-ui, sans-serif;
}

/* ─── Why air matters — dark atmospheric section ─────────────────────── */
.lp-why-air {
  position: relative;
  overflow: hidden;
  background: #080f1c;
  padding: 5rem 1.5rem;
}
.dark .lp-why-air {
  background: #04080f;
}
.lp-why-air-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}
.lp-wblob {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
}
.lp-wblob-a {
  width: min(70vw, 700px);
  height: min(70vw, 700px);
  background: radial-gradient(circle, #FF6400 0%, transparent 65%);
  top: -25%;
  left: -15%;
  opacity: 0.08;
}
.lp-wblob-b {
  width: min(55vw, 580px);
  height: min(55vw, 580px);
  background: radial-gradient(circle, #00dede 0%, transparent 65%);
  bottom: -20%;
  right: -10%;
  opacity: 0.07;
}

/* ─── Features section blob background ─────────────────────────────────── */
.lp-features-wrap {
  position: relative;
  overflow: hidden;
}
.lp-features-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}
.lp-fblob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
}
.lp-fblob-orange {
  width: min(55vw, 580px);
  height: min(55vw, 580px);
  background: radial-gradient(circle, #FF6400 0%, transparent 65%);
  top: -15%;
  right: -8%;
  opacity: 0.12;
  animation: lp-drift-3 18s ease-in-out infinite;
}
.dark .lp-fblob-orange { opacity: 0.18; }
.lp-fblob-white {
  width: min(50vw, 520px);
  height: min(50vw, 520px);
  background: radial-gradient(circle, rgba(255, 255, 255, 0.88) 0%, transparent 65%);
  top: 25%;
  left: 8%;
  opacity: 0.55;
  animation: lp-drift-2 21s ease-in-out infinite;
}
.dark .lp-fblob-white {
  background: radial-gradient(circle, rgba(255, 255, 255, 0.04) 0%, transparent 65%);
  opacity: 1;
}
.lp-fblob-sky {
  width: min(42vw, 440px);
  height: min(42vw, 440px);
  background: radial-gradient(circle, #0ea5e9 0%, transparent 65%);
  bottom: -12%;
  left: -6%;
  opacity: 0.08;
  animation: lp-drift-1 24s ease-in-out infinite reverse;
}
.dark .lp-fblob-sky { opacity: 0.13; }
</style>
