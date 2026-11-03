---
layout: post
title: "Bring More Curated Databricks Data Into Fabric Without Copying It"
date: 2026-11-03
description: Mirrored Azure Databricks catalogs in Microsoft Fabric now support materialized views and streaming tables alongside tables. Here is how to use the capability with clear ownership and production acceptance gates.
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

Microsoft Fabric can now expose more of the curated data products already managed in Azure Databricks.

Mirrored Azure Databricks catalogs now support materialized views and streaming tables alongside tables. The objects stay created and managed in Databricks. Fabric mirrors the selected catalog structure and provides read-only access to the underlying data through shortcuts.

That is a useful architecture because it expands what Fabric consumers can use without asking the platform team to build another ingestion pipeline or maintain another physical copy.

The real value is the ownership boundary: Databricks remains responsible for the object lifecycle, while Fabric becomes a governed discovery, query, and reporting surface.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/databricks-catalog-objects/01-ownership-flow-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/databricks-catalog-objects/01-ownership-flow.webp" alt="A four-stage flow shows Azure Databricks owning curated objects, Unity Catalog exposing them, Fabric mirroring the catalog, and Fabric consumers querying the data"></picture></figure>

## What Microsoft added

The existing Mirrored Azure Databricks catalog experience can now include three supported object types:

- tables
- materialized views
- streaming tables

There is no separate Fabric item type for each object. The same mirrored catalog configuration is used to select the Unity Catalog catalogs, schemas, and supported objects that should appear in Fabric.

Fabric mirrors the selected structure and creates shortcuts to the underlying data. The Databricks objects remain read-only from the Fabric side.

Before a materialized view or streaming table can appear, the object must be configured for external data access in Azure Databricks. The identity used by Fabric also needs the required Unity Catalog permissions. After that, the mirrored catalog is refreshed or synchronized.

Fabric provides an automatically generated SQL analytics endpoint for T-SQL access. Teams can also create a Power BI semantic model and use Direct Lake mode.

## Keep the ownership boundary explicit

Cross-platform designs become difficult when both platforms appear to own the same thing.

This capability has a cleaner division:

### Azure Databricks owns the object

Databricks creates and processes the table, materialized view, or streaming table. Its platform team owns the source dependencies, processing logic, schema, quality, refresh behavior, and recovery path.

### Unity Catalog owns the access contract

Unity Catalog controls which objects can be accessed externally and which identity can see them. Catalog, schema, and object selection should be intentional rather than broad by default.

### Fabric owns the consumer experience

Fabric mirrors the selected catalog structure, exposes read-only shortcuts, provides the SQL analytics endpoint, and lets BI teams build semantic models and reports against the available data.

This prevents a common failure mode where a second platform quietly becomes responsible for data it did not create and cannot repair.

## Treat each object as a published data product

The three supported object types share an access pattern, but they do not share the same operating expectations.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/databricks-catalog-objects/02-object-contract-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/databricks-catalog-objects/02-object-contract.webp" alt="Three cards compare the operating expectations for tables, materialized views, and streaming tables in a mirrored Azure Databricks catalog"></picture></figure>

### Tables need a stable publication contract

Record the owner, schema expectations, update process, quality checks, and supported consumer use cases. A table becoming visible in another platform is still an interface change.

### Materialized views need a freshness contract

Precomputed results can simplify recurring analytical queries, but consumers need to know when the result is refreshed, which sources it depends on, and what happens when refresh fails.

A Power BI report can query successfully and still show an older materialized result. Query success and data freshness are separate signals.

### Streaming tables need a processing contract

Streaming tables support scenarios that need fresher results. That makes processing health, latency expectations, checkpoint or recovery behavior, and incident ownership part of the consumer agreement.

Fabric users do not need every internal implementation detail. They do need enough information to understand whether the object meets the reporting or analytical requirement.

## Selection is part of governance

The configuration lets the team choose the Unity Catalog catalogs, schemas, and supported objects to expose.

Avoid treating that selection as a one-time technical checkbox. It defines the cross-platform publication boundary.

For each selected object, record:

- business purpose
- Databricks owner
- Fabric consumer owner
- allowed audience
- expected freshness or latency
- schema-change policy
- recovery contact
- planned consumer path, such as T-SQL or Direct Lake

Start with objects that are already curated and supported as shared data products. Mirroring an entire schema because it is convenient can create a large discovery surface with unclear ownership and unstable contracts.

