---
layout: post
title: "The Governance Map Every Microsoft Data Team Needs for the OneLake Era"
date: 2026-11-18
description: A practical operating model for moving from Microsoft Purview data governance to OneLake Catalog while preserving security, coverage, ownership, and evidence.
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

Microsoft made a significant data governance decision at Ignite 2026: OneLake Catalog is now Microsoft's data governance product, and Microsoft Purview Unified Catalog plus the classic Purview data governance capabilities are being retired.

This is bigger than moving metadata from one catalog screen to another.

OneLake Catalog governs Fabric data and data connected to OneLake through native items, shortcuts, mirrored databases, federated catalogs, and IQ Shares. Microsoft also says clearly that this is a new model, not a feature-for-feature replacement for Purview Data Governance.

Existing Purview data governance capabilities remain in maintenance mode through November 12, 2027. Purview Data Security and Compliance, including Information Protection, Data Loss Prevention, Insider Risk Management, and Data Security Posture Management, are not part of this retirement.

The practical response is a coverage map. For every governance obligation, decide what moves to OneLake Catalog, what stays in Purview security and compliance, and what needs a partner platform or another control.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/onelake-governance-transition/01-governance-map-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/onelake-governance-transition/01-governance-map.webp" alt="A governance coverage map separates OneLake Catalog, continuing Purview security and compliance capabilities, and partner coverage for the broader data estate"></picture></figure>

## Start with obligations, not product names

A governance program already has responsibilities that exist independently of any Microsoft product:

- people need to find trusted data;
- data owners need to curate definitions and ownership;
- administrators need to review access and policy coverage;
- security teams need classification, DLP, and compliance controls;
- auditors need evidence that controls ran and exceptions were handled;
- stewards may need lineage and metadata across platforms outside Fabric.

List those obligations first. Then map each one to a destination.

### What fits OneLake Catalog

OneLake Catalog brings three working areas together:

- **Explore** for discovery, lineage, permissions, business context, domains, tags, and endorsement.
- **Govern** for tenant and owner insights, recommended actions, domains, tags, metadata scanning, policies, and administrative entry points.
- **Secure** for centralized permission review, workspace roles, OneLake security roles, and user access.

That is a strong fit for governance that follows data already in Fabric or connected to OneLake.

The current operating details matter. Estate-wide governance insights use Admin Monitoring Storage and refresh daily. Some subitems, cross-tenant scenarios, guest users, Private Link configurations, and third-party workload items have documented limitations. A dashboard that refreshes daily cannot prove a permission change made five minutes ago.

### What stays in Purview security and compliance

Do not read "Purview data governance retirement" as "Purview disappears."

Microsoft explicitly separates the retiring governance capabilities from Purview Data Security and Compliance. Information Protection, DLP, Insider Risk Management, and Data Security Posture Management continue.

That distinction belongs in the architecture record and the communication plan. Otherwise, teams will either remove controls that still matter or assume OneLake Catalog replaces security capabilities that Microsoft says continue.

### What may need broader catalog coverage

OneLake Catalog takes a lake-first approach. It governs data that lives in or connects to OneLake. That is different from scanning metadata wherever it lives and building a cross-estate catalog independently of the analytical platform.

Microsoft named Atlan as its preferred data governance partner for coverage beyond OneLake. The announcement also positions partner tooling as a way to carry existing metadata forward and provide granular lineage and governance across heterogeneous sources.

The decision should come from coverage, not logo preference. If a required source cannot be represented, curated, traced, or reviewed through the OneLake model, record the gap and assign it to a partner platform or another explicit control.

## Build a transition inventory before choosing tools

The expensive mistake is migrating features one by one without recording what business control each feature supports.

Inventory the current Purview governance estate by asset and dependency:

| Current asset | Record before transition |
| --- | --- |
| Data Map scans | Sources, credentials, schedules, filters, owners, last successful scan |
| Unified Catalog assets | Data products, domains, glossary links, owners, stewards, access workflows |
| Lineage | Source and target systems, transformation hops, unsupported gaps, audit use |
| Data quality | Rules, thresholds, exception owners, score history, remediation process |
| Roles and workflows | Role assignments, approval paths, service dependencies, escalation routes |
| Reports and exports | Consumers, refresh schedule, downstream automation, retention needs |

For each asset, add one field that is often missing: **the decision or control this asset supports**.

