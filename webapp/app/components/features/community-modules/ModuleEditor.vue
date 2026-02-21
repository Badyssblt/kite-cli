<script setup lang="ts">
import { ChevronLeft, ChevronRight, Send, Loader2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  Stepper,
  StepperItem,
  StepperTrigger,
  StepperIndicator,
  StepperTitle,
  StepperSeparator,
} from '@/components/ui/stepper'
import { toast } from 'vue-sonner'
import StepMetadata from './StepMetadata.vue'
import StepFiles from './StepFiles.vue'
import FileViewer from './FileViewer.vue'
import StepDependencies from './StepDependencies.vue'
import StepEnvVars from './StepEnvVars.vue'
import StepPrompts from './StepPrompts.vue'
import StepReview from './StepReview.vue'
import type {
  CommunityModulePayload,
  CommunityModuleFile,
  CommunityModuleDependency,
  CommunityModuleEnvVar,
  CommunityModulePrompt,
  CommunityModuleResponse,
} from '~~/types/type'

const props = defineProps<{
  initialData?: CommunityModuleResponse
  mode: 'create' | 'edit' | 'readonly'
}>()

const emit = defineEmits<{
  submitted: [module: any]
}>()

const { getFrameworks } = useFrameworks()
const { data: frameworks } = await getFrameworks()

const isReadonly = computed(() => props.mode === 'readonly')

const currentStep = ref(1)
const submitting = ref(false)

// Form state
const name = ref(props.initialData?.name || '')
const description = ref(props.initialData?.description || '')
const frameworkId = ref(props.initialData?.frameworkId || '')
const category = ref(props.initialData?.category || 'other')
const files = ref<CommunityModuleFile[]>(
  props.initialData?.files?.map((f) => ({ path: f.path, content: f.content })) || []
)
const dependencies = ref<CommunityModuleDependency[]>(
  props.initialData?.dependencies?.map((d) => ({ name: d.name, isDev: d.isDev })) || []
)
const envVars = ref<CommunityModuleEnvVar[]>(
  props.initialData?.envVars?.map((e) => ({
    key: e.key,
    defaultValue: e.defaultValue,
    description: e.description,
  })) || []
)
const prompts = ref<CommunityModulePrompt[]>(
  (props.initialData?.prompts as CommunityModulePrompt[]) || []
)

const steps = [
  { step: 1, title: 'Métadonnées' },
  { step: 2, title: 'Fichiers' },
  { step: 3, title: 'Dépendances' },
  { step: 4, title: 'Variables env.' },
  { step: 5, title: 'Prompts' },
  { step: 6, title: 'Résumé' },
]

const isFileStep = computed(() => currentStep.value === 2)

const frameworkName = computed(() => {
  const fw = (frameworks.value as any[])?.find((f: any) => f.id === frameworkId.value)
  return fw?.name || ''
})

const canGoNext = computed(() => {
  if (isReadonly.value) return true
  switch (currentStep.value) {
    case 1:
      return name.value.trim() !== '' && frameworkId.value !== '' && category.value !== ''
    case 2:
      return files.value.length > 0 && files.value.every((f) => f.path.trim() !== '')
    default:
      return true
  }
})

function nextStep() {
  if (currentStep.value < 6 && canGoNext.value) {
    currentStep.value++
  }
}

function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const { createModule, updateModule } = useCommunityModules()

async function submit() {
  submitting.value = true

  const payload: CommunityModulePayload = {
    name: name.value,
    description: description.value,
    frameworkId: frameworkId.value,
    category: category.value,
    files: files.value,
    dependencies: dependencies.value.filter((d) => d.name.trim()),
    envVars: envVars.value.filter((e) => e.key.trim()),
    prompts: prompts.value.filter((p) => p.message.trim()),
  }

  try {
    let result
    if (props.mode === 'edit' && props.initialData?.id) {
      result = await updateModule(props.initialData.id, payload)
    } else {
      result = await createModule(payload)
    }
    toast.success(
      props.mode === 'edit' ? 'Module mis à jour' : 'Module soumis',
      { description: 'Votre module est en attente de modération.' }
    )
    emit('submitted', result)
  } catch (err: any) {
    toast.error('Erreur', {
      description: err.data?.statusMessage || 'Une erreur est survenue.',
    })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div :class="isFileStep ? 'flex flex-col h-[calc(100vh-130px)]' : 'space-y-8'">
    <!-- Stepper header — compact on file step -->
    <Stepper v-model="currentStep" class="flex w-full items-start gap-2" :class="isFileStep ? 'mb-2' : ''">
      <template v-for="(s, index) in steps" :key="s.step">
        <StepperItem
          class="relative flex w-full flex-col items-center justify-center"
          :step="s.step"
        >
          <StepperTrigger as-child>
            <button class="flex flex-col items-center gap-1">
              <StepperIndicator />
              <StepperTitle v-if="!isFileStep" class="text-xs">{{ s.title }}</StepperTitle>
            </button>
          </StepperTrigger>
          <StepperSeparator
            v-if="index < steps.length - 1"
            class="absolute left-[calc(50%+20px)] right-[calc(-50%+20px)] top-3 block h-0.5"
          />
        </StepperItem>
      </template>
    </Stepper>

    <!-- Step content -->
    <div :class="isFileStep ? 'flex-1 min-h-0' : 'min-h-[400px]'">
      <StepMetadata
        v-if="currentStep === 1"
        v-model:name="name"
        v-model:description="description"
        v-model:framework-id="frameworkId"
        v-model:category="category"
        :frameworks="(frameworks as any[]) || []"
        :readonly="isReadonly"
      />
      <FileViewer
        v-else-if="currentStep === 2 && isReadonly"
        :files="files"
      />
      <StepFiles
        v-else-if="currentStep === 2"
        v-model:files="files"
        :framework-id="frameworkId"
      />
      <StepDependencies
        v-else-if="currentStep === 3"
        v-model:dependencies="dependencies"
        :readonly="isReadonly"
      />
      <StepEnvVars
        v-else-if="currentStep === 4"
        v-model:env-vars="envVars"
        :readonly="isReadonly"
      />
      <StepPrompts
        v-else-if="currentStep === 5"
        v-model:prompts="prompts"
        :readonly="isReadonly"
      />
      <StepReview
        v-else-if="currentStep === 6"
        :name="name"
        :description="description"
        :framework-name="frameworkName"
        :category="category"
        :files="files"
        :dependencies="dependencies"
        :env-vars="envVars"
        :prompts="prompts"
      />
    </div>

    <!-- Navigation buttons -->
    <div :class="isFileStep ? 'flex items-center justify-between border-t pt-3 shrink-0' : 'flex items-center justify-between border-t pt-4'">
      <Button
        variant="outline"
        :disabled="currentStep === 1"
        @click="prevStep"
      >
        <ChevronLeft class="size-4 mr-1" />
        Précédent
      </Button>

      <div class="flex gap-2">
        <Button
          v-if="currentStep < 6"
          :disabled="!canGoNext"
          @click="nextStep"
        >
          Suivant
          <ChevronRight class="size-4 ml-1" />
        </Button>
        <template v-else-if="isReadonly">
          <slot name="actions" />
        </template>
        <Button
          v-else
          :disabled="submitting"
          @click="submit"
        >
          <Loader2 v-if="submitting" class="size-4 mr-1 animate-spin" />
          <Send v-else class="size-4 mr-1" />
          {{ mode === 'edit' ? 'Mettre à jour' : 'Soumettre' }}
        </Button>
      </div>
    </div>
  </div>
</template>
