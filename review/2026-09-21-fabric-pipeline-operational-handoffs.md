---
layout: post
title: "Turn Fabric Pipeline Notifications Into Real Operational Handoffs"
description: "A practical decision model for replacing legacy Teams and Outlook activities with modern notifications, approvals, and testable operating contracts."
date: 2026-09-21
author: Shai Karmani
author_url: https://www.linkedin.com/in/shai-kr
sitemap: false
---

**Review draft. Direct link only. Not listed on the blog.**

Microsoft is changing how notification steps are added to Fabric Data Factory pipelines.

Beginning October 30, 2026, users will no longer be able to add new legacy Teams or legacy Outlook activities. Existing legacy activities can still be edited and used, while new notification scenarios should use the modern Microsoft Teams and Outlook activities.

This is a useful migration deadline. It is also a good reason to review what each message in a pipeline is supposed to accomplish.

A pipeline message can notify someone. It can ask for acknowledgment. Or it can require a decision before processing continues. Those are three different operating contracts, and they should not share the same design.

I would use this change to turn pipeline notifications into real operational handoffs.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/fabric-pipeline-operational-handoffs/01-three-handoffs-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/fabric-pipeline-operational-handoffs/01-three-handoffs.svg' | relative_url }}" alt="Three Fabric pipeline handoff patterns: notification, acknowledgment, and approval decision.">
</picture>

## Start with the outcome, not the channel

Teams and email are delivery channels. They do not define the business behavior.

Before replacing an activity, ask one question:

**What must be true after this message is sent?**

The answer usually falls into one of three categories.

### 1. Notification

The pipeline sends useful information, but execution does not wait for a person.

Examples:

- a daily load completed;
- a quality threshold was missed;
- a retry succeeded;
- a downstream dataset is ready;
- a noncritical source arrived late.

Use the modern Teams or Outlook activity when the message is informational and the pipeline can continue or finish independently.

### 2. Acknowledgment

A person needs to own the next action, but the pipeline does not need a formal approve or reject branch.

This is often better handled outside the pipeline with an operational queue, incident system, or work item. The notification should include enough context to create ownership, not just announce that something happened.

### 3. Approval decision

The pipeline must pause until a reviewer approves, rejects, or reaches a timeout.

Fabric's Approval activity is designed for this pattern. It can request a decision through Outlook or Teams and route the pipeline based on the result. Because it changes control flow, it needs stricter design than a normal notification.

Do not turn every warning into an approval. Human gates are useful when a decision is material. They become noise when every routine variation asks someone to click a button.

## Build an inventory before the deadline

The first migration step is not opening every pipeline and swapping activity names.

Create an inventory with one row per legacy activity:

| Field | Why it matters |
| --- | --- |
| Workspace and pipeline | Identifies the deployment unit |
| Activity name and type | Shows the current implementation |
| Owner | Gives the migration a decision maker |
| Trigger condition | Explains why the message is sent |
| Recipient | Reveals personal mailboxes and fragile routing |
| Business purpose | Separates information from control flow |
| Current payload | Shows what evidence users receive today |
| Failure behavior | Captures what happens when message delivery fails |
| Replacement pattern | Notification, acknowledgment, or approval |
| Test result | Proves the new path works |

Prioritize pipelines that affect production loads, finance close, regulated data, executive reporting, or customer-facing processes. A legacy activity in a development pipeline is not the same risk as a notification that coordinates a month-end data release.

## Design a message as an evidence packet

Most pipeline messages are too thin.

"Pipeline failed" tells the recipient almost nothing. A useful handoff should answer:

- what happened;
- which pipeline run is affected;
- when it happened;
- what data or business process is involved;
- what the recipient should do;
- where the supporting evidence lives;
- what happens if nobody responds.

For a notification, that may be enough.

For an approval, add the decision boundary:

- what exactly is being approved;
- which checks already passed;
- which exceptions remain;
- who is allowed to decide;
- when the request expires;
- what the reject branch does;
- whether a timeout fails safely.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/fabric-pipeline-operational-handoffs/02-decision-model-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/fabric-pipeline-operational-handoffs/02-decision-model.svg' | relative_url }}" alt="Decision model for choosing a modern Teams notification, operational acknowledgment, or Fabric Approval activity.">
</picture>