## Synchronization needs an acceptance test

For new mirrors, Microsoft says automatic synchronization of future catalog changes for the selected schema is enabled by default. Supported additions and deletions of schemas and objects can then be reflected in Fabric when the selection and external-access requirements are met.

That convenience needs testing.

Use a controlled object to verify:

1. A newly selected object appears in the mirrored catalog.
2. Its schema is visible as expected.
3. The Fabric identity can query it through the SQL analytics endpoint.
4. A Direct Lake semantic model can use it where appropriate.
5. A Databricks-side change is reflected according to the expected synchronization behavior.
6. A removed object produces an understood consumer outcome rather than a surprise outage.

Schema changes deserve their own contract. A renamed or removed column can break a semantic model even when catalog synchronization works exactly as designed.

## Prove the consumer path end to end

The acceptance test should begin in Databricks and finish in the Fabric experience people will actually use.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/databricks-catalog-objects/03-release-gates-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/databricks-catalog-objects/03-release-gates.webp" alt="A six-part production acceptance gate covers external access, permissions, selection, synchronization, query paths, and operations"></picture></figure>

For a materialized view, I would verify:

- external access is enabled for the object
- the Fabric identity has the required Unity Catalog permissions
- the object appears under the intended mirrored catalog and schema
- T-SQL returns the expected row count and representative values
- the Power BI model uses the intended storage mode and preserves the expected semantics
- freshness evidence matches the Databricks refresh contract
- the support team knows which platform owns a failure

For a streaming table, add a controlled new record and measure when it becomes available to the Fabric consumer. Record the observed latency and compare it with the agreed target.

Do not stop at “the object appears in Fabric.” Discovery proves catalog synchronization. It does not prove data quality, freshness, semantic correctness, or recovery.

## Watch the operational signals on both sides

The consumer experience spans two platforms, so support needs evidence from both.

At minimum, track:

- Databricks object processing or refresh status
- last successful update time
- Unity Catalog access changes
- Fabric catalog synchronization state
- SQL or Direct Lake query failures
- semantic-model refresh or report errors
- owner and incident route for each layer

The support question should be answerable quickly: is the object unavailable, stale, unauthorized, unsynchronized, or being queried incorrectly?

Without that separation, every incident becomes a cross-team guessing exercise.

## A practical first release

Choose one materialized view or streaming table that already serves a real analytical use case in Databricks.

Expose only the required catalog and schema. Configure external access and the Fabric identity. Synchronize the mirrored catalog. Validate the object through T-SQL, then connect one small Power BI semantic model with a clearly defined freshness expectation.

Run one addition test, one schema-change test, one permission-failure test, and one stale-data scenario. Document which team owns each response.

That first release will produce a reusable publication pattern for the next objects. It also gives the platform teams evidence before the mirrored catalog becomes a broad shared dependency.

## The practical takeaway

Support for materialized views and streaming tables makes the Mirrored Azure Databricks catalog more useful to Fabric consumers.

The strongest architecture keeps the object lifecycle in Databricks, access policy in Unity Catalog, and analytical consumption in Fabric. No duplicate pipeline is required, and the ownership boundary remains visible.

Use the new object support to publish curated data products across platforms, not to expose an unmanaged catalog. Selection, permissions, freshness, synchronization, consumer testing, and recovery still need an explicit contract.

## Sources

- [Fabric Updates Blog](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blogs/bg-p/fbc_fabricupdatesblogs)
- [Power BI Updates Blog](https://community.fabric.microsoft.com/t5/Power-BI-Updates-Blog/bg-p/fbc_pbiupdatesblog)
- [Announcing support for Materialized views and streaming tables in Mirrored Azure Databricks catalog](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blog/Announcing-support-for-Materialized-views-and-streaming-tables/ba-p/5377928)
- [Microsoft Fabric Mirrored Catalog from Azure Databricks](https://learn.microsoft.com/fabric/mirroring/azure-databricks)
- [Tutorial: Configure Microsoft Fabric mirror from Azure Databricks Unity Catalog](https://learn.microsoft.com/fabric/mirroring/azure-databricks-tutorial)

---

Written by **[Shai Karmani](https://www.linkedin.com/in/shai-kr)**.

If you work on Microsoft Fabric, Power BI, data engineering, or practical AI systems, feel free to [connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr).
