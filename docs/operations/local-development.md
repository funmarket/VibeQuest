# Local development and verification

Source-derived instructions, checked 10 October 2026. Run commands from the repository root. Examples use PowerShell and `pnpm.cmd`; other shells use `pnpm` with their own environment syntax. This documentation packet did not install dependencies, migrate databases, start services or rerun application/browser suites.

## Prerequisites and installation

- Node 24 (`>=24 <25`) and pnpm 11.1.1, from root `package.json`. This machine reports Node v24.15.0 and pnpm 11.1.1.
- PostgreSQL with PostGIS available to the migration role; loopback local databases `vq_foundation` for development and disposable `vq_test` for tests. No container/cluster provisioning script is supplied in this project.
- Access to the dependency registry and native Sharp build/runtime prerequisites for the target OS. Workspace build allowances are in `pnpm-workspace.yaml`; do not copy an old dependency store between platforms.
- Installed Chrome for the reconstruction/Event/Social configurations. Default browser suites require their configured Playwright browser. Browser installation is a separate environment operation.

```powershell
node --version
pnpm.cmd --version
pnpm.cmd install --frozen-lockfile
```

The install command/flag is supported by the installed pnpm and used by the checked-in workflow; a fresh installation was not executed in D01. Keep `pnpm-lock.yaml`, workspace manifests and `pnpm-workspace.yaml` together. Do not regenerate the lockfile to hide incompatibility.

## Environment configuration

`.env.example` documents variable names and the historical local development target. It is an example, not a provisioned database or credentials for another machine. Never commit actual connection strings/secrets. The API and migration CLI read exported process variables; they do not automatically load the root example file. Next has its own environment conventions; exporting into the launching shell avoids assuming a root file is loaded.

| Name                                                        | Consumer / meaning                                                                          |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                              | API and migration CLI; required PostgreSQL URL. Select development/test target explicitly   |
| `TEST_DATABASE_URL`                                         | Integration suites; explicit loopback database named `vq_test`                              |
| `PORT`                                                      | API; integer 1–65535, default 4100                                                          |
| `API_ORIGIN`                                                | Next server `/api` rewrite destination; default `http://127.0.0.1:4100`                     |
| `WEB_ORIGINS`                                               | API comma-separated allowed mutation Origins; default loopback Web origins on port 3000     |
| `MEDIA_LOCAL_ROOT`                                          | API storage override; use an absolute path. Default workspace `.local/media`                |
| `NODE_ENV`                                                  | API sets Secure cookies only for `production`; Next also uses its standard environment mode |
| `NEXT_PUBLIC_MAP_STYLE_LIGHT`, `NEXT_PUBLIC_MAP_STYLE_DARK` | Optional licensed HTTPS map styles in Web; no map provider is provisioned                   |

Database setup must create the two selected databases/roles with permissions appropriate to local operation and PostGIS extension installation. The existing example uses loopback port 55439; provision your own valid local target rather than assuming that port/role already exists. Test configurations with hardcoded targets are described below. Production trust authentication is not an acceptable inference from the historical local cluster.

Export connection values privately; the following prompts deliberately contain no credential literals:

```powershell
$env:DATABASE_URL = Read-Host 'Development PostgreSQL URL (do not commit it)'
$env:TEST_DATABASE_URL = Read-Host 'Disposable loopback vq_test URL'
$env:WEB_ORIGINS = 'http://127.0.0.1:3000,http://localhost:3000'
$env:API_ORIGIN = 'http://127.0.0.1:4100'
$env:PORT = '4100'
```

Enter secrets only in a trusted local shell; do not paste them into reports. Share storage consistently across API instances using the same database. Restart the relevant process after changing environment configuration.

## Safe migrations

Confirm host/database identity and obtain authority for that target before running:

```powershell
pnpm.cmd db:migrate
```

The CLI uses `DATABASE_URL`, not `TEST_DATABASE_URL`. The runner reads all thirteen numbered SQL files, sorts them, takes a transaction advisory lock, records filename/SHA256 and rejects altered applied migrations. DDL/ledger failure rolls back. Schema contains no application seed records; do not edit an applied migration, clear its ledger or reset existing data to recover a mismatch.

To migrate only an authorized disposable test target, temporarily assign `DATABASE_URL` to the already verified test URL, then restore it:

```powershell
$previousDevelopmentUrl = $env:DATABASE_URL
try {
  $env:DATABASE_URL = $env:TEST_DATABASE_URL
  pnpm.cmd db:migrate
} finally {
  $env:DATABASE_URL = $previousDevelopmentUrl
}
```

