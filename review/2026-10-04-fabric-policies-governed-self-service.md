---
layout: post
title: "Fabric Policies Make Governed Self-Service Practical"
description: "A practical operating model for turning Fabric governance intent into narrow, enforced, and auditable policy decisions."
date: 2026-10-04
author: Shai Karmani
author_url: https://www.linkedin.com/in/shai-kr
sitemap: false
---

**Review draft. Direct link only. Not listed on the blog.**

Microsoft Fabric has reached the point where a single tenant switch is often too blunt.

A platform team may want analysts to create Dataflow Gen2 items in development workspaces, while limiting the same action in production. External data sharing may be valid for one approved group and one business area, but not as a tenant-wide permission.

The new **Policies in Fabric** preview gives administrators a more precise control model. A policy can define **who** may perform an action, **what** action is covered, and **where** the rule applies. Policies are stored in Policy Set items, managed through the Policies Center, available through public APIs, and designed to participate in CI/CD.

That is the useful shift. Governance can move from a document that asks people to behave correctly to an enforced decision that can be tested and audited.

The feature will be most valuable when teams treat every policy as production configuration, with an owner, acceptance tests, evidence, and a rollback path.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/fabric-policies-governed-self-service/01-policy-control-loop-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/fabric-policies-governed-self-service/01-policy-control-loop.svg' | relative_url }}" alt="Fabric policy control loop from definition and targeting through enforcement and audit evidence.">
</picture>

## Why broad tenant settings stop scaling

Tenant settings are useful for platform-wide defaults. The problem starts when an organization needs a narrow exception or a targeted restriction.

Without a more granular control plane, teams usually choose one of three weak outcomes:

1. enable the capability broadly and rely on guidance;
2. block the capability broadly and slow down legitimate self-service;
3. build a manual approval process that sits outside the platform and is difficult to audit.

Fabric Policies create a fourth option. Administrators can preserve self-service inside defined boundaries and enforce the boundary when the action occurs.

The initial documented policy types include controls for item creation, workspace settings, and external data sharing. Conditions can evaluate contextual attributes such as the user, item type, workspace, capacity, or allowed email domains, depending on the policy type.

This does not remove the need for tenant settings, workspace roles, data security, or change management. It adds a policy layer for decisions that need more precision than an organization-wide switch.

## Understand the evaluation model before writing rules

A policy rule should be readable by the administrator who created it and by the operator who has to explain a blocked action six months later.

Microsoft documents three important behaviors:

- conditions within one rule use `AND` logic;
- rules within the policy use `OR` logic;
- the result can follow a default behavior or an explicit allow or block decision.

That combination is flexible, but it can also produce a wider scope than expected if the team does not test it carefully.

Before creating the rule, write the decision as a sentence:

> Members of the approved Dataflow creator group may create Dataflow Gen2 items in these production workspaces. Other item creation remains unaffected.

Then translate each part into the policy scope and conditions. If the sentence is difficult to express, the rule is probably carrying too many business decisions.

I would keep policy sets narrow. One policy set should have a clear purpose, a named owner, and a predictable audience. A large policy set that mixes item creation, workspace configuration, and external sharing will be harder to review and harder to roll back.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/fabric-policies-governed-self-service/02-policy-set-design-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/fabric-policies-governed-self-service/02-policy-set-design.svg' | relative_url }}" alt="Policy set design record covering administration scope, decision logic, and operational ownership.">
</picture>

## Separate policy hosting from policy enforcement

One subtle architectural detail deserves explicit documentation: the capacity that hosts the Policy Set item does not have to be the capacity where the policy is enforced.

That separation is useful. A central governance team can manage policy artifacts in a controlled workspace while applying the rules to the capacities and workspaces they govern.

It also creates two records that should never be confused:

- **hosting record:** where the Policy Set item lives, who can edit it, and how it is promoted;
- **enforcement record:** which users, actions, workspaces, capacities, or destinations the policy decision covers.

Capture both in the change request. Otherwise an operator may inspect the hosting workspace and assume it describes the enforcement boundary.

The policy artifact should move through the same release discipline as other platform configuration. Use a development version, review the definition, test it against representative personas, promote it through CI/CD, and retain the audit evidence.

