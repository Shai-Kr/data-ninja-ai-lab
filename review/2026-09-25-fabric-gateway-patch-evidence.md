---
layout: post
title: "The Fabric Gateway Patch Evidence Pack Every Platform Team Needs"
description: "A practical way to turn the September 2026 on-premises data gateway release into verifiable security, compatibility, and refresh evidence."
date: 2026-09-25
author: Shai Karmani
author_url: https://www.linkedin.com/in/shai-kr
sitemap: false
---

**Review draft. Direct link only. Not listed on the blog.**

Microsoft released version 3000.334 of the on-premises data gateway today.

The release updates the embedded Apache Log4j library to version 2.26.1, addresses CVE-2026-18401, includes Power Query Engine 2.158.928, and aligns gateway query execution with the September 2026 release of Power BI Desktop.

That is useful release information. It is not yet proof that a production gateway estate is protected.

The evidence I want is more concrete:

- every in-scope cluster member is on the approved version;
- security scanning no longer reports the addressed dependency finding;
- representative Fabric and Power BI workloads still refresh correctly;
- authentication and connectivity still work under the real service identity;
- the result is recorded with an owner and timestamp.

That small package turns a routine installer run into a controlled platform change.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/fabric-gateway-patch-evidence/01-release-to-evidence-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/fabric-gateway-patch-evidence/01-release-to-evidence.svg' | relative_url }}" alt="Flow from a Microsoft gateway release through inventory, staged update, validation, and a completed evidence pack.">
</picture>

## Release notes are the input, not the control

The September announcement gives teams three facts worth acting on.

First, version 3000.334 contains security and dependency improvements, including the Log4j update and the stated CVE fix.

Second, it includes a specific Power Query Engine build. The gateway is not only a network relay. It executes query logic between private data sources and cloud services, so engine changes deserve representative refresh testing.

Third, Microsoft says this release is compatible with the September Power BI Desktop release. That helps reduce query-engine drift between what a developer tests locally and what the Power BI service executes through the gateway.

None of those facts tells me which servers were updated, whether every cluster member received the same build, or whether the important workloads passed after the change.

That is the gap the evidence pack closes.

## Start with the exact production scope

Before touching an installer, capture the gateway estate that is actually in scope.

For each cluster, record:

| Field | Why it matters |
| --- | --- |
| Cluster and member name | Proves every node was considered |
| Environment | Separates development, test, and production |
| Current gateway version | Establishes the before state |
| Server owner | Gives the change a responsible person |
| Critical workloads | Defines what must be tested |
| Maintenance window | Keeps the update inside an agreed operating boundary |
| Recovery key owner | Confirms the cluster can be recovered or migrated if needed |

Do not stop at the cluster name. A cluster with three members is three patch targets.

Microsoft recommends updating cluster members one at a time. It also warns that capability differences across versions can cause a query to succeed on one member and fail on another. The inventory should therefore be member-level, not only cluster-level.

This is especially important when load balancing hides the difference. A refresh can pass on one run and fail on the next because the request landed on a different member.

## Use a staged rollout with a proof point after every member

For a multi-member cluster, I would use a simple sequence:

1. Disable one member so new work is not routed to it.
2. Allow active requests to drain.
3. Update that member to version 3000.334.
4. Confirm the service is healthy and the reported version is correct.
5. Re-enable the member.
6. Run a representative validation workload.
7. Repeat for the next member.

Microsoft notes that 30 minutes is enough drain time for many workloads, while clusters with long-running jobs may need more. The right number should come from the real workload, not from a copied runbook.

The proof point after each member matters. If a failure appears, the team knows which step introduced it and still has unchanged capacity available.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/fabric-gateway-patch-evidence/02-staged-cluster-rollout-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/fabric-gateway-patch-evidence/02-staged-cluster-rollout.svg' | relative_url }}" alt="Staged gateway cluster rollout showing drain, update, validate, and repeat for each member while the other members remain available.">
</picture>

## Build the security evidence in layers

A useful security record should answer four different questions.

### 1. What did Microsoft ship?

Record the release URL, gateway version, Power Query Engine version, dependency version, and the CVE identifier named by Microsoft.

This is the vendor statement.

### 2. What did we install?

Capture the installed version from every gateway member after the update. A download receipt or installer completion screen is not enough. The evidence must come from the running estate.

This is the deployment statement.

### 3. What did our security tooling observe?

Run the approved vulnerability or dependency scan after the update. Save the relevant result, including scanner name, scan time, host, and policy outcome.

The Microsoft release note says the release addresses the finding. The local scan proves what the organization's control plane sees on its own servers.

