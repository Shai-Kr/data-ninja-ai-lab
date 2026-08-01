---
layout: post
title: "Make Power BI Semantic Model Settings Easier to Govern"
description: "The new semantic model settings pane is a useful Power BI admin upgrade. The real win is using it to tighten refresh, credentials, access, and ownership before problems become support tickets."
date: 2026-08-01
author: Shai Karmani
author_url: https://www.linkedin.com/in/shai-kr
---

<style>
.article-body code { overflow-wrap: anywhere; word-break: break-word; }
.article-body img[src*="semantic-model-settings-pane-review"] { width: min(100%, 620px); max-width: 620px; display: block; margin-left: auto; margin-right: auto; }
.article-body table { display: block; overflow-x: auto; white-space: nowrap; }
</style>

![Semantic model settings control map]({{ '/assets/blog/semantic-model-settings-pane-review/01-settings-pane-control-map.svg' | relative_url }})

Power BI semantic model settings are becoming less of a separate admin page and more of an in-context workflow.

That is a good change.

In the July 2026 Power BI update, Microsoft says the semantic model settings pane becomes the default starting in August. Instead of jumping away to the full settings page, admins and model owners can open settings beside the content they are working with and update refresh schedules, credentials, and other model options with less context switching.

On paper, that sounds like a UI improvement.

In practice, it is a governance opportunity.

A lot of Power BI estates do not fail because teams lack features. They fail because semantic model administration is scattered across too many people, too many workspaces, and too many undocumented decisions. Refresh settings are copied from old models. Credentials belong to whoever built the first version. RLS roles are rarely reviewed after release. Sensitivity labels, endorsements, descriptions, and workspace access drift quietly.

A better settings pane will not fix that by itself.

But it can make the right checks easier to run.

## Why this matters now

Semantic models are no longer just datasets behind reports.

They are shared business assets. They feed reports, apps, Excel, embedded experiences, Copilot experiences, and sometimes downstream automation. When the model is wrong, stale, insecure, or poorly described, the problem spreads quickly.

The new settings pane matters because it brings administration closer to the model owner workflow.

That changes the question from:

> Where do I find the old settings page?

To:

> What should we verify every time we touch a critical model?

That second question is where senior BI teams can get value.

## The mistake to avoid

The easy reaction is to treat the new pane as a convenience feature.

Open model. Change setting. Move on.

That is fine for small personal reports. It is not enough for shared semantic models that executives, finance teams, operations teams, or customer-facing systems depend on.

For production models, the pane should become part of a short review workflow.

Not a huge governance ceremony. Just enough discipline to prevent the common failures.

![Semantic model settings admin checklist]({{ '/assets/blog/semantic-model-settings-pane-review/02-admin-checklist.svg' | relative_url }})

## The review I would run first

If I inherited a Power BI workspace today, I would use the settings pane as the entry point for a 30 minute semantic model review.

I would not start with a beautiful architecture diagram.

I would start with four checks.

### 1. Who owns this model?

Every important semantic model needs two owners.

One business owner who knows whether the numbers are trusted.

One technical owner who knows how the model refreshes, where the data comes from, how measures are maintained, and what breaks when a source changes.

If the answer is "the person who built it three years ago", that model is already carrying operational risk.

The settings pane cannot assign accountability by itself, but it gives the team a practical place to start the conversation.

For each important model, capture:

- business owner;
- technical owner;
- workspace;
- source systems;
- refresh schedule;
- audience or org app dependency;
- criticality;
- support contact.

A spreadsheet is enough for the first pass.

### 2. Does the refresh schedule match the business need?

Refresh settings are often inherited rather than designed.

A daily finance model, a near-real-time operations model, and a low-usage management report should not all follow the same pattern just because someone copied a previous dataset.

For each model, check:

- refresh frequency;
- refresh window;
- dependency order;
- gateway or cloud connection path;
- last failure pattern;
- whether the business still needs that refresh frequency.

The practical win is not always faster refresh.

Sometimes the win is fewer unnecessary refreshes, less capacity pressure, and fewer false support incidents.

### 3. Are credentials and connections safe to operate?

Credentials are one of the easiest places for Power BI estates to drift.

Personal credentials work until the person leaves, changes roles, rotates a password, or loses access. Gateway mappings work until a source moves. Cloud connections work until nobody remembers why a service principal was created.

