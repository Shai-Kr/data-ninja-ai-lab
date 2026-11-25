---
layout: post
title: "Make Business-Time Logic Reusable in Fabric SQL"
date: 2026-11-25
description: A practical production pattern for scalar UDFs in Microsoft Fabric Data Warehouse, including time-aware rules, time-zone conversion, row identifiers, tests, and workload evidence.
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

Scalar user-defined functions are now generally available in Microsoft Fabric Data Warehouse and the SQL analytics endpoint.

The useful part is not the `CREATE FUNCTION` syntax. It is the ability to keep a time-sensitive business rule in one reviewed T-SQL definition and reuse it across analytical queries.

The GA release adds support for current-time functions, `AT TIME ZONE`, and `NEWID()` through Fabric's UDF inlining paths. Microsoft also improved resource estimation for conditional and iterative control flow.

That opens a practical design option for SLA classification, expiration rules, regional time conversion, and row-level identifier generation. It also creates shared code that can affect many queries at once.

I would treat a scalar UDF as a small data product: one contract, one owner, semantic tests, and workload evidence.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/fabric-warehouse-scalar-udf-ga/01-rule-flow-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/fabric-warehouse-scalar-udf-ga/01-rule-flow.webp" alt="Business facts pass through one reviewed scalar UDF and into supported analytical query shapes"></picture></figure>

## Start with the rule that deserves one definition

A scalar UDF is a good fit when several queries need the same scalar decision and that decision belongs close to the data.

Examples include:

- Classify an order as not started, within target, or past target.
- Convert a stored UTC timestamp to the business time zone used by a regional process.
- Apply one reusable expiration or effective-date rule.
- Generate a row identifier during query evaluation.

The function should return one clearly defined value from explicit inputs. If the logic needs to return a table, mutate data, call an external service, or hide a large transformation pipeline, a scalar UDF is the wrong boundary.

Shared syntax is not enough. Write down the contract before writing the function:

| Contract field | Example |
| --- | --- |
| Business meaning | Current SLA state for an order |
| Inputs | `CreatedUtc`, `TargetMinutes` |
| Output | `Not started`, `Within target`, or `Past target` |
| Null behavior | Return `Unknown` or reject the row |
| Clock | Fabric query execution time in UTC |
| Owner | Order operations data product |

That record makes later changes reviewable. It also prevents two functions with similar names from quietly implementing different business meanings.

## Pattern 1: Put current-time decisions in one place

The GA release supports time-dependent functions such as `GETDATE()`, `CURRENT_TIMESTAMP`, `SYSDATETIME()`, and `SYSUTCDATETIME()` inside supported scalar UDF bodies.

A simplified SLA classifier can look like this:

```sql
CREATE OR ALTER FUNCTION dbo.fn_GetOrderSlaState
(
    @CreatedUtc DATETIME2(6),
    @TargetMinutes INT
)
RETURNS VARCHAR(20)
AS
BEGIN
    DECLARE @CurrentUtc DATETIME2(6) = SYSUTCDATETIME();
    DECLARE @TargetUtc DATETIME2(6) =
        DATEADD(MINUTE, @TargetMinutes, @CreatedUtc);

    IF @CreatedUtc > @CurrentUtc RETURN 'Not started';
    IF @CurrentUtc <= @TargetUtc RETURN 'Within target';
    RETURN 'Past target';
END;
```

The function can then participate in supported CTEs, filters, joins, and grouping queries.

The clock is part of the function's meaning. Separate evaluations can observe different values, and many rows can share the same timestamp because clock resolution and execution timing are not row identifiers.

For repeatable tests, keep a testable form that accepts an explicit `@AsOfUtc` value. Production can pass the current UTC value. Tests can pass exact boundary timestamps.

That makes the important cases deterministic:

- One microsecond before the target.
- Exactly at the target.
- One microsecond after the target.
- A creation time in the future.
- Null creation time or target duration.

## Pattern 2: Centralize time-zone conversion, then test DST

Fabric scalar UDFs now support `AT TIME ZONE` through both Expression Block inlining and Scalar UDF inlining where the function body and calling query are supported.

This is useful when operational data stays in UTC but a business process needs local time:

```sql
CREATE OR ALTER FUNCTION dbo.fn_ToEasternTime
(
    @UtcValue DATETIME2(6)
)
RETURNS DATETIMEOFFSET(6)
AS
BEGIN
    RETURN @UtcValue
        AT TIME ZONE 'UTC'
        AT TIME ZONE 'Eastern Standard Time';
END;
```

