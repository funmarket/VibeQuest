# VibeQuest full target database — non-executable source candidates

These six SQL files are exact extracts of the six **candidate** blocks in Section 12.3 of `docs/product/VIBEQUEST_MASTER_RECONSTRUCTION_PLAN.md`, source blob `7eb1c1a4c65df1a1e04317ade4fcc8f3190264c0` on integration foundation `580175e92224855907711257c5a51560850c30b2`.

**NOT APPROVED FOR RAILWAY EXECUTION.** These files do not belong to `packages/database/migrations` and must not be consumed by `db:migrate`. No proposed POL alternative or new feature activation is approved by their presence in GitHub. The 154 unresolved POL proposals remain unresolved, and the previously accepted POL-X-11 remains unchanged.

## Ordered candidates

1. `00_existing_extensions.sql`
2. `01_target_tables.sql`
3. `02_target_constraints_indexes.sql`
4. `02b_version_guards.sql`
5. `03_integrity_guards.sql`
6. `03b_retention.sql`

Section 12.3 records 140 proposed new tables and 266 intended foreign keys beyond source migrations 0001–0020. These candidate scripts are a design input, not applied migration names, and include changes requiring inspection of live legacy constraints, approved policy semantics, source-owned role and privilege provisioning, and a verified recovery point.

Before any executable forward migration, reconcile each dependency-closed owner slice with Sections 12.4–12.7, 13–14 and 16 of the master plan; separately inspect actual Railway PostgreSQL catalog, ledger checksums, data compatibility, permission boundaries, and recovery capability; identify exact unresolved policy gates. Never apply these candidate files directly to the existing database.

No API, Web, Railway resource, historical migration or existing data is modified by this document.
