---
layout: post
title: "The New Eventhouse Signals That Turn Capacity Tuning Into a Closed Loop"
date: 2026-11-19
description: A practical operating model for using Fabric workspace monitoring, Real-Time Dashboards, and Activator to detect Eventhouse capacity pressure and prove the response worked.
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

Fabric Eventhouse now exposes three workspace-monitoring signals that answer different operational questions: when throttling starts, when an Eventhouse stays undersized after throttling, and why it scaled out.

That is more useful than another utilization chart.

Together, these signals can form a closed operating loop. Detect pressure, classify what happened, choose the smallest safe response, and verify that the next workload window behaved better.

The release also includes a ready-to-use Real-Time Dashboard template and the option to route changes into Activator. The value is not the dashboard alone. The value is having one evidence path from capacity pressure to an owned response.

{% include yt-embed.html id="1_e6TUSKjxs" title="Real Weather in Fabric: Rain Alert + AI Agent in Teams" duration="9:17" kicker="Related PBI 101 build" %}

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/eventhouse-capacity-loop/01-closed-loop-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/eventhouse-capacity-loop/01-closed-loop.webp" alt="A closed Eventhouse operating loop moves from monitoring signals to diagnosis, response, and verification"></picture></figure>

## Three signals, three different decisions

It is tempting to put all capacity events in one alert rule. That loses the distinction Microsoft built into the logs.

### 1. Capacity throttling is the immediate incident signal

`EventhouseCapacityThrottlingState` records transitions into and out of throttling states. The documented states distinguish interactive delay, interactive rejection, and background rejection.

That difference matters. A delayed query, a rejected user query, and rejected background work do not have the same impact or response priority.

The incident record should include:

- Eventhouse and workspace;
- throttling state and transition time;
- affected workload window;
- ingestion, interactive-query, and background-work context;
- business service or operational process affected;
- owner and initial response.

Do not alert on every row without context. Alert when a state crosses a service threshold or when repeated transitions show instability.

### 2. Sub-optimal size is the recovery signal

`EventhouseSubOptimalSizeAfterThrottling` answers a different question: did the Eventhouse remain undersized after it exited throttling?

Microsoft documents that this condition is reported every five minutes until capacity increases or load decreases. That makes it suitable for a sustained-condition rule, not a one-time incident notification.

A team can use it to separate a short burst from a structural capacity problem. One throttling event may need investigation. A continuing undersized state needs an owner, a deadline, and a capacity or workload decision.

### 3. Scale-out events are the explanation signal

`EventhouseScaleoutEvents` records why scale-out happened, including resource utilization and ingestion pressure. Microsoft documents this as a daily aggregated record when events occur.

That cadence makes it useful for planning and post-incident review. It is not the right table for second-by-second paging.

Use it to answer questions such as:

- Did scale-out follow ingestion growth or query demand?
- Was query acceleration part of the pressure pattern?
- Did the same trigger repeat across several days?
- Did a capacity change reduce rejections, or only move the bottleneck?

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/eventhouse-capacity-loop/02-signal-contract-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/eventhouse-capacity-loop/02-signal-contract.webp" alt="Three Eventhouse monitoring signals map to incident response, sustained recovery, and daily planning decisions"></picture></figure>

## Build one operational contract around the logs

The implementation should start with a small contract, not a large command center.

| Contract field | What to record |
| --- | --- |
| Service objective | The query, ingestion, or freshness outcome users depend on |
| Detection rule | The log, state, threshold, and evaluation window |
| Severity | Business impact, not just a technical state name |
| Owner | The person or team expected to respond |
| Allowed action | Observe, tune workload, reschedule, scale capacity, or escalate |
| Verification | The later signal that proves the response helped |
| Evidence retention | How long incident and decision records remain reviewable |

This turns monitoring into an operating model. Without it, a Real-Time Dashboard can be visually accurate and still leave every response dependent on whoever happens to be watching.

