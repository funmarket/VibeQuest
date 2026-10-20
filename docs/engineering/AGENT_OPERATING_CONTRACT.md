# VibeQuest — canonical agent operating contract

**Purpose:** Prevent unsupported diagnosis, implementation drift, invented authorization gates and contradictory recommendations while advancing the complete VibeQuest reconstruction. This document governs agent method, not product requirements or release permissions. The [master reconstruction plan](../product/VIBEQUEST_MASTER_RECONSTRUCTION_PLAN.md) remains the sole product execution plan. Existing BashirExecute's **one authorized semantic outcome per packet** remains in force.

## 1. Inspect before concluding or acting

Before any consequential diagnosis, recommendation, execution packet or mutation, inspect current **task-relevant** source truth: exact repository/branch/HEAD and overlapping PRs as applicable; canonical owner and call/data path; current tests/contracts; runtime and deployment state if those affect the decision; and the applicable master-plan contract. Read legacy references when reconstructing protected product behavior. Do not run a generic full-system audit for a narrow change. If live access fails, disclose the limitation and restrict claims.

## 2. Classify the evidence

Use the following distinctions for consequential claims:
- **VERIFIED NOW:** directly checked in current source/tool/runtime evidence.
- **PREVIOUSLY VERIFIED:** established earlier but not refreshed.
- **REPORTED:** another agent/document claims it.
- **INFERRED:** conclusion from cited evidence, not directly observed.
- **UNKNOWN:** evidence is insufficient.

Never silently promote reported, inferred or historical facts to verified-now. Do not invent symbols, files, services, data, mechanics, tests, risks or authority.

## 3. Prove a defect before proposing a fix

Establish (a) actual observed condition, (b) verified expected contract, (c) whether the difference is an expected state, incomplete planned feature, genuine violation or unknown, (d) canonical owner, (e) real consequences. An old deployed commit is not automatically drift; CI success is not deployment; missing functionality is not necessarily an architecture defect. Where evidence is insufficient, inspect more within read-only scope or state uncertainty. Never turn a hypothesis into a required corrective packet.

## 4. No invented permissions or stop gates

Interpret the user's authorized **semantic outcome** with its actual targets and consequences. Preserve existing GitHub, Railway, database and external-system release/permission contracts; inspect them before recommending their alteration. Do not invent a mandatory deployment, forbid an established authorized step without grounds, or treat normal in-scope edits/test/format retries as drift. New authorization is needed only for a new consequential target, independent fix, owner, architecture choice, unauthorized external mutation, or recovery after true material drift. Existing BashirExecute rules govern command ledger, full diff and stop conditions.

## 5. Canonical ownership and protected mechanics

Trace the affected UI/control -> event -> state -> API/domain -> persistence/render -> styling -> relevant deployment path before altering ownership. Preserve one canonical owner per behavior and datum. No shadow state, duplicate services/owners, global CSS overrides or timer/observer/DOM-relocation glue without demonstrated need. Preserve accepted original feature and game/challenge mechanics; require an explicit product decision for a consequential reinterpretation.

## 6. Source, release and acceptance are separate

For deployment-related advice or action, verify current source repo/branch/commit pin, triggers, effective service config, current deployed SHA/status, dependency compatibility, migration needs, authorization, rollback and relevant live acceptance. Clearly label **implemented**, **locally tested**, **CI passed**, **merged**, **deployed**, **live verified**, and **production accepted**. Do not assume these are identical. An intentionally pinned healthy staging release can legitimately trail GitHub. Neither automatically promote it nor call it a failure.

## 7. Controlled implementation

Within a directly authorized implementation: fresh preflight -> prove existing owner -> implement one semantic outcome -> review complete diff -> correct in-scope mechanical errors -> pinned formatter before commit -> applicable lint/typecheck/architecture/targeted behavioral tests -> exact-head CI and PR review -> authorized integration/deployment -> runtime proof where in scope -> report and plan sync. Do not start an unrelated next task. Do not equate source-pattern tests with phone/layout or deployed runtime evidence.

## 8. Contradiction register

Before reversing a consequential prior finding, explicitly state: the earlier claim, its evidence status, the new evidence, which portion is withdrawn or changed, and the operational effect. Do not quietly switch recommendations or invent remediation because a prior assistant was wrong. When two instructions, references or reports conflict, inspect the authoritative source, label unresolved decisions and do not improvise a tie-breaker.

**Regression case:** An earlier assistant called a GitHub/Railway SHA difference a deployment gap and recommended a Web release without inspecting explicit commit pins and triggers. Subsequent inspection found healthy, deliberately pinned Web/API revisions and no push triggers: `EXPECTED_RELEASE_STATE`. Agents must check release policy before diagnosing a defect and must not infer historical human intent from the existence of a pin.

## 9. Shared handoff and plan discipline

Use one master reconstruction plan, not competing roadmaps. Record verified milestones with exact source PR/commit/CI and separate staging/production runtime state. Historical checkpoints are not live facts. Every receiving agent independently refreshes relevant HEAD/runtime before acting. Report unresolved blockers accurately. New agent instruction documents should point here, not fork these rules.

## 10. Pre-action decision check

Before any consequential recommendation or action, establish:
1. What exact currently verified facts support it?
2. What authoritative product/technical/release contract governs it?
3. Is the condition genuinely defective or expected?
4. What is its canonical owner and affected dependency path?
5. Is the outcome/action within current authorization, with no invented permission or extra gate?
6. Does it contradict a previous verified claim, and if so has the contradiction been reconciled?
7. What proportional evidence proves the result, and which acceptance stages remain unverified?

If a material answer is unknown, inspect it before deciding. If access prevents inspection, disclose the limit; do not manufacture certainty.

**Operating sequence:** INSPECT -> PROVE -> RECONCILE -> AUTHORIZED EXECUTION -> DIFF -> VERIFY -> DOCUMENT -> REPORT -> STOP. Guardrails protect scope; they are not procedural obstacles.
