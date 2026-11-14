---
layout: post
title: "The Feedback Loop That Makes Fabric Data Agents Better Every Week"
date: 2026-11-14
description: Fabric data agents can collect consumer feedback and operational telemetry. Here is a practical weekly loop for turning those signals into tested, governed improvements.
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

Fabric data agents are getting something more useful than another prompt setting: a path from consumer feedback to creator action.

Microsoft already supports answer ratings and comments for Fabric data agents used in Microsoft Copilot. Creators can retrieve shared feedback through the Fabric data agent Python SDK. The Fabric roadmap now describes a broader consumer-to-creator monitoring loop, starting with Microsoft 365 Copilot and later expanding to other consumption channels.

That creates a practical operating model. A weak answer no longer has to remain an anecdote in a Teams chat or support ticket. It can become a case with evidence, an owner, a tested correction, and a release record.

{% include yt-embed.html id="KOMo49vQUAc" title="Build a Fabric Data Agent in 5 Minutes (+ Prod Checklist)" duration="9:39" kicker="Related PBI 101 build" %}

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/fabric-data-agent-feedback-loop/01-feedback-path-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/fabric-data-agent-feedback-loop/01-feedback-path.webp" alt="A four-stage flow turns a consumer question and rating into creator triage, a targeted fix, and a retest"></picture></figure>

## Feedback is evidence, not a backlog by itself

A thumbs-down rating tells you that a user disliked an answer. It does not tell you why.

The failure could be in the agent, but it could also come from:

- stale or incomplete source data
- a permission boundary that hides required rows or objects
- ambiguous business language
- an instruction that routes the question to the wrong source
- an example query that teaches the wrong join or aggregation
- a valid question that the current agent design does not support

That is why I would not create a work item called "improve agent accuracy" for every negative rating. I would create a bounded case with the original business intent, the answer the user saw when it was shared, the expected result, and enough execution evidence to classify the problem.

The feedback feature can provide a rating, comment, submitted time, optional shared question and response, and optional attachments. Which fields are available depends on user choice and organizational feedback policies. The feedback table does not include user identifiers or email addresses, but the shared content can still contain personal or sensitive information.

Treat the feedback dataset as governed operational data, not casual product analytics.

## Enablement is part of the control model

Feedback sharing is not automatic.

A Microsoft 365 administrator must enable **Agent feedback sharing** for all agents or selected agents. The creator then republishes the Fabric data agent to Microsoft Copilot. Creators also need Write permission on the agent to retrieve its feedback.

That sequence matters because it gives the process named control points:

1. An administrator decides which agents can share feedback with creators.
2. A creator republishes the agent after the setting is enabled.
3. Consumers decide what to submit with each rating.
4. People who can edit the agent can read the shared feedback.

The control is not only about turning a feature on. It is about knowing who can read the resulting data and where notebook output or downloaded attachments can travel.

## Pull a bounded review window

The SDK makes the first review simple:

```python
from fabric.dataagent.client import FabricDataAgentManagement

management = FabricDataAgentManagement(
    data_agent="<your-data-agent-name>"
)

feedback = management.list_feedback(
    start_date="2026-11-01",
    end_date="2026-11-07",
    sort_by="submitted_at",
    ascending=False,
    max_results=100,
    page_size=50,
)

display(feedback)
```

I prefer a fixed window over an unbounded dump. It gives the team a repeatable weekly review, makes volume visible, and creates a clear cutoff for the release that follows.

Attachments need extra care. Microsoft documents that Purview sensitivity labels and protections are not preserved on downloaded feedback attachments. The SDK requires an explicit acknowledgement before download. That is a useful guardrail, but the operating decision still belongs to the team: avoid downloading unless the case requires it, store the file in an approved location, and do not circulate notebook output without review.

## Feedback and telemetry solve different parts of the problem

Consumer feedback answers a qualitative question: did this answer help, and what did the user think was wrong?

Operational telemetry answers a different question: what happened while the agent request executed?

For Fabric data agents connected to Microsoft Foundry, Microsoft documents traces in Application Insights that can include duration, status, queried data sources, agent and source display names, reasoning step IDs, and conversation IDs. Prompts and responses are not included in that telemetry.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/fabric-data-agent-feedback-loop/02-two-signals-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/fabric-data-agent-feedback-loop/02-two-signals.webp" alt="A comparison separates qualitative consumer feedback from operational request telemetry"></picture></figure>

