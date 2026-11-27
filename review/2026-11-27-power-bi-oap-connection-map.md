---
layout: post
title: "The Two-Workspace Map That Makes Power BI OAP Predictable"
date: 2026-11-27
description: A practical rollout plan for Power BI outbound access protection, including report-to-model rules, model-to-source rules, connection inventory, and release evidence.
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

Power BI outbound access protection is now generally available for semantic models and interactive reports.

The feature is easy to describe: block outbound connections by default, then allow the destinations a workspace needs. The rollout becomes more interesting when one report crosses two separate workspace policies.

The report workspace controls whether the report can reach a semantic model in another workspace. The model workspace controls whether that semantic model can reach its data sources.

Those are separate decisions. Allowing the report-to-model connection does not authorize the model-to-source connection. A team that treats OAP as one workspace switch can approve the first hop, miss the second, and discover the gap when a report will not open or a model will not refresh.

I would roll it out with a two-workspace connection map and a small release test for every path.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/power-bi-oap-connection-map/01-control-map-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/power-bi-oap-connection-map/01-control-map.webp" alt="Two Power BI workspaces control the report-to-model and model-to-source connections separately"></picture></figure>

## Start with the connection hops

An interactive report can always query a semantic model in its own workspace. When the model is in another workspace, the report workspace needs a Power BI Semantic Model exception for that destination.

That rule applies at the workspace level, not to one report.

The semantic model has a different outbound path. Its workspace policy controls the sources the model reaches, including Azure SQL, a Fabric Lakehouse or Warehouse, and gateway-backed sources.

The failure points tell you which policy to inspect:

| Symptom | First policy to inspect |
| --- | --- |
| A cross-workspace report cannot open | Report workspace exception for the semantic model |
| Import refresh fails | Model workspace exception for the data source |
| DirectQuery query fails | Model workspace exception for the data source |
| Direct Lake framing fails | Model workspace exception for the required connection |

This separation is useful. A report team can approve only the shared semantic models it needs. A model team can approve only the data sources its models need. Neither team has to broaden the other workspace's outbound policy.

## Inventory the connection type, not just the item location

One detail in Microsoft's GA guidance deserves attention: a semantic model might need an OAP exception for a Lakehouse or Warehouse in the same Fabric workspace.

Why? SQL and ADLS Gen2 connections are treated as external connections even when the destination item sits in the same workspace. Direct Lake over OneLake can use an ADLS Gen2 connection. Direct Lake over SQL uses the Warehouse SQL endpoint.

The visible workspace layout is not enough to predict the rule. The actual connection type matters.

For each semantic model, record:

- The report workspace and semantic model workspace.
- Whether the report uses a local or remote model.
- Every model data source and its connection type.
- Import, DirectQuery, or Direct Lake behavior.
- The gateway or cloud connection involved.
- The owner, business reason, and review trigger for each exception.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/power-bi-oap-connection-map/02-inventory-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/power-bi-oap-connection-map/02-inventory.webp" alt="A Power BI OAP inventory separates report connections, model connections, and acceptance evidence"></picture></figure>

This inventory also prevents a common troubleshooting mistake. If a report is rebound to another model, the report workspace policy may need a new exception. If the model keeps its location but changes source endpoint or connection type, the model workspace policy may need the change.

The asset moved in one case. The connection changed in the other. OAP evaluates the connection.

## Test each layer separately

A green report page does not prove the whole policy is correct.

Use a representative test workspace and verify both hops:

1. Open the report with the identity and permissions a real viewer uses.
2. For an Import model, run a refresh and check the result.
3. For DirectQuery, run representative report queries.
4. For Direct Lake, check access to the required tables and framing behavior.
5. Point a test asset at one unapproved destination and confirm OAP blocks it.

The negative test matters. It proves the boundary still works after the required exceptions are added.

There is another boundary to keep clear. For interactive reports, OAP governs the report's connection to the semantic model. It does not govern browser-originated requests such as an `ImageURL` or a custom visual. Those requests need controls in the user's network and the relevant security layers. Do not use a successful OAP rollout as evidence that every browser connection is controlled.

## Use the APIs to manage rule drift

Fabric exposes REST operations to get and set outbound cloud connection rules for a workspace.

That opens a practical operating pattern for larger estates:

- Export current rules on a schedule.
- Compare them with the approved connection inventory.
- Flag a destination with no owner or business reason.
- Review changes after a report rebind, model move, source endpoint change, or gateway change.
- Keep the test evidence with the rule change.

Automation should not invent approvals. It should make drift visible and make the approved state reproducible.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/power-bi-oap-connection-map/03-rollout-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/power-bi-oap-connection-map/03-rollout.webp" alt="A four-step Power BI OAP rollout covers discovery, configuration, verification, and drift review"></picture></figure>

## A practical release record

For each rollout batch, I would keep one short record:

- Reports and semantic models in scope.
- Required report-to-model exceptions.
- Required model-to-source exceptions.
- Connection types and endpoints.
- Positive tests for viewer access and model operation.
- One negative test for an unapproved destination.
- Rule owner, approval reason, and next review date.

That record is more useful than a screenshot of the workspace toggle. It explains what the policy permits and proves the paths the workload needs.

## The practical takeaway

Power BI OAP becomes predictable when the team stops treating a workspace as one security box.

Map the report-to-model hop. Map the model-to-source hop. Inventory the actual connection type, even when both items appear in the same workspace. Test approved and blocked paths separately. Then use the REST APIs to detect drift from the approved state.

The result is a smaller allowlist, clearer ownership, and a rollout the operations team can verify.

## Sources

- [Workspace outbound access protection for Power BI semantic models and interactive reports (Generally Available)](https://community.fabric.microsoft.com/t5/Power-BI-Updates-Blog/Workspace-outbound-access-protection-for-Power-BI-semantic/ba-p/5435053)
- [Workspace outbound access protection overview](https://learn.microsoft.com/en-us/fabric/security/workspace-outbound-access-protection-overview)
- [Workspace outbound access protection for semantic models](https://learn.microsoft.com/en-us/fabric/security/workspace-outbound-access-protection-semantic-models)
- [Workspace outbound access protection for Power BI reports](https://learn.microsoft.com/en-us/fabric/security/workspace-outbound-access-protection-power-bi-reports)
- [Enable workspace outbound access protection](https://learn.microsoft.com/en-us/fabric/security/workspace-outbound-access-protection-set-up)
- [Get Outbound Cloud Connection Rules](https://learn.microsoft.com/en-us/rest/api/fabric/core/workspaces/get-outbound-cloud-connection-rules)
- [Set Outbound Cloud Connection Rules](https://learn.microsoft.com/en-us/rest/api/fabric/core/workspaces/set-outbound-cloud-connection-rules)

---

**Shai Karmani**  
Data, Microsoft Fabric, Power BI, and practical AI  
[Connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr)
