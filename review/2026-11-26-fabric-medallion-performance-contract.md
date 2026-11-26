---
layout: post
title: "Make Every Fabric Medallion Layer Faster With Evidence"
date: 2026-11-26
description: A practical performance plan for Bronze, Silver, and Gold in Microsoft Fabric Data Warehouse, built around Query Insights, measured workloads, and layer-specific tuning.
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
  .article-body table { display: block; max-width: 100%; overflow-x: auto; }
  .article-body pre { max-width: 100%; overflow-x: auto; }
  .article-body pre code { white-space: pre-wrap; overflow-wrap: anywhere; }
  .subscribe-orbit { display: none; }
}
.review-visual { width: 100%; max-width: 100%; margin: 34px 0 10px; overflow: hidden; }
.review-visual img { display: block; width: 100%; max-width: 100%; height: auto; }
</style>

**Review draft. Direct link only.**

A slow Gold dashboard does not prove that Gold is the problem.

The delay might come from a cold first query, oversized string columns in Silver, or a Bronze load that created thousands of small files. Tuning the visible symptom can improve one test and leave the real bottleneck in place.

Microsoft's latest Fabric Data Warehouse guidance puts the right principle first: measure the affected layer, then tune the lever that belongs to it.

That sounds obvious. It is also where many performance exercises go wrong. Teams change table design, capacity, SQL, and refresh schedules at the same time, then cannot explain which change helped.

I would use a simpler operating model: label the workload by layer, capture Query Insights evidence, change one lever, and verify the result against the same workload.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/fabric-medallion-performance-contract/01-layer-plan-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/fabric-medallion-performance-contract/01-layer-plan.webp" alt="Bronze, Silver, and Gold each have a distinct performance job and tuning lever"></picture></figure>

## Start with the layer, not the symptom

Each medallion layer has a different job. That gives it a different primary performance lever.

| Layer | Main performance job | First evidence to collect |
| --- | --- | --- |
| Bronze | Land data in efficient batches and files | Load duration, statement label, file shape |
| Silver | Standardize types and prepare statistics | Transform CPU, duration, join conversions |
| Gold | Serve recurring analytical query patterns | Frequency, scan path, elapsed time |

The boundaries matter. Bronze should not quietly become a row-by-row integration database. Silver should not preserve every loose source type. Gold should not return every column and expect the report client to do the reduction.

When each layer has one job, the investigation becomes smaller. You can test the load shape, the data shape, or the query shape without redesigning the whole platform.

## Measure before changing anything

Fabric Data Warehouse and the SQL analytics endpoint expose 30 days of completed workload history through the `queryinsights` schema.

The useful views answer three different questions:

- `exec_requests_history`: What happened during a specific completed statement?
- `long_running_queries` and `frequently_run_queries`: Which query shapes keep costing time?
- `sql_pool_insights`: Did many statements slow down because the SQL pool was under pressure?

A basic investigation can start here:

```sql
SELECT TOP 20
    distributed_statement_id,
    label,
    allocated_cpu_time_ms,
    data_scanned_remote_storage_mb,
    data_scanned_memory_mb,
    data_scanned_disk_mb
FROM queryinsights.exec_requests_history
ORDER BY allocated_cpu_time_ms DESC;
```

Labeling is worth the small effort. Labels such as `Bronze_Load_Customer`, `Silver_Transform_Order`, and `Gold_Refresh_Sales` make the history usable during an incident. Without them, the team spends time reconstructing which pipeline or report issued each statement.

Do not judge performance from the first execution alone. A first run can fetch data from OneLake, create statistics, or resume compute resources. A nonzero `data_scanned_remote_storage_mb` value is evidence that the query fetched data from remote storage. Compare repeat runs before declaring the query slow.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/fabric-medallion-performance-contract/02-evidence-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/fabric-medallion-performance-contract/02-evidence.webp" alt="Query history, workload patterns, and SQL pool evidence answer different performance questions"></picture></figure>

## Bronze: optimize the write shape

Bronze performance starts before the data reaches the table.

For files in Azure Data Lake Storage, Microsoft's current guidance is to use `COPY INTO` and aim for files between 100 MB and 1 GB where practical. Independent loads can run through separate `COPY INTO` statements in parallel.

