---
layout: default
title: Bring AWS Glue Iceberg Tables Into OneLake Without Rebuilding the Lake
date: 2026-08-06
description: AWS Glue catalog mirroring gives Fabric teams a practical cross-cloud path: keep Iceberg data in Amazon S3, mirror the catalog into OneLake, and build Power BI or Fabric experiences from a governed analytics surface.
author: Shai Karmani
author_url: https://www.linkedin.com/in/shai-kr
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
    <h1>Bring AWS Glue Iceberg Tables Into OneLake Without Rebuilding the Lake</h1>
    <p class="byline"><img class="avatar avatar-small" src="{{ '/assets/img/shai-karmani-profile.png' | relative_url }}" alt="Shai Karmani"> by <a href="https://www.linkedin.com/in/shai-kr">Shai Karmani</a> · Aug 6, 2026</p>
    <p class="dek">AWS Glue catalog mirroring gives Fabric teams a practical cross-cloud path: keep Iceberg data in Amazon S3, mirror the catalog into OneLake, and build Power BI or Fabric experiences from a governed analytics surface.</p>
  </header>

  <div class="article-body" markdown="1">
![AWS Glue catalog mirroring flow into OneLake]({{ '/assets/blog/aws-glue-onelake-mirroring/01-cross-cloud-catalog-flow.svg' | relative_url }})

Most data platforms do not fail because the team picked the wrong lake.

They fail because the organization ends up with several lakes, several catalogs, several security models, and no clean way for the analytics layer to use them without creating another copy of everything.

That is why AWS Glue catalog mirroring in Microsoft Fabric is worth a serious look.

Microsoft describes the preview as a way to integrate data cataloged in AWS Glue with the rest of your data in Fabric. The important detail is this: Fabric mirrors the catalog structure into OneLake, but the underlying Iceberg table data stays in Amazon S3 and is accessed through shortcuts.

That changes the conversation.

This is not a full migration story. It is not a promise that every AWS lakehouse can suddenly become a Fabric lakehouse with no architecture work. It is a practical bridge for teams that already have Iceberg tables cataloged in AWS Glue and want those assets to be usable from Fabric, SQL analytics endpoints, Power BI Direct Lake, and other Fabric workloads.

Used well, this can reduce duplicate data movement and give BI teams a cleaner path into cross-cloud data.

Used carelessly, it can create a bigger catalog with the same ownership problems as before.

The feature is useful. The operating model around it matters more.

## What actually happens

When you create a mirrored AWS Glue catalog item in Fabric, Fabric creates a mirrored catalog item and a SQL analytics endpoint for that item.

The AWS Glue catalog provides the databases, tables, and schema metadata. The Iceberg table data remains in S3. Fabric uses shortcuts to access that data, and the mirrored tables can be queried from the SQL analytics endpoint, used from Power BI with Direct Lake mode, or reached by other Fabric workloads.

That is a powerful pattern for organizations that are already split across Microsoft and AWS.

A common enterprise reality looks like this:

- product or operational teams have data in AWS;
- analytics teams are standardizing on Fabric and Power BI;
- executives want one reporting layer;
- engineering does not want another copy pipeline just to make a dashboard possible;
- governance teams still need to understand who can read what.

AWS Glue catalog mirroring gives those teams a middle path.

You can expose selected Iceberg tables to Fabric without starting with a full data migration. That is the benefit.

But the benefit depends on the quality of the pilot.

## The pilot I would run first

I would not start by mirroring a broad catalog.

I would start with one domain, one decision group, and one real analytics use case.

For example, pick a set of Iceberg tables that support customer activity, operational events, inventory, finance, or product usage. Then prove the pattern end to end:

1. Can Fabric discover the right AWS Glue databases and tables?
2. Can the IAM credential read the required Glue metadata and S3 paths?
3. If AWS Lake Formation governs the catalog, does the same identity have the right permissions there?
4. Can the SQL analytics endpoint query the tables with acceptable latency?
5. Can Power BI Direct Lake produce the expected report experience?
6. Can the data owner explain what should and should not be exposed?

That is the pilot. Not the UI wizard. Not the first successful query. The pilot is whether the cross-cloud data path can be trusted by the people who have to operate it.

![AWS Glue mirroring readiness checklist]({{ '/assets/blog/aws-glue-onelake-mirroring/02-readiness-checklist.svg' | relative_url }})

## Identity and access are the real design work

The docs are very clear on the authentication model. AWS Glue catalog mirroring uses a delegated authorization model. The person creating the connection provides an AWS IAM credential, and Fabric uses that credential for the initial catalog scan and ongoing metadata sync.

That credential needs read access to AWS Glue metadata and to the Amazon S3 locations that store the Iceberg data. If AWS Lake Formation governs the catalog, that same identity also needs the right Lake Formation permissions.

This is where the architecture decision lives.

The weak pattern is to create a broad IAM user, connect it to Fabric, mirror too much, and call the result a platform win.

The stronger pattern is to treat the IAM identity as a product boundary:

- which Glue databases can it see;
- which S3 buckets and paths can it read;
- which Lake Formation grants apply;
- who owns the credential lifecycle;
- who reviews table selection;
- what happens when new tables are synced automatically.