For production models, I would check:

- whether credentials belong to a person or an approved service identity;
- whether the connection is documented;
- whether the gateway path is still the right one;
- whether the model uses sources that require special privacy or network rules;
- whether connection failures are routed to someone who can fix them.

This is not glamorous work. It is the work that keeps trusted reports from turning into Monday morning escalations.

### 4. Is access aligned with how the model is consumed?

Power BI access is rarely only one thing.

A user might reach a report through a workspace, a shared link, an app, an org app audience, Excel, or a direct semantic model connection. That means model access deserves its own review, not just report access.

For each important model, verify:

- workspace roles;
- build permissions;
- RLS roles and members;
- sensitivity labels;
- endorsement or certification status;
- downstream reports and apps;
- whether external sharing is relevant;
- whether Copilot or AI experiences may rely on the model metadata.

The model is the contract. Reports are only one consumer of that contract.

## A practical operating model

The settings pane is useful because it puts more of this work closer to where model owners already work.

But UI proximity is not the same as operational discipline.

I would define a simple operating model around critical semantic models.

![Semantic model settings operating model]({{ '/assets/blog/semantic-model-settings-pane-review/03-operating-model.svg' | relative_url }})

### For low-risk models

A lightweight review is enough.

- named owner;
- refresh schedule checked;
- credentials confirmed;
- access reviewed when someone asks for build permission.

### For shared departmental models

Add a little more control.

- owner register;
- refresh failure routing;
- quarterly access review;
- measure descriptions for core KPIs;
- endorsement policy;
- documented source systems.

### For executive or operational models

Treat the semantic model like production infrastructure.

- business and technical ownership;
- change review for major model updates;
- tested refresh dependencies;
- approved credential pattern;
- RLS and access review;
- monitoring for refresh failures;
- support path;
- documentation that a new admin can understand.

That sounds heavier, but it is usually lighter than explaining why the CEO dashboard is stale on the morning of a board meeting.

## The checklist I would keep beside the pane

Here is the short version I would use with a BI team.

| Check | Question |
| --- | --- |
| Ownership | Who owns the business meaning and who owns the technical model? |
| Refresh | Does the schedule match the actual business need? |
| Dependencies | What upstream jobs, gateways, or sources does this model depend on? |
| Credentials | Are credentials tied to a safe identity pattern? |
| Access | Who can view, build, share, or manage the model? |
| RLS | Are roles still correct and tested? |
| Labels | Is the sensitivity label appropriate for the data? |
| Endorsement | Should this be promoted, certified, or left unendorsed? |
| Documentation | Can a new admin understand how this model works? |
| Support | Who gets called when refresh fails? |

This is not bureaucracy. It is basic model hygiene.

## Where this fits in the bigger Power BI shift

Power BI is slowly moving more model work into the service.

Web modeling, model options in the service, TMDL view on the web, measure descriptions from triple-slash comments, org apps, audience management, and richer APIs all point in the same direction.

The browser is becoming a serious place to operate BI assets, not just consume reports.

That creates a useful tension.

More people can make changes.

More changes can happen closer to the workspace.

More model administration can happen without opening Desktop.

That is good for speed, but it also means teams need clearer standards.

The semantic model settings pane is a small feature if you only look at the screen.

It is a bigger feature if you use it as the front door to model governance.

## My take

I like this update because it makes the right admin work easier to reach.

But I would not sell it internally as "new settings UI".

I would sell it as a chance to clean up semantic model ownership.

Pick the top ten models in the tenant. Open the settings pane. Check owners, refresh, credentials, access, labels, endorsement, and support routing.

You will probably find at least one risk worth fixing before it becomes visible to the business.

That is the real value.

## Sources

- [See What's New in the July 2026 Power BI Update](https://learn.microsoft.com/en-us/power-bi/fundamentals/whats-new)
- [Edit semantic models in the Power BI service](https://learn.microsoft.com/en-us/power-bi/transform-model/service-edit-data-models)
- [Get Started with Org Apps](https://learn.microsoft.com/en-us/power-bi/explore-reports/org-app-items)

## About the author

Shai Karmani is a senior data and AI practitioner focused on Microsoft Fabric, Power BI, analytics engineering, and practical automation.

Connect with Shai on LinkedIn: [https://www.linkedin.com/in/shai-kr](https://www.linkedin.com/in/shai-kr)
