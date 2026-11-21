---
layout: post
title: "The 17-Day Power BI Copilot Readiness Plan Teams Can Use Now"
date: 2026-11-21
description: A practical readiness plan for the December 8, 2026 Microsoft Copilot tenant-setting change in Power BI and Fabric.
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
  .article-body table { display: block; max-width: 100%; overflow-x: auto; }
  .subscribe-orbit { display: none; }
}
.review-visual { width: 100%; max-width: 100%; margin: 34px 0 10px; overflow: hidden; }
.review-visual img { display: block; width: 100%; max-width: 100%; height: auto; }
</style>

**Review draft. Direct link only.**

On December 8, 2026, Microsoft plans to change two default tenant settings in Power BI and Fabric.

Microsoft Copilot will default to on. Standalone Power BI Copilot will default to off. Existing administrator choices will be preserved.

That sounds like a settings change. For a Power BI team, it is a useful deadline for checking something larger: who can use which Copilot experience, against which content, under which permissions, with what evidence that the answers are trustworthy.

There are 17 days between this article's publication and the planned change. That is enough time for a focused readiness cycle if the scope stays practical.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/power-bi-copilot-readiness/01-transition-map-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/power-bi-copilot-readiness/01-transition-map.webp" alt="The transition from standalone Power BI Copilot entry points to Microsoft Copilot alongside continuing report and authoring Copilot experiences"></picture></figure>

## Start by separating the Copilot experiences

The word "Copilot" now refers to several different experiences around Power BI. Treating them as one switch creates bad rollout decisions.

Microsoft's November update says it plans to end support for standalone Power BI Copilot on the web, including Home, Teams, and Power BI mobile, by the end of January 2027. Microsoft also says official deprecation, end-of-support, and retirement dates have not yet been announced.

That transition does not mean every Power BI Copilot capability disappears.

Report Copilot remains supported in the Power BI service, Power BI Desktop, and Power BI mobile. Copilot in web modeling and DAX query view also remains available and supported. App-scoped Copilot in Power BI workspace apps is a separate preview experience planned for removal in January 2027.

Microsoft Copilot with Fabric IQ is the planned direction for asking questions grounded in Power BI and Fabric data. The available capabilities depend on licensing, entitlements, content permissions, and the current preview requirements.

The first task is therefore an experience inventory:

| Experience | Current user group | Tenant control | Planned change | Owner |
| --- | --- | --- | --- | --- |
| Microsoft Copilot in Power BI and Fabric | Named users or groups | Microsoft Copilot tenant setting | Defaults on December 8 if no existing choice overrides it | Fabric admin |
| Standalone Power BI Copilot | Existing users | Standalone experience setting | Defaults off December 8; transition continues | Fabric admin |
| Report Copilot | Eligible report users and authors | Relevant Copilot and capacity controls | Remains supported | BI platform owner |
| Web modeling and DAX query view Copilot | Model authors | Relevant authoring controls | Remains supported | Semantic model owner |
| App-scoped Copilot | Workspace app audiences | Workspace app setup | Planned removal in January 2027 | App owner |

Do not copy this table and call the inventory finished. Add the actual security groups, capacities, reports, semantic models, owners, and support contacts from your tenant.

## Build an effective-access contract

A tenant setting does not tell you what a user can actually do.

Microsoft documents Fabric IQ availability in Microsoft Copilot for users who meet the relevant licensing and access conditions. Basic and Premium experiences have different capabilities. Work IQ, which can use Microsoft 365 work data such as emails, meetings, chats, and documents, is a Premium capability. Fabric IQ can ground supported questions in Power BI and Fabric data, subject to the user's content permissions and licensed access.

That means the effective experience is the intersection of four controls.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/power-bi-copilot-readiness/02-access-contract-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/power-bi-copilot-readiness/02-access-contract.webp" alt="Four controls determine effective Copilot access: tenant policy, user entitlement, Power BI permissions, and semantic model quality"></picture></figure>

### 1. Tenant policy

Record the current value of the Microsoft Copilot setting and the standalone Power BI Copilot setting. Capture the security-group scope and the administrator who approved it.

Because existing admin choices are preserved, the December 8 default change should not be treated as proof that every tenant will suddenly have a different experience. Check the actual configuration.

### 2. User entitlement

List the pilot users and the licenses or entitlements they hold. Document whether the expected test uses Fabric IQ only or also depends on Work IQ.

A test result from a Premium user is not evidence for a Basic user. Keep the user persona attached to every result.

### 3. Content permission

Choose the reports and semantic models the pilot can access. Verify the user's Power BI license, item permissions, workspace role, and row-level or object-level security.

The assistant should not become a second permission system. It should respect the content access the user already has.

### 4. Semantic readiness

Permissions can be correct while answers remain weak.

Measure names, descriptions, synonyms, relationships, date logic, hidden fields, RLS, and business definitions all affect the quality of a grounded answer. A model that works for a carefully designed report can still be ambiguous when a user asks a broad question in natural language.

