---
layout: default
title: "One SQL Statement Can Now Start Your Fabric Medallion Pipeline"
date: 2026-10-16
description: File-ingesting materialized lake views bring CSV and Parquet files into a declarative Fabric pipeline with schema control, lineage, data quality, and managed refresh.
author: Shai Karmani
author_url: https://www.linkedin.com/in/shai-kr
sitemap: false
---

<style>
@media (max-width: 760px) {
  .site-header { gap: 12px; margin-bottom: 22px; }
  .brand { font-size: 0.95rem; }
  .nav { gap: 10px; font-size: 0.86rem; }
  .article-header { padding: 24px 18px; }
  .article-header h1 { font-size: clamp(1.55rem, 7.2vw, 1.95rem); line-height: 1.16; letter-spacing: -0.035em; overflow-wrap: anywhere; }
  .article-header .dek { font-size: 0.98rem; line-height: 1.58; }
  .article-body { overflow-x: hidden; }
  .article-body img { width: 100%; max-width: 100%; }
  .subscribe-orbit { display: none; }
}
</style>

<article class="article" markdown="1">
  <header class="article-header">
    <p class="eyebrow">Data Ninja AI Lab</p>
    <h1>One SQL Statement Can Now Start Your Fabric Medallion Pipeline</h1>
    <p class="byline"><img class="avatar avatar-small" src="{{ '/assets/img/shai-karmani-profile.png' | relative_url }}" alt="Shai Karmani"> by <a href="https://www.linkedin.com/in/shai-kr">Shai Karmani</a> · Oct 16, 2026</p>
    <p class="dek">Fabric materialized lake views can now ingest CSV and Parquet files directly from OneLake. The useful part is bigger than shorter SQL: bronze can join the same declarative lineage, quality, refresh, and monitoring model as silver and gold.</p>
  </header>

  <div class="article-body" markdown="1">
![A declarative file-to-gold pipeline with materialized lake views]({{ '/assets/blog/materialized-lake-views-file-ingestion/01-file-to-gold.svg' | relative_url }})

The first mile of a medallion architecture is usually the awkward one.

The data lands as files. Then somebody has to build a notebook, pipeline, copy activity, or shortcut transformation before the declarative part of the platform can begin. That first step gets its own schedule, retry logic, monitoring, deployment path, and ownership question.

Microsoft Fabric now has a more direct option in preview.

A materialized lake view can ingest CSV or Parquet files straight from a physical OneLake folder, a OneLake folder shortcut, or a single-file path. The definition uses `USING OneLake_Files`, and Fabric materializes the result as a managed Delta table.

That means bronze no longer has to sit outside the materialized lake view dependency graph. A file-ingesting bronze view can feed silver and gold views, while Fabric derives the order and runs the chain through built-in lineage and scheduled refresh.

The feature is useful because it removes plumbing. The bigger opportunity is to make the ingestion contract explicit.

## What the new path looks like

The smallest useful definition is compact:

```sql
CREATE MATERIALIZED LAKE VIEW bronze.raw_orders
USING OneLake_Files
OPTIONS (
  'format' = 'csv',
  'path' = 'abfss://SalesWorkspace@onelake.dfs.fabric.microsoft.com/SalesLake.Lakehouse/Files/orders/',
  'header' = 'true'
)
TBLPROPERTIES (
  'schema_mode' = 'DYNAMIC',
  'refresh_mode' = 'APPEND_ONLY'
);
```

The statement binds the source path, file format, schema behavior, and refresh behavior to one managed object.

You can also add a FROM-less `AS SELECT` to choose columns, cast values, filter rows, calculate new fields, aggregate data, or capture malformed records during ingestion. Data quality constraints can run against that projected output.

The important implementation detail is that `USING OneLake_Files` already binds the source. The optional `AS SELECT` does not use a `FROM` clause.

Once the bronze view exists, downstream materialized lake views can reference it normally:

```sql
CREATE MATERIALIZED LAKE VIEW silver.orders
(
  CONSTRAINT valid_amount CHECK (amount > 0) ON MISMATCH DROP
)
AS SELECT
  id,
  customer,
  CAST(amount AS DECIMAL(18,2)) AS amount,
  __filepath__
FROM bronze.raw_orders;
```

Fabric records the dependency and can refresh bronze, silver, and gold in order. That is the real simplification. The pipeline definition and the dependency model stop living in different places.

## Pick schema behavior deliberately

File ingestion supports two schema modes. They serve different operating models.

`DYNAMIC` is the default. Newly discovered columns are added, and established columns that are absent from a file receive `NULL`. This can be practical for a landing zone where additive drift is expected and downstream consumers are designed for it.

`FIXED` pins the schema at creation and rejects later drift. That is a better fit when the bronze table is already a contract for downstream reporting, finance logic, regulatory evidence, or a shared semantic model.

Neither mode is universally correct.

The decision should come from the cost of accepting drift versus rejecting it. A new nullable telemetry attribute may be safe to absorb. A renamed revenue field should probably stop the refresh and force a review.

![A decision model for Dynamic and Fixed schema modes]({{ '/assets/blog/materialized-lake-views-file-ingestion/02-schema-refresh-decisions.svg' | relative_url }})

I would document four things before choosing a mode:

