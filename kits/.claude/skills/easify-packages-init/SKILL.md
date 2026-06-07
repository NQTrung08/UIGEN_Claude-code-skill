---
name: easify-packages-init
description: "Initialize a new package in the packages/ monorepo directory. Creates package.json, tsconfig.json, vite.config.ts, and src/ scaffold (components, use-cases, models, routes, services) following the @easify-po/app conventions. Keywords: new package, create package, init package, monorepo package, easify package"
compatibility: Requires Node.js
metadata:
    author: Seppy
    version: "1.0.0"
---

# easify-packages-init

Scaffolds a new package under `packages/` following project monorepo conventions.

## Usage

When the user wants to create a new package, run the init script from the **project root**:

```bash
node .agents/skills/easify-packages-init/scripts/init-package.mjs <package-name>
```

**Examples:**

```bash
node .agents/skills/easify-packages-init/scripts/init-package.mjs @easify/settings
node .agents/skills/easify-packages-init/scripts/init-package.mjs @easify-po/product-variants
```

After running, always run `yarn install` to link the new workspace package.

---

## What Gets Created

Given `@easify/settings`, the script creates `packages/@easify/settings/`:

```
packages/@easify/settings/
├── package.json              # name, version, deps (@easify-app/core, @easify-po/app)
├── tsconfig.json             # Bundler moduleResolution, paths aliased to workspace roots
├── vite.config.ts            # vite-tsconfig-paths plugin
└── src/
    ├── components/           # React UI components and styles
    ├── models/
    │   └── Settings/
    │       ├── settingsModel.ts           # extends AbstractModel
    │       ├── settingsResourceModel.ts   # extends AbstractResourceModel
    │       └── settingsCollection.ts      # extends AbstractCollection
    ├── routes/               # React Router route files (auto-detected by app/routes.ts)
    ├── services/
    │   └── settingsService.ts             # extends AbstractService — called by use-cases, orchestrates models
    ├── use-cases/             # extends AbstractUseCase — implement perform() with business logic

```

---

## Model Inheritance Pattern

Models in the scaffold extend the abstract base classes from `@easify-app/core`:

| File                          | Extends                 | Purpose                                              |
|-------------------------------|-------------------------|------------------------------------------------------|
| `{camelName}Model.ts`         | `AbstractModel`         | Business logic, data mapping, save/delete operations |
| `{camelName}ResourceModel.ts` | `AbstractResourceModel` | Database/API adapter via a server instance           |
| `{camelName}Collection.ts`    | `AbstractCollection`    | Paginated list of models with filtering and sorting  |

### Key TODOs after scaffolding

1. **Set `db_name`** in `{camelName}ResourceModel.ts` — must match the Prisma model name (e.g. `"settings"` →
   `prisma.settings`)
2. **Flesh out `{camelName}Service.ts`** — implement `load()`, `save()`, `getModel()`, `getValue()` as needed
3. **Add use-case classes** to `src/use-cases/` — extend `AbstractUseCase` from `@easify-po/app`, implement `perform()`
   with business logic; `execute()` is inherited
4. **Add route files** to `src/routes/` — instantiate use-cases and call `execute()`, never call Services directly
5. **Add components** to `src/components/` for feature UI

---

## Route Auto-Detection

Route files placed in `src/routes/` are **automatically detected** by `app/routes.ts` at startup.

File naming follows React Router flat-routes convention:

- `app.settings._index.tsx` → renders at `/app/settings` inside the `app.tsx` layout
- `app.settings.edit.tsx` → renders at `/app/settings/edit` inside the `app.tsx` layout

No manual registration needed.

---

## tsconfig Paths

The generated `tsconfig.json` includes self-referential and cross-package aliases:

```json
{
  "@easify/settings/*": [
    "./*"
  ],
  "@easify-app/core/*": [
    "../../@easify-app/core/*"
  ],
  "@easify-po/app/*": [
    "../../@easify-po/app/*"
  ],
  "~/*": [
    "../../../app/*"
  ]
}
```

Paths are computed automatically based on scope depth (`@scope/name` = 2 levels, `name` = 1 level).
