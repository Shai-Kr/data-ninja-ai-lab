---
layout: post
title: "Fabric Warehouse Migrations Can Now Move in Safer, Smaller Steps"
date: 2026-10-21
description: Incremental migration and controlled re-migration let teams move Fabric Warehouse definitions in workload-sized waves. This practical playbook covers scope, conflicts, data movement, validation, and evidence.
author: Shai Karmani
author_url: https://www.linkedin.com/in/shai-kr
---

<style>
@media (max-width: 760px) {
  .site-shell { width: min(100% - 24px, var(--max)); }
  .site-header { gap: 12px; margin-bottom: 18px; }
  .brand { font-size: 0.94rem; }
  .brand-mark { width: 32px; height: 32px; border-radius: 10px; }
  .nav { display: none; }
  .article { max-width: 100%; overflow-x: hidden; }
  .article-header { padding: 20px 14px; border-radius: 18px; }
  .article-header h1 { font-size: clamp(1.12rem, 5vw, 1.6rem); line-height: 1.17; letter-spacing: -0.025em; }
  .article-header .dek { font-size: 0.94rem; margin-top: 14px; }
  .article-body { overflow-x: hidden; font-size: 0.98rem; }
  .article-body img { width: 100%; max-width: 100%; height: auto; border-radius: 16px; }
  .article-body p:has(> img) { max-width: 100%; width: 100%; }
  .subscribe-orbit { display: none; }
}
.review-visual { width: 100%; max-width: 100%; margin: 34px 0 10px; overflow: hidden; }
.review-visual img { display: block; width: 100%; max-width: 100%; height: auto; }
</style>

**Review draft. Direct link only.**

Large warehouse migrations rarely move as one clean event.

One business domain is ready. Another still has unresolved dependencies. A translated view needs correction. A procedure changes in the source after the first migration. Meanwhile, the destination already contains work the team cannot casually replace.

Fabric Migration Assistant now supports incremental migration and re-migration for Fabric Data Warehouse in preview. Teams can select a workload-sized group of database objects, add another group in a later run, and return to an existing object when its definition changes. The destination can be empty, created by an earlier migration, or already contain work built through another process.

That is a useful shift. The migration unit no longer has to be the whole database. It can be the smallest business workload the team can validate end to end.

The feature is still an assistant, not a migration operating model. The real value appears when each run has a declared boundary, explicit conflict decisions, separate data movement, and evidence that the dependent workload still behaves correctly.

## What changed

Migration Assistant can now reopen a destination Warehouse and use **Get more objects** to start another migration run. The selection process identifies direct dependencies and warns when an incoming object name already exists in the destination.

For each naming conflict, the team chooses one of three actions:

- **Keep existing:** retain the current destination definition.
- **Keep incoming:** replace it with the newly translated definition.
- **Rename incoming:** create the incoming object under another name and preserve both.

This applies to definitions. It does not continuously synchronize changed rows, reconcile business meaning, or reload data automatically after a replacement. Data movement remains a separate activity, such as a Data Factory copy job, staged files with `COPY INTO`, or a Fabric pipeline.

That distinction matters. A successful object migration proves that a definition was translated and created. It does not prove that the data is current, the dependency chain is complete, or the consuming report produces the same answer.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/fabric-warehouse-incremental-migration/01-wave-model-mobile.svg"><img src="/data-ninja-ai-lab/assets/blog/fabric-warehouse-incremental-migration/01-wave-model.svg" alt="A Fabric Warehouse migration moves through workload-sized waves with scope, translation, deployment, data movement, and validation"></picture></figure>

## Make the workload the migration boundary

Selecting ten tables because ten feels manageable is not a migration scope.

A better boundary is a workload with a clear business result. For example, the order-to-cash reporting flow might include source tables, views, functions, procedures, loading logic, permissions, and the semantic model queries that consume them.

For each wave, I would record:

1. **Business outcome:** the report, process, or analytical use case this wave enables.
2. **Object boundary:** the schemas, tables, views, procedures, and functions intentionally included.
3. **Added dependencies:** objects Migration Assistant included because the selected definitions depend on them.
4. **Destination owner:** the team accountable for names, permissions, and deployment decisions.
5. **Data-load plan:** how rows arrive after the definitions exist.
6. **Acceptance evidence:** the queries, totals, performance checks, and downstream tests required before the wave closes.

The dependency review deserves attention. Migration Assistant includes direct dependencies by default, so the final scope can be larger than the initial selection. That is helpful, but direct dependency discovery is not the same as full workload discovery. External orchestration, dynamic SQL, application calls, report queries, and operational schedules can still sit outside the object graph.

The selection summary should therefore be reviewed as a release manifest, not clicked through as wizard output.

## Treat every conflict as a change request

The side-by-side definition comparison is the most operationally important part of re-migration.

If the incoming object conflicts with a destination object, the decision changes the target architecture. Keeping the existing definition means the source and destination intentionally diverge. Keeping the incoming definition may invalidate data, permissions, dependent objects, or workload assumptions. Renaming creates another object that needs an owner and a retirement plan.

I would require five fields for every conflict:

- selected action and decision owner
- reason for the decision
- dependent objects and consumers reviewed
- data reload or backfill required
- validation tests and rollback action

