---
layout: post
title: "Dataflow Gen2 Can Now Show You Exactly When the Data Changed"
description: "A practical evidence and recovery model for Dataflow Gen2 query-result backups in a Fabric Lakehouse."
date: 2026-10-10
author: Shai Karmani
author_url: https://www.linkedin.com/in/shai-kr
sitemap: false
---

**Review draft. Direct link only. Not listed on the blog.**

A successful refresh tells you that a dataflow finished.

It does not tell you when a value changed, which refresh introduced an unexpected result, or what the query returned before the problem appeared.

Microsoft has added a Backup action for Dataflow Gen2 in preview. It can preserve selected query results in a Fabric Lakehouse after each refresh. Each backup carries the refresh request ID and refresh timestamp, giving teams a practical way to compare outputs across runs without building another pipeline only to keep copies.

That sounds like a small feature. Used properly, it creates a useful evidence layer between Power Query logic and the tables, reports, or processes that consume the result.

The value is not simply having more copies. The value is being able to answer a production question with data instead of memory.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/dataflow-gen2-backup-history/01-evidence-loop-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/dataflow-gen2-backup-history/01-evidence-loop.svg' | relative_url }}" alt="Dataflow Gen2 evidence loop from source and transformation through refresh backup, comparison, and operational decision.">
</picture>

## What the Backup action changes

Dataflow Gen2 normally presents the latest query result. That is enough when every refresh is correct and every source behaves as expected.

Production data is less polite.

A source can resend old records. A transformation can convert a blank into zero. A join can multiply rows after a key stops being unique. A late-arriving correction can change a prior period. The refresh can still finish successfully.

With query-result backups enabled, a selected query can preserve its output in a Lakehouse after each refresh. Microsoft says the retained history includes the refresh request ID and timestamp. That creates a direct link between the data snapshot and the run that produced it.

This is useful for:

- comparing an unexpected result with a known earlier run;
- locating the first refresh where a value changed;
- proving whether a source change or transformation change affected the output;
- retaining recurring query outputs without operating a separate copy pipeline;
- combining dataflow history with other operational evidence in the Lakehouse.

This is not a replacement for source-system recovery, Lakehouse versioning, or a full disaster-recovery plan. It is query-output evidence. That distinction matters.

## Back up the control points, not every query

Turning on history for every intermediate query would create storage growth without improving diagnosis.

Choose the queries that form useful control points in the flow:

1. **Source boundary:** the shaped result after source-specific cleanup, before business rules.
2. **Business-rule boundary:** the result after joins, mappings, filters, and calculations that materially change meaning.
3. **Published boundary:** the final query delivered to a destination or downstream consumer.

For a small flow, the final query may be enough. For a high-value finance or operational flow, retaining both the source boundary and published boundary makes it easier to separate source drift from transformation defects.

I would rank candidates using four questions:

- Would a wrong result create a material reporting or operational issue?
- Is the original source state difficult to reconstruct later?
- Does the query contain transformations where row count, grain, or meaning can change?
- Can the team define a retention period and owner for the history?

If the answer is no across all four, the query probably does not need backup history.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/dataflow-gen2-backup-history/02-control-points-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/dataflow-gen2-backup-history/02-control-points.svg' | relative_url }}" alt="Three recommended Dataflow Gen2 backup control points: source boundary, business-rule boundary, and published boundary.">
</picture>

## Define the evidence contract before the first incident

A folder of historical outputs is not automatically an operating model.

For each backed-up query, record:

- dataflow and query owner;
- business purpose and downstream consumers;
- expected grain and business key;
- refresh request ID and timestamp;
- expected row-count range;
- required columns and data types;
- critical totals or known-answer measures;
- retention period;
- access classification;
- incident and recovery owner.

The request ID and timestamp provide lineage to a specific refresh. The business checks explain whether the output was acceptable.

A simple evidence table can hold one record per refresh:

| Field | Example purpose |
| --- | --- |
| Refresh request ID | Join the snapshot to the exact Dataflow Gen2 run |
| Snapshot timestamp | Order and compare refresh outputs |
| Row count | Detect missing, duplicated, or unexpectedly expanded data |
| Distinct business keys | Detect grain violations |
| Critical total | Validate a known business invariant |
| Schema hash | Identify structural change |
| Acceptance state | Mark the run as accepted, rejected, or under review |
| Owner and note | Preserve the operational decision |

The backup gives you the historical result. The evidence table gives the result operational meaning.

## Compare in layers

