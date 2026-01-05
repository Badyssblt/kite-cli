// Génération dynamique du docker-compose.yml

export interface DockerService {
  image?: string;
  build?: string;
  ports?: string[];
  environment?: string[] | Record<string, string>;
  volumes?: string[];
  depends_on?: string[];
  restart?: string;
  command?: string;
  [key: string]: any;
}

export interface DockerComposeConfig {
  version?: string;
  services: Record<string, DockerService>;
  volumes?: Record<string, any>;
  networks?: Record<string, any>;
}

// Services Docker pour chaque module
export const moduleDockerServices: Record<string, Partial<DockerComposeConfig>> = {
  docker: {
    services: {
      app: {
        build: ".",
        ports: ["3000:3000"],
        environment: ["NODE_ENV=production"],
        restart: "unless-stopped",
        volumes: ["./:/app"]
      }
    }
  },

  prisma: {
    services: {
      app: {
        depends_on: ["db"],
        environment: {
          DATABASE_URL: "postgresql://postgres:postgres@db:5432/mydb?schema=public"
        }
      },
      db: {
        image: "postgres:16-alpine",
        restart: "unless-stopped",
        environment: {
          POSTGRES_USER: "postgres",
          POSTGRES_PASSWORD: "postgres",
          POSTGRES_DB: "mydb"
        },
        ports: ["5432:5432"],
        volumes: ["postgres_data:/var/lib/postgresql/data"]
      }
    },
    volumes: {
      postgres_data: {}
    }
  },

  // Supabase n'a pas besoin de service local (cloud)
  supabase: {
    services: {
      app: {
        environment: [
          "SUPABASE_URL=${SUPABASE_URL}",
          "SUPABASE_KEY=${SUPABASE_KEY}"
        ]
      }
    }
  },

  "nuxt-auth": {
    services: {
      app: {
        environment: [
          "AUTH_ORIGIN=${AUTH_ORIGIN}",
          "AUTH_SECRET=${AUTH_SECRET}",
          "GITHUB_CLIENT_ID=${GITHUB_CLIENT_ID}",
          "GITHUB_CLIENT_SECRET=${GITHUB_CLIENT_SECRET}"
        ]
      }
    }
  }
};

// Merge profond de deux configurations Docker Compose
function deepMergeDockerConfig(
  base: DockerComposeConfig,
  incoming: Partial<DockerComposeConfig>
): DockerComposeConfig {
  const result: DockerComposeConfig = JSON.parse(JSON.stringify(base));

  // Merger les services
  if (incoming.services) {
    for (const [serviceName, serviceConfig] of Object.entries(incoming.services)) {
      if (!result.services[serviceName]) {
        // Nouveau service
        result.services[serviceName] = serviceConfig;
      } else {
        // Merger le service existant
        const existingService = result.services[serviceName];

        // Merger les arrays (ports, environment, volumes, depends_on)
        if (serviceConfig.ports) {
          existingService.ports = [
            ...(existingService.ports || []),
            ...serviceConfig.ports
          ];
        }

        if (serviceConfig.volumes) {
          existingService.volumes = [
            ...(existingService.volumes || []),
            ...serviceConfig.volumes
          ];
        }

        if (serviceConfig.depends_on) {
          existingService.depends_on = Array.from(new Set([
            ...(existingService.depends_on || []),
            ...serviceConfig.depends_on
          ]));
        }

        // Merger environment (peut être array ou object)
        if (serviceConfig.environment) {
          if (Array.isArray(serviceConfig.environment)) {
            if (!existingService.environment) {
              existingService.environment = [];
            }
            if (Array.isArray(existingService.environment)) {
              existingService.environment = [
                ...existingService.environment,
                ...serviceConfig.environment
              ];
            } else {
              // Convertir object en array
              const envArray = Object.entries(existingService.environment).map(
                ([k, v]) => `${k}=${v}`
              );
              existingService.environment = [
                ...envArray,
                ...serviceConfig.environment
              ];
            }
          } else {
            // serviceConfig.environment est un object
            if (!existingService.environment) {
              existingService.environment = {};
            }
            if (typeof existingService.environment === 'object' && !Array.isArray(existingService.environment)) {
              existingService.environment = {
                ...existingService.environment,
                ...serviceConfig.environment
              };
            } else {
              // Convertir array en object et merger
              const envObj: Record<string, string> = {};
              for (const envStr of existingService.environment) {
                const [key, ...valueParts] = envStr.split('=');
                envObj[key] = valueParts.join('=');
              }
              existingService.environment = {
                ...envObj,
                ...serviceConfig.environment
              };
            }
          }
        }

        // Autres propriétés (écrasement simple)
        for (const [key, value] of Object.entries(serviceConfig)) {
          if (!['ports', 'volumes', 'depends_on', 'environment'].includes(key)) {
            existingService[key] = value;
          }
        }
      }
    }
  }

  // Merger les volumes
  if (incoming.volumes) {
    if (!result.volumes) result.volumes = {};
    result.volumes = { ...result.volumes, ...incoming.volumes };
  }

  // Merger les networks
  if (incoming.networks) {
    if (!result.networks) result.networks = {};
    result.networks = { ...result.networks, ...incoming.networks };
  }

  return result;
}

