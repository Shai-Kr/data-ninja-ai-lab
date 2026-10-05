---
layout: post
title: "Fabric Core MCP Gives AI Agents a Governed Path Into Fabric"
description: "A practical operating model for using Fabric Core MCP with narrow permissions, bounded tools, acceptance tests, and audit evidence."
date: 2026-10-05
author: Shai Karmani
author_url: https://www.linkedin.com/in/shai-kr
sitemap: false
---

**Review draft. Direct link only. Not listed on the blog.**

AI agents can now work with Microsoft Fabric through a Microsoft-hosted MCP endpoint, without a local server or a custom integration layer.

That is the headline behind **Fabric Core MCP Server reaching general availability**.

The more useful point is operational. An agent can search OneLake Catalog, inspect workspaces and items, manage supported Fabric resources and permissions, and view capacity information through one authenticated tool surface. Microsoft Entra ID, Fabric permissions, and audit logs remain part of the path.

This gives platform teams a much better starting point than handing an agent a collection of scripts and broad API credentials.

It does not make every Fabric operation safe by default. The agent still needs a narrow identity, an approved tool set, explicit change boundaries, and evidence that the result matched the request.

The pattern I would use is simple: **discover broadly, change narrowly, verify independently, and retain the audit trail.**

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/fabric-core-mcp-governed-agent-operations/01-governed-agent-path-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/fabric-core-mcp-governed-agent-operations/01-governed-agent-path.svg' | relative_url }}" alt="Governed Fabric Core MCP path from user intent through Entra identity, approved tools, Fabric authorization, and audit evidence.">
</picture>

## What Fabric Core MCP changes

MCP gives an AI client a standard way to discover and call tools. Fabric Core MCP applies that model to Fabric platform operations.

The remote server is hosted by Microsoft. A compatible MCP client connects to the documented Fabric endpoint and authenticates the user through Microsoft Entra ID. The server then exposes supported Fabric operations as tools instead of forcing every team to build and maintain its own API wrapper.

Microsoft documents tool areas for:

- OneLake Catalog search;
- workspace, folder, and item operations;
- role assignments and supported permission operations;
- capacity information and management scenarios.

The exact tool surface can evolve. That is why the production contract should name the tools an agent is allowed to call, not simply say that the agent has access to Fabric.

A general Fabric connection is not a useful control boundary. A bounded set of operations for one identity and one business purpose is.

## Keep four control layers separate

Teams often describe agent security as one permission question. In practice, four layers need separate evidence.

### 1. Client boundary

Which AI application is connecting? Who approved it? Where are tool calls and responses retained? Can the client expose Fabric results to another plugin, extension, or conversation?

### 2. Identity boundary

Which signed-in Entra identity is used? Is this an interactive user pilot or an approved workload pattern? What Fabric roles and item permissions does that identity hold?

### 3. Tool boundary

Which Fabric Core MCP tools are available in this client? Which are read-only discovery operations, and which can create, update, delete, or change access?

### 4. Resource boundary

Which capacities, workspaces, folders, and items may the identity reach? Existing Fabric authorization still matters. MCP should not become a reason to widen it.

These layers solve different problems. Fabric permissions can restrict the resource, but they do not explain whether the client should expose a mutation tool. A client allowlist can hide a tool, but it does not replace workspace and item permissions.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/fabric-core-mcp-governed-agent-operations/02-four-control-layers-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/fabric-core-mcp-governed-agent-operations/02-four-control-layers.svg' | relative_url }}" alt="Four control layers for Fabric Core MCP covering client, identity, tools, and Fabric resources.">
</picture>

## Start with a read-only inventory pilot

The safest first pilot is not automated workspace administration. It is an inventory task that produces useful output without changing the tenant.

For example:

> Find the workspaces I can access, list the relevant Fabric items, identify ownership gaps, and produce a review table. Do not change permissions or resources.

This pilot proves several things quickly:

1. the client can complete Entra authentication;
2. the agent discovers the intended MCP tools;
3. Fabric returns only resources the signed-in identity may access;
4. the result is complete enough to support a real platform task;
5. the audit trail and client transcript can be correlated;
6. the agent respects a no-change instruction.

Use known test resources. If the expected workspace set contains twelve workspaces, compare the returned list with a trusted inventory. If one workspace should be invisible to the pilot identity, include that as a negative test.

An agent response that looks plausible is not proof. Known-answer tests make the boundary measurable.

## Put mutations behind a change envelope

After the inventory pilot passes, introduce one reversible mutation. Creating a folder in a non-production workspace is a better test than changing production role assignments.

