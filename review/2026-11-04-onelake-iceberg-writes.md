---
layout: post
title: "Publish Iceberg Tables to OneLake From the Engines You Already Use"
date: 2026-11-04
description: OneLake table APIs now support native Iceberg table creation and snapshot commits from compatible engines, plus richer table and column metadata. Here is a production-ready publishing pattern.
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

OneLake is becoming a write target for engines outside Fabric, not only a place where they discover existing tables.

The OneLake Iceberg REST Catalog endpoint now supports native Iceberg table creation, snapshot commits, table deletion, and short-lived storage credentials. Engines such as PyIceberg, Snowflake, and DuckDB can publish results directly into OneLake through standard Iceberg tooling.

Microsoft also introduced an additional table metadata API in preview. It can attach descriptions and key-value tags to tables and columns, giving people and AI agents more context about what the data means.

That combination creates a practical multi-engine publication path without a custom connector or another copy job.

The API removes plumbing. It does not remove the need for an explicit write contract.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/onelake-iceberg-writes/01-open-write-path-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/onelake-iceberg-writes/01-open-write-path.webp" alt="A four-stage flow shows a compatible engine publishing through the OneLake table endpoint, using short-lived storage credentials, and making the table discoverable to connected consumers"></picture></figure>

## What changed

The OneLake table endpoint already supported catalog discovery and read operations for Iceberg-compatible clients. The new write operations extend that endpoint so a client can:

- create a native Iceberg table in a namespace
- commit a new snapshot or metadata change
- request short-lived storage credentials for the table
- drop the table and its data

The data and Iceberg metadata live in OneLake. Other tools connected to the catalog can discover the published table without waiting for a separate ingestion process.

Microsoft says Snowflake can use this through its catalog-linked database feature. The announcement also names PyIceberg and DuckDB as compatible examples, and notes ClickHouse support for writing Iceberg tables into OneLake.

This is a more meaningful interoperability step than another read connector. A read path lets another engine consume a data product. A write path lets that engine become a producer inside the shared lake.

## Give every writer a bounded target

The first design decision is not which client library to use. It is which team owns the destination.

For every writer, record:

- the OneLake data item and namespace it may use
- the identity that performs the write
- which tables it may create, update, or delete
- the upstream process that produces the data
- the team that owns schema and quality
- the consumers that are allowed to depend on the result

A shared catalog can make tables easy to discover. That is useful only when discovery does not hide ownership.

I would begin with one purpose-built namespace and one workload identity. Broad catalog access may be convenient during a proof of concept, but it creates an unclear production boundary.

## Use credential vending as part of the identity model

The endpoint can return short-lived storage credentials so the client can write the data files required by the Iceberg commit.

That is cleaner than distributing long-lived storage keys to every engine. The client authenticates to the catalog flow, receives credentials scoped to the operation, writes the required files, and commits the new table state.

The operating model still needs evidence:

- which identity requested the credentials
- which namespace and table it targeted
- when the credentials were issued and expired
- which commit followed the storage write
- what happens when authentication or authorization fails

Short-lived credentials reduce secret-management work. They do not replace workload identity, least privilege, or auditability.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/onelake-iceberg-writes/02-write-contract-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/onelake-iceberg-writes/02-write-contract.webp" alt="Four cards describe target ownership, write identity, commit behavior, and business metadata around an Iceberg write"></picture></figure>

## Treat optimistic concurrency as an operational feature

Iceberg commits through the endpoint use optimistic concurrency checks. When two writers try to update the same table from conflicting states, the stale commit fails instead of silently replacing newer metadata.

That behavior protects the table, but the application still has to decide what to do next.

A failed commit should enter one of three paths:

1. Reload the current table state and retry when the operation is safe to repeat.
2. Reconcile the intended change with the newer snapshot when both changes matter.
3. Stop and require human review when ownership or schema intent is unclear.

Do not turn every conflict into an automatic retry loop. A retry is safe only when the write is idempotent or the client can prove that reapplying the change will not duplicate data or erase another producer's work.