This is a future operator procedure, not a migration executed by D01. Applied database state must be checked separately; source files alone do not prove migration execution.

## Startup and build

```powershell
pnpm.cmd dev
```

The root script launches `@vq/web` and `@vq/api` in parallel. Web defaults to loopback port 3000; API to loopback port 4100. Open `http://127.0.0.1:3000/en/home` or `/telegram`; the latter routes into the same locale application and does not authenticate Telegram.

Individual commands:

```powershell
pnpm.cmd --filter @vq/api dev
pnpm.cmd --filter @vq/web dev
pnpm.cmd build
pnpm.cmd --filter @vq/api start
pnpm.cmd --filter @vq/web start
```

Run separate services in separate shells with the correct environment. Root `build` builds Web only; there is no compiled API build script. API `start` executes TypeScript with `tsx`. Web `start` requires a prior production build. Production cookie mode requires actual HTTPS; use development mode for local HTTP. Do not infer deployability from these loopback commands.

`/health/live` checks process availability. `/health/ready` checks PostgreSQL/schema availability; a ready response does not certify providers, Media byte durability or full product acceptance.

## Checks and isolated tests

```powershell
pnpm.cmd format:check
pnpm.cmd lint
pnpm.cmd typecheck
pnpm.cmd architecture
pnpm.cmd test
pnpm.cmd build
pnpm.cmd check
```

Root `check` chains format/lint/typecheck/architecture/unit tests/Web build. It does not include integration or browser tests. `format` writes broadly; use `format:check` during read-only review. Build/typechecking can write generated artifacts; documentation-only tasks should not imply they ran these.

With separately authorized disposable database fixtures:

```powershell
pnpm.cmd test:integration
```

Integration tests require `TEST_DATABASE_URL` on loopback with exact database name `vq_test`; they perform migrations and mutations/fixture cleanup through real repositories/APIs. Do not point them at development/production data. Guarding the URL is not a reason to share test data with another user.

| Browser command                                                              | Actual configuration / limitation                                                                                                                                                                      |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm.cmd test:browser`                                                      | Builds Web, then default Playwright config starts Web on 3000; API must already run. Includes suites that touch local development fixtures; not a read-only gate. Stop conflicting Web processes first |
| `pnpm.cmd exec playwright test --config playwright.reconstruction.config.ts` | Installed Chrome; expects existing Web/API on 3000/4100. Identity/Business/Activities tests hardcode local development database target from source and create/clean fixtures                           |
| `pnpm.cmd exec playwright test --config playwright.events.config.ts`         | Installed Chrome; starts API 4102 and Web 3002, migrates hardcoded local `vq_test`, uses separate Media root                                                                                           |
| `pnpm.cmd exec playwright test --config playwright.social.config.ts`         | Installed Chrome; starts API 4103 and Web 3003, migrates hardcoded local `vq_test`, uses separate Media root                                                                                           |

Dedicated Event/Social configs explicitly select the historical loopback role/port in their source; `TEST_DATABASE_URL` alone does not override these settings. Running them requires matching authorized local setup. Do not run conflicting Next dev instances or tests concurrently against shared fixtures. Source changes to make test targets portable require a separate bounded repair packet, not this documentation task.

Some older suites use transport/SDK fixtures. They test contracts, not genuine Telegram/camera/location/provider acceptance. Test images are not physical capture proof. Historical results are retained in the [checkpoint](reconstruction-progress.md); no historical count is a new D01 pass.

## Current setup limitations and source preservation

No PostgreSQL provisioning script, real Telegram bot/launch/link flow, email/recovery delivery, distributed object storage or separate production worker is established. Map styles are optional and externally configured. Some original features remain unavailable until their master-plan packets complete.

The checked-in `.github/workflows/checks.yml` installs with frozen lockfile and runs `pnpm check`; it does not run database/browser suites. S00 source preservation completed on 10 October 2026: public [funmarket/VibeQuest](https://github.com/funmarket/VibeQuest), development branch `phase-0-foundation`, initial commit `1e95baab86b7252cdd68f3d747824271631072f6`, exactly 232 approved files and thirteen migrations. [GitHub Actions run 38052826906](https://github.com/funmarket/VibeQuest/actions/runs/38052826906) succeeded. No `main` branch was created. Publication is not production or Railway acceptance. The workspace is now a Git repository. D01's installation/runtime claims above retain their original historical scope. Git ignore rules exclude generated/private files and historical evidence while keeping `.env.example` and `pnpm-lock.yaml` publishable. Review candidate contents before every future commit; ignore rules are not a complete secret scanner.
