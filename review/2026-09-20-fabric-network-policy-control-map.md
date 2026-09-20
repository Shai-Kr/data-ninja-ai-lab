---
layout: post
title: "Turn Fabric Network Policies Into a Tenant-Wide Control Map"
description: "A practical workflow for using the Fabric Admin API to inventory workspace network policies, find gaps, and produce reviewable evidence."
date: 2026-09-20
author: Shai Karmani
author_url: https://www.linkedin.com/in/shai-kr
sitemap: false
---

**Review draft. Direct link only. Not listed on the blog.**

Microsoft Fabric now exposes workspace networking communication policies through a generally available Admin API.

That sounds like a narrow platform update. It is more useful than that.

Until now, a Fabric admin could configure inbound and outbound controls at the workspace level, but tenant-wide review was difficult. A secure configuration in one workspace did not answer the larger question: which workspaces allow public inbound traffic, which ones restrict outbound connections, and where are exceptions accumulating?

The new API gives administrators a paginated tenant view of those settings. That turns network configuration into something a team can inventory, compare, review, and monitor.

I would use it to build a Fabric network policy control map, not another raw API export.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/fabric-network-policy-control-map/01-control-map-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/fabric-network-policy-control-map/01-control-map.svg' | relative_url }}" alt="Fabric network policy control map from tenant workspaces through the Admin API into normalized evidence and owner review.">
</picture>

## What the API changes

The `List Networking Communication Policies` Admin API returns network communication policy settings across workspaces in the tenant. The response is paginated and includes workspace context plus inbound and outbound policy details.

The policy model can expose controls such as:

- public network access behavior;
- private endpoint configuration and state;
- outbound access defaults;
- allowed cloud connections and endpoint exceptions;
- outbound gateway rules;
- workspace identity and type.

That is valuable because a workspace-by-workspace portal review does not scale. It is also hard to prove that the review was complete.

An API-based inventory creates a repeatable evidence set. The important word is repeatable. A one-time export shows what existed on one date. A scheduled comparison shows what changed, who needs to review it, and which workspace has drifted from the intended standard.

## Start with a control model, not the endpoint

Before collecting data, define the questions the inventory should answer.

I would begin with five:

1. Which workspaces allow public inbound access?
2. Which workspaces deny outbound access by default?
3. Which explicit outbound exceptions exist?
4. Which private endpoints or gateways are not in the expected state?
5. Which workspace owner must approve each exception?

Those questions produce a much better data model than storing the full JSON response and hoping someone reads it later.

A useful normalized record might include:

| Field | Why it matters |
| --- | --- |
| Workspace ID and name | Stable technical identity plus a readable label |
| Workspace type | Separates standard, managed, and future workspace categories |
| Inbound public access | Makes public exposure visible |
| Private endpoint state | Shows whether the private path is provisioned and usable |
| Outbound default action | Identifies allow-by-default and deny-by-default workspaces |
| Allowed connection count | Highlights the size of the exception surface |
| Allowed endpoints | Shows the exact external destinations that were approved |
| Gateway rules | Captures outbound paths that do not use cloud connections |
| Business owner | Gives the exception a decision maker |
| Review date | Prevents permanent approvals with no reassessment |

The API supplies the technical policy. Ownership, business purpose, and expiry usually come from your governance process. Join the two.

## A practical collection workflow

The collection job should be intentionally boring.

1. Authenticate with an approved administrative identity.
2. Request the first page from the Admin API.
3. Follow the continuation token until every page is collected.
4. Save the raw response with a timestamp.
5. Normalize the fields needed for the control map.
6. Compare the current snapshot with the previous snapshot.
7. Publish only the exceptions and changes that need attention.

Do not discard the raw response. The normalized table is easier to review, but the raw snapshot is the audit evidence that lets you revisit a decision when the schema or policy changes.

The collection should also fail loudly when pagination is incomplete. A partial tenant inventory can look valid while omitting workspaces. Record the number of pages, workspaces, and policies returned, then compare those counts with the prior run.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/fabric-network-policy-control-map/02-evidence-pipeline-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/fabric-network-policy-control-map/02-evidence-pipeline.svg' | relative_url }}" alt="Evidence pipeline for collecting paginated Fabric network policy data, preserving raw snapshots, normalizing controls, and detecting drift.">
</picture>

