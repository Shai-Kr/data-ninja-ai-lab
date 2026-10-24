---
layout: post
title: "Business Central Data Can Reach OneLake Without Another ETL Stack"
date: 2026-10-24
description: Business Central data mirroring is planned as a production-ready preview for October 2026. This guide turns it into a governed and observable analytics source in Microsoft Fabric.
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

Business Central reporting often starts with a reasonable shortcut: call an API, extract the tables needed for one report, and repeat.

Then the estate grows. Multiple companies need the same data. Power BI refreshes compete with integrations. Every use case creates another extraction path, another watermark, and another place to explain why yesterday's numbers do not match today's source.

Microsoft now documents Business Central data mirroring to Microsoft Fabric as a production-ready preview planned for October 2026. The feature connects Business Central online to an open mirrored database, then sends an initial snapshot and ongoing changes into OneLake as Delta Parquet. Fabric IQ, Power BI, Data Factory, and other Fabric workloads can use the synchronized data without repeatedly reading Business Central APIs.

This is prerelease functionality, so timing and behavior can still change. The architecture opportunity is already clear: create one governed replication path, then make analytics teams consume a shared OneLake copy.

## The value is consolidation, not another copy

Mirroring should reduce extraction sprawl.

The weak implementation is to enable hundreds of tables, keep every existing API feed, and call the result modernization. That gives the team another data copy without removing any operational burden.

The stronger model has three layers:

1. **Business Central owns transactions and change tracking.**
2. **Open mirroring owns replication into OneLake.**
3. **Fabric workloads own analytical transformations, models, and products.**

The boundary matters. Mirrored tables are analytical replicas, not a write-back surface. The open mirrored database also gets a SQL analytics endpoint for queries, views, inline table-valued functions, and stored procedures over the Delta tables.

<figure class="review-visual"><img src="/data-ninja-ai-lab/assets/blog/business-central-fabric-mirroring/01-shared-data-path.svg" alt="Business Central sends selected companies and tables through open mirroring into OneLake for shared Fabric analytics consumers"></figure>

## Start with a business-domain contract

The preview supports multiple Business Central companies and up to 1,000 selected tables. Microsoft also provides the MS-STD configuration package with 256 standard tables for analytics scenarios.

Those numbers are capabilities, not design targets.

Selecting a large package is convenient, but the production decision should start with the business domain. A finance product may need general ledger entries, dimensions, customers, vendors, currencies, and a small set of reference tables. An inventory product needs a different contract.

For each mirrored domain, record:

| Contract field | Decision |
|---|---|
| Companies | Included legal entities and the reason for each |
| Tables | Required tables, expected volume, and data owner |
| Grain | Business key and row meaning for every table |
| Freshness | Required interval and tolerated delay |
| Sensitive data | Fields requiring restricted downstream access |
| Consumers | Semantic models, pipelines, notebooks, agents, or exports |
| Acceptance | Counts, balances, watermarks, and known business totals |

This contract prevents a familiar failure: the integration is technically green while the analytical product is incomplete. A successful run does not prove that the selected companies, tables, and business keys answer the intended question.

## Make identity and secrets explicit

The current preview setup requires a dedicated Microsoft Entra app registration. Business Central stores the client secret in encrypted isolated storage and uses the service principal to reach the Fabric workspace. The setup flow adds that principal to the workspace as a Contributor.

That creates an operational contract the team must own:

- use a dedicated app registration for this integration
- record the client ID, service-principal object ID, workspace, and mirrored database
- keep the secret out of screenshots, tickets, and exported configuration
- assign a rotation owner and expiry alert
- test the Fabric connection after rotation
- review whether Contributor access remains appropriate as the preview evolves

Business Central requires data encryption to store the secret. It also provides separate Admin, Activate, and Read permission sets. Use those roles to separate configuration, operational control, and monitoring.

## Build observability from the supplied evidence

The integration exposes more evidence than a succeeded or failed flag.

Business Central records synchronization overview and table-level detail. The details include the company, source table, destination entity, initial or incremental run type, inserted, updated, and deleted row counts, start and end watermarks, state, and error.

The same operational data is available through APIs and in the Fabric logging namespace, which defaults to `BusinessCentral_log`.

That is enough to build a useful control page with four signals:

1. **Freshness:** time since the last completed run by company and table.
2. **Completeness:** expected tables seen, including tables with no changes.
3. **Movement:** inserted, updated, and deleted records compared with normal ranges.
4. **Failure:** consecutive errors, stopped synchronization, and unresolved table failures.