A scan can also expose a different issue that is unrelated to the gateway package. Keep that distinction clear rather than treating one clean product finding as a clean server.

This is the control statement.

### 4. What still works?

Run the workloads that justify the gateway's existence.

I would include at least:

- one scheduled semantic model refresh using a major on-premises source;
- one DirectQuery or composite-model interaction if it is business critical;
- one Fabric Data Factory or dataflow path that uses the same gateway;
- one authentication path under the production identity;
- one diagnostic review for unexpected errors or duration changes.

This is the service statement.

Together, those layers are much stronger than a ticket that says "gateway patched."

## Test query parity, not only connectivity

A green connection test proves that the gateway can reach a source and authenticate. It does not prove that a representative Power Query workload behaves the same way after the engine update.

Because the September gateway includes Power Query Engine 2.158.928 and aligns with the September Power BI Desktop release, I would add a small parity test:

1. Select a query that uses the transformations and connector behavior that matter in production.
2. Run it in the approved September Desktop build against controlled input.
3. Refresh the published workload through the updated gateway.
4. Compare row count, expected totals, data types, error rows, and duration.
5. Record any difference before promoting the change across the rest of the estate.

The goal is not to prove that every possible query is identical. It is to test the paths that carry the most operational risk.

A five-row smoke test with no transformations will miss the behavior teams care about.

## The final evidence pack can fit on one page

This does not need to become a compliance project.

A concise record is enough if it contains the right facts.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/fabric-gateway-patch-evidence/03-evidence-pack-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/fabric-gateway-patch-evidence/03-evidence-pack.svg' | relative_url }}" alt="One-page gateway patch evidence pack containing release facts, member versions, security scan results, refresh validation, authentication checks, and owner approval.">
</picture>

My minimum evidence pack would contain:

- **Change:** September 2026 gateway, version 3000.334.
- **Scope:** cluster members and server names.
- **Security:** Log4j 2.26.1 and CVE-2026-18401 release statement, plus local scan result.
- **Compatibility:** Power Query Engine 2.158.928 and September Desktop test baseline.
- **Service validation:** named refreshes, outcomes, duration comparison, and timestamp.
- **Identity validation:** production authentication path and owner.
- **Exceptions:** failed tests, deferred members, or workloads not covered.
- **Approval:** person who accepted the result and the date.

This structure makes the change reviewable later.

If a refresh incident appears next week, the team can see what changed, which workloads were tested, and where evidence was incomplete. If an audit asks whether the named security update reached production, the answer is available without reconstructing the rollout from chat history.

## Keep soft delete in the right place

The September release also includes gateway soft delete, which retains supported deleted enterprise gateway clusters for 30 days and lets authorized administrators recover them.

That is a useful operational safety net. It is separate from patch recovery.

Soft delete protects against accidental deletion of supported gateway resources. It does not replace a staged upgrade, a recovery key, workload validation, or a rollback decision. Microsoft also states that soft delete is not a backup-and-restore system.

I would document it in the gateway operating model, but I would not count it as evidence that an update is reversible.

## My practical recommendation

Use version 3000.334 as the trigger to create one reusable gateway patch evidence template.

The template should separate four claims:

1. Microsoft shipped the fix.
2. The team installed the approved version on every member.
3. Security tooling verified the production hosts.
4. Real Fabric and Power BI workloads passed after the change.

That separation is the useful part.

It prevents teams from confusing vendor release notes with deployment evidence, an installer result with security validation, or a connection test with query compatibility.

The gateway sits between private data and cloud analytics. A small evidence pack is appropriate for that trust position.

The September release gives teams a concrete starting point. Build the template once, then reuse it for every monthly gateway update.

## Sources

- [On-premises data gateway September 2026 release](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blog/On-premises-data-gateway-September-2026-release/ba-p/5368525)
- [Update an on-premises data gateway](https://learn.microsoft.com/en-us/data-integration/gateway/service-gateway-update)
- [What is an on-premises data gateway?](https://learn.microsoft.com/en-us/data-integration/gateway/service-gateway-onprem)
- [Soft Delete for On-Premises Data Gateways in Microsoft Fabric](https://learn.microsoft.com/en-us/data-integration/gateway/gateway-soft-delete)
- [Fabric Updates Blog](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blogs/bg-p/fbc_fabricupdatesblogs)
- [Power BI Updates Blog](https://community.fabric.microsoft.com/t5/Power-BI-Updates-Blog/bg-p/fbc_pbiupdatesblog)

---

**Shai Karmani**<br>
Microsoft Data and AI practitioner<br>
[Connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr)
