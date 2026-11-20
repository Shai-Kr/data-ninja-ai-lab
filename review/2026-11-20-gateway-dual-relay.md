---
layout: post
title: "The Gateway Upgrade That Adds a Second Route to Fabric"
date: 2026-11-20
description: A practical rollout and acceptance model for the November 2026 on-premises data gateway, Dual Relay, network reachability, and production evidence.
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

The November 2026 on-premises data gateway release includes a feature that deserves more attention than a normal monthly upgrade: Dual Relay.

Eligible gateways can now have two Microsoft-managed relay endpoints, one primary and one secondary in a backup region. If the primary relay becomes unavailable, communication can continue through the secondary, provided the gateway can reach it.

That last condition is the implementation story.

Dual Relay is provisioned automatically for eligible gateways. Network readiness, cluster consistency, and acceptance evidence are still the operator's job. A second endpoint in the configuration does not prove that a firewall or proxy will allow traffic to it during an incident.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/gateway-dual-relay/01-resiliency-path-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/gateway-dual-relay/01-resiliency-path.webp" alt="An on-premises gateway connects Fabric and Power BI through primary and secondary Microsoft-managed relay paths"></picture></figure>

## What the November release changes

Gateway version `3000.342` includes Dual Relay plus a set of operational improvements:

- compatibility with the November 2026 Power BI Desktop query runtime;
- improved retention of service-principal token refresh metadata;
- better handling of duplicate packet acknowledgments;
- lower memory-allocation overhead during serialization;
- caching and request-throttling refinements;
- updated cryptography and third-party dependencies;
- expanded diagnostics and Oracle DirectQuery improvements.

Those changes make the release useful even before Dual Relay is considered. They also make a casual upgrade harder to justify. Authentication, DirectQuery, scheduled refresh, memory behavior, and diagnostics should all be represented in the pilot workload.

The safest approach is to treat `3000.342` as a production change with an acceptance record, not an installer to run across every node on the same afternoon.

## How Dual Relay actually arrives

Microsoft documents different behavior for new and existing gateways.

Eligible new gateways in supported regions receive the primary and secondary endpoints during registration. Existing gateways are migrated asynchronously while they remain online. No restart is required for that provisioning process.

For an existing gateway, the transition can take time:

1. The service creates a new primary relay.
2. The original primary remains as a temporary secondary.
3. Starting around day 15, the service normally selects only the new primary.
4. After the retention period, normally 30 days, it creates the secondary relay in the backup region and removes the original relay after applying the replacement configuration.

The timing can vary because provisioning runs through background jobs. Microsoft states that an eligible existing gateway should have both relay endpoints after about a month.

This matters operationally. Checking immediately after the gateway upgrade and finding one relay is not enough evidence to call the feature broken. Checking once and never returning is also not enough.

Add a dated follow-up check to the rollout plan.

## Five checks make the feature real

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/gateway-dual-relay/02-readiness-contract-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/gateway-dual-relay/02-readiness-contract.webp" alt="Five production-readiness checks cover gateway version, eligibility, network reachability, evidence, and ownership"></picture></figure>

### 1. Version every gateway member

Dual Relay requires the June 2026 gateway release, version `3000.322`, or later. The November release is `3000.342`.

For a cluster, record every member and keep the versions aligned. A portal view that shows one healthy node does not prove the whole cluster is running the intended build.

The inventory should include:

- gateway and cluster name;
- member host;
- installed version;
- region;
- standard or personal mode;
- business workloads using the cluster;
- technical owner and network owner.

### 2. Confirm eligibility

Dual Relay applies to online gateways in supported regions that use Microsoft-managed relays and a supported gateway release. It is not currently available in every region.

As of the documentation update on November 19, 2026, the unsupported list includes North Europe, West Europe, UK South, and North Central US. Check the current Microsoft Learn page rather than copying that list into a permanent runbook.

Eligibility is a deployment fact, not an assumption based on the tenant's location.

### 3. Prove both endpoints are configured

Export the gateway logs and inspect `gatewayproperties.txt`.

For a gateway with Dual Relay configured, Microsoft says to look for both:

- `RelayEndpoint`
- `RelayEndpointSecondary`

The values are relay URIs. Their presence confirms that the endpoints are configured. It does not confirm that the gateway can connect to both.

That distinction belongs in the acceptance record. “Configured” and “reachable” are separate checks.

### 4. Validate network reachability

Run the gateway network ports test and review firewall and proxy rules against the current communication requirements.