The configuration can stop synchronization after one to five consecutive failed runs. The default is two. Treat that threshold as an incident policy. Someone needs to own the alert, root cause, restart, and validation.

<figure class="review-visual"><img src="/data-ninja-ai-lab/assets/blog/business-central-fabric-mirroring/02-operational-contract.svg" alt="An operational contract combines scope, identity, freshness, row movement, failure handling, and business validation"></figure>

## Validate business truth after technical delivery

The first snapshot and every important configuration change need two acceptance layers.

**Technical acceptance** proves that the selected tables arrived, watermarks advanced, row counts are plausible, and no table-level errors remain.

**Business acceptance** proves that the analytical copy reconciles to Business Central for known totals and cases.

Use a compact test pack:

- one company with a known posting period
- one cross-company comparison
- one table with inserts, updates, and deletes
- one table expected to have no changes
- one configuration-package update
- one temporary connection failure
- one secret rotation
- one stop and restart
- one known finance or inventory total
- one freshness breach and recovery

Write the expected result before each test. For reconciliation, compare totals at a defined timestamp and grain. "The row counts are close" is not an acceptance criterion for financial reporting.

## Treat reset as a controlled recovery action

Business Central exposes Start, Stop, and Reset actions. Reset is materially different from a pause. It cancels active work, removes the tenant's mirroring resources, resets watermarks, and deletes synchronization summary and detail records.

That action needs a runbook and restricted authority.

Before a reset, capture the latest run IDs, watermarks, selected companies and tables, configuration package versions, destination details, and unresolved errors. Afterward, prove the new initial load is complete before downstream products resume.

The documented flow also does not allow changing the Fabric workspace or open mirrored database while export is enabled. Moving the destination is a migration event, not a casual configuration edit.

<figure class="review-visual"><img src="/data-ninja-ai-lab/assets/blog/business-central-fabric-mirroring/03-acceptance-path.svg" alt="A five-gate path validates scope, connection, synchronization evidence, business reconciliation, and downstream release"></figure>

## A practical pilot plan

Start with one business domain and one or two representative companies.

1. Define the analytical product and its business owner.
2. Select only the required companies and tables.
3. Create the dedicated Entra application and rotation plan.
4. Prepare the open mirrored database and logging namespace.
5. Run the initial snapshot and capture table-level evidence.
6. Reconcile known totals with Business Central.
7. Test incremental inserts, updates, and deletes.
8. Build freshness and failure monitoring from logs or APIs.
9. Move one downstream report or model to the mirrored data.
10. Retire its old extraction path after a defined parallel run.

The last step is where the business value appears. Mirroring is most useful when it replaces repeated source extraction, not when it sits beside it indefinitely.

## The practical takeaway

Business Central mirroring gives Microsoft data teams a credible route from operational ERP data to shared OneLake analytics without designing another custom ingestion stack.

The feature handles replication. The team still owns scope, identity, monitoring, reconciliation, recovery, and consumer design.

Get those contracts right, and one controlled data path can serve Power BI, engineering, and AI workloads without every team pulling the same Business Central data again.

## Sources

- [Fabric Updates Blog](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blogs/bg-p/fbc_fabricupdatesblogs)
- [Power BI Updates Blog](https://community.fabric.microsoft.com/t5/Power-BI-Updates-Blog/bg-p/fbc_pbiupdatesblog)
- [Data mirroring to Microsoft Fabric from Business Central](https://learn.microsoft.com/en-us/dynamics365/business-central/admin-fabric)
- [Set up Business Central data mirroring to Microsoft Fabric](https://learn.microsoft.com/en-us/dynamics365/business-central/admin-set-up-fabric-mirroring)
- [Manage Business Central synchronization with Microsoft Fabric](https://learn.microsoft.com/en-us/dynamics365/business-central/admin-manage-fabric-export)
- [Monitor and troubleshoot Microsoft Fabric synchronization](https://learn.microsoft.com/en-us/dynamics365/business-central/admin-monitor-fabric-export)
- [Open mirroring in Microsoft Fabric](https://learn.microsoft.com/en-us/fabric/mirroring/open-mirroring)

---

Written by **[Shai Karmani](https://www.linkedin.com/in/shai-kr)**.

If you work on Microsoft Fabric, Power BI, data engineering, or practical AI systems, feel free to [connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr).