That field stops a migration team from faithfully copying metadata nobody uses while dropping a small workflow that an auditor, steward, or production support team depends on.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/onelake-governance-transition/02-transition-flow-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/onelake-governance-transition/02-transition-flow.webp" alt="A five-step transition flow inventories current governance assets, classifies their purpose, maps destinations, proves coverage, and retires old paths"></picture></figure>

## Use a capability matrix to expose real gaps

Do not map `Purview feature A` directly to `OneLake feature B` and call the work complete.

Use a matrix with outcome-based rows:

| Governance outcome | Current evidence | Target control | Acceptance test | Owner |
| --- | --- | --- | --- | --- |
| A data consumer finds the certified sales model | Search result and certification | OneLake Explore, domain, tags, endorsement | Approved users find the correct item first | Data owner |
| A steward sees incomplete descriptions | Catalog health report | Govern insight and recommended action | Known gaps appear with current scope and date | Data steward |
| An admin proves effective access | Role export and access review | OneLake Secure plus audit evidence | Sample users resolve to expected access | Fabric admin |
| Security blocks sensitive-data misuse | DLP policy and alert | Continuing Purview security controls | Test event produces the expected policy result | Security owner |
| A non-Fabric source has end-to-end lineage | Cross-estate lineage | Partner or documented alternative | Required hops are visible and reviewable | Governance lead |

This makes partial coverage visible. It also gives procurement and architecture teams a defensible reason for adding a partner platform when the need is real.

## Pilot one domain, not the whole estate

Choose a domain with enough complexity to expose the model but a small enough blast radius to recover quickly.

A useful pilot includes:

1. Fabric items across at least two workspaces.
2. A named domain admin, data owner, steward, Fabric admin, and security owner.
3. Tags, descriptions, ownership, and endorsement that users can test through search.
4. OneLake security roles or workspace permissions that can be compared with expected access.
5. A governance insight or recommended action that the team can close and verify.
6. At least one source outside native Fabric coverage if broader catalog requirements are part of the target model.

Measure the pilot with evidence, not screenshots. Record search success, metadata coverage, access accuracy, lineage completeness, insight freshness, exception volume, and the time required to remediate a known gap.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/onelake-governance-transition/03-acceptance-gates-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/onelake-governance-transition/03-acceptance-gates.webp" alt="Five acceptance gates cover governance coverage, curation, security, evidence, and operations"></picture></figure>

## Keep a transition register until the old path is gone

Every obligation should have one status:

- covered in OneLake Catalog;
- remains in Purview Data Security and Compliance;
- covered by a partner or another platform;
- accepted gap with owner and deadline;
- not required, with a recorded decision.

Add the last successful evidence date and the planned retirement date for the old path. A target architecture diagram is useful, but it does not tell you whether the new scan ran, the right users can find the data, the lineage is complete, or the access review catches an unexpected permission.

The November 12, 2027 maintenance window gives teams time to do this properly. It is not a reason to wait until the final quarter.

## The opportunity behind the transition

This change can produce a better governance model if teams use it to remove duplicated catalogs and move controls closer to where Fabric data is created and used.

The design has to stay honest about boundaries:

- OneLake Catalog is the governance center for Fabric and OneLake-connected data.
- Purview security and compliance capabilities continue.
- Broader cross-estate governance may need partner coverage.
- Every migrated control needs an owner, an acceptance test, and current evidence.

That is a stronger outcome than reproducing an old catalog inside a new interface.

## Sources

- [OneLake: The unified foundation for data, context, governance, and AI](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blog/OneLake-The-unified-foundation-for-data-context-governance-and/ba-p/5423035)
- [Microsoft Purview data governance overview and retirement notice](https://learn.microsoft.com/en-us/purview/data-governance-overview)
- [OneLake Catalog overview](https://learn.microsoft.com/en-us/fabric/governance/onelake-catalog-overview)
- [Govern and manage your Fabric data with OneLake Catalog](https://learn.microsoft.com/en-us/fabric/governance/onelake-catalog-govern)
- [A next step in Microsoft's data governance strategy](https://techcommunity.microsoft.com/blog/microsoft-security-blog/a-next-step-in-the-evolution-of-the-microsoft-data-governance-strategy/4572227)

---

**Shai Karmani**  
Data, Microsoft Fabric, Power BI, and practical AI  
[Connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr)
