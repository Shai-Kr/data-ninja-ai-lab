---
layout: post
title: "Turn Every Fabric Connection Into Governed Inventory"
date: 2026-10-27
description: The new Fabric Admin Connections REST APIs give administrators tenant-wide connection visibility. This guide turns that access into a practical inventory, review, and controlled-remediation workflow.
author: Shai Karmani
author_url: https://www.linkedin.com/in/shai-kr
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

Microsoft has added preview Admin Connections REST APIs for Fabric administrators.

The immediate benefit is tenant-wide visibility. An administrator can now inspect connections beyond the smaller set explicitly shared with them. The API family covers on-premises data gateway, virtual network gateway, and cloud connections. It also includes operations for reading connection details, reviewing role assignments, changing those assignments, and deleting a connection.

That is useful, but the larger opportunity is operational.

Connections sit underneath semantic models, dataflows, pipelines, and other workloads. When their ownership and access are managed manually, the tenant develops blind spots. A connection can keep working while nobody can answer who owns it, who can change it, or whether it should still exist.

I would use the new APIs to build a governed connection inventory first. Automation comes after the inventory is trusted.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/fabric-admin-connections/01-governance-loop-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/fabric-admin-connections/01-governance-loop.webp" alt="A governance loop moves from listing Fabric connections through access review and controlled remediation to evidence"></picture></figure>

## What changed

Before this preview, administrators could only see connections for which they had been granted permission. That made tenant-wide governance difficult because the administrative view depended on the same sharing model it was meant to govern.

The Admin Connections API family changes that boundary. The published operations include:

- list connections
- get one connection
- list and get connection role assignments
- add, update, and delete role assignments
- delete a connection

Microsoft says the APIs can be called by Fabric administrators or service principals. Administrative actions, including viewing or deleting a connection and changing role assignments, are recorded in audit logs.

Those details make two use cases practical:

1. **A scheduled inventory and review process.**
2. **A controlled remediation workflow with traceable changes.**

The second should not be the starting point. Read access can reveal drift without creating operational risk. Delete and role-assignment operations change shared infrastructure and deserve a separate approval path.

## Build an inventory that answers business questions

An API export is not yet a governance inventory.

The inventory needs to combine Fabric's connection record with context your team owns. At minimum, every row should answer four questions.

### What is it?

Keep the durable connection identifier, connection type, and gateway or cloud path needed to locate the object again. Do not make display names the only key in your process.

### Who owns it?

Record both a technical owner and a business service or domain. A platform team may operate a gateway, but the business workload using the connection still needs an accountable owner.

### Who can act on it?

Store the current role assignments and compare them with an approved access model. The goal is not to count principals. It is to identify unexpected access, missing operational coverage, and ownership that exists only in someone's memory.

### Should it stay?

Add a review date and a lifecycle decision: keep, fix, or retire. A connection that cannot be tied to an active workload should enter review, not immediate deletion.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/fabric-admin-connections/02-inventory-model-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/fabric-admin-connections/02-inventory-model.webp" alt="A four-part connection inventory covers identity, ownership, access, and lifecycle"></picture></figure>

## Use a two-pass operating model

The safest implementation separates evidence from action.

### Pass 1: discover and classify

Run a read-only job that lists the full connection estate, retrieves the details needed for review, and collects role assignments. Save a dated snapshot before applying policy rules.

Classify findings into clear outcomes:

- **Pass:** owner, access, and lifecycle evidence match policy.
- **Review:** the data is incomplete or the business context is uncertain.
- **Change proposed:** there is enough evidence to recommend a role update or retirement.

This pass should create findings, not changes.

### Pass 2: approve and remediate

Take only approved findings into the change workflow. Use a separate identity or permission boundary for mutations. After the change, read the connection and its role assignments again and preserve the before-and-after state with the change record.

This design keeps a bad policy rule from becoming a fast tenant-wide outage.

## Service principals make scheduling possible, not automatically safe

Service-principal support is what makes recurring governance realistic. It also raises the quality bar.

A scheduled job needs explicit controls for:

- the tenant and environments it may inspect
- the identity used for read operations
- the separate authority required for role or delete operations
- complete result handling rather than a partial first page
- retry behavior that does not repeat a destructive action blindly
- evidence that the final state matches the approved change

The first production version should be read-only. Let it run long enough to prove that it sees the expected estate, produces stable findings, and does not create noise from missing business context.

Only then should role changes be added, and deletion should remain the narrowest path.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/fabric-admin-connections/03-automation-gates-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/fabric-admin-connections/03-automation-gates.webp" alt="Six automation gates cover scope, identity, inventory, policy, approval, and evidence"></picture></figure>

## A practical pilot

I would pilot the capability in four steps.

### 1. Capture a tenant snapshot

List the connection estate and store the raw response with a timestamp. Confirm that on-premises gateway, virtual network gateway, and cloud connections appear as expected.

### 2. Add the ownership layer

Join each connection to a technical owner, business domain, environment, and review date. Keep unresolved records visible. Missing context is a finding.

### 3. Compare role assignments

Retrieve the role assignments and evaluate them against a small policy set. Start with rules that can be explained easily, such as connections with no named service owner or access that lacks an approved reason.

### 4. Prove one controlled change

Choose a low-risk role-assignment correction. Record the proposal, approval, original state, API result, final state, and audit evidence. Test the rollback before expanding the scope.

## What I would measure

The useful metrics are operational, not vanity counts:

- percentage of connections with a named technical owner
- percentage mapped to a business service or domain
- number of role assignments awaiting review
- number of stale candidates with no confirmed workload
- time from finding to approved correction
- percentage of changes with complete before-and-after evidence

An inventory that grows every week but never resolves ownership is not improving governance. The measure is whether uncertainty and unmanaged access decline.

## The practical takeaway

The new Admin Connections APIs close an important visibility gap in Fabric administration.

Use them to create a tenant-wide connection inventory, join that inventory to real ownership, review role assignments against explicit policy, and separate findings from approved changes. Service-principal support can make the process repeatable. Audit records can make it explainable.

The result is more than an API integration. It is a control loop for one of the least visible parts of the analytics platform.

## Sources

- [Fabric Updates Blog](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blogs/bg-p/fbc_fabricupdatesblogs)
- [Power BI Updates Blog](https://community.fabric.microsoft.com/t5/Power-BI-Updates-Blog/bg-p/fbc_pbiupdatesblog)
- [On-premises data gateway October 2026 release](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blog/On-premises-data-gateway-October-2026-release/ba-p/5376557)
- [Fabric REST API: Admin Connections](https://learn.microsoft.com/en-us/rest/api/fabric/admin/connections)

---

Written by **[Shai Karmani](https://www.linkedin.com/in/shai-kr)**.

If you work on Microsoft Fabric, Power BI, data engineering, or practical AI systems, feel free to [connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr).
