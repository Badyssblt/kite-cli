<script setup lang="ts">
import { ArrowRight, Terminal, Blocks, Sparkles, Layers, Package, Zap, ChevronRight } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

const terminalLines = ref<number>(0)
const codeLines = [
  { prompt: true, text: 'npx kite create mon-app' },
  { prompt: false, text: '' },
  { prompt: false, text: '  Framework:  Nuxt 3' },
  { prompt: false, text: '  Modules:    prisma, better-auth, stripe, docker' },
  { prompt: false, text: '  PM:         pnpm' },
  { prompt: false, text: '' },
  { prompt: false, text: '  \u2713 Projet cr\u00e9\u00e9' },
  { prompt: false, text: '  \u2713 D\u00e9pendances install\u00e9es' },
  { prompt: false, text: '  \u2713 Modules configur\u00e9s' },
  { prompt: false, text: '' },
  { prompt: true, text: 'cd mon-app && pnpm dev' },
]

onMounted(() => {
  let i = 0
  const interval = setInterval(() => {
    if (i < codeLines.length) {
      terminalLines.value = i + 1
      i++
    } else {
      clearInterval(interval)
    }
  }, 180)
})

const features = [
  {
    icon: Terminal,
    title: 'CLI + Webapp',
    description: 'G\u00e9n\u00e9rez depuis le terminal ou l\u2019interface web. T\u00e9l\u00e9chargez un ZIP ou pushez directement sur GitHub.',
  },
  {
    icon: Blocks,
    title: 'Syst\u00e8me de modules',
    description: 'Prisma, Auth, Stripe, Docker, i18n, Email\u2026 Chaque module s\u2019int\u00e8gre proprement avec ses d\u00e9pendances.',
  },
  {
    icon: Sparkles,
    title: 'Presets',
    description: 'Sauvegardez vos combinaisons favorites. Un clic pour recr\u00e9er votre stack compl\u00e8te.',
  },
  {
    icon: Layers,
    title: 'Multi-framework',
    description: 'Nuxt 3, Next.js\u2026 M\u00eame syst\u00e8me de modules, m\u00eame exp\u00e9rience, frameworks diff\u00e9rents.',
  },
]