## Separate posture from exceptions

A tenant-wide map becomes useful when it separates the default posture from approved exceptions.

For inbound access, a team might classify workspaces as:

- public access allowed;
- public access restricted by policy;
- private endpoint configured and healthy;
- private endpoint pending or failed;
- no approved classification.

For outbound access, the important distinction is the default action:

- **Allow by default:** external connections are broadly permitted unless another control blocks them.
- **Deny by default:** outbound communication is blocked unless a connection or endpoint is explicitly allowed.

Neither label is enough by itself. A deny-by-default workspace with 40 unmanaged endpoint exceptions may be harder to govern than an allow-by-default development workspace with no sensitive data.

That is why the review needs context:

- data classification;
- environment such as development, test, or production;
- internet exposure requirement;
- approved external systems;
- workspace owner;
- exception reason and expiry.

The policy inventory tells you what is configured. The control map tells you whether that configuration makes sense.

## Use change detection instead of dashboard watching

A network posture dashboard is useful for exploration. It is not the best trigger for action.

The better operating pattern is a change report:

- public inbound access was enabled;
- an outbound default changed from deny to allow;
- a new cloud connection exception appeared;
- an endpoint was added to an allow list;
- a private endpoint moved from provisioned to failed;
- a gateway rule changed;
- a production workspace has no owner or review date.

Each change should create a small evidence packet:

1. workspace and environment;
2. previous value;
3. current value;
4. detected time;
5. policy or exception owner;
6. expected business reason;
7. review decision.

This keeps the process focused on decisions. It also avoids sending administrators a daily spreadsheet where 99 percent of the rows have not changed.

## The first acceptance test

I would test the control map with four deliberately different workspaces:

1. A development workspace with public access and broad outbound connectivity.
2. A production workspace with deny-by-default outbound protection.
3. A workspace using private endpoints.
4. A workspace with one approved external connection exception.

For each workspace, verify the configuration in Fabric, collect it through the API, and compare the normalized result with the expected control record.

Then make one reversible test change in a nonproduction workspace. Confirm that the next run detects the exact field change, preserves the previous value, and routes the review to the right owner.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/fabric-network-policy-control-map/03-review-matrix-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/fabric-network-policy-control-map/03-review-matrix.svg' | relative_url }}" alt="Review matrix that prioritizes Fabric workspace network policy changes by environment, data sensitivity, and exception status.">
</picture>

The acceptance result should prove three things:

- coverage is complete across all pages;
- the normalized control fields match the real workspace settings;
- a change produces a reviewable before-and-after record.

Do not claim compliance based only on a successful API call. The API provides visibility. Your organization still defines the standard, approves exceptions, and responds to drift.

## Where this fits in Fabric governance

This control map should connect to the rest of the Fabric operating model.

Workspace inventory tells you what exists. Item lineage tells you what depends on it. Sensitivity labels tell you what kind of data it contains. Capacity telemetry shows how it behaves. Network policy evidence shows how it can communicate.

Together, those views let an administrator answer a much more useful question:

**Is this workspace configured appropriately for the data, dependencies, and business process it supports?**

That is the real opportunity in the new API. Fabric network controls no longer need to live as isolated workspace settings. They can become part of a tenant-wide review process with evidence, ownership, and change history.

Start with the inventory. Add business context. Detect changes. Review exceptions.

That is how a networking API becomes an operating control.

## Sources

- [Get tenant-wide visibility into workspace networking policies with the Admin API](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blog/Get-tenant-wide-visibility-into-workspace-networking-policies/ba-p/5361690)
- [List Networking Communication Policies REST API](https://learn.microsoft.com/en-us/rest/api/fabric/admin/workspaces/list-networking-communication-policies)
- [Microsoft Fabric What's New](https://learn.microsoft.com/en-us/fabric/fundamentals/whats-new)
- [Fabric Updates Blog](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blogs/bg-p/fbc_fabricupdatesblogs)
- [Power BI Updates Blog](https://community.fabric.microsoft.com/t5/Power-BI-Updates-Blog/bg-p/fbc_pbiupdatesblog)

---

**Shai Karmani**<br>
Microsoft Data and AI practitioner<br>
[Connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr)