Microsoft calls out a subtle failure mode: a firewall can allow only part of a relay IP range. That can produce intermittent reachability instead of a clean, repeatable failure.

The network review should therefore record:

- primary and secondary relay URIs;
- outbound ports and destinations allowed;
- proxy path, if used;
- test date and gateway member;
- result for each member;
- exception owner and remediation date.

Automatic activation removes an administrative step. It does not remove the network dependency.

### 5. Assign operational ownership

The gateway team may own the software, while a network team owns the firewall and a BI team owns refresh validation. Dual Relay crosses all three boundaries.

Name the owner for:

- monthly gateway upgrades;
- firewall and proxy rules;
- cluster-version alignment;
- failed refresh and DirectQuery triage;
- log export and evidence retention;
- regional relay incidents.

Without that split, a relay issue will bounce between teams while business refreshes remain late.

## Use an evidence-gated rollout

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/gateway-dual-relay/03-rollout-gates-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/gateway-dual-relay/03-rollout-gates.webp" alt="A controlled gateway rollout moves through inventory, pilot, validation, cluster rollout, and ongoing operations"></picture></figure>

I would use five rollout gates.

### Gate 1: inventory

Find every cluster member, workload, owner, region, and installed version. Select a pilot that represents the real estate: one scheduled refresh, one DirectQuery path, one service-principal flow if used, and one source with meaningful volume.

### Gate 2: pilot

Upgrade the pilot path during a controlled window. Capture the installer result, gateway service state, CPU and memory baseline, and exported diagnostics.

Run representative workloads from the service, not only from Desktop. The release aligns the gateway with the November Desktop runtime, but cloud refresh is the acceptance surface.

### Gate 3: validate

Check refresh duration, row counts, query behavior, authentication, diagnostics, and network reachability. Record both successful and failed tests.

Do not claim that failover was observed unless you have evidence of an actual or approved controlled relay transition. Microsoft provides automatic relay management, but the documented configuration check is not a manual failover test.

### Gate 4: roll out

Upgrade the remaining cluster members, keeping versions aligned. Watch for authentication retries, memory pressure, throttling, duplicate work, and changes in refresh duration.

Retain a rollback decision point even when the installer itself succeeds. The useful question is whether the workload still meets its service objective.

### Gate 5: operate

Return after the documented provisioning window and verify that eligible gateways show both relay properties. Re-run the network test after firewall, proxy, gateway, or regional infrastructure changes.

Add the gateway version and relay checks to the normal operations dashboard. Resilience that is checked only during installation decays quietly.

## A compact acceptance record

One page is enough:

| Field | Evidence |
| --- | --- |
| Release | Gateway version for every cluster member |
| Eligibility | Region, online state, managed-relay configuration |
| Relay configuration | Primary and secondary properties from exported logs |
| Network | Ports test plus firewall and proxy confirmation |
| Workload | Refresh, DirectQuery, authentication, and volume test results |
| Diagnostics | Export location, timestamp, and named reviewer |
| Ownership | Gateway, network, BI, and incident contacts |
| Follow-up | Date to verify asynchronous Dual Relay provisioning |

This is more useful than a screenshot of the gateway showing “Online.” It can be reviewed during an incident and repeated after infrastructure changes.

## The practical takeaway

Dual Relay gives the on-premises data gateway a better communication design. The primary path no longer has to be the only relay path for an eligible gateway.

The implementation work is still familiar:

- run a supported and consistent gateway version;
- verify regional eligibility;
- confirm both endpoints in exported logs;
- prove firewall and proxy reachability;
- test real Fabric and Power BI workloads;
- retain evidence and assign owners.

Version `3000.342` is a good reason to turn the monthly gateway update into a repeatable release process. The second relay is the feature. The operating contract is what makes it useful.

## Sources

- [On-premises data gateway November 2026 release](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blog/On-premises-data-gateway-November-2026-release/ba-p/5430005)
- [Dual Relay with the on-premises data gateway](https://learn.microsoft.com/data-integration/gateway/service-dual-relay)
- [On-premises data gateway documentation](https://learn.microsoft.com/data-integration/gateway/)
- [Power BI November 2026 Feature Summary](https://community.fabric.microsoft.com/t5/Power-BI-Updates-Blog/Power-BI-November-2026-Feature-Summary/ba-p/5414287)

---

**Shai Karmani**  
Data, Microsoft Fabric, Power BI, and practical AI  
[Connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr)
