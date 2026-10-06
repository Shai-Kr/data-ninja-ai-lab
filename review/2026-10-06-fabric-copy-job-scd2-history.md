---
layout: post
title: "Fabric Copy Job Can Build SCD Type 2 History for You"
description: "A practical design and acceptance guide for using SCD Type 2 and audit columns in Microsoft Fabric Copy Job."
date: 2026-10-06
author: Shai Karmani
author_url: https://www.linkedin.com/in/shai-kr
sitemap: false
---

**Review draft. Direct link only. Not listed on the blog.**

Microsoft Fabric Copy Job can now preserve Slowly Changing Dimension Type 2 history as a built-in write method for supported change data capture scenarios.

That removes a familiar piece of ingestion plumbing. Instead of writing custom logic to close the current row, insert a new version, and handle a deleted source record, teams can configure Copy Job to manage the history columns and row versions at the destination.

The release is more useful when paired with another generally available feature: **audit columns in Copy Job**. SCD Type 2 explains how the business record changed. Audit columns add operational context about the movement that wrote it.

Together, they can turn a basic replication job into a much better historical data product.

The part I would not skip is the contract around it. Built-in history is still only trustworthy when business keys, late changes, deletion behavior, audit metadata, and downstream expectations are tested explicitly.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/fabric-copy-job-scd2-history/01-history-pipeline-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/fabric-copy-job-scd2-history/01-history-pipeline.svg' | relative_url }}" alt="Fabric Copy Job pipeline from change data capture through SCD Type 2 history and audit metadata to current and historical analytics.">
</picture>

## What the built-in write method manages

When SCD Type 2 is selected for a supported CDC scenario, Copy Job preserves a changed record by adding a new destination version instead of replacing the previous one.

Microsoft documents three managed destination columns:

- `Valid_From` records when a version becomes effective;
- `Valid_To` records when that version stops being effective;
- `Is_Current` identifies the active version.

Copy Job also applies history tracking and soft-delete handling across the selected tables. That matters because delete handling is often where home-grown SCD logic becomes inconsistent. One pipeline expires a record, another removes it, and a third leaves the last version marked as current.

The built-in capability creates a consistent mechanism. The data team still has to define what the result means to the business.

There is one documentation detail to verify before rollout. The September 2026 feature summary announces SCD Type 2 in Copy Job as generally available, while the current CDC documentation still contains a preview label and an Oracle limitation in its support section. Check the current connector matrix and behavior in your tenant rather than treating the release-state label as the acceptance test.

For example, a deleted customer record might mean the customer closed an account, was merged into another customer, or disappeared because the source application changed its extraction scope. Those are different business events even if the ingestion layer sees the same CDC delete operation.

## A concrete row-version example

Assume the source customer changes region from East to West on October 6.

A correct Type 2 result should retain both versions:

```text
CustomerKey  Region  Valid_From          Valid_To            Is_Current
C-1042       East    2026-01-15 09:00    2026-10-06 14:21    false
C-1042       West    2026-10-06 14:21    open                 true
```

This looks simple. Production behavior gets harder when several things happen together:

- two updates arrive for the same key in one processing window;
- an older change arrives after a newer one;
- a source record is deleted and later recreated;
- a business key changes;
- an initial load overlaps with the start of CDC processing.

The acceptance test should include those conditions. Testing one clean update proves the happy path, not the historical model.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/fabric-copy-job-scd2-history/02-row-timeline-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/fabric-copy-job-scd2-history/02-row-timeline.svg' | relative_url }}" alt="SCD Type 2 row timeline showing an East version closed and a West version opened while one current row is retained.">
</picture>

## Use audit columns for operational evidence

Audit columns serve a different purpose from the managed SCD columns.

The SCD columns answer questions about the effective business version. Audit metadata helps answer questions about the ingestion operation that wrote the row.

Microsoft says Copy Job can add multiple audit columns without custom expressions and apply them consistently across tables in the job. The exact audit set should match how the platform is operated, but the design should make these questions answerable:

- Which Copy Job run wrote this row?
- When did Fabric process it?
- Which source path or object produced it?
- Was it part of the initial load or an incremental change?
- Which release or configuration version was active?

Do not overload `Valid_From` as the answer to all of those questions. Business effective time, source commit time, ingestion time, and processing time can be different.

Keeping them separate makes late-arriving data and incident analysis much easier to explain.

## Define the contract before enabling history

I would document six decisions before turning SCD Type 2 on for a production table.

### 1. Stable business key

Name the field or field combination that identifies one business entity across time. Validate nulls, duplicates, reuse, and changes to that key.

### 2. Tracked attributes

