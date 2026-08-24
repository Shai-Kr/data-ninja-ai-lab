---
layout: post
title: "Bring Google Lakehouse Tables Into OneLake Without Rebuilding Your Platform"
date: 2026-08-24
description: Microsoft Fabric can now mirror Google Lakehouse Runtime Catalog metadata into OneLake in preview. The real opportunity is a cleaner multi-cloud analytics pattern, not another migration slogan.
author: Shai Karmani
author_url: https://www.linkedin.com/in/shai-kr
---

<style>
@media (max-width: 760px) {
  .article { max-width: 100%; overflow-x: hidden; }
  .article-header { padding: 22px 14px; border-radius: 18px; }
  .article-header h1 { font-size: clamp(1.28rem, 5.8vw, 1.75rem); line-height: 1.16; overflow-wrap: anywhere; }
  .article-body { overflow-x: hidden; font-size: 0.98rem; }
  .article-body img { width: 100%; max-width: 100%; border-radius: 16px; }
  .subscribe-orbit { display: none; }
}
</style>

A lot of lakehouse strategy sounds cleaner in slides than it feels in production.

One team has Microsoft Fabric. Another has Google-managed Apache Iceberg tables. A third has legacy warehouse dependencies. Then the business asks for one view of the customer, one operational metric, or one report that combines the data.

The usual answer is a copy pipeline. Then another one. Then a staging zone. Then a reconciliation job. Then someone asks why the same table exists in three places and nobody is sure which one is current.

Microsoft's new mirrored Google Lakehouse Runtime Catalog item for OneLake, now in preview, points to a better pattern.

The goal is not magic multi-cloud. The goal is simple: make externally managed Iceberg tables discoverable and usable from Fabric without starting the conversation with another full data copy.

That is a meaningful shift for teams that already live across cloud boundaries.

![Google lakehouse catalogs in OneLake](/data-ninja-ai-lab/assets/blog/google-lakehouse-onelake/diagrams/01-onelake-catalog-mirroring-model.svg)

## Why this is useful

OneLake is becoming more than a storage location inside Fabric. It is becoming the namespace where analytics teams expect to find data, whether that data started in Fabric, Azure, AWS, or now Google-managed lakehouse catalogs.

The new preview capability lets organizations connect Google-managed Apache Iceberg catalogs to Fabric and make those tables available through OneLake. It follows the same broad direction as existing catalog mirroring patterns for AWS Glue and other sources.

That matters because Iceberg adoption is growing, but most enterprises are not single-platform environments. They have domains, acquisitions, historical bets, vendor constraints, and teams that picked different cloud stacks for decent reasons.

A mature Fabric architecture has to work with that reality.

The win is not that every table suddenly belongs in Fabric. The win is that Fabric teams can expose useful tables through a governed Fabric experience, then decide what should be queried, modeled, cached, copied, secured, or left in place.

That is a more honest operating model than pretending every useful dataset will be migrated before anyone can analyze it.

## The trap to avoid

Do not treat catalog mirroring as a permission slip to skip architecture.

A mirrored catalog still needs a data contract. Someone owns the source. Someone owns the schema. Someone understands freshness. Someone decides which tables should be visible to which consumers. Someone gets paged when a critical downstream report depends on a table that changed upstream.

Without that, OneLake becomes a prettier catalog for the same unmanaged sprawl.

The questions I would ask before connecting a production Google lakehouse catalog are basic, but important:

- Which business domain owns these tables?
- Which Fabric workspace should expose them?
- Which users or service principals can discover them?
- Which tables are safe for broad BI consumption?
- What is the expected freshness and failure behavior?
- Who approves schema changes that break Power BI models or warehouse queries?
- Which workloads should read through this path, and which should still use a materialized copy?

Those questions are not bureaucracy. They are what keeps a useful multi-cloud pattern from becoming a hidden dependency chain.

![Multi-cloud lakehouse checklist](/data-ninja-ai-lab/assets/blog/google-lakehouse-onelake/diagrams/02-multicloud-lakehouse-checklist.svg)

## Where this fits in a real Fabric estate

I would not start by connecting every catalog and celebrating that everything is visible.

I would start with one high-value domain where the pain is already obvious. For example, a customer or product dataset managed in a Google lakehouse that Fabric users need for reporting, warehouse modeling, or data science.

Then I would validate three paths.

**First, discovery.** Can the Fabric team find the right tables and understand what they represent without asking five people?

**Second, consumption.** Can the expected Fabric workload use the table in a way that is reliable enough for the audience? That might be Spark, SQL-oriented work, a semantic model, or a downstream transformation.

**Third, operations.** Can the team explain access, ownership, refresh expectations, failure modes, and schema changes before the table becomes business critical?

If the answer is yes, the pattern is useful. If the answer is no, the problem is not the feature. The problem is the missing operating model.

## Copy less, but think more

The best version of this capability is not "never copy data again."

That is too simplistic.

Sometimes a copied or materialized dataset is still the right answer. Performance, isolation, cost control, compliance, historical snapshots, and semantic stability all matter. Remote or mirrored access is not automatically better than a curated table in Fabric.

The better rule is: do not copy by default just because the source is in another cloud.

Use OneLake catalog mirroring to inspect, expose, and validate the source. Then choose deliberately:

- Query it where it is.
- Create a shortcut or mirrored access pattern.
- Materialize a curated Fabric table.
- Build a semantic model on a reviewed subset.
- Reject it until ownership and quality are clear.

That is a stronger platform conversation than "move everything first."

![Start small rollout path](/data-ninja-ai-lab/assets/blog/google-lakehouse-onelake/diagrams/03-start-small-rollout.svg)

## The practical takeaway

This preview is a good signal for Fabric architects: the lakehouse boundary is getting more flexible, but the governance boundary still has to be designed.

If your organization already has valuable Iceberg tables outside Fabric, this is worth testing. Not as a broad migration plan. As a controlled way to make cross-cloud analytical data easier to discover, easier to use, and easier to govern from the Fabric side.

Start with one catalog. Pick one domain. Write down the ownership model. Test with real consumers. Decide what deserves to become a production dependency.

That is how this becomes platform leverage instead of another integration shortcut people regret six months later.

## Sources

- [Bring your Google Lakehouse Runtime Catalog data to OneLake (Preview)](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blog/Bring-your-Google-Lakehouse-Runtime-Catalog-data-to-OneLake/ba-p/5360492)
- [Use Iceberg tables with OneLake](https://learn.microsoft.com/en-us/fabric/onelake/onelake-iceberg-tables)
- [Unify Data Sources With OneLake Shortcuts](https://learn.microsoft.com/en-us/fabric/onelake/onelake-shortcuts)

## About Shai

Shai Karmani is a senior data and AI practitioner focused on Microsoft Fabric, Power BI, analytics engineering, and practical AI systems. You can connect with him on [LinkedIn](https://www.linkedin.com/in/shai-kr).
