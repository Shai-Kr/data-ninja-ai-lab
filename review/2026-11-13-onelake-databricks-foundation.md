---
layout: post
title: "The OneLake Pattern That Cuts Data Copies Between Fabric and Databricks"
date: 2026-11-13
description: OneLake can now hold supported Unity Catalog-managed data directly. Here is the practical identity, storage, catalog, consumer, and production contract behind the integration.
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

Microsoft Fabric can now provide the physical OneLake storage for supported objects managed by Azure Databricks Unity Catalog.

That changes a common two-platform architecture. Teams no longer have to assume that Fabric data and Databricks-managed data need separate physical homes, duplicate copies, or synchronization pipelines whose only job is moving the same bytes between platforms.

The integration is generally available on the Fabric side and in public preview on the Azure Databricks side. The useful part is not simply that Databricks can write to OneLake. It is the separation of responsibilities around the shared data foundation:

- Azure Databricks runs compute and manages Unity Catalog objects.
- OneLake stores the supported managed data.
- A mirrored Azure Databricks catalog exposes selected objects to Fabric workloads without copying the data.
- Fabric users read through that mirrored catalog, not through the storage item directly.

That last point is the architecture. The storage path and the consumer path are deliberately different.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/onelake-databricks-foundation/01-shared-foundation-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/onelake-databricks-foundation/01-shared-foundation.webp" alt="A four-stage flow shows Azure Databricks writing managed data to OneLake, publishing selected objects through a mirrored catalog, and serving Fabric workloads"></picture></figure>

## One foundation does not mean one control plane

The data can sit in OneLake while Unity Catalog remains the management surface for the Databricks objects.

A Unity Catalog storage credential points to an approved managed identity or service principal. An external location points to the ID-based OneLake path and uses that credential. A catalog or schema can then use the location as managed storage.

Supported objects include managed Delta and Iceberg tables, volumes, materialized views, and streaming tables. Databricks creates and manages the objects. OneLake holds their physical data.

This is a cleaner model than treating integration as a contest over which platform owns everything. Platform responsibilities stay explicit:

| Responsibility | Primary surface |
| --- | --- |
| Compute and object management | Azure Databricks |
| Catalog permissions for Databricks users | Unity Catalog |
| Physical managed storage | OneLake |
| Fabric discovery and consumption | Mirrored Azure Databricks catalog |
| T-SQL and Power BI access | Fabric SQL analytics endpoint and Direct Lake |

The benefit is a common physical foundation with separate, named control surfaces. That is easier to govern than two copies with different refresh schedules and unclear ownership.

## The storage item is locked for a reason

OneLake security is enabled by default when an Azure Databricks Storage item is created. Fabric workspace roles, including Admin, Member, Contributor, and Viewer, do not grant access to the data inside that item.

The approved Databricks identity needs two things:

1. A suitable role on the Fabric workspace, normally Viewer for the base storage pattern
2. Membership in a OneLake security role with ReadWrite permission on the Azure Databricks Storage item

Microsoft's guidance is specific: that Databricks identity should be the only member of the storage role. Do not add Fabric users, groups, or unrelated service principals.

Anyone added to the role can read and write the underlying data directly, outside Unity Catalog governance. That turns a convenience grant into a bypass path.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/onelake-databricks-foundation/02-identity-boundary-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/onelake-databricks-foundation/02-identity-boundary.webp" alt="A four-row identity contract keeps direct OneLake access limited to the Databricks identity while Fabric readers use a mirrored catalog"></picture></figure>

This is a useful security design because it makes the bypass visible. A review can ask one concrete question: who is a member of the storage item's OneLake security role?

The expected answer should be short.

## Fabric users need a different route

Fabric users consume the data through a mirrored Azure Databricks catalog item. The mirror brings catalog structure into Fabric and uses shortcuts to access the underlying data. It does not replicate the table data.

That gives consumers a Fabric-native surface:

- T-SQL through the generated SQL analytics endpoint
- Power BI through Direct Lake
- supported Fabric notebook and engineering scenarios

The mirrored item can be created from Databricks with **Publish to Fabric**, or from Fabric by creating a mirrored Azure Databricks catalog and selecting the catalog, schemas, or tables to include.