List which source changes should create a new version. A corrected spelling might not deserve a historical row. A customer segment or product category change probably does.

### 3. Time meaning

State whether the model represents source effective time, source transaction time, or Copy Job processing time. If the source provides a reliable effective timestamp, preserve it as separate metadata even when the managed SCD columns use the platform write timeline.

### 4. Delete meaning

Define what a source delete represents, how the current version should close, and whether downstream models need a separate business-status field.

### 5. Late and replayed changes

Define what happens when CDC events arrive late, are retried, or are replayed after recovery. The expected result should be idempotent and should never leave two current rows for the same key.

### 6. Downstream consumption

Specify which consumers need the current view, which need point-in-time history, and which joins must use a date range instead of only `Is_Current = true`.

## Build an acceptance pack

A practical test pack should use a small controlled source table and known expected results.

I would include at least these cases:

| Test | Source action | Expected proof |
|---|---|---|
| Initial load | Insert one entity | One current row, open validity interval |
| Attribute change | Update one tracked field | Previous row closed, new row current |
| No-op update | Rewrite the same values | No unnecessary history version |
| Second change | Update the entity again | Three non-overlapping versions |
| Delete | Delete the source record | Current version handled according to the documented rule |
| Recreate | Insert the key again | Result matches the agreed identity and delete contract |
| Retry | Replay the same processing window | No duplicate version and one current row |
| Late event | Deliver an older event after a newer one | Documented ordering behavior and visible evidence |

Then add invariant queries. These are more valuable than a visual spot check.

```sql
-- No business key should have more than one current row
SELECT CustomerKey, COUNT(*) AS CurrentRows
FROM dbo.DimCustomer
WHERE Is_Current = 1
GROUP BY CustomerKey
HAVING COUNT(*) > 1;
```

```sql
-- No version should end before it starts
SELECT *
FROM dbo.DimCustomer
WHERE Valid_To < Valid_From;
```

Microsoft documents `NULL` for the active row's `Valid_To` value. Confirm the created destination schema and data types in your environment before downstream code depends on them.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/fabric-copy-job-scd2-history/03-acceptance-gates-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/fabric-copy-job-scd2-history/03-acceptance-gates.svg' | relative_url }}" alt="Six production acceptance gates for Fabric Copy Job SCD Type 2 covering keys, versions, time, deletes, audit evidence, and downstream validation.">
</picture>

## Keep current and historical access intentional

Most reporting workloads do not need to scan every historical version for every query.

Create a clear current-state access pattern for common reporting, and expose history where point-in-time analysis needs it. A current-state view can make the default explicit:

```sql
CREATE VIEW dbo.vw_DimCustomer_Current AS
SELECT *
FROM dbo.DimCustomer
WHERE Is_Current = 1;
```

Historical fact joins need more care. If a sales event should use the customer region that was effective when the sale occurred, join the event timestamp to the dimension validity interval. Joining every fact to the latest customer row rewrites history in the report even when the dimension table preserved it correctly.

This is why SCD Type 2 is not only an ingestion option. It changes the semantic contract between the source, the dimension, the fact model, and the report.

## My recommended rollout

Start with one dimension that has a stable key, meaningful history, and manageable volume.

1. Capture the current custom logic and expected row counts.
2. Configure a non-production Copy Job with SCD Type 2.
3. Add only the audit columns the operations team will actually use.
4. Run the controlled acceptance pack.
5. Compare current-state and point-in-time query results with the existing process.
6. Test a retry and a recovery scenario.
7. Publish the contract for semantic model and report developers.
8. Promote only when invariants, audit evidence, and downstream queries pass.

The opportunity here is real. Fabric can now manage a piece of historical ingestion logic that many teams have rebuilt for years.

The win is not fewer lines of pipeline code by itself. The win is a repeatable history pattern with explicit tests, operational evidence, and a downstream model that uses time correctly.

## Sources

- [Fabric September 2026 Feature Summary](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blog/Fabric-September-2026-Feature-Summary/ba-p/5325825)
- [Change data capture in Copy Job](https://learn.microsoft.com/en-us/fabric/data-factory/cdc-copy-job)
- [Audit columns in Copy Job](https://learn.microsoft.com/en-us/fabric/data-factory/audit-columns-copy-job)
- [Fabric Updates Blog](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blogs/bg-p/fbc_fabricupdatesblogs)
- [Power BI Updates Blog](https://community.fabric.microsoft.com/t5/Power-BI-Updates-Blog/bg-p/fbc_pbiupdatesblog)

---

**Shai Karmani**<br>
Data, Microsoft Fabric, Power BI, Analytics Engineering, and AI<br>
[Connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr)
