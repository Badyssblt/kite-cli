// Types centralisés pour Kite CLI

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

export interface ModuleDefinition {
  id: string;
  name: string;
  description?: string;
  dependsOn?: string[];
  hasSetupScript?: boolean;
  instructions?: ModuleInstructions;
  docker?: DockerConfig;
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
