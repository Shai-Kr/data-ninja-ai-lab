---
layout: post
title: "OneLake Images Can Make Power BI Reports Feel Like Real Data Products"
date: 2026-08-23
description: OneLake file URLs in Power BI reports are now generally available. The practical opportunity is authenticated report media, cleaner visual systems, and less unmanaged web content in enterprise reports.
author: Shai Karmani
author_url: https://www.linkedin.com/in/shai-kr
---

<style>
@media (max-width: 760px) {
  .article { max-width: 100%; overflow-x: hidden; }
  .article-header { padding: 22px 14px; border-radius: 18px; }
  .article-header h1 { font-size: clamp(1.3rem, 5.8vw, 1.75rem); line-height: 1.16; overflow-wrap: anywhere; }
  .article-body { overflow-x: hidden; font-size: 0.98rem; }
  .article-body img { width: 100%; max-width: 100%; border-radius: 16px; }
  .subscribe-orbit { display: none; }
}
</style>

Power BI reports have always had a quiet media problem.

Teams want logos, product images, status icons, custom map files, visual backgrounds, and branded report elements. The easiest path is often a public URL, a SharePoint workaround, a manually embedded file, or something owned by one person who eventually leaves the company.

The August 2026 Power BI update makes a better pattern generally available: reports can use authenticated image and map files stored in OneLake.

That sounds like a small reporting feature. It is more useful than that.

It gives BI teams a controlled place for report media. The same Fabric estate that stores tables and files can also hold the visual assets that reports depend on. Power BI loads those assets using the viewer's Microsoft Entra identity, so the files do not need anonymous public access.

That is a cleaner architecture for enterprise reporting.

![OneLake report media architecture](/data-ninja-ai-lab/assets/blog/onelake-images-power-bi-reports/diagrams/01-onelake-report-media.svg)

## Why this matters

A report is not only measures and visuals. It is also the visual language people learn over time.

A warehouse KPI page might use status icons. A sales report might show product images. A logistics report might use custom map boundaries. An executive scorecard might use controlled brand assets. If those files live outside the governed data platform, the report has an unmanaged dependency.

That creates normal operational problems:

- A public image URL breaks.
- A product image changes without review.
- A report uses an asset the viewer cannot access.
- A deployment moves the report but not the media dependency.
- A map file is copied between workspaces with no owner.

OneLake file URLs do not solve every part of that. They do give teams a better default: store the report asset in Fabric, reference it from Power BI, and manage access deliberately.

That is the same direction Power BI and Fabric have been moving for a while. Reports are becoming less like isolated files and more like products on top of governed platform assets.

## The useful pattern

The simplest implementation is not complicated.

1. Store image or map files in the Files area of a Fabric lakehouse.
2. Copy the OneLake HTTPS URL for the file.
3. Use that URL in supported Power BI visuals.
4. Grant report viewers read access to the file or folder in OneLake.
5. Treat the file path as a dependency that needs ownership and deployment rules.

Power BI supports OneLake URLs in image visuals, card visuals, table and matrix image columns, slicers, custom icons, Azure Maps marker layers, and Shape Map custom map files.

That opens a few practical scenarios.

**Product image reports.** Product images can live beside the lakehouse data that describes the products. The report does not need a public CDN just to render a table with images.

**Controlled status icons.** KPI icons can be stored as a small shared asset library rather than copied into every report.

**Custom map files.** TopoJSON or GeoJSON files can sit in OneLake and be referenced from Shape Map visuals.

**Report design systems.** Brand elements, standard icons, and approved image assets can become part of the Power BI development workflow.

![Power BI OneLake media checklist](/data-ninja-ai-lab/assets/blog/onelake-images-power-bi-reports/diagrams/02-report-media-checklist.svg)

## The access rule is the part to remember

Power BI authenticates to OneLake as the report viewer.

That is the feature and the trap.

If the viewer can open the report but cannot read the file in OneLake, the image will not render. Access to the report or semantic model does not automatically grant access to the OneLake file.

So the design question is not only "where is the image URL?" It is also:

- Which workspace owns the media library?
- Who can update the files?
- Which report audiences can read the folders?
- Are we granting least privilege, or giving broad lakehouse access because it is faster?
- What happens when the report moves between dev, test, and production?

This is where many teams will need a tiny operating model.

Create a dedicated folder for report assets. Use stable naming. Keep images small enough for fast report rendering. Grant read access at the folder level where possible. Document which reports depend on which asset folders. Do not let every report author invent a new media storage pattern.

That is boring governance, which means it is probably important.

## Where I would use it first

I would not start with every report in the tenant.

I would start with one report where external media is already annoying:

- a product catalog report with image URLs,
- an operational scorecard with status icons,
- a regional report with custom map boundaries,
- or an executive report that needs approved brand assets.

Move the assets into OneLake. Wire the report to those URLs. Test with a normal viewer account, not only the developer account. Then write down the ownership model before copying the pattern.

The test is simple: if a future developer can find the files, understand who owns them, and know how access works, the pattern is useful.

![OneLake report asset operating model](/data-ninja-ai-lab/assets/blog/onelake-images-power-bi-reports/diagrams/03-operating-model.svg)

## The bigger signal

This is not the loudest feature in the August Power BI update. Modern visual defaults and theme customization will get more attention. Semantic model refresh controls will matter for operations. Copilot improvements will get the AI headlines.

But OneLake file URLs are a good example of a smaller feature that makes the platform feel more complete.

Enterprise BI has a lot of these edges. The model is governed, but the images are not. The report is deployed, but the map file is a copy. The data is protected, but the logo comes from a public link. Each edge is small. Together they make the estate harder to operate.

OneLake image and map files give Power BI teams a better answer for one of those edges.

The best use is not decorative. It is architectural.

Put report media where it can be owned, secured, reused, and reviewed.

That is how reports start to feel less like one-off dashboards and more like real data products.

## Sources

- [Power BI August 2026 Feature Summary](https://community.fabric.microsoft.com/t5/Power-BI-Updates-Blog/Power-BI-August-2026-Feature-Summary/ba-p/5348434)
- [See What's New in the August 2026 Power BI Update](https://learn.microsoft.com/en-us/power-bi/fundamentals/whats-new)
- [Use OneLake image and map files in Power BI reports](https://learn.microsoft.com/en-us/power-bi/visuals/power-bi-onelake-files)
- [Visual defaults in Power BI reports](https://learn.microsoft.com/en-us/power-bi/create-reports/power-bi-reports-visual-defaults)

---

Written by [Shai Karmani](https://www.linkedin.com/in/shai-kr), a senior data and BI practitioner focused on Microsoft Fabric, Power BI, analytics engineering, and practical AI systems.