Do not approve a replacement only because the translated SQL looks reasonable. Review the complete definition, then test the behavior that matters: parameters, filters, joins, null handling, aggregations, transaction assumptions, permissions, and downstream query results.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/fabric-warehouse-incremental-migration/02-conflict-decision-mobile.svg"><img src="/data-ninja-ai-lab/assets/blog/fabric-warehouse-incremental-migration/02-conflict-decision.svg" alt="A decision model for keeping, replacing, or renaming conflicting Fabric Warehouse object definitions"></picture></figure>

## Keep definitions and data on separate checklists

Incremental migration moves object definitions across multiple runs. It does not mean the source and destination data stay synchronized.

That creates two related but separate release tracks.

**Definition track**

- selected objects and dependencies
- translation results and manual fixes
- conflict decisions
- deployment order
- permissions and ownership

**Data track**

- initial full load or staged history
- incremental-load method where supported
- watermark or change-tracking assumptions
- row counts and reconciliation totals
- retry, restart, and late-arriving data behavior

Keeping those tracks visible prevents a common status problem: the schema is deployed, so the migration is reported as complete while the data load and consumer validation are still open.

For a replaced table definition, decide whether the existing data remains compatible. A datatype, nullability, distribution, or column change can require a reload even when the object replacement succeeds. For a view or procedure, the definition may deploy cleanly but return a different result because a dependent object changed in an earlier wave.

## Use a wave ledger

Incremental work becomes difficult to reason about when the team cannot answer which definition came from which run.

A simple wave ledger should contain one row per migrated object:

| Field | What it proves |
|---|---|
| Wave ID | Which approved scope introduced or changed the object |
| Source platform and database | Where the incoming definition originated |
| Source object and hash | Which source definition was reviewed |
| Destination object | Where the translated definition was deployed |
| Conflict action | Keep existing, keep incoming, rename, or no conflict |
| Data-load status | Not started, running, reconciled, or blocked |
| Validation result | The known-answer tests that passed |
| Owner and timestamp | Who accepted the result and when |

The source hash or version is useful when the source keeps changing during a long migration program. Without it, "re-migrated on Tuesday" does not identify which definition was actually accepted.

The ledger also makes rollback clearer. A rollback is not always a button. It may mean restoring the previous definition, reloading data, redirecting a consumer, or pausing the next wave until a dependency is repaired.

## Validate before expanding the scope

Each wave should close with known-answer tests before the next group of objects is added.

At minimum, I would test:

- every selected object exists under the intended name and schema
- every added dependency has an owner and belongs in the wave
- conflict decisions match the approved record
- row counts and reconciliation totals match agreed tolerances
- representative queries return expected results
- translated procedures and functions handle normal and failure paths
- permissions match the destination access model
- Power BI, applications, or pipelines using the workload still work
- rerunning the migration produces only expected conflicts

The rerun test matters because re-migration is part of the new capability. A team should know what happens when it presents the same scope again, then what happens when one source definition changes.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/fabric-warehouse-incremental-migration/03-wave-gates-mobile.svg"><img src="/data-ninja-ai-lab/assets/blog/fabric-warehouse-incremental-migration/03-wave-gates.svg" alt="Six release gates for an incremental Fabric Warehouse migration wave"></picture></figure>

## A practical first run

I would start with one representative workload that has visible value and manageable coupling.

1. Map the workload boundary and its consumers.
2. Create the object manifest and expected dependencies.
3. Choose the destination from ownership, security, naming, and data-isolation requirements.
4. Run Migration Assistant for the selected definitions.
5. Review the expanded object list and resolve every conflict through an owner.
6. Deploy the accepted definitions.
7. Run the separate data-load plan.
8. Execute known-answer tests and reconcile results.
9. Record the wave in the ledger, including source versions and decisions.
10. Expand only after the first workload is accepted.

This approach also helps when consolidating objects from SQL Server, Azure Synapse Analytics dedicated SQL pools, or Teradata into one or more Fabric Warehouses. A shared destination can reduce unnecessary sprawl, but consolidation should be deliberate. Workloads that do not share the same ownership, security, naming, or isolation requirements should not be forced together because the tool permits it.

## The practical takeaway

Incremental migration makes Fabric Warehouse modernization easier to stage around real delivery constraints.

Use a sequence of small, reviewable releases. Every wave should have a business boundary, an object manifest, explicit conflict decisions, a separate data-load plan, and evidence from the workloads that depend on it.

That gives teams something more useful than a faster wizard. It gives them a migration process they can repeat without losing control of the destination.

## Sources

- [Incrementally migrate and re-migrate database objects with Migration Assistant for Fabric Warehouse (Preview)](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blog/Incrementally-migrate-and-re-migrate-database-objects-with/ba-p/5376060)
- [Migration Assistant for Fabric Data Warehouse](https://learn.microsoft.com/en-us/fabric/data-warehouse/migration-assistant)
- [Migrate using a connection to a source system](https://learn.microsoft.com/en-us/fabric/data-warehouse/migrate-using-connection-to-source-system)
- [Migrate by uploading source files](https://learn.microsoft.com/en-us/fabric/data-warehouse/migrate-using-upload-file)

---

Written by **[Shai Karmani](https://www.linkedin.com/in/shai-kr)**.

If you work on Microsoft Fabric, Power BI, data engineering, or practical AI systems, feel free to [connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr).