const stack = ['Nuxt 3', 'Next.js', 'Prisma', 'Better Auth', 'Stripe', 'Docker', 'Tailwind', 'shadcn', 'i18n', 'Nodemailer', 'ESLint', 'Vitest']
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <!-- Nav -->
    <nav class="fixed top-0 inset-x-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div class="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <NuxtLink to="/" class="flex items-center gap-2.5">
          <div class="flex size-7 items-center justify-center rounded-md bg-foreground text-background">
            <Zap class="size-3.5" />
          </div>
          <span class="text-sm font-semibold tracking-tight">Kite</span>
        </NuxtLink>
        <div class="flex items-center gap-3">
          <Button variant="ghost" size="sm" as-child>
            <NuxtLink to="/login">Connexion</NuxtLink>
          </Button>
          <Button size="sm" as-child>
            <NuxtLink to="/login">
              Commencer
              <ArrowRight class="size-3.5" />
            </NuxtLink>
          </Button>
        </div>
      </div>
    </nav>

    <!-- Hero -->
    <section class="relative pt-32 pb-20 px-6 overflow-hidden">
      <!-- Grain texture -->
      <div class="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style="background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E'); background-repeat: repeat; background-size: 256px 256px;" />

      <div class="relative mx-auto max-w-5xl">
        <div class="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" class="mb-6 px-3 py-1 text-xs font-medium">
            <Package class="size-3 mr-1.5" />
            Open Source
          </Badge>

          <h1 class="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1]">
            Votre prochain projet,<br />
            <span class="text-muted-foreground">en une commande.</span>
          </h1>

          <p class="mt-5 text-base text-muted-foreground leading-relaxed max-w-lg mx-auto">
            Kite g&eacute;n&egrave;re des boilerplates production-ready pour Nuxt et Next.js.
            Choisissez vos modules, configurez, lancez.
          </p>

          <div class="mt-8 flex items-center justify-center gap-3">
            <Button size="lg" as-child>
              <NuxtLink to="/login">
                Cr&eacute;er un projet
                <ArrowRight class="size-4" />
              </NuxtLink>
            </Button>
            <Button variant="outline" size="lg" as-child>
              <NuxtLink to="/dashboard">
                Voir la d&eacute;mo
              </NuxtLink>
            </Button>
          </div>
        </div>

        <!-- Terminal -->
        <div class="mt-16 mx-auto max-w-xl">
          <div class="rounded-xl border border-border/60 bg-card shadow-2xl shadow-black/5 dark:shadow-black/30 overflow-hidden">
            <!-- Terminal header -->
            <div class="flex items-center gap-2 px-4 py-3 border-b border-border/40 bg-muted/30">
              <div class="flex gap-1.5">
                <div class="size-2.5 rounded-full bg-foreground/10" />
                <div class="size-2.5 rounded-full bg-foreground/10" />
                <div class="size-2.5 rounded-full bg-foreground/10" />
              </div>
              <span class="ml-2 text-[11px] text-muted-foreground font-mono">terminal</span>
            </div>
            <!-- Terminal body -->
            <div class="p-5 font-mono text-[13px] leading-6 min-h-[280px]">
              <div
                v-for="(line, i) in codeLines.slice(0, terminalLines)"
                :key="i"
                class="transition-opacity duration-200"
                :style="{ animationDelay: `${i * 80}ms` }"
              >
                <span v-if="line.prompt" class="text-muted-foreground select-none">$&nbsp;</span>
                <span :class="line.prompt ? 'text-foreground font-medium' : line.text.includes('\u2713') ? 'text-emerald-500 dark:text-emerald-400' : 'text-muted-foreground'">{{ line.text }}</span>
              </div>
              <div v-if="terminalLines >= codeLines.length" class="mt-1 inline-flex">
                <span class="text-muted-foreground select-none">$&nbsp;</span>
                <span class="inline-block w-2 h-5 bg-foreground animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Stack ribbon -->
    <section class="border-y border-border/40 bg-muted/20 py-6 overflow-hidden">
      <div class="flex items-center gap-8 animate-scroll whitespace-nowrap">
        <template v-for="n in 2" :key="n">
          <span
            v-for="tech in stack"
            :key="`${n}-${tech}`"
            class="text-sm text-muted-foreground/60 font-medium tracking-wide"
          >
            {{ tech }}
          </span>
        </template>
      </div>
    </section>

    <!-- Features -->
    <section class="py-24 px-6">
      <div class="mx-auto max-w-5xl">
        <div class="text-center mb-16">
          <p class="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Fonctionnalit&eacute;s</p>
          <h2 class="text-3xl font-bold tracking-tight">
            Tout ce qu&rsquo;il faut,<br />rien de superflu.
          </h2>
        </div>

        <div class="grid sm:grid-cols-2 gap-px bg-border/40 rounded-2xl overflow-hidden border border-border/40">
          <div
            v-for="(feature, i) in features"
            :key="i"
            class="bg-background p-8 group"
          >
            <div class="flex size-10 items-center justify-center rounded-lg bg-foreground/[0.04] dark:bg-foreground/[0.08] mb-5 transition-colors group-hover:bg-foreground/[0.08] dark:group-hover:bg-foreground/[0.14]">
              <component :is="feature.icon" class="size-5 text-foreground/70" />
            </div>
            <h3 class="text-base font-semibold mb-2">{{ feature.title }}</h3>
            <p class="text-sm text-muted-foreground leading-relaxed">
              {{ feature.description }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section class="py-24 px-6 border-t border-border/40">
      <div class="mx-auto max-w-5xl">
        <div class="text-center mb-16">
          <p class="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Workflow</p>
          <h2 class="text-3xl font-bold tracking-tight">Trois &eacute;tapes.</h2>
        </div>

        <div class="grid sm:grid-cols-3 gap-12">
          <div v-for="(step, i) in [
            { num: '01', title: 'Choisissez', desc: 'Framework, modules, package manager. Depuis le terminal ou la webapp.' },
            { num: '02', title: 'Configurez', desc: 'Base de donn\u00e9es, auth provider, Docker\u2026 R\u00e9pondez aux prompts, Kite fait le reste.' },
            { num: '03', title: 'Lancez', desc: 'Projet pr\u00eat. Code propre, d\u00e9pendances install\u00e9es, fichiers configur\u00e9s.' },
          ]" :key="i" class="relative">
            <span class="text-6xl font-black text-foreground/[0.04] dark:text-foreground/[0.06] leading-none select-none">{{ step.num }}</span>
            <h3 class="text-base font-semibold mt-2 mb-2">{{ step.title }}</h3>
            <p class="text-sm text-muted-foreground leading-relaxed">{{ step.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-24 px-6">
      <div class="mx-auto max-w-5xl">
        <div class="rounded-2xl border border-border/60 bg-foreground/[0.02] dark:bg-foreground/[0.04] p-12 sm:p-16 text-center">
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
            Pr&ecirc;t &agrave; acc&eacute;l&eacute;rer ?
          </h2>
          <p class="text-muted-foreground mb-8 max-w-md mx-auto">
            Cr&eacute;ez votre premier projet en moins d&rsquo;une minute.
            Gratuit et open source.
          </p>
          <div class="flex items-center justify-center gap-3">
            <Button size="lg" as-child>
              <NuxtLink to="/login">
                Commencer gratuitement
                <ChevronRight class="size-4" />
              </NuxtLink>
            </Button>
          </div>
          <p class="mt-4 text-xs text-muted-foreground">
            Aucune carte bancaire requise
          </p>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-border/40 py-8 px-6">
      <div class="mx-auto max-w-5xl flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="flex size-6 items-center justify-center rounded bg-foreground text-background">
            <Zap class="size-3" />
          </div>
          <span class="text-xs text-muted-foreground">&copy; {{ new Date().getFullYear() }} Kite</span>
        </div>
        <div class="flex items-center gap-5">
          <NuxtLink to="/login" class="text-xs text-muted-foreground hover:text-foreground transition-colors">Connexion</NuxtLink>
          <NuxtLink to="/dashboard" class="text-xs text-muted-foreground hover:text-foreground transition-colors">Dashboard</NuxtLink>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
@keyframes scroll {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
.animate-scroll {
  animation: scroll 30s linear infinite;
}
</style>