// Normaliser environment en object pour un meilleur rendu YAML
function normalizeEnvironment(config: DockerComposeConfig): DockerComposeConfig {
  const result = JSON.parse(JSON.stringify(config));

  for (const [serviceName, service] of Object.entries(result.services)) {
    const svc = service as DockerService;
    if (svc.environment && Array.isArray(svc.environment)) {
      // Enlever les doublons
      svc.environment = Array.from(new Set(svc.environment));
    }
  }

  return result;
}

// Convertir un objet en YAML (simple, sans lib externe)
function toYAML(obj: any, indent = 0): string {
  const spaces = '  '.repeat(indent);
  let yaml = '';

  if (Array.isArray(obj)) {
    for (const item of obj) {
      if (typeof item === 'object' && item !== null) {
        yaml += `${spaces}-\n${toYAML(item, indent + 1)}`;
      } else {
        yaml += `${spaces}- ${item}\n`;
      }
    }
  } else if (typeof obj === 'object' && obj !== null) {
    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) continue;

      if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        yaml += toYAML(value, indent + 1);
      } else if (typeof value === 'object') {
        yaml += `${spaces}${key}:\n`;
        yaml += toYAML(value, indent + 1);
      } else if (typeof value === 'string') {
        // Échapper les strings qui contiennent des caractères spéciaux
        if (value.includes(':') || value.includes('$') || value.includes('{')) {
          yaml += `${spaces}${key}: "${value}"\n`;
        } else {
          yaml += `${spaces}${key}: ${value}\n`;
        }
      } else {
        yaml += `${spaces}${key}: ${value}\n`;
      }
    }
  }

  return yaml;
}

// Générer le docker-compose.yml complet
export function generateDockerCompose(modules: string[]): string {
  // Commencer avec une config vide
  let config: DockerComposeConfig = {
    services: {}
  };

  // Merger les configs de chaque module
  for (const moduleName of modules) {
    const moduleConfig = moduleDockerServices[moduleName];
    if (moduleConfig) {
      console.log(`  🐳 Ajout des services Docker pour: ${moduleName}`);
      config = deepMergeDockerConfig(config, moduleConfig);
    }
  }

  // Normaliser
  config = normalizeEnvironment(config);

  // Convertir en YAML
  let yaml = '';
  if (config.services && Object.keys(config.services).length > 0) {
    yaml += 'services:\n';
    yaml += toYAML(config.services, 1);
  }

  if (config.volumes && Object.keys(config.volumes).length > 0) {
    yaml += '\nvolumes:\n';
    yaml += toYAML(config.volumes, 1);
  }

  if (config.networks && Object.keys(config.networks).length > 0) {
    yaml += '\nnetworks:\n';
    yaml += toYAML(config.networks, 1);
  }

  return yaml;
}

// Générer le Dockerfile adapté
export function generateDockerfile(modules: string[]): string {
  let dockerfile = `FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .
`;

  // Si Prisma est présent, générer le client
  if (modules.includes('prisma')) {
    dockerfile += `\n# Generate Prisma Client\nRUN npx prisma generate\n`;
  }

  dockerfile += `\nRUN npm run build

EXPOSE 3000

ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000

CMD ["node", ".output/server/index.mjs"]
`;

  return dockerfile;
}