When a number changes, do not begin with a cell-by-cell comparison across the entire dataset.

Use a layered comparison:

### 1. Structure

Check columns, data types, nullability expectations, and schema hash. Structural change often explains downstream failures quickly.

### 2. Volume and grain

Compare row count, distinct business keys, duplicate keys, and counts by partition or business date. This catches missing batches and join multiplication.

### 3. Business invariants

Compare totals, balances, accepted status values, date ranges, and other rules that should remain within a known boundary.

### 4. Changed records

Only then isolate inserted, removed, and changed business keys. This keeps the investigation focused.

### 5. Downstream effect

Confirm which destination tables, semantic models, reports, or business processes consumed the affected refresh.

This order turns a large data diff into a manageable diagnostic path.

## Add retention and access controls

Historical query outputs can contain the same sensitive data as the current result, sometimes more.

Treat the backup Lakehouse as production data:

- apply workspace and OneLake access controls;
- keep the destination separate from casual exploration when appropriate;
- document who can read history and who can delete it;
- define retention by business, legal, and diagnostic need;
- monitor storage growth by query and refresh frequency;
- remove or mask fields that are not required for comparison;
- test how backup failure appears in monitoring.

Retention should be long enough to cover the detection window. If a monthly reporting issue is usually discovered six weeks later, retaining only seven days creates an impressive feature that cannot answer the real question.

Estimate storage before rollout:

`average query result size × refreshes per day × retention days`

Then add expected growth and a safety margin. Use the estimate to decide where history is valuable, not as a reason to enable nothing.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/dataflow-gen2-backup-history/03-acceptance-card-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/dataflow-gen2-backup-history/03-acceptance-card.svg' | relative_url }}" alt="Acceptance card for Dataflow Gen2 query-result backup covering capture, integrity, comparison, security, retention, and recovery.">
</picture>

## Test the full path

A practical pilot needs more than one successful refresh.

I would run these acceptance tests:

1. **Normal refresh:** Confirm one backup appears with the correct request ID and timestamp.
2. **Known data change:** Change a controlled test record and prove the comparison identifies the right key and value.
3. **Schema change:** Add or rename a test column and verify that the structural check reports it clearly.
4. **Duplicate-key defect:** Introduce a controlled join problem and confirm the grain check catches it.
5. **Backup destination failure:** Remove access in a test environment and verify the failure is visible and owned.
6. **Retention action:** Delete or archive an expired test snapshot using the documented process.
7. **Restore or replay decision:** Prove the team knows whether to reload an earlier result, correct the source, fix the transformation, or rerun the dataflow.

The final test is important. A historical snapshot provides evidence, but the correct recovery action depends on where the defect started and what downstream systems already consumed.

## A practical first rollout

Start with one high-value Dataflow Gen2 query that refreshes daily and has a clear business key.

Enable backup to a controlled Lakehouse. Capture the refresh ID, timestamp, row count, distinct-key count, one critical total, and acceptance state. Retain enough runs to cover the normal detection window.

Then introduce one controlled change and prove that the team can answer five questions:

1. Which refresh introduced the change?
2. Which business keys changed?
3. Was the source or transformation responsible?
4. Which downstream assets consumed the result?
5. What is the approved recovery action?

If those answers are available in minutes, the backup history is doing real operational work.

## My recommendation

Use Dataflow Gen2 query-result backups as a selective evidence layer.

Protect the source, business-rule, and published boundaries that matter. Link every snapshot to refresh metadata. Add grain and business checks. Control access and retention. Test the comparison and recovery process before an incident.

The strongest outcome is not a Lakehouse full of historical tables.

It is a team that can identify exactly when the data changed, measure the effect, and choose the right recovery path.

## Sources

- [Fabric September 2026 Feature Summary](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blog/Fabric-September-2026-Feature-Summary/ba-p/5325825)
- [Dataflow Gen2 overview](https://learn.microsoft.com/en-us/fabric/data-factory/dataflows-gen2-overview)
- [View Dataflow Gen2 refresh history and monitoring](https://learn.microsoft.com/en-us/fabric/data-factory/dataflows-gen2-monitor)
- [Fabric Updates Blog](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blogs/bg-p/fbc_fabricupdatesblogs)
- [Power BI Updates Blog](https://community.fabric.microsoft.com/t5/Power-BI-Updates-Blog/bg-p/fbc_pbiupdatesblog)

---

**Shai Karmani**<br>
Data, Microsoft Fabric, Power BI, Analytics Engineering, and AI<br>
[Connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr)