Centralizing the conversion removes repeated chained expressions from reports, monitoring queries, and downstream transformations.

The test set still matters. Include timestamps around daylight-saving transitions, dates in both standard and daylight time, leap day, and null input. Return `DATETIMEOFFSET` when the offset is part of the business meaning. Converting immediately to a value without an offset throws away evidence that can matter later.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/fabric-warehouse-scalar-udf-ga/02-patterns-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/fabric-warehouse-scalar-udf-ga/02-patterns.webp" alt="Three scalar UDF patterns for SLA rules, time-zone conversion, and row identifiers with their required tests"></picture></figure>

## Pattern 3: Use NEWID() for identity, not time

`NEWID()` is now supported inside Expression Block inlining. When the function is evaluated across a row set, each evaluated output row can receive a new identifier.

```sql
CREATE OR ALTER FUNCTION dbo.fn_NewProcessingId()
RETURNS UNIQUEIDENTIFIER
AS
BEGIN
    RETURN NEWID();
END;
```

One call assigned to a local variable can be reused from that variable. Multiple evaluated `NEWID()` calls can produce different values. Test the exact calling pattern your query uses.

Do not use the value to infer ordering, time, or business sequence. It is an identifier. If the identifier must remain stable across reruns, generate and persist it during ingestion instead of regenerating it in an analytical query.

## Inlineability is part of the release contract

Fabric can use different inlining techniques based on the function definition. The applicable technique determines which function constructs and calling query shapes are supported.

That means a successful function definition does not prove every planned query shape is valid or efficient.

Before promotion, capture:

1. The function definition and its owner.
2. The intended calling query shapes.
3. The inlining-related metadata available for the function.
4. A representative execution test in each important query shape.
5. Query Insights evidence for duration, resource use, and failures.

This matters when the function contains branches or loops. Microsoft improved resource estimation for control-flow work, but estimation is still not a substitute for measuring the workload you plan to run.

## Benchmark the query that will actually call it

Avoid a benchmark that calls the function against ten hand-written rows and then declares it production-ready.

Use a representative row count, distribution, filter, grouping, concurrency level, and cache state. Compare the UDF version with the equivalent direct expression where that comparison is practical.

I would keep these acceptance checks:

| Check | Evidence |
| --- | --- |
| Correct result | Boundary and null test cases pass |
| Supported shape | Every planned CTE, filter, join, or grouping query succeeds |
| Query cost | Query Insights captured for representative volume |
| Stability | Repeated runs stay inside an agreed performance range |
| Change safety | Previous behavior can be reproduced or rolled back |

The decision is not "UDFs are fast" or "UDFs are slow." The decision is whether this definition, called by this query shape, at this workload size, meets the target.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/fabric-warehouse-scalar-udf-ga/03-release-gate-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/fabric-warehouse-scalar-udf-ga/03-release-gate.webp" alt="Four-step scalar UDF release gate covering contract definition, semantic tests, workload measurement, and controlled promotion"></picture></figure>

## A small production release gate

The release record can stay short:

- Function name and business purpose.
- Owner and reviewers.
- Inputs, output, null behavior, and clock semantics.
- Supported calling queries.
- Test cases for boundaries, DST, and repeated evaluation.
- Query Insights snapshot at representative volume.
- Deployment script and rollback script.

Review the function when its business meaning changes, when a calling query adds a new shape, or when workload volume changes materially.

## The practical takeaway

Scalar UDF GA gives Fabric Warehouse teams a useful place for reusable scalar business rules, including rules that depend on current time, regional time, or row-level identifier generation.

The strongest pattern is simple: define the business contract, test the semantic edges, verify the intended query shapes, and measure the real workload before promotion.

That turns a convenient SQL feature into shared logic the team can trust.

## Sources

- [Scalar User-defined functions in Microsoft Fabric Data Warehouse (Generally Available)](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blog/Scalar-User-defined-functions-UDFs-in-Microsoft-Fabric-Data/ba-p/5399753)
- [CREATE FUNCTION for Fabric Data Warehouse](https://learn.microsoft.com/en-us/sql/t-sql/statements/create-function-sql-data-warehouse?view=fabric&preserve-view=true)
- [Create scalar user-defined functions in Fabric Data Warehouse](https://learn.microsoft.com/en-us/fabric/data-warehouse/how-to-inline-udf)
- [Query Insights in Fabric Data Warehouse](https://learn.microsoft.com/en-us/fabric/data-warehouse/query-insights)

---

**Shai Karmani**  
Data, Microsoft Fabric, Power BI, and practical AI  
[Connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr)
