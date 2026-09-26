---
layout: post
title: "The OneLake Security Pattern That Makes Multi-Engine Analytics Work"
description: "A practical trust model for centralized OneLake security policies, distributed query-time enforcement, and evidence across Fabric and authorized engines."
date: 2026-09-26
author: Shai Karmani
author_url: https://www.linkedin.com/in/shai-kr
sitemap: false
---

**Review draft. Direct link only. Not listed on the blog.**

OneLake security has an architecture choice that deserves more attention than the settings screen.

The policy can live in one place while the query engine enforces it where the query runs.

Microsoft describes this as centralized policy definition with controlled, distributed enforcement. OneLake remains the source of truth for role, table, row, and column access. A supported Fabric engine or an authorized third-party engine receives the user’s effective access and applies it in its own query layer.

That design is useful because the engine can keep its native query processing, caching, and optimization behavior. It also creates a clear trust contract.

The useful question is no longer only, “Did we define the role correctly?”

It is, “Can every approved access path prove that it applies the same effective policy for the same user?”

That is the operating model I would build.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/onelake-authorized-engine-trust-model/01-policy-to-enforcement-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/onelake-authorized-engine-trust-model/01-policy-to-enforcement.svg' | relative_url }}" alt="OneLake as the centralized policy source, with effective access enforced by Fabric and authorized query engines.">
</picture>

## One policy source, several enforcement points

OneLake security separates policy definition from query execution.

Policies are authored and stored in OneLake. They can include access to tables and folders, plus row-level security and column-level security. When a supported engine reads secured data, it applies the user’s effective access at query time.

Microsoft’s current documentation lists several supported paths, including Lakehouse, Spark notebooks, Graph in Fabric, Direct Lake on OneLake semantic models, and the SQL analytics endpoint in user’s identity access mode. Eventhouse support is listed with RLS only in public preview. Authorized third-party engines are also in public preview and can apply RLS and CLS when the engine implements the required integration.

This is not the same as handing every engine raw files and hoping each team recreates the same filters.

The intended pattern is:

1. Define the security policy in OneLake.
2. Resolve the requesting user’s effective access.
3. Give that effective access to a trusted engine.
4. Apply the policy inside the engine’s query layer.
5. Block the path when the policy cannot be enforced safely.

Microsoft states that a nonauthorized external engine is treated as user access. If the user cannot see every row or column in a secured table, OneLake blocks that access rather than returning an unfiltered result.

That fail-closed behavior is the boundary teams should preserve.

## The authorized engine is a trust decision

An authorized engine is not only another connector.

Microsoft’s setup guidance currently requires an engine identity backed by Microsoft Entra ID. A workspace Admin or Member adds that identity to the workspace Member role. The authorization is scoped to the workspace and can be revoked by removing that role assignment.

That role gives the engine privileges needed to read OneLake security role metadata and physical data files. The engine is then responsible for enforcing the requesting user’s effective access in its own compute layer.

This deserves the same design review as any privileged workload identity.

Before authorizing an engine, I would record:

| Decision | Evidence I want |
| --- | --- |
| Engine identity | Exact Entra identity, owner, and purpose |
| Workspace scope | Named workspaces and business reason |
| Policy support | Table, row, and column controls the engine can enforce |
| User propagation | How the requesting user is represented end to end |
| Failure behavior | What happens if policy retrieval or evaluation fails |
| Caching behavior | Whether cached results remain scoped to the right identity |
| Revocation | How access is removed and how quickly that takes effect |
| Audit path | Logs that connect user, engine, workspace, item, and outcome |

The word “authorized” should mean that somebody accepted those answers, not that an identity was added to a role.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/onelake-authorized-engine-trust-model/02-engine-trust-gates-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/onelake-authorized-engine-trust-model/02-engine-trust-gates.svg' | relative_url }}" alt="Six trust gates for an authorized OneLake engine: identity, scope, policy support, user context, fail-closed behavior, and audit evidence.">
</picture>

## Test effective access, not only connectivity

A successful connection proves that the engine can reach OneLake. It does not prove that two users receive different allowed results correctly.

I would build a small acceptance matrix with known data and four personas:

- **Full-data user:** allowed to read the complete test table.
- **Regional user:** allowed to read only a known row subset.
- **Masked-column user:** allowed to read the table without one sensitive column.
- **No-access user:** not granted access to the secured data.

Run the same business questions through every approved engine.