This is where BI engineering becomes part of AI governance. The semantic model is the contract between the business question and the answer.

{% include yt-embed.html id="Ybn1boUXbt4" title="Make Power BI Copilot Answer Right: Prep Data for AI" duration="8:38" kicker="Related PBI 101 walkthrough" %}

## Test decisions, not demo prompts

A demo question such as "summarize this report" can prove that the feature responds. It does not prove that the experience is ready for business use.

Build a small acceptance set around real decisions. For each approved model, include:

- one straightforward KPI question;
- one question that requires a time comparison;
- one question where RLS changes the result by user;
- one ambiguous business term that should trigger clarification;
- one unsupported question that should not produce a confident answer;
- one request that cites or identifies the Power BI content used;
- one follow-up question that depends on the previous context.

For every test, record the user, license, entry point, content permission, prompt, expected result, observed result, citation or source context, and reviewer.

Use at least two user personas. One should have broad content access. The other should have restricted access. If both receive the same sensitive result, stop the pilot and investigate.

The acceptance outcome does not need to be "perfect." It needs to be explicit:

- approved for this audience and these models;
- approved with documented limitations;
- blocked until model metadata or permissions are fixed;
- blocked because the experience or entitlement is not suitable.

That is a decision a platform owner can defend later.

## A 17-day rollout plan

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/power-bi-copilot-readiness/03-rollout-plan-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/power-bi-copilot-readiness/03-rollout-plan.webp" alt="A 17-day readiness plan covering inventory, pilot selection, answer testing, remediation, rollout decision, and monitoring"></picture></figure>

### Days 1 to 3: inventory

Capture the two tenant settings, security groups, licenses, current Copilot entry points, approved capacities, relevant reports, semantic models, and owners.

Mark every assumption that still needs evidence. A screenshot without a timestamp and tenant context is not a durable record.

### Days 4 to 7: select the pilot

Use one audience and two trusted semantic models. Pick models with named owners, current refreshes, documented measures, and meaningful RLS if the production estate uses it.

Avoid a tenant-wide pilot. Broad scope increases noise before the team has a repeatable test.

### Days 8 to 11: test answers

Run the acceptance set with both personas. Review the responses with a BI owner who understands the metric definitions and a platform owner who understands access controls.

Capture failures as model, permission, entitlement, experience, or user-guidance issues. That classification determines who fixes them.

### Days 12 to 14: fix and document

Improve measure descriptions, synonyms, model instructions, relationships, or security where needed. Update the experience map and support notes.

Write a one-page user guide that names the approved content, useful question patterns, known limits, and the support route for a wrong or sensitive answer.

### Days 15 to 17: decide and monitor

Record the approved audience, models, tenant-setting scope, evidence, limitations, owner, and next review date.

After rollout, monitor adoption, repeated question failures, permission issues, and semantic model changes. A model update can invalidate earlier answer evidence even when the tenant setting stays unchanged.

## The readiness record

A compact record can fit on one page:

| Field | Evidence |
| --- | --- |
| Tenant settings | Current values, group scope, timestamp, approver |
| Experience map | Standalone, Microsoft Copilot, report, modeling, and app-scoped paths |
| Pilot audience | Users, roles, licenses, and expected entry point |
| Approved content | Reports and semantic models with owners |
| Security | Workspace roles, item permissions, RLS and OLS checks |
| Answer tests | Prompts, expected results, observed results, citations, reviewer |
| Decision | Approved, limited, or blocked |
| Operations | Support owner, monitoring signal, and next review date |

This turns a product announcement into a controlled platform decision.

## The practical takeaway

The December 8 change gives Power BI teams a clear checkpoint. Use it to verify the real access path from tenant policy to user entitlement, Power BI permission, semantic model, and observed answer.

The strongest outcome is not that Microsoft Copilot is enabled. It is that a named audience can use approved Power BI content, the team has tested the answers that matter, and an owner knows what to do when the evidence changes.

Seventeen days is enough for that.

## Sources

- [Power BI November 2026 Feature Summary](https://community.fabric.microsoft.com/t5/Power-BI-Updates-Blog/Power-BI-November-2026-Feature-Summary/ba-p/5414287)
- [Copilot in Power BI and Microsoft Fabric](https://learn.microsoft.com/en-us/fabric/iq/connectors/copilot-power-bi-fabric)
- [Fabric IQ in Microsoft 365 Copilot](https://learn.microsoft.com/en-us/fabric/iq/connectors/microsoft-365-copilot-overview)
- [Prepare your data for AI](https://learn.microsoft.com/en-us/power-bi/create-reports/copilot-prepare-data-ai)
- [Copilot tenant settings](https://learn.microsoft.com/en-us/fabric/admin/service-admin-portal-copilot)

---

**Shai Karmani**  
Data, Microsoft Fabric, Power BI, and practical AI  
[Connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr)