The pattern to avoid is a long stream of tiny inserts, updates, or deletes. Each small write can create another Parquet file. Fabric compacts small files in the background, but reads can pay the fragmentation cost before compaction catches up.

A useful Bronze acceptance check includes:

- Source file count and size distribution.
- Rows and bytes loaded per statement.
- Load duration by statement label.
- The number of small writes generated by the orchestration pattern.
- A repeat read after the load completes.

V-Order is enabled by default. It improves read performance with some ingestion overhead. A write-heavy staging warehouse can be tested with V-Order disabled, but this is not a casual switch. Microsoft notes that it cannot be turned back on for that warehouse. Make that choice from measured workload evidence, not from a generic rule.

## Silver: make types do less work

Silver is where loose source data becomes a reusable analytical contract.

This is the best place to replace oversized strings with the smallest practical `varchar(n)`, use appropriate numeric types, declare temporal values as date or time types, and keep the data types on join columns aligned.

Type mismatches force conversions during every downstream query. An easy source mapping can become a permanent query tax.

Statistics also belong in the Silver release plan. Fabric creates and maintains statistics automatically, but the first query after a large data change can still pay the creation or refresh cost. If there is a window between the transformation and the reporting workload, update statistics on important join, filter, and grouping columns before users arrive.

I would put these checks in the Silver gate:

1. Review generated column types before promotion.
2. Compare the types on every high-volume join pair.
3. Identify the columns used by recurring filters and groups.
4. Refresh key statistics after material loads when the workload needs it.
5. Run representative transforms and capture Query Insights evidence.

## Gold: shape tables for real query patterns

Gold should make common analytical questions cheap to answer.

That usually means pre-aggregating recurring business calculations, returning only required columns, and applying filters early. `SELECT *` is convenient during exploration. It is a poor default for a stable serving query.

Data clustering can help when large tables are repeatedly filtered on the same medium-to-high cardinality columns. The column choice should come from actual `WHERE` patterns in Query Insights. Equality joins do not benefit simply because a column participates in a join, and clustering adds work during ingestion.

The benchmark also needs a declared cache state. Test the first run, then the repeat runs. If an executive dashboard must be responsive at the start of the day, run its key queries after the Gold refresh so the cold work happens before the audience opens it.

## Use a release gate, not a tuning session

Performance changes should be reproducible.

For each change, keep a short record:

- Workload label, data volume, concurrency, and cache state.
- Baseline duration, CPU allocation, scan path, and pool pressure.
- One tuning lever and its expected effect.
- The same evidence after the change.
- Downstream report or pipeline validation.
- Owner, rollback, and the condition that triggers another review.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/fabric-medallion-performance-contract/03-evidence-loop-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/fabric-medallion-performance-contract/03-evidence-loop.webp" alt="A four-step performance release gate captures a baseline, changes one lever, verifies evidence, and promotes or reverts"></picture></figure>

This keeps the result honest. If the query improved because the second test used warm cache while the baseline used cold cache, the evidence will show it. If many queries slowed together because the pool was under pressure, the team will not waste a week rewriting one statement.

## The practical takeaway

Fabric manages caching, statistics, compaction, and V-Order by default. That removes a lot of traditional warehouse maintenance. It does not remove the need to shape the workload well.

Load Bronze in efficient batches. Give Silver precise types and usable statistics. Shape Gold around the queries people actually run. Use Query Insights to prove which layer needs attention and whether the change worked.

The fastest medallion pipeline is not the one with the most tuning. It is the one where every change starts and ends with evidence.

## Sources

- [Tune the performance of your medallion pipeline in Fabric Data Warehouse](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blog/Tune-the-performance-of-your-medallion-pipeline-in-Fabric-Data/ba-p/5377545)
- [Performance guidelines for Fabric Data Warehouse](https://learn.microsoft.com/en-us/fabric/data-warehouse/guidelines-warehouse-performance)
- [Query Insights in Fabric Data Warehouse](https://learn.microsoft.com/en-us/fabric/data-warehouse/query-insights)
- [Ingest data into your Warehouse using COPY](https://learn.microsoft.com/en-us/fabric/data-warehouse/ingest-data-copy)
- [Data clustering in Fabric Data Warehouse](https://learn.microsoft.com/en-us/fabric/data-warehouse/data-clustering)

---

**Shai Karmani**  
Data, Microsoft Fabric, Power BI, and practical AI  
[Connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr)
