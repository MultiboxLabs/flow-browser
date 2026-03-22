# Adding a Database Migration

Flow Browser stores local app data in SQLite. The schema is defined in `src/main/saving/db/schema.ts`, generated migration SQL lives in `drizzle/`, and the app applies migrations automatically during database initialization from `src/main/saving/db/index.ts`.

## When You Need a Migration

Add a migration any time you change the SQLite schema in a way that existing installs need to pick up, for example:

- creating a new table
- adding, removing, or renaming columns
- adding indexes or unique constraints
- changing foreign keys or defaults

If you are only changing TypeScript types or application logic and the database shape does not change, you do not need a migration.

## Workflow

### 1. Update the Drizzle schema

Make your schema change in:

- `src/main/saving/db/schema.ts`

Keep the schema as the source of truth. Do not start by editing old SQL migration files.

### 2. Generate a new migration

From the repository root, run:

```bash
bunx drizzle-kit generate --config drizzle.config.ts --name add_history_search_index
```

Use a short, descriptive `snake_case` name. Drizzle will create the next numbered SQL file in `drizzle/` and update the metadata it tracks in `drizzle/meta/`.

Avoid hand-written SQL migrations unless the generated SQL is demonstrably wrong for the change you need.

If you absolutely must write the SQL yourself, generate an empty migration instead:

```bash
bunx drizzle-kit generate --config drizzle.config.ts --name backfill_history_titles --custom
```

Treat `--custom` as an escape hatch, not the default workflow.

- Prefer updating the Drizzle schema and generating SQL from that schema.
- Custom SQL is easier to get wrong and easier for later contributors to misunderstand.
- Any custom migration should get an especially careful review before it is committed.

### 3. Review the generated files

Check the new migration carefully before committing it.

- Make sure the SQL only does what you intended.
- Pay extra attention to column renames, default changes, and constraint changes.
- SQLite has limited `ALTER TABLE` support, so some changes may require table recreation. Review the generated SQL instead of assuming it is safe.

Do not:

- edit or rename older migrations
- hand-edit `drizzle/meta/_journal.json`
- delete previously committed migrations to "clean up" history

If the generated SQL needs a small adjustment, edit the new migration file only.

### 4. Apply the migration locally

Start the app in development:

```bash
bun dev
```

On first database access, Flow Browser runs Drizzle's migrator against the `drizzle/` directory automatically.

- In development, migrations are loaded from the project-root `drizzle/` folder.
- In packaged builds, `electron-builder` copies that folder into the app's `resources/drizzle` directory.

The local SQLite database file is stored at:

```text
app.getPath("userData")/flow.db
```

### 5. Verify the change

Before opening a PR, verify both the schema and the runtime behavior.

- Confirm the app starts without migration errors.
- Exercise the feature that depends on the new schema.
- If the migration changes existing tables, test against an existing local database as well as a fresh one when practical.

### 6. Commit the right files

A migration change will usually include:

- the schema update in `src/main/saving/db/schema.ts`
- the new `drizzle/*.sql` migration file
- any generated `drizzle/meta/*` updates

## Before Pushing

Run the standard checks called out in `AGENTS.md`:

```bash
bun run lint
bun run typecheck
bun run format
```

## Example

For a new index on `history_urls.title`, the flow would be:

1. Add the index to `src/main/saving/db/schema.ts`.
2. Run `bunx drizzle-kit generate --config drizzle.config.ts --name add_history_title_index`.
3. Review the new SQL in `drizzle/`.
4. Launch the app with `bun dev` and confirm the migration applies cleanly.
5. Commit the schema change, the migration SQL, and the generated metadata updates.