Do not flatten those two datasets into one unrestricted table. They have different content, access paths, retention questions, and residency considerations.

Use a case record to connect the conclusions:

| Field | Purpose |
| --- | --- |
| Case ID | Stable reference for the investigation |
| Submitted time | Connects the signal to the correct release window |
| Business intent | What the user was trying to decide |
| Failure class | Source, access, terminology, routing, query, or support boundary |
| Evidence reference | Link to approved feedback or telemetry, not copied content |
| Owner | Person responsible for the correction |
| Acceptance test | Original question plus nearby variations |
| Agent version | Release that contains the change |

This gives the creator enough structure to improve the agent without turning every user conversation into broadly accessible debugging data.

## Fix the smallest responsible layer

Once the failure is classified, change the narrowest layer that owns the problem.

If the answer used the wrong business definition, fix the governed definition or agent instruction. If the generated query missed a required join, add or correct an example query. If a source was unavailable because of permissions, fix the access path and test with the intended consumer identity. If the source data was stale, the agent configuration is not the first place to look.

Example queries are especially useful because Fabric validates them against the selected source. The run-steps view can show which examples were retrieved for a question. The SDK can also evaluate SQL examples for clarity, relatedness, mapping, and conflicts.

The next roadmap step is parameterized example queries, described as reusable query templates for SQL databases and semantic models. That could make common business patterns easier to maintain without duplicating one example for every customer, product, or period. It also raises the quality bar: the template needs an owner, parameter rules, test values, and a known result.

## Make the correction survive release

A creator can fix one prompt in a test window and still fail to improve the production agent.

The release gate should replay:

- the original question
- a paraphrased version
- a nearby value or time period
- a question that should route to a different source
- a question the agent should decline or qualify

Record the expected result before running the test. For data questions, compare the returned value to a trusted query or measure. For routing and support-boundary tests, record the expected behavior explicitly.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/fabric-data-agent-feedback-loop/03-weekly-loop-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/fabric-data-agent-feedback-loop/03-weekly-loop.webp" alt="A five-step weekly loop collects feedback, classifies failures, applies a small change, tests it, and releases a new agent version"></picture></figure>

Then republish the agent and watch the next bounded window. The objective is not a perfect rating score. It is fewer repeatable failure patterns and faster correction of the ones that remain.

## The operating metric I would use

I would track five numbers:

1. Feedback cases received in the review window
2. Cases with enough evidence to classify
3. Repeat cases for a known failure pattern
4. Cases closed with a passing acceptance test
5. Median time from submitted feedback to released correction

The second number matters more than it looks. A large pile of ratings without enough context is not an improvement system. It is a sentiment counter.

Fabric data agents are moving toward a healthier product lifecycle. Consumers can signal when an answer misses. Creators can retrieve evidence, combine it with operational telemetry, correct the responsible layer, and prove the change before republishing.

That is how an agent gets better in production: one traceable failure pattern at a time.

## Sources

- [Get user feedback for a Fabric data agent in Microsoft Copilot](https://learn.microsoft.com/en-us/fabric/data-science/data-agent-microsoft-copilot-feedback)
- [Observability for Fabric data agents in Microsoft Foundry](https://learn.microsoft.com/en-us/fabric/data-science/fabric-data-agent-foundry-observability)
- [Data Agent example queries](https://learn.microsoft.com/en-us/fabric/data-science/data-agent-example-queries)
- [Fabric roadmap: Data Agent monitoring, consumer-to-creator feedback loop](https://roadmap.fabric.microsoft.com/?product=conversationalanalytics&releaseItem=5db8bce1-2b43-f111-88b5-6045bd00fc61)
- [Fabric roadmap: Parameterized Example Queries](https://roadmap.fabric.microsoft.com/?product=conversationalanalytics&releaseItem=04b9f8e4-acac-f111-aaab-7ced8d70ff57)

---

**Shai Karmani**  
Data, Microsoft Fabric, Power BI, and practical AI  
[Connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr)
