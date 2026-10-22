# VibeQuest — agent entry point

Before diagnosing, proposing, drafting an execution packet, editing, merging, or operating this repository, read [the canonical agent operating contract](docs/engineering/AGENT_OPERATING_CONTRACT.md) and the relevant current sections of [the master reconstruction plan](docs/product/VIBEQUEST_MASTER_RECONSTRUCTION_PLAN.md).

**Order of authority:** explicit current user authorization and safety boundaries; current verified runtime/source facts for what exists; master reconstruction plan for approved product requirements and sequence; canonical agent contract for method; historical notes and other agent reports as evidence only. If these conflict, investigate and report rather than silently choose.

Do not take another agent's summary or a historical SHA as current truth. Inspect only the systems relevant to the task, but inspect them before a consequential diagnosis or action. Do not invent problems, release rules, authorization boundaries or architectural owners. One authorized semantic outcome per packet; ordinary in-scope retries and corrections are not new work.

For implementation, inspect complete diff, format before committing, run relevant tests and CI, distinguish merged source from deployed and live-accepted behavior, and maintain the authoritative plan only for accepted verified milestones. Never make unauthorized infrastructure, data or production changes.

Agents must follow the contract even if a prompt omits it. A repository instruction is not permission to exceed the user's authorization.