This is where publishing discipline matters. Do not expose every object because the connection works. Select the domains that have an owner, a consumer, and a freshness expectation. Treat each published schema or table as a data product contract.

At minimum, record:

- the Unity Catalog owner
- the Fabric workspace owner
- the objects intentionally exposed
- the expected metadata propagation delay
- the semantic model or report consumers
- the support route when schema changes break a downstream workload

## The setup path is simple enough to automate

The base sequence has five parts:

1. Create or select an Access Connector for Azure Databricks with a managed identity, or use a service principal.
2. Grant that identity the required Fabric workspace role.
3. Create an Azure Databricks Storage item and add only that identity to a ReadWrite OneLake security role.
4. In Unity Catalog, create a storage credential and a OneLake external location using the ID-based ABFSS path.
5. Create a catalog or schema that uses the external location as managed storage.

The path format matters:

```text
abfss://<WorkspaceID>@onelake.dfs.fabric.microsoft.com/<DatabricksStorageID>/Files/
```

The external location requires workspace and item IDs. Display-name paths are rejected.

The Fabric tenant must also allow users to create Azure Databricks Storage items, and the workspace needs the delegated OneLake SAS setting described in the setup guide.

A successful **Test connection** result proves connectivity. It does not prove the consumer route, security boundary, freshness behavior, or workload compatibility.

## Check the current limitations before choosing the pilot

The first production pilot should use a supported, representative workload and explicitly test the documented limits.

Four points deserve attention:

**Catalog commits.** New Unity Catalog managed tables can use catalog commits. Fabric Spark cannot currently read those tables through the mirrored catalog because Unity Catalog is the source of truth for table state. Turning catalog commits off also disables features that depend on them, so this is an architecture choice, not a hidden checkbox.

**Open sharing.** Databricks-to-Open sharing is not supported for managed tables stored on OneLake because that pattern relies on pre-signed file URLs.

**FILE columns.** Fabric does not expose the Databricks `FILE` type in mirrored catalogs. Other columns remain available, but consumers cannot use the missing column to reach the file.

**File events.** New external locations can use file events. Automatic setup requires a higher Fabric workspace role than the base Viewer pattern. That exception should be documented instead of quietly widening the identity's role.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/onelake-databricks-foundation/03-production-gate-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/onelake-databricks-foundation/03-production-gate.webp" alt="Five production checks cover supported runtime, OneLake path, identity, Fabric consumers, and current integration limits"></picture></figure>

## A practical adoption gate

Before calling the pattern production-ready, I would ask for evidence that:

- Unity Catalog and a supported Databricks runtime are in use
- the Fabric workspace has active capacity and the required settings
- the external location uses the ID-based OneLake path
- only the approved Databricks identity has direct storage access
- a managed table can be created, written, and queried through Databricks
- the intended objects appear through the mirrored catalog
- T-SQL and Power BI consumers return expected results
- metadata freshness is measured, not assumed
- catalog commits, FILE columns, sharing, and file-event requirements are resolved
- ownership is clear across Databricks, Fabric, and the consuming semantic model

Then measure whether the architecture removed anything:

- one duplicate storage copy
- one synchronization pipeline
- one separate access-control process
- one reconciliation check between platforms

The value is not the presence of another connector. It is the work the shared foundation lets the team retire.

OneLake as managed storage for Azure Databricks creates a credible pattern for organizations that need both platforms. Databricks keeps its compute and catalog responsibilities. Fabric gets a governed consumer surface. OneLake becomes the common physical layer.

That division is specific enough to operate, test, and explain. That is what makes it useful.

## Sources

- [Use OneLake as native storage for Azure Databricks](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blog/Use-OneLake-as-native-storage-for-Azure-Databricks/ba-p/5377939)
- [Connect Azure Databricks to a OneLake external location](https://learn.microsoft.com/en-us/azure/databricks/connect/unity-catalog/cloud-storage/external-locations-onelake)
- [Microsoft Fabric mirrored catalog from Azure Databricks](https://learn.microsoft.com/en-us/fabric/mirroring/azure-databricks)
- [Publish Unity Catalog to Microsoft Fabric](https://learn.microsoft.com/en-us/azure/databricks/partners/bi/fabric-publish)

---

**Shai Karmani**  
Data, Microsoft Fabric, Power BI, and practical AI  
[Connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr)
