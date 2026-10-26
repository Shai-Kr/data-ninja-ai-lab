---
layout: post
title: "The Fabric Warehouse Signal That Can Shorten Your Next Investigation"
date: 2026-10-26
description: Fabric Data Warehouse now sends completed query activity to workspace monitoring. This guide turns that telemetry into a practical detection, triage, and drill-down workflow.
author: Shai Karmani
author_url: https://www.linkedin.com/in/shai-kr
sitemap: false
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
  .article-header h1 { font-size: clamp(1.12rem, 5vw, 1.6rem); line-height: 1.17; }
  .article-header .dek { font-size: 0.94rem; margin-top: 14px; }
  .article-body { overflow-x: hidden; font-size: 0.98rem; }
  .article-body img { width: 100%; max-width: 100%; height: auto; border-radius: 16px; }
  .article-body pre { max-width: 100%; overflow-x: auto; font-size: 0.78rem; }
  .subscribe-orbit { display: none; }
}
.review-visual { width: 100%; max-width: 100%; margin: 34px 0 10px; overflow: hidden; }
.review-visual img { display: block; width: 100%; max-width: 100%; height: auto; }
</style>

**Review draft. Direct link only.**

Fabric Data Warehouse can now send completed query execution events into workspace monitoring.

The useful part is not another monitoring screen. It is a shared `WarehouseExecutions` table that lets operators compare warehouse activity across a workspace before opening the affected item.

That changes the first few minutes of an investigation. Instead of starting with a warehouse selected by guesswork, you can rank items by failure rate, duration percentile, or CPU time, identify the time window, then carry the exact operation identifier into Query Insights.

I would treat this as a two-level investigation model:

1. **Workspace monitoring for detection and triage.**
2. **Warehouse Monitor or Query Insights for query-level diagnosis.**

The distinction matters. Workspace monitoring gives breadth. Query Insights gives depth.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/fabric-warehouse-monitoring/01-investigation-flow-mobile.svg"><img src="/data-ninja-ai-lab/assets/blog/fabric-warehouse-monitoring/01-investigation-flow.svg" alt="A two-level Fabric Warehouse investigation moves from workspace monitoring to the affected item and then to Query Insights"></picture></figure>

## What the preview actually captures

When workspace monitoring is enabled, Fabric writes supported warehouse activity to the `WarehouseExecutions` table in the monitoring KQL database.

The current preview covers completed, user-initiated queries that use distributed execution from:

- Fabric Warehouses
- SQL analytics endpoints
- warehouse snapshots

Each qualifying query produces one event when it completes. Useful fields include:

| Field | Operational use |
|---|---|
| `ItemId` and `ItemKind` | Identify the affected Fabric item |
| `DurationMs` | Compare average, median, and tail latency |
| `Status` and `ResultCode` | Group failures and cancellations |
| `CpuTimeMs` | Attribute relative distributed-query activity |
| `Identity` | Investigate workload ownership and user patterns |
| `OperationId` | Find the same execution in Query Insights |

There are boundaries to respect. System-generated queries are excluded. Queries that run only in the SQL front end, including many metadata lookups, do not appear. `CpuTimeMs` is useful for relative workload comparison, but Microsoft explicitly says it is not a billing measure. Use the Fabric Capacity Metrics app for capacity utilization and billing analysis.

This means the table is a strong operational signal, not a complete accounting ledger.

## Start with percentiles, not a single average

Average duration can hide the exact pattern an operator needs to find. One warehouse might be consistently moderate. Another might be fast most of the day but produce a small set of extreme runs that break an SLA.

The Microsoft example compares query count, average duration, median duration, and the 95th percentile by item:

```kusto
WarehouseExecutions
| where Timestamp > ago(24h)
| summarize
    QueryCount = count(),
    AverageDurationMs = round(avg(DurationMs), 2),
    P50DurationMs = percentile(DurationMs, 50),
    P95DurationMs = percentile(DurationMs, 95)
  by ItemId, ItemKind
| order by P95DurationMs desc
```

That is a better starting point than sorting by average alone.

I would save three baseline queries in a shared KQL query set:

1. **Performance:** count, P50, P95, and average duration by item.
2. **Reliability:** failed query count and failure rate by item and result code.
3. **Workload:** query count, total CPU time, and average CPU time by item and identity.

Those three views answer different questions. A performance regression, a reliability incident, and a workload concentration problem should not be collapsed into one red or green score.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/fabric-warehouse-monitoring/02-signal-matrix-mobile.svg"><img src="/data-ninja-ai-lab/assets/blog/fabric-warehouse-monitoring/02-signal-matrix.svg" alt="A signal matrix separates Fabric Warehouse performance, reliability, and workload indicators"></picture></figure>

## Use OperationId as the handoff contract

The strongest part of the integration is the shared identifier between monitoring layers.

`WarehouseExecutions.OperationId` matches `queryinsights.exec_requests_history.distributed_statement_id`.

That gives the investigation a clean handoff:

1. Find the affected `ItemId`, time window, and `OperationId` in KQL.
2. Open the corresponding Warehouse or SQL analytics endpoint.
3. Query the Query Insights history by the same identifier.
4. Review query text, status, login, duration, CPU time, scan metrics, and SQL pool details.

```sql
SELECT *
FROM queryinsights.exec_requests_history
WHERE distributed_statement_id =
  'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
```

This prevents a common monitoring failure: the workspace view detects a symptom, but the next tool cannot locate the same execution without a manual timestamp search.

Query Insights can take up to 15 minutes to show a completed execution, so the runbook should account for that delay. Record the identifier first. Do not assume an empty immediate lookup means the event was lost.

## Turn telemetry into a small operating model

Enabling collection is only the first step. I would define five things before treating the signal as production-ready.

### 1. Scope

List the Warehouses, SQL analytics endpoints, and snapshots expected to emit activity. Record known exclusions, especially front-end-only and system activity.

### 2. Baseline

Measure normal P50, P95, failure rate, query volume, and CPU concentration over a representative period. A threshold without a baseline is only a guess.

### 3. Ownership

Map each `ItemId` to a business workload and technical owner. The current event schema does not provide a supported `ItemName` for Data Warehouse events, so keep an explicit item lookup rather than depending on names in the telemetry.

### 4. Investigation path

Define when an operator stays in KQL, when they open Data Warehouse Monitor, and when they use Query Insights. Save the shared `OperationId` with the incident record.

### 5. Evidence

Preserve the KQL result, affected item, operation identifier, detailed diagnosis, action taken, and comparison window after the change. That turns a chart into an auditable investigation.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/fabric-warehouse-monitoring/03-operating-model-mobile.svg"><img src="/data-ninja-ai-lab/assets/blog/fabric-warehouse-monitoring/03-operating-model.svg" alt="A five-part operating model covers scope, baseline, ownership, investigation, and evidence for Fabric Warehouse monitoring"></picture></figure>

## Configuration decisions belong in the design

Workspace monitoring does not collect historical activity from before it was enabled. Collection begins after configuration and activation.

The monitoring item can send telemetry to an Eventhouse in the current workspace or to an existing monitoring item in another workspace in the same Azure region. The destination cannot be changed after configuration.

That makes destination selection an architecture decision, not a setup detail.

A local destination keeps ownership simple. A shared monitoring destination can support a broader operations model across several workspaces. In either case, decide retention and cache policy deliberately. The monitoring database keeps data for 30 days by default, and the cache period cannot exceed retention.

Before enabling it, confirm:

- the workspace runs on Power BI Premium or Fabric capacity
- the tenant settings allow workspace admins to enable monitoring and create Fabric items
- the person configuring it has the Admin workspace role
- monitoring users have at least the Contributor workspace role to query the database
- the destination and retention period match the investigation requirement

## A practical release checklist

Before calling Warehouse workspace monitoring operational:

1. Enable monitoring in a non-critical workspace first.
2. Run known successful, failed, canceled, slow, and CPU-heavy distributed queries.
3. Confirm qualifying executions appear once in `WarehouseExecutions`.
4. Verify known exclusions do not create false expectations.
5. Compare P50 and P95 rather than relying on average duration.
6. Validate failure-rate grouping by `ItemId` and `ResultCode`.
7. Confirm `OperationId` finds the same execution in Query Insights.
8. Document the expected Query Insights ingestion delay.
9. Add item-to-owner and item-to-business-service mappings.
10. Save the KQL queries and incident evidence template.

## The practical takeaway

The new integration gives Fabric Warehouse teams a useful middle layer between capacity-wide signals and item-level query diagnosis.

Use `WarehouseExecutions` to identify which item deserves attention, what kind of issue occurred, and which exact operation to investigate. Then use Data Warehouse Monitor or Query Insights for the detailed query evidence.

That is the real benefit: less time deciding where to look, and a cleaner path from workspace symptom to query-level cause.

## Sources

- [Fabric Updates Blog](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blogs/bg-p/fbc_fabricupdatesblogs)
- [Power BI Updates Blog](https://community.fabric.microsoft.com/t5/Power-BI-Updates-Blog/bg-p/fbc_pbiupdatesblog)
- [Announcing workspace monitoring integration for Fabric Data Warehouse](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blog/Announcing-workspace-monitoring-integration-for-Fabric-Data/ba-p/5376599)
- [Monitor warehouse activity with workspace monitoring](https://learn.microsoft.com/en-us/fabric/data-warehouse/warehouse-workspace-monitoring)
- [Configure workspace monitoring](https://learn.microsoft.com/en-us/fabric/fundamentals/enable-workspace-monitoring)
- [Query Insights in Fabric Data Warehouse](https://learn.microsoft.com/en-us/fabric/data-warehouse/query-insights)

---

Written by **[Shai Karmani](https://www.linkedin.com/in/shai-kr)**.

If you work on Microsoft Fabric, Power BI, data engineering, or practical AI systems, feel free to [connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr).