For each engine and persona, record:

- visible tables;
- returned row count and known totals;
- visible columns;
- blocked versus filtered behavior;
- cache behavior after switching identities;
- audit event or diagnostic record;
- result after access is revoked.

The expected outcome is not “all engines return the same rows.” Different users should receive different results.

The expected outcome is that the same user receives the same authorized slice of data across every supported path.

That distinction matters. A single administrator account can make every test look successful while proving almost nothing about policy enforcement.

## Keep the control plane and data plane separate

Fabric has two permission planes that teams can easily mix together.

The control plane governs what someone can do to an item, such as create, configure, share, or delete it. Workspace roles and item permissions live here.

The data plane governs which data the person can see or change. OneLake security roles can scope access to folders, tables, schemas, rows, and columns.

The separation becomes important with authorized engines because the engine identity needs elevated workspace access to perform its enforcement work. That does not mean every end user should inherit the engine’s broad data view.

The engine acts as a trusted enforcement point. The requesting user’s effective access is still the result that should shape the query.

I would therefore review two identity paths independently:

1. **Engine identity:** Can the engine retrieve policy metadata and access the physical data needed to execute the query?
2. **User identity:** Which rows, columns, tables, and folders is this person allowed to receive?

If a design diagram has only one identity arrow, it is probably hiding the most important part of the trust model.

## Add cache isolation to the test plan

Distributed enforcement lets an engine use its native caching and optimization capabilities. That is one of the architectural benefits.

It also means cache isolation belongs in the acceptance test.

A practical sequence is:

1. Query as the full-data user.
2. Query the same object as the regional user.
3. Query again as the user with a restricted column.
4. Revoke one assignment.
5. Repeat the queries and record the behavior.

The result should demonstrate that cached work never expands another user’s effective access. The revocation test should also establish how quickly the changed policy becomes visible through the engine.

Do not invent a universal propagation target. Measure the real path, document the observed timing, and set the operational expectation from evidence.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/onelake-authorized-engine-trust-model/03-acceptance-matrix-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/onelake-authorized-engine-trust-model/03-acceptance-matrix.svg' | relative_url }}" alt="Acceptance matrix comparing full, regional, restricted-column, and no-access users across Fabric and authorized engines.">
</picture>

## Use an engine trust record

This can fit into one reusable record per engine.

My minimum version would contain:

- engine name and version;
- Entra identity and owner;
- authorized workspaces;
- supported OneLake security controls;
- user-context propagation method;
- known limitations and preview dependencies;
- four-persona acceptance results;
- cache-isolation result;
- revoke-and-retest result;
- audit evidence location;
- review date and approving owner.

Re-run the matrix when the engine version changes, when policy support changes, or when the access path changes.

That turns multi-engine security from an architecture promise into a repeatable control.

## My practical recommendation

Use Microsoft’s clarified distributed-enforcement model as the trigger for an engine trust review.

Start with one secured table that has a known row rule and a known column rule. Test it through Direct Lake on OneLake, Spark, the SQL analytics endpoint in user’s identity access mode, and any authorized external engine in scope.

Do not compare only technical success.

Compare effective access for the same identities, then test the identity switch, cache boundary, and revocation path.

OneLake gives teams a valuable design: define policy once, then let capable engines enforce it close to the query.

The benefit becomes real when every engine can produce the same security evidence.

## Sources

- [OneLake security integrations overview](https://learn.microsoft.com/en-us/fabric/onelake/security/onelake-security-integrations-overview)
- [Read data secured with OneLake security](https://learn.microsoft.com/en-us/fabric/onelake/security/read-secured-data)
- [Data security overview](https://learn.microsoft.com/en-us/fabric/onelake/security/get-started-security)
- [OneLake security roles, permissions, and scopes](https://learn.microsoft.com/en-us/fabric/onelake/security/data-access-control-model)
- [MicrosoftDocs update: Add OneLake security whitepaper context](https://github.com/MicrosoftDocs/fabric-docs/commit/3207547739e50ad3c435e7b5dc3081afc524d5f3)
- [Fabric Updates Blog](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blogs/bg-p/fbc_fabricupdatesblogs)
- [Power BI Updates Blog](https://community.fabric.microsoft.com/t5/Power-BI-Updates-Blog/bg-p/fbc_pbiupdatesblog)

---

**Shai Karmani**<br>
Microsoft Data and AI practitioner<br>
[Connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr)
