export interface EditorSnippet {
  label: string
  insertText: string
  detail: string
  kind: 'Function' | 'Snippet' | 'Variable' | 'Class' | 'Interface' | 'Module'
}

const nuxtSnippets: EditorSnippet[] = [
  // Composables
  { label: 'useAsyncData', insertText: "const { data, pending, error } = await useAsyncData('${1:key}', () => {\n\t$0\n})", detail: 'Nuxt — async data fetching', kind: 'Function' },
  { label: 'useFetch', insertText: "const { data, pending, error } = await useFetch('${1:/api/endpoint}', {\n\tkey: '${2:key}',\n})", detail: 'Nuxt — fetch composable', kind: 'Function' },
  { label: 'useRuntimeConfig', insertText: 'const config = useRuntimeConfig()', detail: 'Nuxt — runtime config', kind: 'Function' },
  { label: 'useRoute', insertText: 'const route = useRoute()', detail: 'Nuxt — current route', kind: 'Function' },
  { label: 'useRouter', insertText: 'const router = useRouter()', detail: 'Nuxt — router instance', kind: 'Function' },
  { label: 'useState', insertText: "const ${1:state} = useState('${2:key}', () => ${3:null})", detail: 'Nuxt — shared state', kind: 'Function' },
  { label: 'useCookie', insertText: "const ${1:cookie} = useCookie('${2:name}')", detail: 'Nuxt — cookie composable', kind: 'Function' },
  { label: 'useHead', insertText: "useHead({\n\ttitle: '${1:titre}',\n})", detail: 'Nuxt — head management', kind: 'Function' },
  { label: 'useSeoMeta', insertText: "useSeoMeta({\n\ttitle: '${1:titre}',\n\tdescription: '${2:description}',\n})", detail: 'Nuxt — SEO meta tags', kind: 'Function' },
  { label: 'useNuxtApp', insertText: 'const nuxtApp = useNuxtApp()', detail: 'Nuxt — app instance', kind: 'Function' },
  { label: 'useRequestHeaders', insertText: "const headers = useRequestHeaders(['${1:cookie}'])", detail: 'Nuxt — request headers (SSR)', kind: 'Function' },
  { label: 'navigateTo', insertText: "navigateTo('${1:/path}')", detail: 'Nuxt — navigation', kind: 'Function' },
  { label: 'abortNavigation', insertText: 'abortNavigation()', detail: 'Nuxt — abort navigation', kind: 'Function' },
  // Page/Layout macros
  { label: 'definePageMeta', insertText: "definePageMeta({\n\tlayout: '${1:default}',\n})", detail: 'Nuxt — page metadata', kind: 'Function' },
  { label: 'defineNuxtConfig', insertText: 'export default defineNuxtConfig({\n\t$0\n})', detail: 'Nuxt — config file', kind: 'Function' },
  // Server
  { label: 'defineEventHandler', insertText: 'export default defineEventHandler(async (event) => {\n\t$0\n})', detail: 'Nitro — event handler', kind: 'Snippet' },
  { label: 'createError', insertText: "throw createError({ statusCode: ${1:400}, statusMessage: '${2:Bad Request}' })", detail: 'Nitro — create error', kind: 'Function' },
  { label: 'readBody', insertText: 'const body = await readBody(event)', detail: 'Nitro — read request body', kind: 'Function' },
  { label: 'getQuery', insertText: 'const query = getQuery(event)', detail: 'Nitro — get query params', kind: 'Function' },
  { label: 'getRouterParam', insertText: "const ${1:id} = getRouterParam(event, '${2:id}')", detail: 'Nitro — get route param', kind: 'Function' },
  { label: 'setResponseStatus', insertText: 'setResponseStatus(event, ${1:201})', detail: 'Nitro — set status code', kind: 'Function' },
  // Vue SFC
  { label: 'defineProps', insertText: 'const props = defineProps<{\n\t${1:prop}: ${2:string}\n}>()', detail: 'Vue — define props', kind: 'Function' },
  { label: 'defineEmits', insertText: "const emit = defineEmits<{\n\t${1:event}: [${2:value}: ${3:string}]\n}>()", detail: 'Vue — define emits', kind: 'Function' },
  { label: 'ref', insertText: "const ${1:value} = ref(${2:null})", detail: 'Vue — reactive ref', kind: 'Function' },
  { label: 'computed', insertText: "const ${1:value} = computed(() => {\n\t$0\n})", detail: 'Vue — computed property', kind: 'Function' },
  { label: 'watch', insertText: "watch(${1:source}, (newVal, oldVal) => {\n\t$0\n})", detail: 'Vue — watcher', kind: 'Function' },
  { label: 'onMounted', insertText: 'onMounted(() => {\n\t$0\n})', detail: 'Vue — mounted hook', kind: 'Function' },
  // Nuxt components
  { label: 'NuxtLink', insertText: '<NuxtLink to="${1:/path}">${2:Lien}</NuxtLink>', detail: 'Nuxt — link component', kind: 'Snippet' },
  { label: 'NuxtPage', insertText: '<NuxtPage />', detail: 'Nuxt — page component', kind: 'Snippet' },
  { label: 'NuxtLayout', insertText: '<NuxtLayout name="${1:default}">\n\t$0\n</NuxtLayout>', detail: 'Nuxt — layout component', kind: 'Snippet' },
  { label: 'ClientOnly', insertText: '<ClientOnly>\n\t$0\n</ClientOnly>', detail: 'Nuxt — client only', kind: 'Snippet' },
  // Prisma
  { label: 'prisma', insertText: "import { prisma } from '~~/server/utils/db'", detail: 'Prisma — import client', kind: 'Module' },
  { label: 'prisma.findMany', insertText: "const ${1:items} = await prisma.${2:model}.findMany({\n\twhere: { $0 },\n})", detail: 'Prisma — find many', kind: 'Snippet' },
  { label: 'prisma.findUnique', insertText: "const ${1:item} = await prisma.${2:model}.findUnique({\n\twhere: { id: ${3:id} },\n})", detail: 'Prisma — find unique', kind: 'Snippet' },
  { label: 'prisma.create', insertText: "const ${1:item} = await prisma.${2:model}.create({\n\tdata: { $0 },\n})", detail: 'Prisma — create', kind: 'Snippet' },
  { label: 'prisma.update', insertText: "const ${1:item} = await prisma.${2:model}.update({\n\twhere: { id: ${3:id} },\n\tdata: { $0 },\n})", detail: 'Prisma — update', kind: 'Snippet' },
  { label: 'prisma.delete', insertText: "await prisma.${1:model}.delete({\n\twhere: { id: ${2:id} },\n})", detail: 'Prisma — delete', kind: 'Snippet' },
]