## Treat failure handling as part of the migration

A notification step can fail even when the data work succeeds.

That creates an awkward question: should the entire pipeline fail because Teams or email was unavailable?

There is no universal answer. Define it by message type.

For a low-priority completion notice, record the delivery failure and let the data pipeline complete. For a critical incident alert, retry and route to a second channel or incident system. For an approval gate, a delivery failure should normally stop the process because the required decision was never requested.

The same distinction applies to timeouts.

A timeout should not silently become approval. Choose a safe route explicitly:

- reject and stop;
- escalate to another owner;
- create an incident;
- hold the process for manual recovery.

If the process has no safe timeout behavior, it is not ready for an approval activity.

## Use environment-aware recipients

Hard-coded personal recipients are easy to build and hard to operate.

Use environment-aware configuration for:

- development, test, and production channels;
- support groups or role-based mailboxes;
- business owners;
- escalation recipients;
- regional or business-unit routing.

The pipeline logic should not need editing when ownership changes. Keep recipients and routing rules in governed configuration, then test that configuration during deployment.

Also decide what information is safe to place in Teams or email. Avoid sending credentials, raw sensitive records, or unrestricted diagnostic payloads. Link to controlled evidence where possible.

## A five-case acceptance test

I would not call this migration complete after the new activity sends one successful test message.

Run five cases:

1. **Normal completion:** the modern activity sends the expected message with the correct run context.
2. **Pipeline failure:** the right error path triggers and the message points to useful evidence.
3. **Delivery failure:** the pipeline follows the documented retry, continue, or stop behavior.
4. **Approval timeout:** the process takes the safe timeout branch and records the outcome.
5. **Wrong environment check:** a nonproduction run cannot notify production recipients or request a production approval.

For approval flows, add approve and reject tests with authorized reviewers. Confirm that each branch performs the intended downstream action and that the decision can be traced to the pipeline run.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/fabric-pipeline-operational-handoffs/03-migration-loop-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/fabric-pipeline-operational-handoffs/03-migration-loop.svg' | relative_url }}" alt="Migration loop for inventorying legacy activities, classifying intent, replacing, testing, and retiring them with evidence.">
</picture>

## The practical migration sequence

A clean rollout can follow six steps:

1. Inventory every legacy Teams and Outlook activity.
2. Classify each one as notification, acknowledgment, or approval.
3. Select the modern activity or external operating system that matches the outcome.
4. Rewrite the message as an evidence packet with ownership and next action.
5. Run the five-case acceptance test in a nonproduction environment.
6. Promote, monitor, and rescan until no unmanaged legacy activity remains.

Existing legacy activities do not stop working on October 30. The immediate change is that users can no longer add new ones. That gives teams room to migrate deliberately rather than rush.

Use that room well.

The goal is not to replace one notification icon with another. The goal is to make every pipeline message clear about ownership, decision rights, failure behavior, and evidence.

That is how a notification becomes an operational handoff.

## Sources

- [Upcoming changes to legacy Teams and Outlook activities in Fabric Data Factory pipelines](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blog/Upcoming-changes-to-legacy-Teams-and-Outlook-activities-in/ba-p/5314499)
- [Microsoft Teams activity in Fabric Data Factory](https://learn.microsoft.com/en-us/fabric/data-factory/teams-activity)
- [Outlook activity in Fabric Data Factory](https://learn.microsoft.com/en-us/fabric/data-factory/outlook-activity)
- [Approval activity in Fabric Data Factory](https://learn.microsoft.com/en-us/fabric/data-factory/approval-activity)
- [Fabric pipeline activities overview](https://learn.microsoft.com/en-us/fabric/data-factory/activity-overview)
- [Microsoft Fabric What's New](https://learn.microsoft.com/en-us/fabric/fundamentals/whats-new)
- [Fabric Updates Blog](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blogs/bg-p/fbc_fabricupdatesblogs)
- [Power BI Updates Blog](https://community.fabric.microsoft.com/t5/Power-BI-Updates-Blog/bg-p/fbc_pbiupdatesblog)

---

**Shai Karmani**<br>
Microsoft Data and AI practitioner<br>
[Connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr)