1. Which source changes are expected?
2. Which changes can downstream models tolerate?
3. Who investigates a rejected refresh?
4. What evidence proves the corrected run is complete?

The schema setting is one line of SQL. The operating contract behind it is the real design work.

## Refresh mode describes the source lifecycle

Folder-based ingestion supports three refresh modes:

- `APPEND_ONLY` adds rows from newly discovered files.
- `FULL` reprocesses the current folder as a snapshot.
- `MIRROR` reflects file additions and deletions.

A single-file source uses full-refresh semantics.

This choice should match how the source publishes data.

Use `APPEND_ONLY` when files are immutable batches and a file is never corrected in place. Use `FULL` when the folder represents the current snapshot. Use `MIRROR` when deletion from the source folder is meaningful and should be reflected in the materialized result.

The wrong choice can still produce a successful run. It just produces the wrong history.

That is why I would test refresh behavior with a small acceptance sequence before calling the view production-ready:

1. Land the initial files and reconcile row counts.
2. Add a file and confirm exactly what changed.
3. Replace or delete a file and confirm the selected mode behaves as intended.
4. Introduce a schema change and verify the schema policy.
5. Run a full refresh and compare the result with a known source snapshot.

## Use file traceability as evidence

File-ingesting views can expose the `__filepath__` metadata column. That gives each row a direct link back to its source file.

This is more useful than it first appears.

When a business owner asks why a number changed, the investigation can move from an aggregate in a report to a silver row, then to a bronze row, then to the exact file that supplied it. The lineage experience also shows the source location, discovered files, files processed, and rows added for a run.

A simple reconciliation query can become part of the runbook:

```sql
SELECT
  __filepath__,
  COUNT(*) AS rows_loaded
FROM bronze.raw_orders
GROUP BY __filepath__
ORDER BY __filepath__;
```

That is not a complete observability system. It is a clean evidence primitive, and it comes from the ingestion definition instead of custom logging code.

## The production gate I would use

I would not approve a file-ingesting materialized lake view because the first refresh succeeded.

I would approve it when six questions have evidence behind them.

![A six-part production gate for file-ingesting materialized lake views]({{ '/assets/blog/materialized-lake-views-file-ingestion/03-production-gate.svg' | relative_url }})

### 1. Source boundary

Is the path a physical OneLake folder, a controlled shortcut, or a single file? Is the scope narrow enough that unrelated files cannot appear by accident?

### 2. Parser contract

For CSV, are header, delimiter, quote, escape, encoding, date, timestamp, multiline, and malformed-row behavior explicit where needed?

### 3. Schema contract

Is `DYNAMIC` or `FIXED` justified by downstream tolerance, not convenience?

### 4. Refresh contract

Does `APPEND_ONLY`, `FULL`, or `MIRROR` match the publisher's lifecycle? Have add, replace, delete, retry, and full-reprocess cases been tested?

### 5. Data proof

Can the team reconcile files, rows, rejected records, quality constraints, and known business totals?

### 6. Recovery ownership

Who responds when a constraint fails, schema drift is rejected, a source file is malformed, or a downstream view does not refresh?

The syntax makes the path shorter. This gate keeps the shorter path reliable.

## Where this fits well

I would evaluate this pattern first for:

- recurring CSV or Parquet drops into OneLake;
- a bounded bronze source with a clear owner;
- medallion pipelines where the separate ingestion step exists mainly to create the first Delta table;
- workloads that benefit from one dependency graph and one refresh model;
- sources where per-file traceability helps support and audit work.

I would be more cautious when ingestion needs complex API orchestration, cross-system transactions, heavy custom parsing, enrichment from several operational systems, or event-driven latency that scheduled materialized views cannot meet.

Removing a pipeline is valuable only when the remaining abstraction still matches the workload.

## The practical takeaway

File ingestion for materialized lake views makes Fabric's declarative data engineering story more complete.

The headline is that one statement can materialize CSV or Parquet files from OneLake. The operational value is that the first table can now participate in the same dependency order, scheduled refresh, constraints, lineage, and run evidence as the rest of the medallion chain.

My recommendation is to start with one file feed and prove the whole contract:

- source scope;
- parser settings;
- schema behavior;
- refresh semantics;
- per-file reconciliation;
- recovery ownership.

If those six parts hold, a lot of custom ingestion plumbing may no longer be necessary.

## Sources

- [File Data Ingestion with Materialized Lake Views in Microsoft Fabric (Preview)](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blog/File-Data-Ingestion-with-Materialized-Lake-Views-in-Microsoft/ba-p/5367801)
- [Spark SQL reference: ingest files with USING OneLake_Files](https://learn.microsoft.com/en-us/fabric/data-engineering/materialized-lake-views/create-materialized-lake-view#ingest-files-with-using-onelake_files)
- [Materialized lake views overview](https://learn.microsoft.com/en-us/fabric/data-engineering/materialized-lake-views/overview-materialized-lake-view#ingest-files-with-materialized-lake-views)
- [Manage materialized lake view lineage for file ingestion](https://learn.microsoft.com/en-us/fabric/data-engineering/materialized-lake-views/view-lineage#view-lineage-for-file-ingestion)

---

Written by **Shai Karmani**. If you work with Microsoft Fabric, Power BI, data platforms, or practical AI systems, [connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr).

  </div>
</article>