That last point matters. The Fabric docs say the Automatically sync future tables option is enabled by default when creating a mirrored AWS Glue catalog. That can be useful if the mirrored scope is tightly controlled. It can also surprise teams if the selected database becomes a dumping ground for unrelated tables.

Automatic sync is not bad. It just needs a boundary.

## Why this is good for Power BI teams

Power BI teams often get pulled into cross-cloud problems late.

The business wants a report. The data exists in AWS. The analytics standard is Fabric and Power BI. Someone proposes a copy job. Someone else proposes a warehouse build. Another team asks why the existing Iceberg tables cannot just be used.

AWS Glue catalog mirroring gives Power BI teams a better option to evaluate.

Instead of treating AWS data as external data that must be copied first, Fabric can expose a mirrored catalog item and a SQL analytics endpoint. Power BI can connect through Direct Lake mode. Other Fabric workloads can participate in the same architecture.

That does not remove the need for modeling.

A mirrored Iceberg table is not the same thing as a well-designed semantic model. The BI layer still needs metric definitions, relationships, naming discipline, security decisions, and report design. The mirrored catalog is the access path, not the finished product.

That distinction is important.

The win is not "we can see AWS tables in Fabric." The win is "we can build governed Fabric and Power BI products from selected AWS Iceberg data without creating a duplicate lake first."

## The operating model I would document

For a serious implementation, I would write down four ownership lanes.

![Operating model for AWS Glue mirrored catalogs in Fabric]({{ '/assets/blog/aws-glue-onelake-mirroring/03-operating-model.svg' | relative_url }})

### 1. AWS data owner

This person or team owns the source meaning.

They know what the tables represent, what quality issues exist, what changes might break downstream analytics, and whether the selected tables are appropriate for broader use.

### 2. Platform owner

This person owns the Fabric connection, mirrored catalog item, sync behavior, workspace placement, and operational runbook.

They should know how the IAM credential is managed and what to do when metadata stops syncing or a table disappears.

### 3. BI owner

This person owns the Power BI model or report layer built on top of the mirrored data.

They are responsible for turning tables into measures, definitions, relationships, and a usable experience.

### 4. Governance owner

This person reviews exposure risk.

They care about which tables are selected, which identity can read them, how sensitive data is handled, and whether automatic future table sync is acceptable for the selected scope.

If nobody owns one of those lanes, the pilot is not ready to expand.

## Where I would use this first

The best first use cases are not the biggest ones.

I would look for scenarios like:

- AWS Iceberg data that already has clear ownership;
- a bounded reporting need with a known audience;
- duplicated pipelines that exist mainly to feed Power BI;
- a Fabric workspace with mature owners;
- tables that do not require complex writeback or heavy transformation before analysis;
- an executive or operational report where freshness matters but a full migration is overkill.

That is where this feature can show value quickly.

It can also help platform teams have a better migration conversation. You do not need to decide between "copy everything now" and "do nothing until the migration is funded." You can run a controlled access pilot, learn where the real friction is, and decide what deserves migration later.

That is a much better starting point.

## The practical takeaway

AWS Glue catalog mirroring is one of those Fabric features that looks small if you only read the release note.

In practice, it points to something bigger: Fabric is becoming a more realistic analytics layer for organizations whose data is not all in one cloud.

That is useful.

But the teams that get the most value will not be the ones that mirror the most tables. They will be the ones that pick the right tables, define the right access boundary, and turn the mirrored catalog into a governed analytics product.

My recommendation would be simple:

Start with one AWS Glue database, one Fabric workspace, one Power BI use case, and one ownership map.

If that works, expand carefully.

If that does not work, you learned the right thing early.

## Sources

- [Microsoft Fabric What's New](https://learn.microsoft.com/en-us/fabric/fundamentals/whats-new)
- [AWS Glue catalog mirroring in Microsoft Fabric](https://learn.microsoft.com/en-us/fabric/mirroring/catalog-mirroring/aws-glue)
- [Tutorial: Configure mirrored AWS Glue catalog](https://learn.microsoft.com/en-us/fabric/mirroring/catalog-mirroring/aws-glue-tutorial)
- [Fabric Updates Blog board](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blogs/bg-p/fbc_fabricupdatesblogs)

---

Written by **Shai Karmani**. If you work with Microsoft Fabric, Power BI, data platforms, or practical AI systems, [connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr).

  </div>

  <section class="subscribe-card article-subscribe" aria-label="Subscribe to Data Ninja AI Lab updates">
    <div class="subscribe-orbit" aria-hidden="true"></div>
    <div class="subscribe-copy">
      <p class="subscribe-kicker">New posts by email</p>
      <h2>Get the next Data Ninja note when it goes live.</h2>
      <p>I send short updates only when a new practical Fabric, Power BI, analytics engineering, or AI article is published.</p>
    </div>
    <a class="subscribe-button" href="https://docs.google.com/forms/d/e/1FAIpQLSfzdHN_6hpK7X0OnN2q_TeR3OaQoPG0Llu447dgISWpfjyTCA/viewform">Subscribe to updates</a>
  </section>
</article>
