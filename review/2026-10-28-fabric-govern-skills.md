---
layout: post
title: "Build a Fabric Governance Loop Your AI Agent Can Explain"
date: 2026-10-28
description: The OneLake catalog Govern experience and Govern Skills create a practical path from estate-wide findings to reviewed, evidence-backed remediation.
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

Microsoft has made the Govern experience in the OneLake catalog generally available. It now puts tenant and owner views, governance insights, recommended actions, domains, capacities, workspaces, tags, and policies into one operating surface.

The same announcement introduces Govern Skills for Fabric. These reusable instructions give compatible AI coding agents a governance workflow, not just API access. Microsoft describes the workflow as audit, explain, recommend, and remediate, with evidence, priority, uncertainty handling, and confirmation before sensitive actions.

That combination is the interesting part.

The portal can show where governance attention is needed. The skills can make the investigation repeatable. A human still owns the decision and the risk. Used together, they can turn governance from a periodic report into an evidence-backed operating loop.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/fabric-govern-skills/01-governance-loop-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/fabric-govern-skills/01-governance-loop.webp" alt="A Fabric governance loop moves from estate insight through agent-assisted investigation to approved remediation and verification"></picture></figure>

## Start with the operating model, not the prompt

An AI agent can inventory a tenant quickly. That does not make the inventory useful, and it definitely does not make every proposed fix safe.

The first design decision should be the operating model:

1. **Observe:** use the Govern experience to establish the current estate view.
2. **Audit:** let the skill collect supported evidence for a defined governance question.
3. **Explain:** require the finding, scope, evidence, impact, and uncertainty.
4. **Recommend:** generate a proposed action with priority and expected outcome.
5. **Approve:** keep sensitive or bulk changes behind an explicit human decision.
6. **Verify:** read the resulting state and preserve the before-and-after evidence.

This structure gives the agent a bounded job. It also gives the platform team a way to review quality without reading every command transcript.

## What the Govern experience contributes

The OneLake catalog Govern section gives Fabric administrators an estate-wide view and data owners a scoped view of the items they own.

The tenant view covers governance insights and recommended actions across Fabric metadata, including domains, capacities, workspaces, and items. The owner view narrows the same idea to content the user can update. Microsoft also exposes the underlying governance report in the Admin monitoring workspace, with a semantic model that can be copied or used for custom reporting.

This is valuable because it creates a shared starting point. An admin and a domain owner can discuss the same classes of gaps, such as unassigned workspaces, inactive items, missing descriptions, weak endorsement coverage, or missing sensitivity labels.

There are two practical limits to keep in mind:

- Estate insights depend on admin monitoring storage that refreshes daily, so the view is not a live transaction log.
- Availability is rolling out by region, and documented limitations include cross-tenant scenarios, guest users, Private Link, subitems, and some third-party workload coverage.

Those limits should become part of the evidence returned by an agent. A finding based on yesterday's snapshot should say so.

## What Govern Skills contribute

Giving an agent a Fabric API endpoint solves connectivity. It does not solve governance judgment.

Govern Skills package the jobs to perform, the evidence to collect, the conditions to evaluate, and the safer path to remediation. The initial coverage spans three governance pillars:

- **Health:** tenant inventory, empty domains, unassigned workspaces, inactive items, and missing metadata.
- **Protect:** sensitivity label coverage and domain default labels.
- **Trust:** descriptions, tags, endorsements, and prioritization of curation work.

Microsoft says the skills use supported Fabric admin APIs, surface uncertainty instead of inventing missing details, and request confirmation before sensitive or destructive actions. Some health scenarios can perform bulk changes, including workspace-to-domain assignment and domain administrator management.

That is why the confirmation boundary matters. The value is not autonomous change for its own sake. The value is a repeatable investigation that can prepare a clear decision package.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/fabric-govern-skills/02-responsibility-split-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/fabric-govern-skills/02-responsibility-split.webp" alt="The Fabric portal prioritizes governance attention while Govern Skills repeat the evidence collection workflow"></picture></figure>

## Define a finding contract

Before running a tenant-wide health check, define the output every finding must contain.

I would require:

