---
layout: post
title: "Fabric Apps Just Opened a New Public Data Pattern"
date: 2026-08-25
description: Anonymous data access for Fabric Apps gives teams a practical way to build public-facing data experiences while keeping the exposed surface deliberately small and governed.
author: Shai Karmani
author_url: https://www.linkedin.com/in/shai-kr
---

<style>
@media (max-width: 760px) {
  .site-shell { width: min(100% - 24px, var(--max)); }
  .site-header { gap: 12px; margin-bottom: 18px; }
  .brand { font-size: 0.94rem; }
  .brand-mark { width: 32px; height: 32px; border-radius: 10px; }
  .nav { width: 100%; gap: 6px; font-size: 0.82rem; justify-content: flex-start; flex-direction: column; align-items: flex-start; }
  .nav a { padding: 1px 0; }
  .nav-subscribe { padding: 3px 8px; margin-left: 0; }
  .article { max-width: 100%; overflow-x: hidden; }
  .article-header { padding: 20px 14px; border-radius: 18px; }
  .article-header h1 { font-size: clamp(1.12rem, 5vw, 1.52rem); line-height: 1.17; letter-spacing: -0.025em; overflow-wrap: normal; }
  .article-header .dek { font-size: 0.94rem; margin-top: 14px; }
  .article-body { overflow-x: hidden; font-size: 0.98rem; }
  .article-body img { width: 100%; max-width: 100%; border-radius: 16px; }
  .subscribe-orbit { display: none; }
}
</style>

Most analytics platforms are designed around authenticated users.

That makes sense. Internal BI, governed data, semantic models, warehouses, lakehouses, and operational dashboards usually belong behind a company identity boundary.

But not every useful data experience is internal.

Sometimes you need a public product catalog. A registration flow. A lightweight status page. A public lookup backed by curated data. A partner-facing app where requiring a tenant login would kill the experience before anyone gets value from it.

Microsoft's new anonymous data access for Fabric Apps, now in preview, creates an interesting opening for those scenarios.

Fabric Apps can now support public-facing experiences without mandatory sign-in, while still requiring tenant admin approval, explicit app opt-in, and role permissions for anonymous users. According to Microsoft's announcement, app developers can expose specific read or create operations for public data while protecting sensitive information through administrative and model-level controls.

That is the right direction.

The practical opportunity is not "make Fabric public." That would be a bad slogan and a worse architecture.

The opportunity is more focused: build small public data products on top of Fabric when the boundary is clear, the exposed data is deliberate, and the operating model is written down before the first external user arrives.

![Public Fabric App Access Model](/data-ninja-ai-lab/assets/blog/fabric-apps-public-data-pattern/diagrams/01-public-fabric-app-access-model.svg)

## Why this matters

Fabric has been moving steadily from analytics workspace to broader data application platform.

Fabric Apps already give teams a way to build and deploy app experiences with Fabric infrastructure around authentication, data persistence, and static hosting. Anonymous access changes the set of patterns that become realistic.

For internal users, identity is the default control surface. You know the user. You can use workspace access, app access, semantic model permissions, row-level security, object-level security, endorsements, and normal tenant policies.

For anonymous users, the model has to be different.

You cannot rely on the user's corporate identity. You cannot assume a department, role, manager, license, workspace membership, or normal BI consumption path.

That forces a cleaner design conversation.

What is actually public? What can a public user do? What data should never cross that line? What happens if the public flow is abused? Who owns monitoring and rollback?

Those are good questions. They are the questions teams should already be asking when they build public data experiences, even if the first version is a simple form or lookup page.

## The best use cases are small and explicit

Anonymous access is most useful when the public surface is narrow.

A few examples make sense:

- A public product or service catalog backed by curated Fabric data.
- Event registration where anonymous users can create a controlled record.
- A public operational status view where the exposed fields are non-sensitive.
- A partner intake form that writes to a reviewed table or workflow.
- A simple lookup experience where users can read only a prepared subset.

Those are not open-ended analytics scenarios. They are product scenarios.

That distinction matters.

A public Fabric App should not feel like a workspace with the doors left open. It should feel like a product boundary: defined inputs, defined outputs, controlled permissions, validation, observability, and a clear owner.

