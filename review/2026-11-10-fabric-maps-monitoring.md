---
layout: post
title: "Give Every Fabric Maps Tileset Build an Evidence Trail"
date: 2026-11-10
description: Fabric Maps now writes completed tileset operations to workspace monitoring. Here is a practical KQL pattern for reliability, duration, failure evidence, and job correlation.
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

Fabric Maps can now leave a usable operational trail for every completed tileset build.

The new workspace monitoring documentation introduces a `MapLogs` table. It records the final state of supported `BuildTileset` jobs, including duration, status, result code, and identifiers that connect the map operation to Fabric job events.

That sounds like a logging feature. The useful part is the operating model it enables.

Instead of waiting for someone to report a stale or missing map layer, a team can measure build reliability, find slow operations, investigate failures, and connect a map result to the job that triggered it.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/fabric-maps-monitoring/01-evidence-path-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/fabric-maps-monitoring/01-evidence-path.webp" alt="A four-stage flow shows a tileset build producing MapLogs evidence, job correlation, and an operational response"></picture></figure>

## What Fabric Maps records today

Fabric Maps currently writes one completion record for a supported `BuildTileset` job when it succeeds, fails, or is cancelled.

The record includes useful fields such as:

- `ItemId`, `WorkspaceId`, and `CapacityId`
- `OperationId` and `OperationName`
- `DurationMs`
- `Status`, `Level`, and `ResultCode`
- `ResultMessage` and `CorrelationId`, when available

There are two boundaries worth recording before anyone builds a dashboard around this data.

First, this is completion telemetry. It does not contain progress events, individual retry attempts, or per-tile detail.

Second, some friendly-name fields are not currently populated for `BuildTileset`. `ItemName`, `WorkspaceName`, and `Identity` can be empty. Use stable IDs as the operating keys and resolve names through a controlled inventory when people need readable labels.

Workspace monitoring also starts collecting only after it is enabled. It does not backfill earlier operations. The first acceptance test should therefore run a known tileset build after collection is turned on and confirm that `MapLogs` appears.

## Use the join that turns a log into an investigation

The most useful documented relationship is:

```text
MapLogs.OperationId == ItemJobEventLogs.JobInstanceId
```

`MapLogs` tells you how the map operation finished. `ItemJobEventLogs` adds job lifecycle context such as invoke type, job type, start time, end time, and job status.

That join separates two questions that are often mixed together:

1. What happened inside the Fabric Maps operation?
2. What job invoked it, and how did that job move through its lifecycle?

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/fabric-maps-monitoring/02-correlation-model-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/fabric-maps-monitoring/02-correlation-model.webp" alt="A comparison shows MapLogs operation evidence beside ItemJobEventLogs lifecycle evidence joined by operation and job instance identifiers"></picture></figure>

Here is a compact version of the correlation pattern:

```kusto
let StartTime = ago(24h);
let MapOperations =
    MapLogs
    | where Timestamp > StartTime
    | project ItemId, OperationId, MapStatus = Status,
              DurationMs, ResultCode, ResultMessage;
let JobEvents =
    ItemJobEventLogs
    | where Timestamp > StartTime
    | summarize arg_max(Timestamp, *) by JobInstanceId
    | project JobInstanceId, JobStatus, JobInvokeType,
              JobType, JobStartTime, JobEndTime;
MapOperations
| join kind=leftouter JobEvents
    on $left.OperationId == $right.JobInstanceId
| order by DurationMs desc
```

Use a left outer join. A map completion record should remain visible even when the lifecycle side is missing or delayed. Missing correlation is itself an operational signal.

## Start with three measures

I would not begin with a large monitoring dashboard. Start with three measures that lead to action.

### Reliability

Count completed operations by `Status` and calculate the failure and cancellation rates over a defined window.

Do not hide low volume behind a percentage. One failure in two builds is 50%, but the count matters as much as the rate.

### P95 duration

Average duration can look healthy while a small set of tileset builds becomes materially slower. Track P95 duration by `ItemId` and compare it with the previous period.

Use a minimum sample threshold before treating a percentile as meaningful.

### Unresolved failures

Count failures with a `ResultCode`, owner, and investigation status. The log gives you evidence. It does not assign ownership or close the issue.

A failed operation without an owner is still an unresolved failure, even when the dashboard is green again the next day.

## Build one response contract

Monitoring becomes useful when every signal has a response.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/fabric-maps-monitoring/03-response-contract-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/fabric-maps-monitoring/03-response-contract.webp" alt="Four operational response cards cover failure, cancellation, duration regression, and missing correlation"></picture></figure>

For each alert or dashboard state, record:

| Signal | First check | Evidence to retain | Owner |
|---|---|---|---|
| Failed build | `ResultCode` and `ResultMessage` | Operation ID, item ID, correlation ID, timestamps | Map item owner |
| Cancelled build | Job invoke type and lifecycle | Operation ID, job instance ID, initiating path | Workflow owner |
| Duration regression | P95 by item and time window | Slowest operations and capacity ID | Platform owner |
| Missing job correlation | Join key and collection timing | Operation ID plus query window | Monitoring owner |

Keep the evidence record small. A useful incident note needs the stable identifiers, time window, result, owner, and next action. Copying the full log row into a ticket usually adds noise without improving the investigation.

## A practical rollout sequence

Use a short rollout instead of trying to design the final dashboard first.

1. Enable workspace monitoring in the workspace that contains the Map item.
2. Run a known `BuildTileset` job after collection starts.
3. Confirm the completion record in `MapLogs`.
4. Join it to `ItemJobEventLogs` with `OperationId` and `JobInstanceId`.
5. Test one success, one controlled failure, and one cancellation if the environment allows it.
6. Capture a seven-day baseline for count, status, average duration, and P95 duration.
7. Assign owners before adding alerts.

This order proves the data path before anyone spends time polishing visualizations.

## The broader Fabric pattern

Fabric is steadily making item-level telemetry queryable through workspace monitoring. The important design choice is consistent: use the item table for service-specific evidence, then correlate it with shared Fabric job events.

For Fabric Maps, the practical model is now clear:

- `MapLogs` explains the completed tileset operation
- `ItemJobEventLogs` explains the invoking job lifecycle
- stable IDs connect the two
- KQL turns the evidence into reliability and duration signals
- an ownership contract turns those signals into operations

That is enough to move Fabric Maps from "someone says the layer looks old" to an investigation that starts with a specific operation, result code, duration, and job instance.

## Sources

- [Monitor Fabric Maps with workspace monitoring](https://learn.microsoft.com/fabric/real-time-intelligence/map/workspace-monitoring)
- [Workspace monitoring overview](https://learn.microsoft.com/fabric/fundamentals/workspace-monitoring-overview)
- [Item job event logs](https://learn.microsoft.com/fabric/fundamentals/item-job-event-logs)
- [Microsoft Fabric documentation change that added Fabric Maps monitoring](https://github.com/MicrosoftDocs/fabric-docs/commit/84899eb1402309cdba53d7b86d22f2ad6a300c9e)

---

**Shai Karmani**  
Data, Microsoft Fabric, Power BI, and practical AI  
[Connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr)