## Build an acceptance matrix

A policy is not ready because it saved successfully.

For each policy, I would test at least four cases:

### The intended allowed path

Use a representative user who matches every required condition. Confirm the action succeeds in the intended target.

### The intended blocked path

Use a user who differs by one relevant condition, such as security group or role. Confirm the same action is blocked in the same target.

### The wrong-scope path

Use an allowed identity against a workspace, capacity, item type, or destination that should not be covered. Record the expected behavior before the test.

### The no-match path

Test a request that matches no explicit rule. This proves the policy default is understood rather than assumed.

For every case, save the user persona, requested action, target, expected result, actual result, matching policy or rule, and audit event.

Positive tests prove the business path still works. Negative tests prove the guardrail exists.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/fabric-policies-governed-self-service/03-policy-acceptance-matrix-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/fabric-policies-governed-self-service/03-policy-acceptance-matrix.svg' | relative_url }}" alt="Policy acceptance matrix for allowed users, blocked users, wrong scope, and audit evidence.">
</picture>

## Use audit data as operating evidence

Fabric records policy configuration and enforcement decisions through audit logs. That makes policy evidence useful for more than troubleshooting.

A weekly or monthly review can answer practical questions:

- Which policy rules are blocking actions most often?
- Are blocks concentrated in one workspace or team?
- Is a policy preventing unsafe behavior, or exposing a training gap?
- Are exceptions still active after the original business need ended?
- Did a recent policy change alter the volume or location of blocked actions?

This is where governance becomes operational. The team can see whether the control is working as intended and whether the policy scope should change.

Do not use block counts alone as a success metric. A high count may mean the policy is protecting the platform, or it may mean the rule is poorly targeted. Pair the count with the requested action, target, user context, and support impact.

## Start with one decision that already causes friction

The safest rollout is not a large collection of policy sets on day one.

Choose one repeated governance decision with a clear business owner. Item creation in production workspaces is a good candidate because the intended users and targets can be named and the acceptance tests are easy to understand.

A practical pilot looks like this:

1. document the current tenant setting and manual process;
2. select one policy type and one narrow target;
3. write the intended decision in plain language;
4. create a Policy Set with a named owner;
5. run the acceptance matrix in a non-production scope;
6. confirm audit events identify the decision correctly;
7. promote through the controlled release path;
8. review blocks and exceptions after a fixed period.

The outcome should be measurable. Fewer manual approvals, no unauthorized actions in scope, clear audit evidence, and fewer support escalations are better proof than the number of policies created.

## The operating contract I would use

For each Fabric policy, keep one compact record:

```text
Policy purpose: One business decision
Policy owner: Named platform or domain owner
Hosting location: Policy Set workspace and capacity
Enforcement scope: Users, actions, workspaces, capacities, or destinations
Default behavior: Recorded
Rule logic: Reviewed
Allowed persona test: PASS
Blocked persona test: PASS
Wrong-scope test: PASS
No-match test: PASS
Audit evidence: Captured
Exception owner: Named
Review date: Scheduled
Rollback path: Verified
```

Fabric Policies make governed self-service practical because the platform can enforce a narrow decision without turning every exception into a tenant-wide permission.

The feature is still in preview, so I would pilot it with bounded scope and retain an explicit fallback. But the direction is strong: policy intent, runtime enforcement, CI/CD, and audit evidence can now live in one operating model.

That is a better foundation for Fabric governance than another document asking users to remember the rules.

## Sources

- [Fabric September 2026 Feature Summary](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blog/Fabric-September-2026-Feature-Summary/ba-p/5325825)
- [Policies in Microsoft Fabric overview](https://learn.microsoft.com/en-us/fabric/governance/fabric-policies-overview)
- [Fabric Updates Blog](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blogs/bg-p/fbc_fabricupdatesblogs)
- [Power BI Updates Blog](https://community.fabric.microsoft.com/t5/Power-BI-Updates-Blog/bg-p/fbc_pbiupdatesblog)

---

**Shai Karmani**<br>
Data, Microsoft Fabric, Power BI, Analytics Engineering, and AI<br>
[Connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr)