## Use the dashboard for triage, not decoration

The announced dashboard template is a useful starting point. I would organize it around decisions:

1. **Current impact:** active throttling state, affected Eventhouse, first seen, latest transition.
2. **Recovery health:** continuing undersized conditions and their duration.
3. **Cause pattern:** recent scale-out reasons, repeated windows, ingestion and query context.
4. **Response ownership:** open incident, owner, action, target verification time.
5. **Outcome:** whether the next comparable workload window met the service objective.

Avoid a wall of charts. A production view should help an operator decide what to do in a few minutes.

Activator can notify or start a workflow when a meaningful condition changes. Keep the first automation narrow. Create or enrich an incident, route it to the right owner, and attach the evidence. Do not automatically scale or rewrite workloads until the team has enough history to trust the rule.

## Separate immediate response from capacity planning

The same data supports two cadences.

### During an incident

- confirm the active throttling state;
- identify the affected service and workload;
- reduce avoidable concurrency or move discretionary work when safe;
- record the action and expected recovery signal;
- watch for exit from throttling and continued undersized status.

### During the weekly review

- group events by Eventhouse and workload window;
- compare throttling duration and rejection states;
- inspect scale-out reasons;
- identify recurring ingestion, query, or acceleration patterns;
- decide whether to tune, reschedule, isolate, or change capacity;
- compare the next week with the previous baseline.

This prevents two common errors: treating every spike as a purchasing decision, or treating recurring capacity pressure as an isolated incident.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/eventhouse-capacity-loop/03-response-gates-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/eventhouse-capacity-loop/03-response-gates.webp" alt="Five response gates move an Eventhouse event from impact confirmation through corrective action and measured verification"></picture></figure>

## Start with a two-week baseline

Before setting aggressive alerts, collect enough evidence to understand normal behavior.

For two weeks, record:

- throttling transitions by state;
- duration until recovery;
- repeated undersized reports;
- scale-out reasons;
- workload windows and deployment changes;
- user-visible impact;
- operator action and outcome.

Then define thresholds from service expectations. A production query path may require immediate routing on interactive rejection. A development Eventhouse may only need a daily summary. The platform state is the same; the operational consequence is not.

The baseline also helps test the dashboard and Activator rules. A rule that produces fifty unactionable notifications in a day is not observability. It is a queue nobody will trust.

## The bigger opportunity

Real-Time Intelligence is often presented as a way to monitor operational events from applications, devices, and business processes. These new Eventhouse logs apply the same pattern to the platform running the real-time workload.

That closes an important gap. The system can now observe its own capacity behavior, route meaningful changes, and preserve the evidence needed for tuning.

The practical pattern is straightforward:

- use throttling state for immediate impact;
- use sub-optimal size for sustained recovery risk;
- use scale-out events for planning evidence;
- connect each signal to an owner and allowed response;
- verify every change against the next comparable workload window.

That is how capacity monitoring becomes an operating loop instead of another dashboard tab.

## Sources

- [Run proactive operations with Real-Time Intelligence in Microsoft Fabric](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blog/Run-proactive-operations-with-Real-Time-Intelligence-in/ba-p/5414256)
- [Monitor Eventhouse with workspace monitoring](https://learn.microsoft.com/en-us/fabric/real-time-intelligence/monitor-eventhouse)
- [Eventhouse capacity throttling logs](https://learn.microsoft.com/en-us/fabric/real-time-intelligence/monitor-logs-capacity-throttling)
- [Eventhouse sub-optimal size logs](https://learn.microsoft.com/en-us/fabric/real-time-intelligence/monitor-logs-sub-optimal-size)
- [Eventhouse scale-out event logs](https://learn.microsoft.com/en-us/fabric/real-time-intelligence/monitor-logs-scaleout-events)

---

**Shai Karmani**  
Data, Microsoft Fabric, Power BI, and practical AI  
[Connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr)