Track the expected base snapshot, attempted operation, returned conflict, selected recovery path, and final committed snapshot. That evidence is what makes concurrency control useful in production.

## Publish meaning with the table

The additional table metadata API can read and write descriptions and key-value tags for a table and its columns.

Use it for context that should travel with the published data product:

- business purpose
- owning team
- source system
- freshness expectation
- sensitivity or handling category
- support contact
- column definitions and units

Keep the metadata small and operational. A description should help a consumer decide whether the table is appropriate. A tag should support a real discovery, governance, or automation rule.

The API is in preview, so treat the metadata contract as versioned. Test how clients read the fields, decide which tags are required, and avoid making a critical control depend on undocumented behavior.

## Separate table creation from table acceptance

A client can create a table successfully and still publish a poor data product.

Use two stages:

### Technical commit

The writer creates the table, uploads files, commits the snapshot, and confirms that the catalog returns the expected metadata.

### Consumer acceptance

A second engine discovers the table, reads representative rows, checks schema and row counts, validates business rules, and confirms that descriptions and tags are visible where expected.

The second stage matters because a producer can validate its own write path while missing a compatibility or interpretation issue that affects downstream tools.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/onelake-iceberg-writes/03-release-gates-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/onelake-iceberg-writes/03-release-gates.webp" alt="A six-part production acceptance gate covers table creation, snapshot commits, concurrency conflicts, catalog discovery, metadata, and operations"></picture></figure>

## Prove the failure paths before broad adoption

A useful first release should include controlled failures, not only a happy-path demo.

Test at least these cases:

- the writer targets an unauthorized namespace
- credentials expire before the data-file write completes
- two clients attempt conflicting commits
- a schema change breaks a known consumer expectation
- required descriptions or ownership tags are missing
- a drop request targets a table with active consumers

For each case, record the error, the visible table state, whether partial files remain, who owns recovery, and how the client proves the final outcome.

Delete operations deserve a separate guard. The API can drop a table and its data, so production automation should require an explicit target check, dependency review, and recoverability decision before that call is available to a workload.

## A practical first release

Pick one small derived dataset produced outside Fabric. Give the writer access to one approved namespace. Create the table through the OneLake endpoint, commit a second snapshot, and verify the conflict path with a controlled stale update.

Add a short description, owner tag, freshness tag, and column definitions. Then use a different engine to discover the table and validate the expected rows, schema, and metadata.

Finish by documenting the create, update, conflict, and drop responsibilities. That small release proves the architecture without turning the entire catalog into a shared write surface on day one.

## The practical takeaway

Iceberg writes make the OneLake table endpoint a genuine publication interface for multi-engine data platforms.

The best use is a controlled way for approved engines to publish native Iceberg tables into a shared catalog, using short-lived credentials, concurrency protection, and business metadata.

Start with one producer, one namespace, and one consumer acceptance test. When that path has evidence, reuse the contract for the next engine.

## Sources

- [Fabric Updates Blog](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blogs/bg-p/fbc_fabricupdatesblogs)
- [Power BI Updates Blog](https://community.fabric.microsoft.com/t5/Power-BI-Updates-Blog/bg-p/fbc_pbiupdatesblog)
- [OneLake table APIs: Now with Iceberg writes, plus richer table metadata](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blog/OneLake-table-APIs-Now-with-Iceberg-writes-plus-richer-table/ba-p/5391262)
- [Overview of OneLake table APIs](https://learn.microsoft.com/fabric/onelake/table-apis/table-apis-overview)
- [OneLake Iceberg metadata API](https://learn.microsoft.com/fabric/onelake/table-apis/iceberg-table-apis-overview)
- [Iceberg table API samples](https://learn.microsoft.com/fabric/onelake/table-apis/iceberg-table-apis-get-started)
- [Read and write additional table metadata](https://learn.microsoft.com/fabric/onelake/table-apis/additional-table-metadata)

---

Written by **[Shai Karmani](https://www.linkedin.com/in/shai-kr)**.

If you work on Microsoft Fabric, Power BI, data engineering, or practical AI systems, feel free to [connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr).
