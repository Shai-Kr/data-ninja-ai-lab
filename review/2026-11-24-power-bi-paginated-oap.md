---
layout: post
title: "Build a Power BI Allowlist That Keeps Paginated Reports Working"
date: 2026-11-24
description: A practical rollout guide for Power BI paginated report outbound access protection, from connection inventory to positive and negative test evidence.
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
  .subscribe-orbit { display: none; }
}
.review-visual { width: 100%; max-width: 100%; margin: 34px 0 10px; overflow: hidden; }
.review-visual img { display: block; width: 100%; max-width: 100%; height: auto; }
</style>

**Review draft. Direct link only.**

Power BI paginated reports can now participate in workspace outbound access protection in preview.

That matters because an RDL can reach more than its primary dataset. A single render might query a Fabric Warehouse, call a semantic model through XMLA, use a gateway, fetch a map, and retrieve an external image. Those requests come from the Power BI service while it renders the report.

Outbound access protection changes the default. Connections are blocked unless the workspace policy allows the required connector and destination.

The useful outcome is a tighter network boundary without giving up print-ready operational, financial, or regulatory reporting. Getting there requires an inventory and a test plan. Enabling the switch first and discovering dependencies from render errors is not a rollout plan.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/power-bi-paginated-oap/01-render-path-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/power-bi-paginated-oap/01-render-path.webp" alt="Paginated report rendering path from request through the Power BI service and workspace outbound access protection to approved resources"></picture></figure>

## Start with the render path, not the viewer

The first design decision is understanding who makes the network call.

For paginated reports, the Power BI service retrieves report data and external resources during rendering. The viewer's browser is not fetching the external image or querying the report dataset directly.

That makes the report workspace policy the enforcement point for these outbound requests. If an approved data source has no matching rule, the report cannot retrieve that data. If a map or external image host is blocked, the main report can still render while that resource remains missing.

Opening the source URL from an administrator's laptop proves local reachability. It does not prove that the Power BI service can reach the same destination under the workspace policy.

## Inventory every connection the RDL needs

Use the report definition and its configured connections as the source of truth.

| Dependency | Evidence to record | Typical rule decision |
| --- | --- | --- |
| Data source | Connector, server, database, connection owner | Approved cloud or gateway connection |
| Power BI semantic model | Workspace, model, XMLA connection string | Analysis Services or semantic model access |
| Fabric item | Lakehouse, Warehouse, or SQL endpoint | Matching connector and destination |
| External image or map | Exact host and report element | Web connection to the approved endpoint |
| Embedded image | Stored inside the RDL | No external request required |

Do not stop at the happy-path parameter value. A region parameter can send one report to different databases. A logo can come from one host while a map comes from another. A subscription can use a saved parameter set that the interactive test never exercises.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/power-bi-paginated-oap/02-connection-inventory-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/power-bi-paginated-oap/02-connection-inventory.webp" alt="Connection inventory for data sources, semantic models, external content, and paginated report execution variants"></picture></figure>

## Treat report-to-model and model-to-source as separate hops

A paginated report that queries a Power BI semantic model creates at least one connection from the report to the model. The model can then have its own connections to SQL, OneLake, a gateway, or another supported source.

Those are different policy boundaries.

The report workspace must allow the connection used to reach the semantic model. Microsoft specifically calls out the Analysis Services connector with an XMLA connection string for this pattern. If the semantic model sits in another workspace, the report workspace policy needs to allow that destination.

The semantic model workspace controls the model's own outbound access. Allowing the report-to-model hop does not automatically allow the model-to-source hop. A model refresh, DirectQuery request, or Direct Lake framing operation can still fail if its workspace policy blocks the underlying destination.

Draw both hops. Assign an owner to each policy. Test them separately.

## Use endpoint-specific rules for web content

External maps and images are easy to miss because they are not usually described as data sources. They are still outbound dependencies when the service retrieves them.

A broad Web exception gets a report working quickly, but it weakens the point of outbound protection. Prefer the narrowest supported endpoint rule for the hosts the report actually needs. Record why each host exists and which report element uses it.

Where practical, embed static images inside the RDL. Embedded images do not require an external request, which removes one rule and one runtime dependency. Dynamic images and map tiles still need explicit treatment.

## Build a test matrix before production

The acceptance test should prove required access and denied access.

### Positive tests

- Render each representative parameter combination.
- Run the report as a viewer, not only as the owner.
- Test every configured data source and semantic model path.
- Verify maps and external images visually.
- Run scheduled subscriptions and exports that matter to the business.
- Confirm gateway-backed sources use the intended connection.

### Negative tests

- Point a test copy at an unapproved web host and confirm the resource is blocked.
- Remove one non-production exception and verify the expected failure is visible.
- Bind a test report to a semantic model in an unapproved workspace and confirm access is denied.

A negative test proves that the policy is enforcing the boundary instead of merely coexisting with a working report.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/power-bi-paginated-oap/03-rollout-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/power-bi-paginated-oap/03-rollout.webp" alt="Six-step rollout from connection inventory to rule mapping, testing, denial proof, and production promotion"></picture></figure>

## Keep the rollout evidence small and useful

One row per required connection is enough:

| Field | Why it matters |
| --- | --- |
| Report and workspace | Identifies the protected item and policy boundary |
| Connector and destination | Defines the exception being approved |
| Business reason | Explains why the connection exists |
| Technical owner | Gives failures and changes an accountable owner |
| Positive test | Proves the required render path works |
| Negative test | Proves an unapproved path remains blocked |
| Review date | Prevents old exceptions from becoming permanent by accident |

Review the record when a report is rebound, a semantic model moves, a gateway changes, or an image host is replaced. Those are connection changes, even when the RDL layout looks identical.

## One preview detail to watch

Microsoft announced paginated report support as preview on November 24, 2026. At the time of writing, the general Microsoft Learn OAP overview still lists semantic models and interactive reports under Power BI and does not yet reflect paginated reports in its supported-item table.

Use the announcement as the current feature source, validate availability in the target region and tenant, and recheck the Learn documentation before a production rollout. Preview support and documentation can move independently.

## The practical takeaway

Outbound access protection gives paginated reports a clearer network contract: only approved connections should participate in the render.

Map data sources, semantic models, gateway connections, maps, and image hosts. Apply the minimum rules in a test workspace. Prove every business-critical render variant, then prove one unapproved destination stays blocked.

That produces something more useful than a security checkbox. It produces a report that still works and a boundary the team can explain.

## Sources

- [Paginated reports in Power BI support outbound access protection (Preview)](https://community.fabric.microsoft.com/t5/Power-BI-Updates-Blog/Paginated-reports-in-Power-BI-support-outbound-access-protection/ba-p/5435045)
- [Workspace outbound access protection overview](https://learn.microsoft.com/en-us/fabric/security/workspace-outbound-access-protection-overview)
- [Enable workspace outbound access protection](https://learn.microsoft.com/en-us/fabric/security/workspace-outbound-access-protection-set-up)

---

**Shai Karmani**  
Data, Microsoft Fabric, Power BI, and practical AI  
[Connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr)
