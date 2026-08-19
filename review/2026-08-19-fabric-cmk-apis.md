---
layout: default
title: Fabric CMK APIs Make Workspace Encryption Easier to Govern at Scale
date: 2026-08-19
description: Microsoft Fabric customer-managed key APIs are now generally available. The real win is not just encryption control. It is repeatable workspace governance.
author: Shai Karmani
author_url: https://www.linkedin.com/in/shai-kr
---

<style>
@media (max-width: 760px) {
  .site-shell { width: min(var(--max), calc(100% - 18px)); }
  .site-header { gap: 12px; margin-bottom: 22px; }
  .brand { font-size: 0.95rem; }
  .nav { display: none; }
  .article { max-width: 100%; }
  .article-header { padding: 22px 14px; border-radius: 18px; }
  .article-header h1 { font-size: clamp(1.28rem, 5.4vw, 1.72rem); line-height: 1.17; letter-spacing: -0.035em; overflow-wrap: anywhere; }
  .article-header .dek { font-size: 0.93rem; line-height: 1.55; }
  .article-body { overflow-x: hidden; font-size: 0.98rem; }
  .article-body img { width: 100%; max-width: 100%; border-radius: 16px; }
  .subscribe-orbit { display: none; }
}
</style>

<article class="article" markdown="1">
  <header class="article-header">
    <p class="eyebrow">Data Ninja AI Lab</p>
    <h1>Fabric CMK APIs Make Workspace Encryption Easier to Govern at Scale</h1>
    <p class="byline"><img class="avatar avatar-small" src="{{ '/assets/img/shai-karmani-profile.png' | relative_url }}" alt="Shai Karmani"> by <a href="https://www.linkedin.com/in/shai-kr">Shai Karmani</a> · Aug 19, 2026</p>
    <p class="dek">Microsoft Fabric customer-managed key APIs are now generally available. The real win is not just encryption control. It is repeatable workspace governance.</p>
  </header>

  <div class="article-body" markdown="1">
![Fabric workspace CMK API governance loop]({{ '/assets/blog/fabric-cmk-apis/01-cmk-api-control-loop.svg' | relative_url }})

Microsoft published a useful Fabric security update today: Customer-Managed Key APIs for Fabric workspaces are now generally available.

That sounds like a narrow security feature.

It is more interesting than that.

Until now, customer-managed key configuration was mostly a portal operation. That can work for a few workspaces. It does not work well when a platform team needs to apply encryption policy during provisioning, rotate keys consistently, inspect hundreds of workspaces, and prove the current state to security or compliance teams.

The new APIs move CMK from a manual workspace setting into something Fabric admins can put into an operating model.

That is the part worth paying attention to.

## The feature is encryption. The opportunity is control.

Fabric already encrypts data at rest with Microsoft-managed keys. Customer-managed keys add another layer by wrapping Fabric data encryption with a key you own in Azure Key Vault.

For regulated organizations, that matters. Key ownership, rotation, access control, and auditability are often not optional. They are part of the platform contract.

The generally available API set gives teams four practical capabilities:

- assign or rotate a key for a workspace
- inspect the encryption state of a workspace
- reset a workspace back to Microsoft-managed keys
- list workspace encryption state across the tenant through the admin API

The individual calls are not complicated. The operating model around them is where teams need to be careful.

A key can protect data only if the surrounding process is reliable. Who owns the key? Which workspaces require CMK? Which items are supported? What happens when encryption is still in progress? Who gets paged if a workspace moves into a failed state?

Those questions are not solved by an API endpoint. The endpoint just makes them automatable.

## Why this matters for Fabric platform teams

Fabric is becoming a real enterprise data platform, not only a collection of analytics experiences.

That changes the job of the admin.

A platform team now has to manage workspaces, capacities, data products, semantic models, pipelines, warehouses, lakehouses, eventhouses, shortcuts, gateways, agents, and governance policies. Security settings cannot live as one-off portal clicks inside that estate.

CMK APIs help because they create a path for repeatable controls:

- apply CMK during workspace provisioning
- verify the configured key after deployment
- detect drift between expected and actual encryption state
- rotate keys without turning the process into a manual campaign
- produce tenant-wide evidence for audit reviews

That last point is easy to undervalue.

A screenshot is weak evidence. A repeatable inventory is better.

If a tenant admin can ask, "which workspaces are encrypted, which key do they use, and which ones are in progress or failed?" then encryption posture becomes visible enough to manage.

## The rollout checklist matters more than the script

![CMK rollout checklist for Fabric workspaces]({{ '/assets/blog/fabric-cmk-apis/02-cmk-rollout-checklist.svg' | relative_url }})

I would not start this by writing the automation first.

I would start with the rollout checklist.

Before assigning a key to any production workspace, the platform team should confirm the basics:

- the Fabric tenant setting for customer-managed keys is enabled
- the Fabric Platform CMK service principal exists in Microsoft Entra ID
- Azure Key Vault has soft delete and purge protection enabled
- the key is RSA or RSA-HSM and uses a supported size
- the key identifier is versionless
- the workspace contains only supported Fabric items
- the required workspace and tenant permissions are clear
- the owner of key rotation is named

That list is not paperwork. It prevents the painful class of failure where the API succeeds in one place, fails in another, and nobody knows whether the issue is Key Vault, permissions, unsupported items, workspace state, or tenant policy.

The Microsoft docs also include some important caveats. For example, not every item or metadata surface is protected by CMK, and some mirrored scenarios are not supported in CMK-enabled workspaces. SQL database in Fabric has a specific manual revalidation note if key access is restored after becoming inaccessible.

Those details belong in the runbook, not in someone's memory.

## Treat encryption status as a monitored state

The `GET /v1/workspaces/{workspaceId}/encryption` API is the part I would build around first.

The response can show whether encryption is active, disabled, enabling, disabling, or failed. When encryption is in progress, the API can include a `Retry-After` header. It can also return item-level details for encryption states.

That gives admins enough signal to build a responsible loop.

![Workspace encryption status model for Fabric CMK APIs]({{ '/assets/blog/fabric-cmk-apis/03-cmk-status-model.svg' | relative_url }})

A simple version could look like this:

1. Provision or identify the workspace.
2. Check whether the workspace is eligible for CMK.
3. Assign the versionless Key Vault key URI.
4. Poll status using the service response timing.
5. Record the key identifier and final status.
6. Alert on failed or long-running states.
7. Include workspace encryption state in regular governance inventory.

This is not glamorous engineering.

It is the kind of platform hygiene that keeps enterprise analytics estates from becoming a maze of exceptions.

## Be careful with reset and rotation

The assign API is used both to enable CMK and to rotate the encryption key by supplying a different key identifier.

That is powerful, but it should not be treated like a casual update.

A rotation workflow should capture the previous key state, confirm the new key meets Key Vault requirements, check that the workspace reaches the expected status, and keep the older version available long enough for Fabric to use the latest version safely. The docs call out that Fabric checks Key Vault daily for a new key version and recommends waiting before disabling an older version.

Resetting encryption back to Microsoft-managed keys is also not something I would hide inside a generic remediation script. It may be valid in some cases, but it should be a deliberate platform decision with a reason, approval path, and audit record.

Security automation should reduce ambiguity, not make risky actions easier to trigger accidentally.

## Where this fits in a broader Fabric governance model

CMK APIs are one piece of a larger pattern I keep seeing in Fabric updates.

Microsoft is making more admin and governance operations scriptable: item definitions, deployment, workspace settings, org apps, paginated reports, semantic model settings, data source routing, identities, gateways, monitoring, and now workspace encryption.

The practical takeaway is that Fabric governance is moving toward code, APIs, and repeatable platform processes.

That is good for serious teams.

It also raises the bar. If the platform exposes the control plane through APIs, teams eventually need source-controlled policies, deployment checks, inventory jobs, exception reporting, and operational ownership.

The win is not that every setting can be scripted.

The win is that the platform can be made predictable.

## A practical starting point

If I were advising a Fabric admin team, I would start small:

- pick one low-risk workspace that requires CMK
- validate Key Vault and tenant prerequisites
- apply CMK through the API
- verify status until active
- record the workspace ID, key URI, state, timestamp, and owner
- test the failure path in a non-production workspace
- turn that into a repeatable runbook before expanding

Do not begin with a tenant-wide rollout.

Begin with evidence.

Once the team can prove the loop works, expand by workspace type, data sensitivity, or business domain.

That is how a security feature becomes a platform capability.

## The bigger lesson

The headline is that CMK APIs for Fabric workspaces are generally available.

The real story is that workspace encryption is now easier to govern like a first-class platform operation.

Portal settings are fine for isolated administration. APIs are better for consistent operations, especially when the estate grows.

For Fabric teams dealing with regulated data, this is a good moment to stop treating CMK as a checkbox and start treating it as an encryption posture lifecycle:

Provision. Assign. Verify. Monitor. Rotate. Audit.

That is the part that will matter six months after the feature announcement is forgotten.

## Sources

- [Customer-Managed Key (CMK) APIs for Microsoft Fabric Workspaces (Generally Available)](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blog/Customer-Managed-Key-CMK-APIs-for-Microsoft-Fabric-Workspaces/ba-p/5360035)
- [Customer-managed keys for Fabric workspaces](https://learn.microsoft.com/en-us/fabric/security/workspace-customer-managed-keys)
- [Workspaces - Assign Workspace Encryption](https://learn.microsoft.com/en-us/rest/api/fabric/core/workspaces/assign-workspace-encryption)
- [Workspaces - Get Workspace Encryption](https://learn.microsoft.com/en-us/rest/api/fabric/core/workspaces/get-workspace-encryption)

---

Written by **Shai Karmani**. Connect with me on [LinkedIn](https://www.linkedin.com/in/shai-kr).

  </div>
</article>