![Public data boundary checklist](/data-ninja-ai-lab/assets/blog/fabric-apps-public-data-pattern/diagrams/02-public-data-boundary-checklist.svg)

## The governance work moves earlier

The easiest mistake is to treat anonymous access as a front-end setting.

It is not.

The setting is only the final visible part. The real work happens before it:

- Tenant admins decide whether this capability is allowed and who can use it.
- App owners decide which app scenarios deserve anonymous access.
- Data owners define which fields and operations are safe to expose.
- Developers validate inputs and keep create operations tightly scoped.
- Platform teams monitor usage and review suspicious or unexpected behavior.

That is not heavy process. It is the minimum operating model for a public endpoint backed by business data.

The announcement mentions several important controls: tenant admin approval, explicit app opt-in, data-model role permissions, minimal grants, field restrictions, input validation, and monitoring.

That combination is the point.

Anonymous access should never be sold internally as "now anyone can use the app." The better framing is "we can build a public experience where the allowed data and actions are intentionally small."

That is a much safer conversation with security, compliance, and platform owners.

## Read and create are very different promises

The announcement mentions read and create permissions for public data scenarios.

Those two words deserve different review paths.

Read access is about disclosure. The question is whether the data can safely be seen by someone you cannot identify.

Create access is about integrity. The question is whether an anonymous user can write something that later becomes trusted operational data.

That second path needs more care.

If an anonymous app can create records, I would want to know:

- What fields can be submitted?
- Which fields are system-controlled and never client-controlled?
- What validation happens before the record is accepted?
- Is there a review queue before downstream consumption?
- Can duplicate, spammy, or malicious submissions be detected?
- Which downstream reports, workflows, or notifications use that data?

A public registration form and a public catalog page should not go through the same gate. One exposes information. The other changes state.

Treat them differently.

## A practical rollout pattern

I would start with one app and one public scenario.

Not ten. One.

Pick a scenario where the data is already meant to be public or where the create operation is low-risk and easy to validate. Then write the contract in plain English:

- The purpose of the app.
- The public audience.
- The fields exposed.
- The operations allowed.
- The owner of the app.
- The owner of the data.
- The monitoring signal.
- The rollback step if something goes wrong.

Then test it like a production surface, not a demo.

Use a fake public user. Try bad inputs. Try missing fields. Try duplicate submissions. Check what lands in the data store. Check what downstream users see. Check whether the monitoring is useful enough for a real incident.

Only then expand.

![Safe rollout path](/data-ninja-ai-lab/assets/blog/fabric-apps-public-data-pattern/diagrams/03-safe-rollout-path.svg)

## The useful mental model

The closest mental model is not a dashboard.

It is a public API or lightweight product surface backed by governed data.

That means the Fabric team has to think beyond reports and datasets. They need application ownership, permission design, source control, validation, observability, and release discipline.

That is also why this preview is interesting.

It pushes Fabric further into the space where analytics, operational apps, and data products meet. For organizations already trying to turn data work into usable products, this is worth watching.

The feature will not remove the need for app architecture. It raises the bar for it.

## The practical takeaway

Anonymous data access for Fabric Apps is a good signal for teams building public-facing data experiences.

Used well, it can reduce friction for external users while keeping the public surface small and governed. Used casually, it can create a messy boundary between public users and business data.

The difference is not the preview feature. The difference is the operating model around it.

Start with one public scenario. Keep the permissions narrow. Separate read from create. Validate inputs. Monitor behavior. Make rollback boring.

That is how this becomes a useful Fabric Apps pattern instead of another public access setting that makes everyone nervous.

## Sources

- [Introducing anonymous data access for Fabric Apps (Preview)](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blog/Introducing-anonymous-data-access-for-Fabric-Apps-Preview/ba-p/5361116)
- [Create your first Fabric apps project](https://learn.microsoft.com/en-us/fabric/apps/create-app)
- [Roles in workspaces in Microsoft Fabric](https://learn.microsoft.com/en-us/fabric/fundamentals/roles-workspaces)

## About Shai

Shai Karmani is a senior data and AI practitioner focused on Microsoft Fabric, Power BI, analytics engineering, and practical AI systems. You can connect with him on [LinkedIn](https://www.linkedin.com/in/shai-kr).