Every change request should include a small envelope:

```text
Business purpose: Why this change is needed
Target scope: Exact workspace, folder, or item
Allowed tools: Named Fabric Core MCP operations
Allowed mutation: One create or update action
Protected actions: Delete and permission changes blocked
Expected result: Named resource and properties
Validation: Independent read-back and known-answer check
Rollback: Named reversible action and owner
Evidence: Client record plus Fabric audit reference
Expiry: End of pilot or change window
```

The envelope gives the agent less room to interpret an operational request as a broad objective.

It also makes human approval meaningful. The reviewer is approving a specific target and mutation, not an open-ended instruction such as "clean up this workspace."

## Treat permission changes as a separate risk class

Permission tools deserve their own gate.

Changing a role assignment can alter who sees data, who can modify platform assets, and what another agent can do later. A technically successful permission update can still be the wrong business decision.

I would require these checks before allowing an agent to change access:

- the target identity is resolved to an exact Entra object;
- the current assignment is captured before the change;
- the requested role is the narrowest role that supports the task;
- inherited and item-level access are reviewed;
- a second identity verifies the effective result;
- the previous assignment is available for rollback;
- the change appears in the expected audit evidence.

Discovery and mutation should also use separate prompts or jobs. Mixing "find the right workspace" and "change its permissions" in one autonomous step makes review harder and increases the blast radius of a bad match.

## Build an acceptance suite, not a demo

A successful demo proves that a tool call can work. A production pilot has to prove the operating boundary.

I would run six tests:

### Authentication

The approved identity can connect. An unapproved identity or expired session cannot continue silently.

### Discovery

The agent can find the intended workspace and item by stable identifiers and useful metadata, not only by a friendly name.

### Authorization

The identity can perform the approved action and cannot perform a protected action outside the pilot scope.

### Accuracy

Read results match a trusted inventory. A requested mutation produces the exact expected properties.

### Failure behavior

Ambiguous targets, duplicate names, unavailable resources, and partial failures stop the workflow instead of triggering a guess.

### Evidence

The team can connect the business request, user identity, client call, Fabric result, validation output, and audit record.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/fabric-core-mcp-governed-agent-operations/03-six-gate-pilot-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/fabric-core-mcp-governed-agent-operations/03-six-gate-pilot.svg' | relative_url }}" alt="Six-gate pilot for Fabric Core MCP covering authentication, discovery, authorization, accuracy, failure behavior, and evidence.">
</picture>

## Where this becomes genuinely useful

The strongest early use cases are repetitive platform tasks with clear evidence:

- building workspace and item inventories;
- finding assets through OneLake Catalog before a migration;
- checking naming, ownership, and folder structure;
- preparing capacity context for an operations review;
- creating a bounded development resource from an approved request;
- validating that a previous platform change produced the expected state.

The weakest early use cases are broad cleanup instructions, bulk permission changes, production deletion, or objectives where the agent has to invent the desired end state.

Fabric Core MCP makes the connection layer easier. The platform team still owns the operating model.

## My recommended rollout

I would use four stages:

1. **Inventory:** read-only discovery with known-answer tests.
2. **Reversible change:** one non-production mutation with independent read-back.
3. **Controlled administration:** a short allowlist of tools, exact scopes, approval, and rollback.
4. **Repeatable workflow:** a versioned change envelope, monitored evidence, and scheduled permission review.

Each stage should have an exit criterion. Do not expand access because the demo felt smooth.

The real benefit of Fabric Core MCP is not that an agent can call Fabric APIs. It is that teams can standardize the path between an AI client and Fabric while keeping identity, authorization, and audit controls in the platform.

That is a useful foundation for agentic operations, provided the autonomy grows only as fast as the evidence.

## Sources

- [Fabric September 2026 Feature Summary](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blog/Fabric-September-2026-Feature-Summary/ba-p/5325825)
- [Fabric Core MCP Server overview](https://learn.microsoft.com/en-us/rest/api/fabric/articles/mcp-servers/core-remote/overview-core-mcp-server)
- [Get started with Fabric Core MCP Server](https://learn.microsoft.com/en-us/rest/api/fabric/articles/mcp-servers/core-remote/get-started-core)
- [Fabric Updates Blog](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blogs/bg-p/fbc_fabricupdatesblogs)
- [Power BI Updates Blog](https://community.fabric.microsoft.com/t5/Power-BI-Updates-Blog/bg-p/fbc_pbiupdatesblog)

---

**Shai Karmani**<br>
Data, Microsoft Fabric, Power BI, Analytics Engineering, and AI<br>
[Connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr)
