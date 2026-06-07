#!/usr/bin/env node
/**
 * Creates a new package under packages/ following the @easify-po/app structure.
 * Usage: node init-package.mjs <package-name>
 * Example: node init-package.mjs @easify/settings
 */
import { mkdirSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const packageName = process.argv[2];

if (!packageName) {
  console.error("Usage: node init-package.mjs <package-name>");
  console.error("Example: node init-package.mjs @easify/settings");
  process.exit(1);
}

const isScoped = packageName.startsWith("@");
let scope = "";
let name = packageName;

if (isScoped) {
  const slashIdx = packageName.indexOf("/");
  if (slashIdx === -1) {
    console.error("Invalid scoped package name. Expected format: @scope/name");
    process.exit(1);
  }
  scope = packageName.slice(0, slashIdx);
  name = packageName.slice(slashIdx + 1);
}

if (!name) {
  console.error("Package name cannot be empty");
  process.exit(1);
}

const pkgDir = isScoped
  ? join("packages", scope, name)
  : join("packages", name);

if (existsSync(pkgDir)) {
  console.error(`❌ Package ${packageName} already exists at ${pkgDir}`);
  process.exit(1);
}

// Relative paths from the new package root to other directories
const depth = isScoped ? 2 : 1;
const relToPackages = Array(depth).fill("..").join("/");
const relToApp = Array(depth + 1)
  .fill("..")
  .join("/");

// PascalCase for class names: product-options → ProductOptions
const className = name
  .split("-")
  .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
  .join("");

// camelCase for file names: product-options → productOptions
const camelName = name
  .split("-")
  .map((s, i) => (i === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1)))
  .join("");

// ─── Create directory structure ───────────────────────────────────────────────
const dirs = [
  "src/components",
  `src/models/${className}`,
  "src/routes",
  "src/services",
  "src/use-cases",
];
for (const dir of dirs) {
  mkdirSync(join(pkgDir, dir), { recursive: true });
}

// ─── package.json ─────────────────────────────────────────────────────────────
writeFileSync(
  join(pkgDir, "package.json"),
  JSON.stringify(
    {
      name: packageName,
      version: "1.0.0",
      description: "",
      author: "Easify",
      license: "MIT",
      type: "module",
      dependencies: {
        "@easify-app/core": "^1.0.0",
        "@easify-po/app": "^1.0.0",
      },
    },
    null,
    2,
  ) + "\n",
);

// ─── tsconfig.json ────────────────────────────────────────────────────────────
writeFileSync(
  join(pkgDir, "tsconfig.json"),
  JSON.stringify(
    {
      include: ["**/*.ts", "**/*.tsx"],
      compilerOptions: {
        lib: ["DOM", "DOM.Iterable", "ES2022"],
        strict: true,
        skipLibCheck: true,
        isolatedModules: true,
        allowSyntheticDefaultImports: true,
        removeComments: false,
        forceConsistentCasingInFileNames: true,
        noEmit: true,
        allowJs: true,
        resolveJsonModule: true,
        jsx: "react-jsx",
        module: "ESNext",
        moduleResolution: "Bundler",
        target: "ES2022",
        baseUrl: ".",
        paths: {
          [`${packageName}/*`]: ["./*"],
          "@easify-app/core/*": [`${relToPackages}/@easify-app/core/*`],
          "@easify-po/app/*": [`${relToPackages}/@easify-po/app/*`],
          "~/*": [`${relToApp}/app/*`],
        },
        types: [
          "node",
          "@shopify/app-bridge-types",
          "@react-router/node",
          "vite/client",
          "@shopify/polaris-types",
        ],
      },
    },
    null,
    2,
  ) + "\n",
);

// ─── vite.config.ts ───────────────────────────────────────────────────────────
writeFileSync(
  join(pkgDir, "vite.config.ts"),
  `import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
});
`,
);

// ─── Model files ──────────────────────────────────────────────────────────────
const modelDir = join(pkgDir, "src", "models", className);

// {ClassName}Model — extends AbstractModel, wires ResourceModel
writeFileSync(
  join(modelDir, `${camelName}Model.ts`),
  `import AbstractModel from "@easify-app/core/src/models/Abstract/abstractModel";
import type { ModelConstructor } from "@easify-app/core/src/types/models/Abstract/abstractModel.type";
import ${className}ResourceModel from "${packageName}/src/models/${className}/${camelName}ResourceModel";

export default class ${className}Model extends AbstractModel<${className}ResourceModel> {
  constructor({ session }: ModelConstructor) {
    super({ session, resourceModel: ${className}ResourceModel });
  }
}
`,
);

// {ClassName}ResourceModel — extends AbstractResourceModel, backed by abstractServer + Prisma
writeFileSync(
  join(modelDir, `${camelName}ResourceModel.ts`),
  `import AbstractResourceModel from "@easify-app/core/src/models/Abstract/abstractResourceModel";
import type { ResourceModelConstructor } from "@easify-app/core/src/types/models/Abstract/abstractResourceModel.type";
import abstractServer from "@easify-app/core/src/servers/abstract.server";
import dbServer from "@easify-po/app/src/db.server";
import { Prisma } from "@prisma/client";

// TODO: replace "${name}" with the actual Prisma model name matching prisma/schema.prisma
export type ${className}Data = Prisma.${name}GetPayload<undefined>;

export default class ${className}ResourceModel extends AbstractResourceModel<${className}Data> {
  constructor({ session, transaction }: ResourceModelConstructor) {
    super({
      session,
      server: abstractServer({
        dbServer: dbServer,
        db_name: "${name}",
      }),
      transaction,
    });
  }
}
`,
);

// {ClassName}Collection — extends AbstractCollection, manages lists of {ClassName}Model
writeFileSync(
  join(modelDir, `${camelName}Collection.ts`),
  `import AbstractCollection from "@easify-app/core/src/models/Abstract/abstractCollection";
import type { CollectionConstructor } from "@easify-app/core/src/types/models/Abstract/abstractCollection.type";
import ${className}Model from "${packageName}/src/models/${className}/${camelName}Model";
import ${className}ResourceModel from "${packageName}/src/models/${className}/${camelName}ResourceModel";

export default class ${className}Collection extends AbstractCollection<${className}Model> {
  constructor({ session }: CollectionConstructor) {
    super({ session, model: ${className}Model, resourceModel: ${className}ResourceModel });
  }
}
`,
);

// ─── Service file ─────────────────────────────────────────────────────────────
const serviceDir = join(pkgDir, "src", "services");

writeFileSync(
  join(serviceDir, `${camelName}Service.ts`),
  `import AbstractService from "@easify-po/app/src/services/abstractService";

export default class ${className}Service extends AbstractService {}
`,
);

// ─── Print result ─────────────────────────────────────────────────────────────
console.log(`✅ Package ${packageName} created at ${pkgDir}/\n`);
console.log("Structure:");

function listFiles(dir, prefix = "") {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      console.log(`${prefix}${entry.name}/`);
      listFiles(join(dir, entry.name), prefix + "  ");
    } else {
      console.log(`${prefix}${entry.name}`);
    }
  }
}

listFiles(pkgDir);

console.log(
  `\nNext steps:\n` +
    `  1. Set db_name in src/models/${className}/${camelName}ResourceModel.ts\n` +
    `  2. Flesh out src/services/${camelName}Service.ts (load, save, getModel, getValue)\n` +
    `  3. Add route files to src/routes/ — call ${className}Service, never Model directly\n`,
);