const nextjsSnippets: EditorSnippet[] = [
  // App Router
  { label: 'useRouter', insertText: "const router = useRouter()\n// import { useRouter } from 'next/navigation'", detail: 'Next.js — router hook', kind: 'Function' },
  { label: 'usePathname', insertText: "const pathname = usePathname()\n// import { usePathname } from 'next/navigation'", detail: 'Next.js — current pathname', kind: 'Function' },
  { label: 'useSearchParams', insertText: "const searchParams = useSearchParams()\n// import { useSearchParams } from 'next/navigation'", detail: 'Next.js — search params', kind: 'Function' },
  { label: 'useParams', insertText: "const params = useParams()\n// import { useParams } from 'next/navigation'", detail: 'Next.js — route params', kind: 'Function' },
  { label: 'redirect', insertText: "redirect('${1:/path}')\n// import { redirect } from 'next/navigation'", detail: 'Next.js — server redirect', kind: 'Function' },
  { label: 'notFound', insertText: "notFound()\n// import { notFound } from 'next/navigation'", detail: 'Next.js — trigger 404', kind: 'Function' },
  // Metadata
  { label: 'generateMetadata', insertText: "export async function generateMetadata({ params }: { params: Promise<{ ${1:id}: string }> }) {\n\treturn {\n\t\ttitle: '${2:Title}',\n\t}\n}", detail: 'Next.js — dynamic metadata', kind: 'Function' },
  { label: 'metadata', insertText: "export const metadata = {\n\ttitle: '${1:Title}',\n\tdescription: '${2:Description}',\n}", detail: 'Next.js — static metadata', kind: 'Variable' },
  // Route handlers
  { label: 'GET', insertText: "export async function GET(request: NextRequest) {\n\t$0\n\treturn NextResponse.json({ })\n}", detail: 'Next.js — GET route handler', kind: 'Snippet' },
  { label: 'POST', insertText: "export async function POST(request: NextRequest) {\n\tconst body = await request.json()\n\t$0\n\treturn NextResponse.json({ })\n}", detail: 'Next.js — POST route handler', kind: 'Snippet' },
  { label: 'PUT', insertText: "export async function PUT(request: NextRequest) {\n\tconst body = await request.json()\n\t$0\n\treturn NextResponse.json({ })\n}", detail: 'Next.js — PUT route handler', kind: 'Snippet' },
  { label: 'DELETE', insertText: "export async function DELETE(request: NextRequest) {\n\t$0\n\treturn NextResponse.json({ })\n}", detail: 'Next.js — DELETE route handler', kind: 'Snippet' },
  { label: 'NextRequest', insertText: "import { NextRequest, NextResponse } from 'next/server'", detail: 'Next.js — import server types', kind: 'Module' },
  // Server components / actions
  { label: "'use client'", insertText: "'use client'\n\n", detail: 'Next.js — client component directive', kind: 'Snippet' },
  { label: "'use server'", insertText: "'use server'\n\n", detail: 'Next.js — server action directive', kind: 'Snippet' },
  // Hooks
  { label: 'useState', insertText: "const [${1:state}, set${1/(.*)/${1:/capitalize}/}] = useState(${2:null})\n// import { useState } from 'react'", detail: 'React — state hook', kind: 'Function' },
  { label: 'useEffect', insertText: "useEffect(() => {\n\t$0\n\treturn () => {}\n}, [${1:}])\n// import { useEffect } from 'react'", detail: 'React — effect hook', kind: 'Function' },
  { label: 'useCallback', insertText: "const ${1:fn} = useCallback(() => {\n\t$0\n}, [${2:}])", detail: 'React — callback hook', kind: 'Function' },
  { label: 'useMemo', insertText: "const ${1:value} = useMemo(() => {\n\t$0\n}, [${2:}])", detail: 'React — memo hook', kind: 'Function' },
  // Components
  { label: 'Link', insertText: "<Link href=\"${1:/path}\">${2:Lien}</Link>\n{/* import Link from 'next/link' */}", detail: 'Next.js — link component', kind: 'Snippet' },
  { label: 'Image', insertText: "<Image src=\"${1:/image.png}\" alt=\"${2:alt}\" width={${3:100}} height={${4:100}} />\n{/* import Image from 'next/image' */}", detail: 'Next.js — image component', kind: 'Snippet' },
  // Prisma
  { label: 'prisma', insertText: "import { prisma } from '@/lib/db'", detail: 'Prisma — import client', kind: 'Module' },
  { label: 'prisma.findMany', insertText: "const ${1:items} = await prisma.${2:model}.findMany({\n\twhere: { $0 },\n})", detail: 'Prisma — find many', kind: 'Snippet' },
  { label: 'prisma.findUnique', insertText: "const ${1:item} = await prisma.${2:model}.findUnique({\n\twhere: { id: ${3:id} },\n})", detail: 'Prisma — find unique', kind: 'Snippet' },
  { label: 'prisma.create', insertText: "const ${1:item} = await prisma.${2:model}.create({\n\tdata: { $0 },\n})", detail: 'Prisma — create', kind: 'Snippet' },
  { label: 'prisma.update', insertText: "const ${1:item} = await prisma.${2:model}.update({\n\twhere: { id: ${3:id} },\n\tdata: { $0 },\n})", detail: 'Prisma — update', kind: 'Snippet' },
  { label: 'prisma.delete', insertText: "await prisma.${1:model}.delete({\n\twhere: { id: ${2:id} },\n})", detail: 'Prisma — delete', kind: 'Snippet' },
]

export const frameworkSnippets: Record<string, EditorSnippet[]> = {
  nuxt: nuxtSnippets,
  nextjs: nextjsSnippets,
}
