---
layout: post
title: "Real-Time Orders, a Teams Alert and an AI Agent in Microsoft Fabric: The Full Build Guide"
date: 2026-11-13
author: Shai Karmani
author_url: https://www.linkedin.com/in/shai-kr
categories: [Microsoft Fabric, Real-Time Intelligence, AI Agents, Copilot Studio]
tags: [microsoftfabric, realtimeintelligence, eventstream, eventhouse, activator, copilotstudio, dataagent, kql]
description: "A step-by-step guide to a small working system: events flow into Fabric as they happen, a rule watches them, and an AI agent in Teams explains the alert. Then real weather joins in. Every step, with screenshots and code."
image: /assets/blog/fabric-real-time-alert-agent/d-architecture-with-weather.webp
---

<style>
.g-lead { max-width: 760px; margin: 0 auto 8px; font-size: 1.12rem; color: var(--text); }
.g-box { max-width: 820px; margin: 26px auto; padding: 18px 22px; border-radius: 18px; border: 1px solid var(--line); background: var(--panel); }
.g-box h3, .g-box p, .g-box ul, .g-box ol { max-width: none !important; margin-left: 0 !important; margin-right: 0 !important; }
.g-box h3 { margin: 0 0 8px; font-size: 1.05rem; color: var(--cyan); letter-spacing: 0.02em; }
.g-box ul, .g-box ol { padding-left: 22px; margin-top: 6px; margin-bottom: 6px; }
.g-box.warn { border-color: rgba(255, 181, 71, 0.55); background: rgba(58, 40, 10, 0.45); }
.g-box.warn h3 { color: #ffb547; }
.g-box.ok { border-color: rgba(31, 209, 194, 0.5); background: rgba(8, 44, 46, 0.45); }
.g-box.ok h3 { color: #5fe6d8; }
.g-toc { columns: 2; column-gap: 34px; }
.g-toc li { break-inside: avoid; margin-bottom: 4px; }
@media (max-width: 700px) { .g-toc { columns: 1; } }
.g-step { max-width: 820px; margin: 54px auto 6px; display: flex; align-items: center; gap: 16px; }
.g-step .n { flex: none; width: 54px; height: 54px; border-radius: 50%; display: grid; place-items: center; font-weight: 800; font-size: 1.35rem;
  color: #0b1830; background: radial-gradient(circle at 35% 30%, #ffe2a8, #ffb547 55%, #c47417); box-shadow: 0 8px 20px rgba(0,0,0,0.45); }
.g-step h2 { margin: 0 !important; max-width: none !important; font-size: 1.55rem; line-height: 1.25; }
.g-step small { display: block; font-size: 0.8rem; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--cyan); }
.g-part { max-width: 900px; margin: 70px auto 10px; padding: 26px 28px; border-radius: 24px; border: 1px solid var(--line);
  background: linear-gradient(135deg, rgba(41,182,232,0.16), rgba(10,22,38,0.7)); }
.g-part h2 { margin: 0 !important; max-width: none !important; font-size: 1.9rem; }
.g-part p { margin: 8px 0 0 !important; max-width: none !important; color: var(--muted); }
.g-shot { max-width: 900px; margin: 26px auto 30px; }
.g-shot img { margin: 0 auto !important; border-radius: 16px !important; border: 1px solid var(--line); box-shadow: 0 18px 44px rgba(0,0,0,0.45); width: 100%; }
.g-shot.chat img { max-width: 720px; }
.g-shot figcaption { max-width: 760px; margin: 12px auto 0; font-size: 0.95rem; color: var(--muted); }
.g-shot figcaption strong { color: var(--text); }
.g-table { max-width: 820px; margin: 22px auto; overflow-x: auto; }
.g-table table { width: 100%; border-collapse: collapse; font-size: 0.96rem; }
.g-table th { text-align: left; padding: 10px 12px; color: var(--cyan); border-bottom: 1px solid var(--line); font-size: 0.82rem; letter-spacing: 0.08em; text-transform: uppercase; }
.g-table td { padding: 10px 12px; border-bottom: 1px solid rgba(116, 214, 255, 0.1); vertical-align: top; }
.g-check { max-width: 760px; margin: 14px auto; padding: 10px 16px; border-left: 4px solid #1fd1c2; background: rgba(8, 44, 46, 0.4); border-radius: 0 12px 12px 0; }
.g-check b { color: #5fe6d8; }
</style>

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/d-architecture-with-weather.webp' | relative_url }}" alt="The whole system: a store sends orders through an Eventstream into an Eventhouse, an Activator rule watches them, and an agent in Teams answers; a weather feed joins through a second Eventstream"></figure>

{% include yt-embed.html id="X25d1Z-HTrw" title="Real-Time Orders in Fabric: Teams Alert + AI Agent" duration="10:27" kicker="Watch part 1: the whole flow, working" %}

<p class="g-lead">This guide builds a small system that does one useful thing. Every order reaches Microsoft Fabric the moment it happens. A rule keeps watching. When something breaks, an AI agent in Teams gets the alert, checks the data, and tells you whether it is real. Then you keep asking it questions, in the same chat.</p>

<p class="g-lead">In part 2, real weather joins the same data, and the agent starts telling you what rain is about to do to your sales.</p>

The two videos show it working. This article is the build: every step, in order, with the screenshots, the code, and the things that went wrong on the way.

<div class="g-box" markdown="1">
### What is in this guide
{: .no_toc}

<ol class="g-toc">
<li><a href="#what-you-build">What you build</a></li>
<li><a href="#before-you-start">Before you start</a></li>
<li><a href="#step-1">The Eventhouse and the table</a></li>
<li><a href="#step-2">The Eventstream</a></li>
<li><a href="#step-3">Send the first order</a></li>
<li><a href="#step-4">History, and a live dashboard</a></li>
<li><a href="#step-5">The Fabric data agent</a></li>
<li><a href="#step-6">The rule in Activator</a></li>
<li><a href="#step-7">The agent in Teams (Copilot Studio)</a></li>
<li><a href="#step-8">The flow that hands the alert to the agent</a></li>
<li><a href="#step-9">Test it: ask, break, get alerted</a></li>
<li><a href="#part-2">Part 2: real weather joins</a></li>
<li><a href="#step-10">The weather table and its stream</a></li>
<li><a href="#step-11">The feed, and the history</a></li>
<li><a href="#step-12">Teach both agents about weather</a></li>
<li><a href="#step-13">The second rule: rain started</a></li>
<li><a href="#step-14">A real rain alert</a></li>
<li><a href="#numbers">The numbers I measured</a></li>
<li><a href="#troubleshooting">What went wrong, and the fix</a></li>
<li><a href="#clean-up">Costs and clean-up</a></li>
</ol>
</div>

## What you build
{: #what-you-build}

Six pieces, connected for one purpose.

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/b-path-of-an-order.webp' | relative_url }}" alt="The path of an order: the store, the Eventstream, the Eventhouse, the dashboard" loading="lazy"><figcaption><strong>The data.</strong> The store sends one small message per order. The Eventstream takes it in. The Eventhouse keeps it, ready to query a couple of seconds later. A dashboard reads from it.</figcaption></figure>

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/c-who-is-watching.webp' | relative_url }}" alt="Who is watching: an Activator rule, a small flow, an agent in Teams, and a Fabric data agent behind it" loading="lazy"><figcaption><strong>The watching.</strong> A rule in Activator checks the numbers every minute. When it fires, a small flow posts a message in a Teams chat with an agent. That agent has one tool: a Fabric data agent, which turns a question into a query on the same data.</figcaption></figure>

<div class="g-table" markdown="1">

| Piece | What it is | Its job here |
|---|---|---|
| Eventstream | Fabric's front door for events | Receives every order over HTTPS |
| Eventhouse | A KQL database built for time-stamped rows | Keeps every order, queryable in seconds |
| Real-Time Dashboard | A dashboard on top of the Eventhouse | Shows the orders arriving |
| Fabric data agent | Natural language to KQL | Answers questions with real queries |
| Activator | Rules on data in motion | Fires when a region stops ordering |
| Copilot Studio agent | The agent you talk to in Teams | Explains the alert and takes follow-ups |
| Power Automate flow | Two steps of glue | Hands the alert to the agent |

</div>

<div class="g-box warn" markdown="1">
### One honest note before you start

The store in this guide is **simulated**: a script sends the orders. The stream, the database, the rule, the alert and the agent's answers are real. In part 2 the weather is real too, but the simulated shoppers were built to react to it. I say so again where it matters.
</div>

## Before you start
{: #before-you-start}

<div class="g-table" markdown="1">

| You need | Notes |
|---|---|
| A paid Fabric capacity | I used an F8. Data agents do not run on a trial capacity. Pause it when you are not working |
| A workspace on that capacity | You as Admin or Member |
| The Copilot and data agent tenant settings turned on | And, if your capacity is outside the US and EU, the setting that lets data be processed across regions |
| Microsoft Teams | The agent lives in a Teams chat |
| Copilot Studio with a way to pay | I used pay-as-you-go: a billing plan in the Power Platform admin center, linked to an environment that has Dataverse. No Microsoft 365 Copilot license was needed |
| Python 3.10 or newer, and the Azure CLI | The scripts use only the standard library. Run `az login` first |

</div>

**The code.** Everything I ran is in the channel's repo: [part 1](https://github.com/Shai-Kr/pbi101-youtube/tree/main/videos/11-live-orders-alert) and [part 2](https://github.com/Shai-Kr/pbi101-youtube/tree/main/videos/12-weather-joins-orders). The scripts read your workspace id from a small config file; the repo has an example.

**How to read the steps.** I created the Fabric items with small scripts that call the REST API, so the build can be repeated exactly. Each step shows the command, what it creates, and what the result looks like in Fabric. You can also create the same items by clicking: I say where.

<div class="g-step"><span class="n">1</span><div><small>Part 1 · the data</small><h2 id="step-1">The Eventhouse and the table</h2></div></div>

An Eventhouse is where the orders will live. It comes with a KQL database of the same name. Inside it you need one table, with one column per field of an order.

```bash
python setup_fabric.py items
```

The script creates a workspace folder called "Real-Time", the Eventhouse `AuroraLive`, and this table:

```kusto
.create-merge table OrdersLive (
    OrderId: string, OrderTime: datetime, ProductId: long, Product: string, Category: string,
    RegionId: long, Region: string, City: string, Quantity: long, UnitPrice: real,
    SalesAmount: real, PaymentMethod: string, Channel: string)

.alter table OrdersLive policy streamingingestion enable
```

By clicking instead: **New item → Eventhouse**, then open its database, **Query**, and run the two commands above.

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/01-eventhouse-table.webp' | relative_url }}" alt="The OrdersLive table in the Eventhouse, with its ingestion chart and a data preview" loading="lazy"><figcaption><strong>The table, later in the build.</strong> (1) The table. (2) How many rows have been ingested. (3) The data preview: one row per order.</figcaption></figure>

<div class="g-step"><span class="n">2</span><div><small>Part 1 · the data</small><h2 id="step-2">The Eventstream</h2></div></div>

The Eventstream is the address your application posts to. It has three boxes: a **source**, the **stream**, and a **destination**.

- Source: **Custom endpoint**. Fabric gives you an Event Hubs compatible address and a key.
- Destination: **Eventhouse**, the table `OrdersLive`, with the ingestion mode "Event processing before ingestion", JSON input.

The same script created it. Then one more command fetches the endpoint's connection details and saves them in a file on your machine:

```bash
python setup_fabric.py endpoint
```

<div class="g-box warn" markdown="1">
### The key stays on your machine

The connection file holds the endpoint's key. It is written outside the repo folder on purpose. Never commit it, and never paste it into a chat.
</div>

By clicking instead: **New item → Eventstream → Add source → Custom endpoint**, then **Add destination → Eventhouse**, pick the database and the table, and **Publish**. The keys are on the source's details pane.

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/02-eventstream.webp' | relative_url }}" alt="The Eventstream canvas: a custom endpoint source, the stream, and the Eventhouse destination, with a data preview below" loading="lazy"><figcaption><strong>The Eventstream.</strong> (1) The source: the address the store posts to. (2) The stream. (3) The destination: the Eventhouse table. (4) The data preview shows events as they arrive, which is the quickest way to see that the stream is alive.</figcaption></figure>

<div class="g-step"><span class="n">3</span><div><small>Part 1 · the data</small><h2 id="step-3">Send the first order</h2></div></div>

A custom endpoint accepts a plain HTTPS POST. You do not need an SDK. You sign a short token with the key, and post a JSON array of messages.

```python
import base64, hashlib, hmac, json, time, urllib.parse, urllib.request

def sas_token(namespace, hub, key_name, key, ttl=3600):
    uri = urllib.parse.quote_plus(f"https://{namespace}/{hub}")
    expiry = str(int(time.time()) + ttl)
    signature = base64.b64encode(hmac.new(key.encode(), f"{uri}\n{expiry}".encode(), hashlib.sha256).digest()).decode()
    return f"SharedAccessSignature sr={uri}&sig={urllib.parse.quote_plus(signature)}&se={expiry}&skn={key_name}"

def send(namespace, hub, token, events):
    body = json.dumps([{"Body": json.dumps(e)} for e in events]).encode("utf-8")
    request = urllib.request.Request(f"https://{namespace}/{hub}/messages?timeout=60&api-version=2014-01", data=body, method="POST")
    request.add_header("Authorization", token)
    request.add_header("Content-Type", "application/vnd.microsoft.servicebus.json")
    return urllib.request.urlopen(request, timeout=30).status      # 201 = accepted
```

The repo wraps this in a simulated store:

```bash
python live_orders.py send 5          # five orders, right now
python live_orders.py run 20          # a steady flow, about 20 orders a minute
```

For the video I also built a phone-shaped store page. A tap on Buy sends one real event through a small local relay, and the page measures how long each hop took.

```bash
python phone_server.py                # then open http://127.0.0.1:8711/
```

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/03-phone-page.webp' | relative_url }}" alt="The phone page: a store app on the left, the JSON event it sent and the timings on the right" loading="lazy"><figcaption><strong>One tap, one event.</strong> (1) Tap Buy. (2) The whole message: product, city, price, time. (3) The Eventstream had it after 0.2 seconds, and it was ready to query in the Eventhouse after 1.9 seconds.</figcaption></figure>

<div class="g-check"><b>Check.</b> In the Eventhouse, run <code>OrdersLive | top 5 by OrderTime desc</code>. Your orders should be there a few seconds after you sent them.</div>

<div class="g-step"><span class="n">4</span><div><small>Part 1 · the data</small><h2 id="step-4">History, and a live dashboard</h2></div></div>

**History first.** An alert that says "orders stopped" is only useful if something knows what normal looks like. So the table needs a few weeks of history.

Do not send history as events. Generate it inside the Eventhouse, with one statement that builds a row per order from a range of minutes:

```bash
python live_orders.py backfill 28
```

The core of it:

```kusto
.set-or-append OrdersLive <|
range Minute from datetime(2026-10-16) to datetime(2026-11-13) step 1m
| extend n = toint(round(20 * todouble(curve[hourofday(Minute)]) * (0.75 + 0.5 * rand())))
| mv-expand i = range(1, n) to typeof(long)
| extend OrderTime = Minute + totimespan(tolong(rand() * 600000000))
// ... then pick a product, a city, a quantity and a payment method for every row
```

Twenty-eight days came to about 810,000 rows, in under a minute.

**Then the dashboard.** A Real-Time Dashboard is defined by a JSON file: a list of KQL queries and the tiles that show them. The script writes it:

```bash
python setup_dashboard.py
```

The query behind the line chart is worth a look, because of one detail: **it returns zeros**. A region that stops ordering must drop to 0, not disappear from the chart.

```kusto
OrdersLive
| where OrderTime >= bin(ago(30m), 1m) and OrderTime < bin(now(), 1m)
| make-series Orders = count() default = 0 on OrderTime from bin(ago(30m), 1m) to bin(now(), 1m) step 1m by Region
| mv-expand OrderTime to typeof(datetime), Orders to typeof(long)
| project OrderTime, Region, Orders
```

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/05-dashboard-live.webp' | relative_url }}" alt="The Real-Time Dashboard: two cards, a line chart of orders per minute by region, and two tables" loading="lazy"><figcaption><strong>The live dashboard.</strong> (1) Orders in the last minute. (2) Orders per minute, one line per region. (3) The taps from the phone page, with how fast each arrived. (4) The latest orders. Open it with <em>Live refresh</em> on.</figcaption></figure>

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/04-phone-next-to-dashboard.webp' | relative_url }}" alt="The phone next to the dashboard: a tap on Buy shows up as a blue block and a new row" loading="lazy"><figcaption><strong>The tap, arriving.</strong> In this take the order was in the database 1.5 seconds after the tap, and on the dashboard about 4 seconds later. The dashboard's refresh interval is what you see: I set it to 10 seconds in the definition (<code>autoRefresh</code>). With 30 seconds the same tap took up to 24 seconds to show.</figcaption></figure>

<div class="g-step"><span class="n">5</span><div><small>Part 1 · the watching</small><h2 id="step-5">The Fabric data agent</h2></div></div>

A Fabric data agent turns a question into a query. This one gets a single table.

1. **New item → Data agent.** Name it. Mine is `Aurora Live Agent`.
2. **Add a data source**, choose the KQL database, and tick the table `OrdersLive`.
3. Ask it something in the test pane: "How many orders came in over the last 10 minutes?" Open the steps and read the KQL it wrote.
4. **Publish.** This matters: Copilot Studio lists only *published* data agents.

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/06-data-agent.webp' | relative_url }}" alt="The Fabric data agent with the OrdersLive table ticked and the Publish button" loading="lazy"><figcaption><strong>The data agent.</strong> (1) Tick the table. (2) Publish.</figcaption></figure>

<div class="g-box" markdown="1">
### Draft and published are two different things

The test pane talks to the **draft**. Copilot Studio, and anything else outside Fabric, talks to the **published** version. A test that passes in the pane proves nothing about what Teams will get. After a change, publish again and test the published one.
</div>

If you have never built a data agent, this video builds one from scratch:

{% include yt-embed.html id="KOMo49vQUAc" title="Build a Fabric Data Agent in 5 Minutes (+ Prod Checklist)" duration="9:39" kicker="New to data agents? Start here" %}

<div class="g-step"><span class="n">6</span><div><small>Part 1 · the watching</small><h2 id="step-6">The rule in Activator</h2></div></div>

Activator needs three things: a **source** of numbers, an **object** to split them by, and a **rule**.

The source is a KQL query that Activator runs every 60 seconds. For every minute and every region, it returns the number of orders in the last five minutes. Again, zeros included:

```kusto
let regions = datatable(Region:string)["North America", "Europe", "Asia Pacific", "Latin America"];
let perMin = OrdersLive
    | where OrderTime >= s - 5m and OrderTime < e
    | summarize c = count() by Region, M = bin(OrderTime, 1m);
range Minute from s to e step 1m
| extend k = 1
| join kind=inner (regions | extend k = 1) on k
| project Minute, Region
| join kind=leftouter perMin on Region
| summarize Orders5m = sumif(c, M >= Minute - 5m and M < Minute) by Minute, Region
```

(`s` and `e` are the start and end of the window Activator passes in.)

The rule itself has three settings:

<div class="g-table" markdown="1">

| Setting | Value | Why |
|---|---|---|
| Monitor | Orders in the last 5 minutes, per region | One number per region, every minute |
| Condition | **Decreases below** 1 | It fires on the *change* from some orders to none, so you get one alert, not one every minute |
| Action | Tell the agent | A custom action, built in step 8. Until then, a Teams message to yourself is a good test |

</div>

```bash
python setup_activator.py deploy
```

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/07-activator-rule.webp' | relative_url }}" alt="The Activator rule 'Region stopped ordering' with its Monitor, Condition and Action sections" loading="lazy"><figcaption><strong>The rule.</strong> (1) What to monitor. (2) The condition: decreases below 1. (3) The action.</figcaption></figure>

<div class="g-box" markdown="1">
### Why not use Activator's own Teams message?

It works, and the card arrives. But it comes from a bot called "Fabric Activator", and you cannot answer that bot. The whole point here is one chat where the alert lands **and** you keep talking. That needs the agent, and a small flow.
</div>

<div class="g-step"><span class="n">7</span><div><small>Part 1 · the watching</small><h2 id="step-7">The agent in Teams (Copilot Studio)</h2></div></div>

**First, a place for it to live.** My default Power Platform environment had no Dataverse and no license, and Copilot Studio refused to build there. This is what worked:

1. In the Azure portal, register the resource provider `Microsoft.PowerPlatform` on your subscription.
2. In the Power Platform admin center: **Licensing → Billing plans → New billing plan** (pay-as-you-go), linked to that subscription.
3. Create a new **Production** environment **with Dataverse**, then add it to the billing plan. A plan only lists environments of its own region, so create both in the same one.

**Then the agent.**

1. Open Copilot Studio **in the new environment** and create an agent.
2. Give it instructions. Mine:

   > You are Aurora Watch, the operations assistant for Aurora Outdoor's online store (a simulated demo store). Answer questions about live orders by calling the Aurora Live Agent tool. Never guess a number: every number in your answer must come from the tool. All times in the data are UTC. Keep answers short: the answer first, then the numbers it is based on. When the user asks about an alert, check the most recent data for that region and compare it with the same hour on earlier days.

3. **Add a tool → Fabric IQ Data MCP**, and pick the published data agent from step 5.
4. **Channels → Teams + Microsoft 365**, Teams only.
5. **Publish**, then open the agent in Teams and add it. You get a chat with it.

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/08-copilot-studio-agent.webp' | relative_url }}" alt="The Copilot Studio agent: instructions on the left; one channel and one tool on the right" loading="lazy"><figcaption><strong>The whole agent.</strong> (1) A short set of instructions. (2) One channel: Teams. (3) One tool: the Fabric data agent. No code.</figcaption></figure>

<div class="g-box warn" markdown="1">
### Three things that cost me time here

- The first **Save** after adding the tool failed with a message about connection permissions. Saving again half a minute later worked.
- The first **Publish** sat on "Publishing..." for five minutes and the agent stayed a draft. The second try went through.
- The agent does not appear in the Teams store search. Open it from Copilot Studio's "View in Teams" link.
</div>

<div class="g-step"><span class="n">8</span><div><small>Part 1 · the watching</small><h2 id="step-8">The flow that hands the alert to the agent</h2></div></div>

Now connect the rule to the agent.

1. In the Activator rule, open **Action** and choose **Create custom action**. Name it (mine is "Tell Aurora Watch") and add one input field, `Region`. Activator shows a connection string and a button that opens Power Automate.
2. Build the flow **in the agent's environment** (check the environment at the top right before you start). It has two steps:
   - Trigger: **When an activator rule is triggered**. Paste the connection string.
   - Action: Teams, **Post message in a chat or channel**.
3. Set the Teams step like this:

<div class="g-table" markdown="1">

| Field | Value |
|---|---|
| Post as | **User** |
| Post in | **Group chat** |
| Group chat | The chat with the agent (enter its key as a custom value) |
| Message | Alert from Fabric: orders stopped in *(the object from the trigger)*. Check this region's orders in the last 15 minutes against the same hour on earlier days, and tell me what you see. |

</div>

4. Back in the rule, pick the new action and map its `Region` field to the region's name. Save and start the rule.

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/09-flow.webp' | relative_url }}" alt="The two-step Power Automate flow, with the Teams step open: Post as User, Post in Group chat, and the message" loading="lazy"><figcaption><strong>The glue.</strong> (1) The trigger. (2) The Teams step. (3) Post as User. (4) Post in the chat with the agent. (5) The message, with the region's name from the trigger.</figcaption></figure>

<div class="g-box" markdown="1">
### Why does the flow post as you?

I wanted the agent to open the conversation itself. Posting *as the agent* failed for this kind of agent ("We couldn't find your bot"). So the flow posts the question **in my name**, into my chat with the agent, and the agent answers it. The result is the same single thread. Be honest about it when you demo: the rule raises the alert, not the agent.
</div>

<div class="g-box warn" markdown="1">
### "This flow's owner needs a Power Automate Premium license"

The Activator trigger is a premium connector. Without a Premium license the flow saves but cannot run. The fix that needed no new license: open the flow's details, **Edit → Plan → Copilot Studio**, and turn the flow on. It is then billed in Copilot credits on the plan you already have. This switch cannot be undone for that flow.
</div>

<div class="g-step"><span class="n">9</span><div><small>Part 1 · the result</small><h2 id="step-9">Test it: ask, break, get alerted</h2></div></div>

**Ask.** In the Teams chat with the agent:

> How many orders came in over the last 15 minutes, by region?

<figure class="g-shot chat"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/10-teams-question.webp' | relative_url }}" alt="The agent's answer in Teams: 434 orders in the last 15 minutes, split by region" loading="lazy"><figcaption><strong>40 seconds later:</strong> 434 orders, split by region, with the time of the last order in each. I ran the same count directly on the database: exact.</figcaption></figure>

**Break it.** Stop the store and start it again without one region:

```bash
python live_orders.py run 20 --mute-region "North America"
```

Then wait, and do not type anything.

<figure class="g-shot chat"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/11-teams-outage-alert.webp' | relative_url }}" alt="The agent's analysis in Teams: This is a real outage, with a table of the same hours on the days before" loading="lazy"><figcaption><strong>The alert, and the answer.</strong> The message from the flow arrived 7 minutes after the last order. About 50 seconds later the agent wrote: "This is a real outage." It compared the hour with the same hour on the seven days before (645 to 795 orders, against 26), and noted that the other regions were still ordering, so it was not a data delay. Every number in that table matched a direct query.</figcaption></figure>

**Keep going.** Because it is a chat:

> Break down North America's last 30 minutes of orders by payment method.

<figure class="g-shot chat"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/12-teams-follow-up.webp' | relative_url }}" alt="The follow-up answer: all four payment methods stopped at the same time" loading="lazy"><figcaption><strong>43 seconds:</strong> all four payment methods stopped at the same moment, so it is not the payment provider. One sentence from me, in the thread where the alert came in.</figcaption></figure>

<div class="g-box ok" markdown="1">
### Part 1 is done

An order, an alert and an answer, in one thread. The agent's line about "a shared cause, such as a deployment" is its guess; the numbers are checked.
</div>

<div class="g-part" id="part-2"><h2>Part 2: real weather joins</h2><p>The same system, plus one outside feed. An outside feed joined with your own events is where this gets useful.</p></div>

{% include yt-embed.html id="1_e6TUSKjxs" title="Real Weather in Fabric: Rain Alert + AI Agent in Teams" duration="9:17" kicker="Watch part 2: a real rain alert" %}

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/f-real-weather-simulated-shoppers.webp' | relative_url }}" alt="Real weather, simulated shoppers: the weather is real, the shoppers were built to react to it" loading="lazy"><figcaption><strong>What is real here.</strong> The weather comes from a public weather service, for the real cities. The shoppers are simulated, and I built them to buy about three times more rain jackets when it rains in their city. So when the agent finds that pattern, it is not a discovery. The plumbing is the point: an outside feed, joined with your own data, as it happens.</figcaption></figure>

<div class="g-step"><span class="n">10</span><div><small>Part 2 · the data</small><h2 id="step-10">The weather table and its stream</h2></div></div>

A second table in the **same** Eventhouse, and a second Eventstream that feeds it.

```bash
python weather.py setup
python weather.py endpoint
```

```kusto
.create-merge table WeatherLive (
    ReadingTime: datetime, City: string, Region: string, Latitude: real, Longitude: real,
    TempC: real, PrecipMm: real, RainRate: real, SnowCm: real, WindKmh: real,
    WeatherCode: long, Condition: string, IntervalMin: long, Source: string)
```

`RainRate` is millimetres per hour. I count a city as raining from 0.4.

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/13-weather-eventstream.webp' | relative_url }}" alt="The second Eventstream: a weather feed source, the stream, and the same Eventhouse as the destination" loading="lazy"><figcaption><strong>The second Eventstream.</strong> (1) The source the weather feed posts to. (2) The destination: the same Eventhouse, a new table. (3) One row per city, every few minutes.</figcaption></figure>

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/14-two-tables.webp' | relative_url }}" alt="The KQL database with two tables: OrdersLive and WeatherLive" loading="lazy"><figcaption><strong>One database, two tables.</strong> This is the important part: because both sit in the same Eventhouse, one query can use both.</figcaption></figure>

<div class="g-step"><span class="n">11</span><div><small>Part 2 · the data</small><h2 id="step-11">The feed, and the history</h2></div></div>

The feed is about forty lines of Python. Every few minutes it asks the weather service for the current reading in all 17 cities with **one** call, and posts the readings to the Eventstream with the same `send` function as in step 3.

```python
def current():
    data = fetch("current=temperature_2m,precipitation,snowfall,weather_code,wind_speed_10m")   # 17 cities, one call
    return [reading(city, location["current"]) for city, location in zip(CITIES, data)]

while True:
    post([r for r in current() if changed(r)])      # send a reading when its values change
    time.sleep(300)
```

```bash
python weather.py run            # the feed
python weather.py history 28     # real hourly weather for the last 28 days
python weather.py extras 28      # the simulated shoppers' reaction, for the history
python store_sim.py run 20       # the store from part 1, now reacting to the weather
```

Weather data is by [Open-Meteo.com](https://open-meteo.com) (CC BY 4.0), free for non-commercial use and without a key.

**The dashboard gets a page** with a map of the 17 cities:

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/15-dashboard-weather.webp' | relative_url }}" alt="The Weather page of the dashboard: a world map of the cities coloured by their weather, a table of readings, and rain jackets' share of orders per city" loading="lazy"><figcaption><strong>The weather page.</strong> (1) A map tile needs only longitude, latitude, a text column for the colour and a number for the size. (2) Switch <em>Auto center</em> off, or the map jumps back on every refresh. (3) The readings. (4) Rain jackets' share of each city's orders in the last hour: orange is where it is raining now.</figcaption></figure>

**And the join.** Every order has a city and a time. Every reading has a city and a time. Put them side by side, hour by hour:

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/e-one-answer-two-tables.webp' | relative_url }}" alt="One answer from two tables: orders and weather joined on city and hour" loading="lazy"></figure>

```kusto
let weather = WeatherLive
    | where IntervalMin == 60 and City == "Seattle"
    | project Hour = ReadingTime - 1h, Rainy = RainRate >= 0.4;
weather
| join kind=leftouter (
    OrdersLive
    | where City == "Seattle" and Product == "Storm Shell Jacket"
    | summarize Units = sum(Quantity) by Hour = bin(OrderTime, 1h)
  ) on Hour
| summarize Hours = count(), UnitsPerHour = round(avg(coalesce(Units, 0)), 2) by Rainy
```

Start from the weather rows and use a left outer join, so the hours with no jacket sold at all still count as zero. Compare **per hour**, never totals: there are far more dry hours than rainy ones.

<div class="g-step"><span class="n">12</span><div><small>Part 2 · the watching</small><h2 id="step-12">Teach both agents about weather</h2></div></div>

**The Fabric data agent** gets the new table and, this time, real instructions.

```bash
python setup_agent.py apply
```

The script adds `WeatherLive` to the agent's KQL source and writes the instructions, to the draft and to the published version. You can do the same by hand: tick the table, open **Agent instructions**, paste, publish. The part of the instructions that matters most:

> WeatherLive: REAL weather readings for the store's 17 cities. One row per city per reading. IntervalMin == 60: hourly history; ReadingTime is the END of the hour the reading covers. RainRate is millimetres per hour. Raining means RainRate >= 0.4.
>
> Weather and orders in the history: summarize OrdersLive by City and Hour, and join to WeatherLive on City and Hour. Keep the hours with no orders of a product as 0 (start from the weather rows). Compare orders PER HOUR in rainy hours and in dry hours of the same city. Never compare totals: dry hours are far more numerous.

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/16-agent-instructions.webp' | relative_url }}" alt="The data agent with both tables ticked and the agent instructions pane open" loading="lazy"><figcaption><strong>The data agent, with weather.</strong> (1) Both tables ticked. (2) The Agent instructions button. (3) What a reading is, what counts as rain, and how to join the two tables.</figcaption></figure>

<div class="g-box warn" markdown="1">
### Wait about ten minutes

Right after the change, the agent answered that the new table "isn't accessible" and its queries failed. Ten minutes later the same question worked. The change takes time to reach the part that writes the queries.
</div>

**Then the agent in Teams.** I expected it to just use the new data. It did not:

<figure class="g-shot chat"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/17-teams-before.webp' | relative_url }}" alt="The Teams agent answering that it cannot tell where it is raining because it has no weather data" loading="lazy"><figcaption><strong>Before.</strong> "I can't tell you where it's raining. My only data source is Aurora's live orders." The Fabric agent already knew the weather table. The Copilot Studio agent was still working from the description it got when the tool was added.</figcaption></figure>

The fix is a few more lines in its instructions, and publishing it again (under a minute this time):

> The Aurora Live Agent tool also has real weather readings for the store's 17 cities (temperature and rain, right now and for the last 28 days). For any question about weather, rain or temperature, call the tool; never say you have no weather data. When an alert says rain started in a city, use the tool to report what rain usually does to orders in that city (orders per hour in rainy hours against dry hours, by product), what the last hour shows, and what to expect in the next hour.

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/18-copilot-studio-weather.webp' | relative_url }}" alt="The Copilot Studio agent's instructions with the new paragraph about weather" loading="lazy"></figure>

<figure class="g-shot chat"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/19-teams-after.webp' | relative_url }}" alt="The Teams agent's answer after the fix: rain jackets per hour in dry and rainy hours for three cities" loading="lazy"><figcaption><strong>After.</strong> Rain in three cities, and rain jackets per hour over 28 days, dry against rainy: Vancouver about 3.4 times more, Singapore 2.3, Sao Paulo 3.5. The full answer took 74 seconds. The rainy-hour numbers are exact. The dry-hour ones ran a little high, because its query dropped the hours with no jacket sold at all, which is exactly what the instruction about starting from the weather rows is for.</figcaption></figure>

<div class="g-step"><span class="n">13</span><div><small>Part 2 · the watching</small><h2 id="step-13">The second rule: rain started</h2></div></div>

A question is nice. Being told is better.

The second rule lives in the same Activator item. Its source asks, for every minute and every city: did any reading in the last 30 minutes show rain?

```kusto
let r = WeatherLive
    | where IntervalMin == 15 and ReadingTime > s - 31m and ReadingTime <= e
    | project City, ReadingTime, RainRate;
range Minute from s to e step 1m
| extend k = 1
| join kind=inner (r | extend k = 1) on k
| where ReadingTime <= Minute and ReadingTime > Minute - 30m
| summarize RainMax30 = max(RainRate) by Minute, City
| project Minute, City, Wet = iff(RainMax30 >= 0.4, 1, 0)
```

Looking back 30 minutes keeps a drizzle that flickers on and off from firing again and again.

<div class="g-table" markdown="1">

| Setting | Value |
|---|---|
| Monitor | Wet in the last 30 minutes, per city |
| Condition | **Increases above** 0 (a dry city turns wet) |
| Action | The **same** custom action as the outage rule; its field gets the city's name |

</div>

```bash
python setup_flow.py apply
python setup_weather_rule.py apply
```

Because both rules use the same action, the flow has to know which one fired. One expression in the message does it: if the name is one of the four regions, write the outage sentence; otherwise write the rain sentence.

```text
if(contains(createArray('North America', 'Europe', 'Asia Pacific', 'Latin America'), triggerOutputs()?['body/objectInstanceId']),
   concat('orders stopped in ', triggerOutputs()?['body/objectInstanceId'], '. Check this region''s orders ...'),
   concat('rain started in ', triggerOutputs()?['body/objectInstanceId'], '. Check what rain usually does to our orders in that city, and tell me what to expect in the next hour.'))
```

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/20-rain-rule.webp' | relative_url }}" alt="The second Activator rule, 'Rain started in a city'" loading="lazy"><figcaption><strong>The second rule.</strong> (1) Monitor: wet in the last 30 minutes. (2) Condition: increases above 0. (3) The same action as the outage rule. (4) Its field gets the city's name.</figcaption></figure>

<div class="g-step"><span class="n">14</span><div><small>Part 2 · the result</small><h2 id="step-14">A real rain alert</h2></div></div>

You cannot order rain for a test. So ask the forecast when it is expected to start, and wait:

```bash
python weather.py forecast 8
```

On the day I recorded, it said Seattle, a quarter to six, a light drizzle right on the threshold. I started watching the chat a few minutes early and typed nothing.

<figure class="g-shot chat"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/21-teams-rain-alert.webp' | relative_url }}" alt="The agent's answer to the rain alert: rain usually more than triples sales of the rain jacket in Seattle" loading="lazy"><figcaption><strong>The rain alert, answered.</strong> The reading turned to drizzle, and 49 seconds later the message was in the chat. 108 seconds after that: "In Seattle, rain usually more than triples sales of the Storm Shell Jacket, and barely moves anything else", with every product, dry hours against rainy hours (11.25 to 38.63 units an hour for the jacket: exact). It also said the rain was "just at the point where the data counts the city as rainy", so the increase might not happen. That is the caveat I would want from a person.</figcaption></figure>

Then the question a business actually asks:

> So what should I put at the top of the home page for Seattle shoppers right now?

<figure class="g-shot chat"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/22-teams-home-page.webp' | relative_url }}" alt="The agent's suggestion for the top of the home page for Seattle" loading="lazy"><figcaption><strong>39 seconds:</strong> the jacket in the main spot, the warm base layer next to it, the water bottle moved down, and a warning that this is only twenty minutes of orders. From a weather reading to a decision, in one sentence.</figcaption></figure>

<div class="g-box" markdown="1">
### A bonus I did not plan

While I was building part 2, my store simulator stopped by mistake. All four regions went silent at once, and the outage rule fired four times. When I looked at the chat, the agent had written a summary of the day's alerts by itself, and its last line was not "four outages". It was: **"Data feed stalled. Every region was normal until then."** It was right. I had broken it.
</div>

<figure class="g-shot chat"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/23-teams-data-feed-stalled.webp' | relative_url }}" alt="The agent's own summary table of the day's alerts, ending with 'Data feed stalled'" loading="lazy"></figure>

## The numbers I measured
{: #numbers}

<div class="g-table" markdown="1">

| What | Time |
|---|---|
| Order sent → ready to query in the Eventhouse | 1.5 to 5 seconds |
| Order sent → visible on the dashboard (10 second refresh) | 4 to 10 seconds |
| Region stops → alert message in the Teams chat | About 7 minutes (the rule looks at a 5 minute window; you can tighten it) |
| Weather reading turns rainy → alert message in the chat | 49 seconds |
| A question to the agent in Teams → the full answer | 40 to 75 seconds |
| A change to the data agent → the change actually working | About 10 minutes |

</div>

## What went wrong, and the fix
{: #troubleshooting}

<div class="g-table" markdown="1">

| What you see | What it was | The fix |
|---|---|---|
| A KQL command returns a bare 400 | I used `first` and `last` as column names | Rename them |
| The line chart draws nothing | A line tile with no settings reads the columns by position | `project` time, then series, then value |
| A tap takes 20 seconds to show on the dashboard | The dashboard's refresh interval | Set `autoRefresh` to 10 seconds in its definition |
| Copilot Studio: "Dataverse isn't set up", or the agent type "isn't included in your license" | The default environment | A new environment with Dataverse, linked to a pay-as-you-go billing plan |
| The billing plan does not list your environment | They are in different regions | Create both in the same region |
| The flow saves but cannot run | The Activator trigger is a premium connector | Switch the flow's plan to Copilot Studio |
| "We couldn't find your bot" | Posting a Teams message *as* the agent | Post as User, into the chat with the agent |
| The Teams agent says it has no weather data | It keeps the tool description from the day the tool was added | Say it in the agent's own instructions and publish again |
| The data agent says a new table "isn't accessible" | The change has not reached the query generator yet | Wait about ten minutes |
| Four alerts at once, for every region | The simulator had stopped | Stop the rules before you stop the store |
| A whole batch of rows is missing after an inline ingest | A comma inside a text value; inline ingest is CSV | No commas in the values, and compare the row count afterwards |
| The agent's answer changes after you thought it was done | It posts an interim reply first, then the full one | Wait for the final message before you judge the answer |

</div>

## Costs and clean-up
{: #clean-up}

- **The Fabric capacity** bills for every hour it is on. Pause it when you stop working. Before you pause it, stop the store script and the feed.
- **Stop the rules** when you are not testing. Every real rain start in one of the 17 cities posts in your chat and uses credits: `python setup_weather_rule.py stop`.
- **Copilot Studio**, pay-as-you-go, was about one cent per Copilot credit when I recorded this. A question to the agent cost me one to two credits. A flow on the Copilot Studio plan is billed in the same credits.
- **Do not pause and resume the capacity back to back.** After doing that, my published data agent returned authorization errors for twenty minutes while the draft worked.

<div class="g-box ok" markdown="1">
### Where to go from here

The pattern is the same for any events: something comes in, a rule watches it, and somebody gets a message they can answer. A machine that stops sending measurements. Support tickets about one product that suddenly double. A city with no delivery scans for twenty minutes. Swap the orders for your own events, and the weather for the outside feed that matters to you: prices, traffic, exchange rates.

The code is here: [part 1](https://github.com/Shai-Kr/pbi101-youtube/tree/main/videos/11-live-orders-alert) and [part 2](https://github.com/Shai-Kr/pbi101-youtube/tree/main/videos/12-weather-joins-orders).
</div>