| Field | Purpose |
| --- | --- |
| Scope | Tenant, domain, workspace, item, or owner boundary |
| Observation time | When the source data was last refreshed or queried |
| Finding | The condition that was detected |
| Evidence | IDs, counts, policy state, and source used |
| Impact | Why the gap matters operationally |
| Confidence | Confirmed, incomplete, or blocked by a documented limitation |
| Recommendation | Proposed next action and owner |
| Approval | Who may authorize the change |
| Verification | The post-change state that proves completion |

This contract makes agent output comparable across runs. It also stops a recommendation from appearing more certain than its evidence.

For example, an unassigned workspace is easy to detect. Assigning it to the correct domain requires business context. The agent can identify the gap and suggest a domain from available metadata, but the domain owner should confirm the classification before a bulk assignment.

## Use two execution lanes

I would separate governance work into two lanes.

### Lane 1: read and recommend

This is the default lane. It inventories the estate, evaluates supported checks, explains findings, and produces a prioritized worklist. It should run on a schedule and preserve the evidence for each scan.

The first few runs should be evaluated for noise. A technically correct finding can still be operationally useless if it ignores ownership exceptions, rollout status, or approved temporary states.

### Lane 2: approved remediation

Only reviewed findings enter this lane. It should use the narrowest available permission, capture the approved scope, execute one bounded change, and then verify the result.

Bulk operations deserve additional gates:

- a dry-run list of affected resources
- an explicit owner and approver
- a recorded policy or decision basis
- a maximum change count per run
- a rollback or correction path
- a final read showing the new state

The agent can prepare and execute the procedure. It should not silently decide that every anomaly is a defect.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/fabric-govern-skills/03-acceptance-gates-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/fabric-govern-skills/03-acceptance-gates.webp" alt="Five acceptance gates require a baseline, evidence, explanation, approval, and verification"></picture></figure>

## A practical first pilot

The best pilot is small enough to verify but useful enough to expose real process gaps.

### 1. Establish a baseline

Open the Govern section and record the current health, protection, and trust indicators. Note the data refresh time and any regional or tenant limitations.

### 2. Run one read-only health check

Ask the agent to identify unassigned workspaces and empty domains. Require the finding contract above. Do not authorize changes.

### 3. Review ten findings manually

Confirm that the resource identity, evidence, suggested owner, and priority match what an administrator sees. Record false positives and missing business context.

### 4. Approve one low-risk correction

Choose a workspace with a confirmed target domain. Capture the proposed assignment, approver, expected result, and rollback path.

### 5. Verify the new state

Read the workspace assignment again and preserve the result. Remember that the Govern insight may not reflect the change until its next refresh.

### 6. Measure the loop

Track coverage and closure, not the number of prompts:

- percentage of workspaces assigned to a domain
- percentage of items with useful descriptions
- sensitivity label coverage by domain
- findings with complete evidence
- findings accepted, rejected, or deferred by owners
- time from confirmed finding to verified correction

## The practical takeaway

The OneLake catalog Govern experience gives Fabric teams a common place to see governance posture and decide where to act. Govern Skills give AI agents a reusable procedure for investigating those gaps and preparing remediation.

The strongest implementation keeps both roles clear. The portal prioritizes attention. The agent gathers and explains evidence. The accountable owner approves the change. The workflow verifies the result.

That is a useful AI governance pattern because it improves speed without hiding the decision path.

## Sources

- [Fabric Updates Blog](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blogs/bg-p/fbc_fabricupdatesblogs)
- [Power BI Updates Blog](https://community.fabric.microsoft.com/t5/Power-BI-Updates-Blog/bg-p/fbc_pbiupdatesblog)
- [Govern your Microsoft Fabric data estate from one place with the OneLake catalog and Govern Skills](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blog/Govern-your-Microsoft-Fabric-data-estate-from-one-place-with-the/ba-p/5377369)
- [Govern and manage your Fabric data with the OneLake catalog](https://learn.microsoft.com/en-us/fabric/governance/onelake-catalog-govern)
- [Skills for Fabric overview](https://learn.microsoft.com/en-us/fabric/fundamentals/skills-for-fabric-overview)
- [Microsoft Skills for Fabric repository](https://github.com/microsoft/skills-for-fabric)

---

Written by **[Shai Karmani](https://www.linkedin.com/in/shai-kr)**.

If you work on Microsoft Fabric, Power BI, data engineering, or practical AI systems, feel free to [connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr).
