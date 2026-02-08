// Types centralisés pour Kite CLI

/**
 * Définition d'un groupe de variantes de fichiers
 * Permet de copier différentes versions d'un fichier selon les réponses utilisateur
 */
export interface FileVariantGroup {
  /** ID de la question (prompt) dont la réponse détermine la variante */
  promptId: string;

  /** Chemin relatif du fichier cible (sans le suffixe de variante) */
  targetPath: string;

  /**
   * Mapping: valeur de réponse -> suffixe de variante
   * Si non défini, utilise directement la valeur de la réponse comme suffixe
   */
  variantMap?: Record<string, string>;

  /** Variante par défaut si la réponse ne correspond à aucune variante existante */
  fallback?: string;
}

/**
 * Définition d'un fragment de fichier à fusionner
 * Permet à un module de contribuer du contenu à un fichier partagé
 */
export interface FragmentDefinition {
  /** Fichier source du fragment dans le module */
  source: string;

  /** Fichier cible dans le projet généré */
  target: string;

  /** Condition: seulement si ce module est sélectionné */
  ifModule?: string;

  /** Condition: seulement si cette réponse de prompt */
  ifPrompt?: {
    id: string;
    value: string | string[];
  };

  /** Stratégie de fusion (défaut: 'append') */
  strategy?: 'append' | 'prepend' | 'merge-json' | 'merge-yaml';

  /** Commentaire de séparation (optionnel) */
  separator?: string;
}

export interface ModuleInstructions {
  title: string;
  steps: string[];
  links?: string[];
}

export interface DockerService {
  image?: string;
  build?: string;
  ports?: string[];
  environment?: string[] | Record<string, string>;
  volumes?: string[];
  depends_on?: string[];
  restart?: string;
  command?: string;
  [key: string]: unknown;
}

export interface DockerConfig {
  services?: Record<string, DockerService>;
  volumes?: Record<string, object>;
  networks?: Record<string, object>;
}

// Configuration des prompts pour un module
export interface ModulePromptChoice {
  name: string;
  value: string;
  description?: string;
}

export interface ModulePrompt {
  id: string;                          // Identifiant unique de la question
  type: 'select' | 'input' | 'confirm';
  message: string;
  choices?: ModulePromptChoice[];      // Pour type 'select'
  default?: string | boolean;
  // Condition d'affichage (ex: seulement si docker est sélectionné)
  when?: (context: PromptContext) => boolean;
}

export interface PromptContext {
  selectedModules: string[];
  answers: ModuleAnswers;
}

export type ModuleAnswers = Record<string, Record<string, string | boolean>>;

// Configuration générée par un module basée sur les réponses
export interface ModuleConfiguration {
  env?: Record<string, string>;        // Variables .env
  docker?: DockerConfig;               // Config docker-compose
  dependencies?: Record<string, string>; // Dépendances npm à ajouter
  devDependencies?: Record<string, string>;
}

export interface ModuleDefinition {
  id: string;
  name: string;
  description?: string;
  dependsOn?: string[];
  hasSetupScript?: boolean;
  instructions?: ModuleInstructions;
  placeholderDefinition?: Record<string, any>;
  docker?: DockerConfig;

  // Nouveau: Questions interactives
  prompts?: ModulePrompt[];

  // Nouveau: Fonction pour générer la config basée sur les réponses
  configure?: (answers: Record<string, string | boolean>, context: PromptContext) => ModuleConfiguration;

  // Variantes de fichiers selon les réponses utilisateur
  fileVariants?: FileVariantGroup[];

  // Fragments de fichiers à fusionner avec d'autres modules
  fragments?: FragmentDefinition[];
}

export interface FrameworkDefinition {
  id: string;
  name: string;
  description: string;
  modules: ModuleDefinition[];
  configFileName: string;
  configMergeStrategy: 'magicast' | 'json';
  dockerfileTemplate(modules: string[]): string;
}

export interface SetupScript {
  name: string;
  path: string;
}

export interface CopyTemplateResult {
  setupScripts: SetupScript[];
}

export interface DockerComposeConfig {
  services: Record<string, DockerService>;
  volumes?: Record<string, object>;
  networks?: Record<string, object>;
}



/**
 * Définition d'un preset de configuration prédéfini
 */
export interface PresetDefinition {
  name: string;
  description: string;
  framework: string | string[];
  modules: string[];
  answers?: ModuleAnswers;
}