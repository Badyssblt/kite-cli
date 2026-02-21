<script setup lang="ts">
import { frameworkSnippets, type EditorSnippet } from './snippets'

const props = defineProps<{
  modelValue: string
  filename: string
  frameworkId?: string
  readonly?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const langMap: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  vue: 'html',
  html: 'html',
  css: 'css',
  scss: 'scss',
  json: 'json',
  md: 'markdown',
  yaml: 'yaml',
  yml: 'yaml',
  sh: 'shell',
  bash: 'shell',
  prisma: 'graphql',
  sql: 'sql',
  xml: 'xml',
  svg: 'xml',
  env: 'ini',
  dockerfile: 'dockerfile',
}

const language = computed(() => {
  const ext = props.filename.split('.').pop()?.toLowerCase() || ''
  return langMap[ext] || 'plaintext'
})

const theme = computed(() => {
  if (import.meta.server) return 'vs'
  return document.documentElement.classList.contains('dark') ? 'vs-dark' : 'vs'
})

const content = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value),
})

// Register framework completions on Monaco load
const completionDisposables = ref<any[]>([])

async function onEditorLoad() {
  const monaco = await useMonaco()

  // Disable semantic validation (unknown imports, missing types)
  // Keep syntax validation (missing brackets, invalid syntax)
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: false,
  })
  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: false,
  })

  completionDisposables.value.forEach((d) => d.dispose())
  completionDisposables.value = []

  const snippets = frameworkSnippets[props.frameworkId || ''] || []
  if (snippets.length === 0) return

  const kindMap: Record<string, number> = {
    Function: monaco.languages.CompletionItemKind.Function,
    Snippet: monaco.languages.CompletionItemKind.Snippet,
    Variable: monaco.languages.CompletionItemKind.Variable,
    Class: monaco.languages.CompletionItemKind.Class,
    Interface: monaco.languages.CompletionItemKind.Interface,
    Module: monaco.languages.CompletionItemKind.Module,
  }

  for (const lang of ['typescript', 'javascript', 'html']) {
    const disposable = monaco.languages.registerCompletionItemProvider(lang, {
      provideCompletionItems(model, position) {
        const word = model.getWordUntilPosition(position)
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        }

        return {
          suggestions: snippets.map((s) => ({
            label: s.label,
            kind: kindMap[s.kind] ?? monaco.languages.CompletionItemKind.Snippet,
            insertText: s.insertText,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: s.detail,
            range,
          })),
        }
      },
    })
    completionDisposables.value.push(disposable)
  }
}

onBeforeUnmount(() => {
  completionDisposables.value.forEach((d) => d.dispose())
})
</script>

<template>
  <div class="overflow-hidden h-full">
    <MonacoEditor
      v-model="content"
      :lang="language"
      :options="{
        theme: theme,
        minimap: { enabled: false },
        fontSize: 13,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        tabSize: 2,
        automaticLayout: true,
        readOnly: props.readonly ?? false,
        quickSuggestions: !props.readonly,
        suggestOnTriggerCharacters: !props.readonly,
      }"
      class="h-full w-full"
      @load="onEditorLoad"
    />
  </div>
</template>
