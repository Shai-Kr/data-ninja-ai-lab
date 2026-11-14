---
layout: post
title: "Real-Time Orders, a Teams Alert and an AI Agent in Microsoft Fabric: The Full Build Guide"
date: 2026-11-13
author: Shai Karmani
author_url: https://www.linkedin.com/in/shai-kr
categories: [Microsoft Fabric, Real-Time Intelligence, AI Agents, Copilot Studio]
tags: [microsoftfabric, realtimeintelligence, eventstream, eventhouse, activator, copilotstudio, dataagent, kql]
description: "Build it by clicking inside Fabric: events flow in as they happen, a rule watches them, and an AI agent in Teams explains the alert. Then real weather joins in. Every click has a screenshot, and everything you paste has a Copy button."
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
.g-links { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 12px; margin-top: 12px; }
.g-links a { display: block; padding: 12px 14px; border-radius: 12px; border: 1px solid var(--line); background: rgba(41, 182, 232, 0.08); text-decoration: none; font-weight: 700; }
.g-links a small { display: block; font-weight: 500; color: var(--muted); margin-top: 2px; }
.g-links a:hover { border-color: var(--cyan); }
.g-toc { columns: 2; column-gap: 34px; }
.g-toc li { break-inside: avoid; margin-bottom: 4px; }
@media (max-width: 700px) { .g-toc { columns: 1; } }
.g-step { max-width: 820px; margin: 58px auto 6px; display: flex; align-items: center; gap: 16px; }
.g-step .n { flex: none; width: 54px; height: 54px; border-radius: 50%; display: grid; place-items: center; font-weight: 800; font-size: 1.35rem;
  color: #0b1830; background: radial-gradient(circle at 35% 30%, #ffe2a8, #ffb547 55%, #c47417); box-shadow: 0 8px 20px rgba(0,0,0,0.45); }
.g-step h2 { margin: 0 !important; max-width: none !important; font-size: 1.55rem; line-height: 1.25; }
.g-step small { display: block; font-size: 0.8rem; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--cyan); }
.g-part { max-width: 900px; margin: 70px auto 10px; padding: 26px 28px; border-radius: 24px; border: 1px solid var(--line);
  background: linear-gradient(135deg, rgba(41,182,232,0.16), rgba(10,22,38,0.7)); }
.g-part h2 { margin: 0 !important; max-width: none !important; font-size: 1.9rem; }
.g-part p { margin: 8px 0 0 !important; max-width: none !important; color: var(--muted); }
.g-shot { max-width: 1000px; margin: 22px auto 28px; }
.g-shot img { margin: 0 auto !important; border-radius: 14px !important; border: 1px solid var(--line); box-shadow: 0 18px 44px rgba(0,0,0,0.45); width: 100%; cursor: zoom-in; }
.g-zoom { position: fixed; inset: 0; z-index: 9999; display: grid; place-items: center; padding: 2vh 2vw; background: rgba(2, 6, 14, 0.93); cursor: zoom-out; }
.g-zoom img { max-width: 96vw; max-height: 96vh; border-radius: 10px; box-shadow: 0 20px 60px rgba(0,0,0,0.6); }
.g-shot.chat img { max-width: 720px; }
.g-shot.small img { max-width: 620px; }
.g-shot figcaption { max-width: 760px; margin: 12px auto 0; font-size: 0.95rem; color: var(--muted); }
.g-shot figcaption strong { color: var(--text); }
.g-table { max-width: 820px; margin: 22px auto; overflow-x: auto; }
.g-table table { width: 100%; border-collapse: collapse; font-size: 0.96rem; }
.g-table th { text-align: left; padding: 10px 12px; color: var(--cyan); border-bottom: 1px solid var(--line); font-size: 0.82rem; letter-spacing: 0.08em; text-transform: uppercase; }
.g-table td { padding: 10px 12px; border-bottom: 1px solid rgba(116, 214, 255, 0.1); vertical-align: top; }
.g-check { max-width: 760px; margin: 14px auto; padding: 10px 16px; border-left: 4px solid #1fd1c2; background: rgba(8, 44, 46, 0.4); border-radius: 0 12px 12px 0; }
.g-check b { color: #5fe6d8; }
.g-where { max-width: 760px; margin: 18px auto 6px; display: flex; gap: 10px; align-items: baseline; font-size: 0.9rem; color: var(--muted); }
.g-where b { flex: none; padding: 3px 10px; border-radius: 999px; font-size: 0.74rem; letter-spacing: 0.1em; text-transform: uppercase; color: #0b1830; background: #6fe3ff; }
.g-where b.nb { background: #ffb547; }
.g-where b.txt { background: #c9b8ff; }
.g-details { max-width: 820px; margin: 16px auto; border: 1px solid var(--line); border-radius: 14px; background: rgba(10, 22, 38, 0.6); }
.g-details summary { cursor: pointer; padding: 12px 18px; font-weight: 700; color: var(--cyan); }
.g-details > *:not(summary) { margin-left: 14px !important; margin-right: 14px !important; }
.g-code { position: relative; }
.g-copy { position: absolute; top: 8px; right: 8px; z-index: 2; padding: 6px 14px; border-radius: 8px; border: 1px solid var(--line); background: rgba(10, 22, 38, 0.95); color: var(--cyan); font: 700 0.8rem/1.2 inherit; cursor: pointer; }
.g-copy:hover { border-color: var(--cyan); }
.g-copy.done { color: #5fe6d8; border-color: #1fd1c2; }
.article-body pre { scrollbar-width: thin; scrollbar-color: rgba(116, 214, 255, 0.35) transparent; padding-top: 44px; }
.article-body .language-text pre { white-space: pre-wrap; word-break: break-word; }
.article-body ol[start] { max-width: 760px; margin-left: auto; margin-right: auto; }
</style>

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/d-architecture-with-weather.webp' | relative_url }}" alt="The whole system: a store sends orders through an Eventstream into an Eventhouse, an Activator rule watches them, and an agent in Teams answers; a weather feed joins through a second Eventstream"></figure>

{% include yt-embed.html id="X25d1Z-HTrw" title="Real-Time Orders in Fabric: Teams Alert + AI Agent" duration="10:27" kicker="Watch part 1: the whole flow, working" %}

<p class="g-lead">In this guide you build a small system that does one useful thing. Every order reaches Microsoft Fabric the moment it happens. A rule keeps watching. When a region stops ordering, an AI agent in Teams gets the alert, checks the data, and tells you whether it is real. In part 2, real weather joins the same data.</p>

<p class="g-lead">You build all of it <strong>by clicking inside Fabric</strong>. Nothing is installed on your computer.</p>

<div class="g-box ok" markdown="1">
### Start here: what you are going to do

1. **Create the place for the data**: an Eventhouse (the database) and an Eventstream (the front door).
2. **Open a simulated store** that sends orders into it. The store is one notebook that runs inside Fabric.
3. **Add a dashboard, a Fabric data agent and a rule** that notices when a region stops ordering.
4. **Add an agent in Teams** that gets the alert and answers questions about it.
5. **Part 2**: add real weather to the same database, and a second rule for rain.

<div class="g-links">
<a href="https://github.com/Shai-Kr/pbi101-youtube/tree/main/videos/11-live-orders-alert/in_fabric" target="_blank" rel="noopener">The files, part 1<small>GitHub: the notebook and the queries</small></a>
<a href="https://github.com/Shai-Kr/pbi101-youtube/tree/main/videos/12-weather-joins-orders/in_fabric" target="_blank" rel="noopener">The files, part 2<small>GitHub: the weather notebook and queries</small></a>
<a href="https://github.com/Shai-Kr/pbi101-youtube/archive/refs/heads/main.zip" target="_blank" rel="noopener">Download everything (ZIP)<small>The whole repository in one file</small></a>
<a href="https://www.youtube.com/playlist?list=PLW_84LVKkESo" target="_blank" rel="noopener">The two videos<small>YouTube playlist</small></a>
</div>
</div>

<div class="g-box" markdown="1">
### How to read the steps

Every step is a list of clicks, with a screenshot, and the numbers on the screenshot show where to click. **Click any screenshot to see it full size.**

When a step asks you to paste something, a coloured label says **where it goes**, and the box has a **Copy** button in its corner:

<div class="g-where"><b>KQL</b><span>goes into the query editor of your KQL database, inside Fabric. You paste it and press Run.</span></div>
<div class="g-where"><b class="nb">Notebook</b><span>is the code of the simulated store. It runs in a Fabric notebook. You never edit it, apart from pasting one line.</span></div>
<div class="g-where"><b class="txt">Text</b><span>is plain text for a box in the product: instructions for an agent, or a message.</span></div>
</div>

<div class="g-box ok" markdown="1">
### In a hurry? One notebook builds the whole Fabric part

You can click through steps 1 to 7 below and see how every piece is made. Or you can let **one notebook** make all of them in about three minutes, with nothing to paste. Both roads end in the same place. [Jump to the fast path](#fast-path).
</div>

<div class="g-box" markdown="1">
### What is in this guide
{: .no_toc}

<ol class="g-toc">
<li><a href="#what-you-build">What you build</a></li>
<li><a href="#fast-path">The fast path: one notebook</a></li>
<li><a href="#before-you-start">Before you start</a></li>
<li><a href="#step-1">The Eventhouse and the table</a></li>
<li><a href="#step-2">The Eventstream</a></li>
<li><a href="#step-3">The store: a notebook inside Fabric</a></li>
<li><a href="#step-4">A month of history</a></li>
<li><a href="#step-5">A live dashboard</a></li>
<li><a href="#step-6">The Fabric data agent</a></li>
<li><a href="#step-7">The rule that watches</a></li>
<li><a href="#step-8">The agent in Teams</a></li>
<li><a href="#step-9">The flow that hands the alert to the agent</a></li>
<li><a href="#step-10">Test it: ask, break, get alerted</a></li>
<li><a href="#part-2">Part 2: real weather joins</a></li>
<li><a href="#numbers">The numbers I measured</a></li>
<li><a href="#troubleshooting">What went wrong, and the fix</a></li>
<li><a href="#clean-up">Costs and clean-up</a></li>
</ol>
</div>

## What you build
{: #what-you-build}

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/b-path-of-an-order.webp' | relative_url }}" alt="The path of an order: the store, the Eventstream, the Eventhouse, the dashboard" loading="lazy"><figcaption><strong>The data.</strong> The store sends one small message per order. The Eventstream takes it in. The Eventhouse keeps it, ready to query a few seconds later. A dashboard reads from it.</figcaption></figure>

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/c-who-is-watching.webp' | relative_url }}" alt="Who is watching: an Activator rule, a small flow, an agent in Teams, and a Fabric data agent behind it" loading="lazy"><figcaption><strong>The watching.</strong> A rule in Activator checks the orders every minute. When it fires, a small flow posts a message in a Teams chat with an agent. That agent has one tool: a Fabric data agent, which turns a question into a query on the same data.</figcaption></figure>

<div class="g-table" markdown="1">

| Piece | What it is | Its job here |
|---|---|---|
| Eventstream | Fabric's front door for events | Receives every order |
| Eventhouse | A database built for time-stamped rows (you query it with KQL) | Keeps every order, queryable in seconds |
| Notebook | Code that runs inside Fabric | Plays the store: sends the orders |
| Real-Time Dashboard | A dashboard on top of the Eventhouse | Shows the orders arriving |
| Fabric data agent | Natural language to KQL | Answers questions with real queries |
| Activator | Rules on data in motion | Fires when a region stops ordering |
| Copilot Studio agent | The agent you talk to in Teams | Explains the alert and takes follow-ups |
| Power Automate flow | Two steps of glue | Hands the alert to the agent |

</div>

<div class="g-box warn" markdown="1">
### One honest note before you start

The store is **simulated**: a notebook sends the orders. The stream, the database, the rule, the alert and the agent's answers are real. In part 2 the weather is real too, but the simulated shoppers were built to react to it. I say so again where it matters.
</div>

## Before you start
{: #before-you-start}

<div class="g-table" markdown="1">

| You need | Notes |
|---|---|
| A paid Fabric capacity | I used an F8. Data agents do not run on a trial capacity. Pause it when you are not working |
| A workspace on that capacity | You as Admin or Member. An empty workspace is the easiest |
| The Copilot and data agent tenant settings turned on | And, if your capacity is outside the US and EU, the setting that lets data be processed across regions |
| Microsoft Teams | The agent lives in a Teams chat |
| Copilot Studio with a way to pay | I used pay-as-you-go: a billing plan in the Power Platform admin center, linked to an environment that has Dataverse. No Microsoft 365 Copilot license was needed |

</div>

Steps 1 to 7 happen in Fabric. Steps 8 and 9 happen in Copilot Studio and Power Automate. If you only want the data, the dashboard and the alert, you can stop after step 7.

<div class="g-part" id="fast-path"><h2>The fast path: one notebook builds it all</h2><p>For the Fabric part only (steps 1 to 7, and the Fabric side of part 2). You paste nothing and you click one button.</p></div>

The notebook runs **inside Fabric**, with your own permissions, in the workspace you put it in. It creates the Eventhouse and its tables, both Eventstreams, a month of history, the dashboard, the data agent and the two rules. Then it opens the store.

**1. Get the file.** Open [Aurora_Everything.ipynb on GitHub](https://github.com/Shai-Kr/pbi101-youtube/blob/main/videos/11-live-orders-alert/in_fabric/Aurora_Everything.ipynb) and click the **download** button (the arrow at the top right of the file).

**2. Import it into an empty workspace.** In the workspace click **Import**, then **Notebook**, then **From this computer**. Click **Upload** and choose the file.

<figure class="g-shot small"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/ui-13-import-notebook.webp' | relative_url }}" alt="The workspace Import menu: Notebook, From this computer" loading="lazy"></figure>

**3. Open the notebook and click Run all.** You do not have to change anything. The four settings in the first cell are optional.

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/ui-40-fast-notebook.webp' | relative_url }}" alt="The notebook Aurora_Everything: a short settings cell, and Run all" loading="lazy"></figure>

**4. Wait about three minutes.** This is what the notebook prints:

<div class="g-where"><b class="txt">Text</b><span>What you should see (nothing to copy)</span></div>
{% raw %}
```text
1. Eventhouse and tables
  [ok] Eventhouse AuroraLive
  [ok] table OrdersLive
  [ok] table WeatherLive
2. Eventstreams
  [ok] Eventstream AuroraOrders
  [ok] Eventstream AuroraWeather
3. History
  [ok] 28 days of orders: 810,497 rows
4. Dashboard
  [ok] dashboard Aurora Live Orders
5. Rules in Activator
  [ok] Activator AuroraOrdersWatch: the rules exist and are STOPPED. Start them when you want to test (the guide shows where)
6. Data agent
  [ok] data agent Aurora Live Agent (published)

Everything is in place. The next cell opens the store.
First run: sending 28 days of real weather history...
  11,492 hourly readings are in, and the history's shoppers have reacted to them.
The store is open. The weather feed is on.
03:05:09 UTC  orders sent: 2 + 2 because of the weather | raining now: Vancouver
03:06:08 UTC  orders sent: 13 + 2 because of the weather
```
{% endraw %}

**5. Look at what you got.** Go back to the workspace: everything is there.

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/ui-41-fast-workspace.webp' | relative_url }}" alt="The top of the workspace list after the notebook ran: data agent, dashboard, the notebook, Eventhouse, database and Eventstream" loading="lazy"><figcaption>The list goes on with <strong>AuroraOrdersWatch</strong> (the rules) and <strong>AuroraWeather</strong> (the second Eventstream).</figcaption></figure>

Open **Aurora Live Orders**. The dashboard is already live:

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/ui-42-fast-dashboard.webp' | relative_url }}" alt="The dashboard the notebook created: orders in the last minute, orders per minute by region, the latest orders, and the weather map" loading="lazy"></figure>

Open **Aurora Live Agent** and ask it something. It already knows both tables:

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/ui-43-fast-agent.webp' | relative_url }}" alt="The data agent the notebook created, answering a question about rain jackets in rainy and dry hours" loading="lazy"><figcaption><strong>19 seconds.</strong> Orders of the rain jacket per hour in Vancouver: 26.84 in rainy hours, 8.55 in dry ones. A direct query gave the same ratio (37.9 and 11.9 units an hour: the agent counted orders, the query counted units).</figcaption></figure>

**6. Start the rules when you want alerts.** The notebook creates both rules **stopped**, so that nothing is sent before you are ready. Open **AuroraOrdersWatch**, click a rule, and click **Start**. The alert is a Teams message to you.

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/ui-44-fast-rule.webp' | relative_url }}" alt="The rule the notebook created: orders in the last 10 minutes per region, decreases below 1, and the Start button" loading="lazy"></figure>

The notebook's rules look a little different from the one you build by hand in step 7. Each rule watches a number (orders per region in the last 10 minutes, or wet readings per city in the last 30) and fires when the number crosses a line: **decreases below 1** for orders, **increases above 0** for rain. The result is the same alert.

I tested it: I started the orders rule the notebook had created, with the store stopped for a while. The rule's history showed two activations, Europe and North America.

<div class="g-box" markdown="1">
### Good to know about the fast path

- **Who can run it:** anyone who may create items in the workspace (Admin, Member or Contributor).
- **Running it again is safe.** Whatever already exists is left as it is, and the store simply opens again. That is also how you restart the store after its two hours.
- **Orders only?** Set `INCLUDE_WEATHER = False` in the first cell before the first run.
- **To stage an outage:** click **Interrupt kernel**, write a region in `MUTE_REGION`, and Run all again.
- **Stop the rules before you stop the store**, or every region "stops ordering" at once.
- The notebook does **not** create the agent in Teams and the flow. Those live outside Fabric: continue with [step 8](#step-8).
</div>

This is the output of a second run. Everything is found, nothing is made twice:

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/ui-45-fast-rerun.webp' | relative_url }}" alt="The notebook output on a second run: every item is already there" loading="lazy"></figure>

Steps 1 to 7 below build the same things by hand, one click at a time. Read them if you want to know what the notebook did, or if you prefer to build it yourself.

<div class="g-step"><span class="n">1</span><div><small>Part 1 · the data</small><h2 id="step-1">The Eventhouse and the table</h2></div></div>

An Eventhouse is where the orders will live. It comes with a database of the same name.

**1.** Open your workspace and click **New item**.

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/ui-01-new-item.webp' | relative_url }}" alt="The workspace with the New item button" loading="lazy"></figure>

**2.** Type **Eventhouse** in the filter and click the card.

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/ui-02-eventhouse-card.webp' | relative_url }}" alt="The New item pane filtered to Eventhouse" loading="lazy"></figure>

**3.** Name it `AuroraLive` and click **Create**. If a welcome window opens, click **Get started**.

<figure class="g-shot small"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/ui-03-eventhouse-name.webp' | relative_url }}" alt="The New Eventhouse dialog with the name AuroraLive" loading="lazy"></figure>

**4.** In the list on the left, click the database **AuroraLive**, then click **AuroraLive_queryset** under it. This is the query editor. It opens with sample text.

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/ui-04-queryset.webp' | relative_url }}" alt="The queryset of the database: the query editor with sample text" loading="lazy"></figure>

**5.** Click inside the editor, press **Ctrl+A** to select the sample text, and paste this over it. Then click **Run**.

<div class="g-where"><b>KQL</b><span>Paste into the query editor, then Run</span></div>
{% raw %}
```kusto
.create-merge table OrdersLive (
    OrderId: string, OrderTime: datetime, ProductId: long, Product: string,
    Category: string, RegionId: long, Region: string, City: string,
    Quantity: long, UnitPrice: real, SalesAmount: real,
    PaymentMethod: string, Channel: string)
```
{% endraw %}

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/ui-05-table-created.webp' | relative_url }}" alt="The create-table command after Run: the table OrdersLive appears in the list" loading="lazy"><figcaption><strong>What you should see:</strong> the table <code>OrdersLive</code> in the list on the left, and <em>Done</em> above the result.</figcaption></figure>

<div class="g-box" markdown="1">
### How the query editor works

You will come back to this editor several times. Each time: click in it, **Ctrl+A**, paste, **Run**. Replacing the old text is fine; nothing is lost in the database.
</div>

<div class="g-step"><span class="n">2</span><div><small>Part 1 · the data</small><h2 id="step-2">The Eventstream</h2></div></div>

The Eventstream is the address the store sends orders to. It has three boxes: a **source**, the **stream**, and a **destination**.

**1.** Back in the workspace: **New item**, type **Eventstream**, click the card. Name it `AuroraOrders` and click **Create**. Leave the schema checkbox empty.

**2.** On the first screen, click **Use custom endpoint**.

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/ui-06-eventstream-start.webp' | relative_url }}" alt="The first screen of a new Eventstream with three choices" loading="lazy"></figure>

**3.** Name the source `StoreOrders` and click **Add**.

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/ui-07-source-name.webp' | relative_url }}" alt="The Add source dialog with the source name StoreOrders" loading="lazy"></figure>

**4.** Click **Add destination** in the ribbon. In the pane on the right, type **Eventhouse** and click **Configure**.

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/ui-08-add-destination.webp' | relative_url }}" alt="The Add destination pane filtered to Eventhouse" loading="lazy"></figure>

**5.** Fill the pane as in the picture, and click **Save**. Leave the first choice on *Event processing before ingestion*.

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/ui-09-destination-settings.webp' | relative_url }}" alt="The Eventhouse destination settings filled in" loading="lazy"></figure>

**6.** The destination box now shows a small warning triangle, and it is not connected. **Drag** from the dot on the right side of the stream box to the destination box.

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/ui-10-connect.webp' | relative_url }}" alt="The canvas: the destination is not connected to the stream yet" loading="lazy"></figure>

<div class="g-box warn" markdown="1">
### The warning triangle does not go away. That is fine

After you connect the boxes, the triangle says *Add a mapper to map schema*. You can ignore it: the orders use the same field names as the table's columns, so no mapping is needed. I published with the triangle on, and the orders arrived.
</div>

**7.** Click **Publish** (top right). After a few seconds the view changes to **Live**: three connected boxes.

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/ui-11-published.webp' | relative_url }}" alt="The published Eventstream: source, stream and destination connected" loading="lazy"></figure>

<div class="g-step"><span class="n">3</span><div><small>Part 1 · the data</small><h2 id="step-3">The store: a notebook inside Fabric</h2></div></div>

Now something has to send orders. That is the job of one notebook. It runs **inside Fabric**, so there is nothing to install. You do two things: import it, and paste one line into it.

**1. Copy the connection string.** In the Eventstream, click the source box **StoreOrders**. In the pane at the bottom (open it with the small arrow on its right edge if it is closed), click **SAS Key Authentication**. Click the **copy icon** next to *Connection string-primary key*.

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/ui-12-connection-string.webp' | relative_url }}" alt="The source&#x27;s details: SAS Key Authentication with the copy icon next to the connection string" loading="lazy"></figure>

<div class="g-box warn" markdown="1">
### The connection string is a password

Anyone who has it can send events into your Eventstream. Do not put it in a chat, an email or a screenshot.
</div>

**2. Get the notebook file.** Open [Aurora_Store.ipynb on GitHub](https://github.com/Shai-Kr/pbi101-youtube/blob/main/videos/11-live-orders-alert/in_fabric/Aurora_Store.ipynb) and click the **download** button (the arrow at the top right of the file). Or take it from [the ZIP](https://github.com/Shai-Kr/pbi101-youtube/archive/refs/heads/main.zip): it is in `videos/11-live-orders-alert/in_fabric`.

**3. Import it.** In your workspace click **Import**, then **Notebook**, then **From this computer**. Click **Upload** and choose the file.

<figure class="g-shot small"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/ui-13-import-notebook.webp' | relative_url }}" alt="The workspace Import menu: Notebook, From this computer" loading="lazy"></figure>

**4. Paste the connection string.** Open the notebook **Aurora_Store**. In the first cell, replace the words `PASTE-YOUR-CONNECTION-STRING-HERE` with what you copied. Keep the quotes around it. Then click **Run all**.

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/ui-14-notebook-open.webp' | relative_url }}" alt="The imported notebook: the settings cell with the placeholder, and the Run all button" loading="lazy"></figure>

**5. Wait about half a minute** for the session to start. Then the notebook says *The store is open*, and adds a line every minute.

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/ui-15-notebook-running.webp' | relative_url }}" alt="The notebook running: The store is open, orders sent so far" loading="lazy"></figure>

<div class="g-box" markdown="1">
### Good to know about the notebook

- **You can close the tab.** The store keeps running in Fabric: I left the page for a quarter of an hour and the orders kept arriving. When you open the notebook again it reconnects.
- **It stops by itself after two hours** (`RUN_MINUTES = 120` in the first cell). To stop it earlier, click **Interrupt kernel**, the button that replaced *Run all*.
- **To start it again**: Run all.
- It is a plain Python notebook. It sends about 20 orders a minute, fewer at night.
</div>

<details class="g-details" markdown="1">
<summary>Prefer to paste the code instead of importing the file? Open this</summary>

Create a notebook yourself: **New item**, **Notebook**. Paste the first box into the first cell. Add a second cell (**+ Code**) and paste the second box into it. Then continue from step 4 above. The code is plain Python, so the language box in the toolbar can stay as it is. (I tested the imported file, which sets the language to Python by itself.)

<div class="g-where"><b class="nb">Notebook</b><span>Cell 1: the settings</span></div>
{% raw %}
```python
# ---- SETTINGS: this is the only cell you edit ----

# Paste the connection string of your Eventstream between the quotes.
# Where to find it: open the Eventstream, click the source box (the custom endpoint),
# then in the pane below: Event Hub > SAS Key Authentication > "Connection string-primary key".
CONNECTION_STRING = "PASTE-YOUR-CONNECTION-STRING-HERE"

ORDERS_PER_MINUTE = 20     # about 20 orders a minute
MUTE_REGION = None         # to stage an outage, write a region: "North America", "Europe", "Asia Pacific" or "Latin America"
RUN_MINUTES = 120          # the store stops by itself after this many minutes
```
{% endraw %}

<div class="g-where"><b class="nb">Notebook</b><span>Cell 2: the store</span></div>
{% raw %}
```python
# ---- THE STORE: run this cell. It keeps sending orders until RUN_MINUTES pass, or until you press Stop. ----
import base64, hashlib, hmac, json, random, time, urllib.parse, urllib.request
from datetime import datetime, timezone

PRODUCTS = [  # id, name, category, price, how popular
    (1, "Summit 2P Tent", "Camping", 331, 94), (2, "Basecamp 6P Tent", "Camping", 667, 50),
    (3, "Arctic Sleeping Bag", "Camping", 217, 70), (4, "Trailhead 45L Pack", "Hiking", 179, 120),
    (5, "Ridge Trekking Poles", "Hiking", 85, 85), (6, "Alpine Hiking Boots", "Hiking", 208, 104),
    (7, "Storm Shell Jacket", "Apparel", 247, 101), (8, "Thermal Base Layer", "Apparel", 75, 133),
    (9, "Summit Fleece", "Apparel", 122, 114), (10, "Glacier Water Bottle", "Accessories", 33, 154),
    (11, "Headlamp Pro", "Accessories", 56, 120), (12, "Trail First-Aid Kit", "Accessories", 43, 92)]
REGIONS = {  # name: (id, share of orders, cities)
    "North America": (1, 39, ["Vancouver", "Seattle", "Denver", "Toronto", "New York"]),
    "Europe": (2, 27, ["London", "Berlin", "Oslo", "Madrid", "Zurich"]),
    "Asia Pacific": (3, 16, ["Tokyo", "Sydney", "Auckland", "Singapore"]),
    "Latin America": (4, 9, ["Santiago", "Bogota", "Sao Paulo"])}
PAYMENTS = [("Card", 62), ("PayPal", 20), ("Apple Pay", 12), ("Bank transfer", 6)]
QUANTITIES = [(1, 70), (2, 22), (3, 8)]
CHANNELS = [("Web", 64), ("App", 36)]
# busier in the European evening, quieter at night (hours are UTC)
CURVE = [0.62, 0.55, 0.50, 0.48, 0.50, 0.56, 0.66, 0.78, 0.90, 1.00, 1.08, 1.14,
         1.20, 1.26, 1.32, 1.38, 1.42, 1.45, 1.42, 1.34, 1.20, 1.02, 0.84, 0.70]

conn = dict(part.split("=", 1) for part in CONNECTION_STRING.strip().split(";") if "=" in part)
if "Endpoint" not in conn or "EntityPath" not in conn:
    raise ValueError("Paste the connection string of your Eventstream into CONNECTION_STRING (the cell above), then run both cells.")
NAMESPACE = conn["Endpoint"].replace("sb://", "").strip("/")
URL = f"https://{NAMESPACE}/{conn['EntityPath']}"


def token():
    uri = urllib.parse.quote_plus(URL)
    expiry = str(int(time.time()) + 3600)
    signature = base64.b64encode(hmac.new(conn["SharedAccessKey"].encode(), f"{uri}\n{expiry}".encode(), hashlib.sha256).digest()).decode()
    return f"SharedAccessSignature sr={uri}&sig={urllib.parse.quote_plus(signature)}&se={expiry}&skn={conn['SharedAccessKeyName']}"


def send(events):
    body = json.dumps([{"Body": json.dumps(e)} for e in events]).encode("utf-8")
    request = urllib.request.Request(URL + "/messages?timeout=60&api-version=2014-01", data=body, method="POST")
    request.add_header("Authorization", token())
    request.add_header("Content-Type", "application/vnd.microsoft.servicebus.json")
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.status


def pick(pairs):
    return random.choices([p[0] for p in pairs], weights=[p[1] for p in pairs])[0]


def order():
    pid, product, category, price, _ = random.choices(PRODUCTS, weights=[p[4] for p in PRODUCTS])[0]
    region = random.choices(list(REGIONS), weights=[r[1] for r in REGIONS.values()])[0]
    quantity = pick(QUANTITIES)
    now = datetime.now(timezone.utc)
    return {"OrderId": f"ORD-{int(now.timestamp() * 1000)}-{random.randint(100, 999)}",
            "OrderTime": now.strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z",
            "ProductId": pid, "Product": product, "Category": category,
            "RegionId": REGIONS[region][0], "Region": region, "City": random.choice(REGIONS[region][2]),
            "Quantity": quantity, "UnitPrice": price, "SalesAmount": quantity * price,
            "PaymentMethod": pick(PAYMENTS), "Channel": pick(CHANNELS)}


print("The store is open." + (f" Muted region: {MUTE_REGION}." if MUTE_REGION else ""))
sent, started = 0, time.time()
while time.time() - started < RUN_MINUTES * 60:
    tick = time.time()
    now = datetime.now(timezone.utc)
    busy = CURVE[now.hour] * (1.12 if now.weekday() >= 5 else 1.0)
    count = max(1, round(ORDERS_PER_MINUTE * busy / 6 * random.uniform(0.6, 1.4)))      # one batch every 10 seconds
    batch = [o for o in (order() for _ in range(count)) if o["Region"] != MUTE_REGION]
    if batch:
        send(batch)
        sent += len(batch)
    if int((tick - started) // 10) % 6 == 0:
        print(f"{now:%H:%M:%S} UTC  orders sent so far: {sent}")
    time.sleep(max(0.0, 10 - (time.time() - tick)))
print("The store is closed. Orders sent:", sent)
```
{% endraw %}

</details>

<div class="g-check"><b>Check.</b> Go back to the Eventstream and click the stream box in the middle. <em>Data preview</em> at the bottom shows real orders arriving.</div>

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/ui-16-eventstream-preview.webp' | relative_url }}" alt="The Eventstream&#x27;s data preview with orders arriving" loading="lazy"></figure>

<div class="g-step"><span class="n">4</span><div><small>Part 1 · the data</small><h2 id="step-4">A month of history</h2></div></div>

An alert that says "orders stopped" is only useful if something knows what normal looks like. So the table needs history.

You do not send history through the stream. One statement **creates it inside the database**: 28 days of orders, about 800,000 rows, in a few seconds.

**1.** Open the query editor again (the database, then **AuroraLive_queryset**).

**2.** Ctrl+A, paste, **Run**.

<div class="g-where"><b>KQL</b><span>Paste into the query editor, then Run</span></div>
{% raw %}
```kusto
.set-or-append OrdersLive <|
let products = datatable(ProductId: long, Product: string, Category: string, UnitPrice: real, Popular: long) [
    1, "Summit 2P Tent", "Camping", 331, 94,          2, "Basecamp 6P Tent", "Camping", 667, 50,
    3, "Arctic Sleeping Bag", "Camping", 217, 70,     4, "Trailhead 45L Pack", "Hiking", 179, 120,
    5, "Ridge Trekking Poles", "Hiking", 85, 85,      6, "Alpine Hiking Boots", "Hiking", 208, 104,
    7, "Storm Shell Jacket", "Apparel", 247, 101,     8, "Thermal Base Layer", "Apparel", 75, 133,
    9, "Summit Fleece", "Apparel", 122, 114,          10, "Glacier Water Bottle", "Accessories", 33, 154,
    11, "Headlamp Pro", "Accessories", 56, 120,       12, "Trail First-Aid Kit", "Accessories", 43, 92];
let cities = datatable(City: string, Region: string, RegionId: long, Popular: long) [
    "Vancouver", "North America", 1, 78,  "Seattle", "North America", 1, 78,  "Denver", "North America", 1, 78,
    "Toronto", "North America", 1, 78,    "New York", "North America", 1, 78,
    "London", "Europe", 2, 54,   "Berlin", "Europe", 2, 54,   "Oslo", "Europe", 2, 54,
    "Madrid", "Europe", 2, 54,   "Zurich", "Europe", 2, 54,
    "Tokyo", "Asia Pacific", 3, 40,     "Sydney", "Asia Pacific", 3, 40,
    "Auckland", "Asia Pacific", 3, 40,  "Singapore", "Asia Pacific", 3, 40,
    "Santiago", "Latin America", 4, 30, "Bogota", "Latin America", 4, 30, "Sao Paulo", "Latin America", 4, 30];
// a product or a city appears in its list as many times as it is popular, so a random pick follows the popularity
let productPick = toscalar(products | mv-expand n = range(1, Popular) to typeof(long) | summarize make_list(ProductId));
let cityPick = toscalar(cities | mv-expand n = range(1, Popular) to typeof(long) | summarize make_list(City));
let payments = dynamic(["Card", "Card", "Card", "Card", "Card", "Card", "PayPal", "PayPal", "Apple Pay", "Bank transfer"]);
let quantities = dynamic([1, 1, 1, 1, 1, 1, 1, 2, 2, 3]);
let channels = dynamic(["Web", "Web", "App"]);
// how busy each hour of the day is (UTC)
let curve = dynamic([0.62, 0.55, 0.50, 0.48, 0.50, 0.56, 0.66, 0.78, 0.90, 1.00, 1.08, 1.14,
                     1.20, 1.26, 1.32, 1.38, 1.42, 1.45, 1.42, 1.34, 1.20, 1.02, 0.84, 0.70]);
range Minute from bin(ago(28d), 1m) to bin(now(), 1m) - 1m step 1m
| extend Orders = toint(round(20 * todouble(curve[hourofday(Minute)])
                  * iff(dayofweek(Minute) == 0d or dayofweek(Minute) == 6d, 1.12, 1.0) * (0.75 + 0.5 * rand())))
| where Orders > 0
| mv-expand i = range(1, Orders) to typeof(long)
| extend OrderTime = Minute + totimespan(tolong(rand() * 600000000)),
         ProductId = tolong(productPick[toint(rand() * array_length(productPick))]),
         City = tostring(cityPick[toint(rand() * array_length(cityPick))]),
         Quantity = tolong(quantities[toint(rand() * 10)])
| lookup kind=leftouter products on ProductId
| lookup kind=leftouter cities on City
| project OrderId = strcat("ORD-", tolong((OrderTime - datetime(1970-01-01)) / 1ms), "-", toint(rand() * 900) + 100),
          OrderTime, ProductId, Product, Category, RegionId, Region, City, Quantity, UnitPrice,
          SalesAmount = round(Quantity * UnitPrice, 2),
          PaymentMethod = tostring(payments[toint(rand() * 10)]), Channel = tostring(channels[toint(rand() * 3)])
```
{% endraw %}

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/ui-17-history.webp' | relative_url }}" alt="The history statement after Run: Done, and a row count of 811,167" loading="lazy"><figcaption><strong>What you should see:</strong> <em>Done</em> after a few seconds, and a row count of about 800,000.</figcaption></figure>

<div class="g-box warn" markdown="1">
### Run it once

Every run adds another 28 days of orders on top. If you ran it twice by mistake, clear the table with `.clear table OrdersLive data` and run it once more.
</div>

<div class="g-step"><span class="n">5</span><div><small>Part 1 · the data</small><h2 id="step-5">A live dashboard</h2></div></div>

**1.** In the workspace: **New item**, type **Real-Time Dashboard**, click the card. Name it `Aurora Live Orders` and click **Create**.

**2.** A small window offers your Eventhouse as the data source. Click **Continue**. (If the window does not show, click the **AuroraLive** card under *Suggested from the Workspace*.)

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/ui-18-dashboard-source.webp' | relative_url }}" alt="The new dashboard: a suggestion to use the workspace&#x27;s Eventhouse as the data source" loading="lazy"></figure>

**3.** In the *Add visual* box click **More**, and choose **Time chart**.

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/ui-19-add-visual.webp' | relative_url }}" alt="The Add visual box with its visual types" loading="lazy"></figure>

**4.** The tile editor opens. Paste the query into the **Query editor** at the bottom and click **Run**. The chart draws itself. Open **Visual setup**, then **General**, and give the tile a name. Click **Apply**.

<div class="g-where"><b>KQL</b><span>Paste into the tile's Query editor, then Run</span></div>
{% raw %}
```kusto
OrdersLive
| where OrderTime >= bin(ago(30m), 1m) and OrderTime < bin(now(), 1m)
| make-series Orders = count() default = 0 on OrderTime from bin(ago(30m), 1m) to bin(now(), 1m) step 1m by Region
| mv-expand OrderTime to typeof(datetime), Orders to typeof(long)
| project OrderTime, Region, Orders
```
{% endraw %}

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/ui-20-tile-editor.webp' | relative_url }}" alt="The tile editor: the query, the chart it produced, the tile name, and Apply" loading="lazy"></figure>

**5.** Click the **save** icon (top left). A window says *Live refresh is on*: click **Save changes**. The dashboard now updates by itself as orders arrive.

One detail in that query matters later: it **returns zeros**. A region that stops ordering drops to 0 on the chart; it does not disappear.

<details class="g-details" markdown="1">
<summary>Two more tiles, if you want them</summary>

Add each one with **Add visual**, paste, Run, Apply. Choose the visual type **Table** for the second.

<div class="g-where"><b>KQL</b><span>Orders in the last minute</span></div>
{% raw %}
```kusto
OrdersLive
| where OrderTime > ago(1m)
| summarize ['Orders in the last minute'] = count()
```
{% endraw %}

<div class="g-where"><b>KQL</b><span>The latest orders</span></div>
{% raw %}
```kusto
OrdersLive
| top 8 by OrderTime desc
| project OrderTime, Product, City, Region, SalesAmount, PaymentMethod
```
{% endraw %}

</details>

<div class="g-step"><span class="n">6</span><div><small>Part 1 · the watching</small><h2 id="step-6">The Fabric data agent</h2></div></div>

A Fabric data agent turns a question into a query. This one gets a single table.

**1.** In the workspace: **New item**, type **Data agent**, click the card. Name it `Aurora Live Agent` and click **Create**.

**2.** Click **Add a data source**.

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/ui-22-agent-add-source.webp' | relative_url }}" alt="The new data agent: Add a data source" loading="lazy"></figure>

**3.** The catalog lists items from every workspace you can open. Type `AuroraLive` in the filter, click your KQL database, and click **Add**.

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/ui-23-agent-catalog.webp' | relative_url }}" alt="The OneLake catalog filtered to AuroraLive" loading="lazy"></figure>

**4.** Tick the table **OrdersLive**.

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/ui-24-agent-table.webp' | relative_url }}" alt="The agent&#x27;s sources with the table OrdersLive ticked" loading="lazy"></figure>

**5.** Ask it something in the box at the bottom:

<div class="g-where"><b class="txt">Text</b><span>A test question</span></div>
{% raw %}
```text
How many orders came in over the last 15 minutes, by region?
```
{% endraw %}

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/ui-25-agent-answer.webp' | relative_url }}" alt="The data agent&#x27;s answer: orders in the last 15 minutes by region" loading="lazy"><figcaption><strong>11 seconds.</strong> I ran the same count directly on the database: 129, 100, 48 and 25 for a window two minutes later. The agent is reading the real table.</figcaption></figure>

**6.** Click **Publish**, write one or two sentences about what the agent knows, and click **Publish** again.

<figure class="g-shot small"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/ui-26-agent-publish.webp' | relative_url }}" alt="The Publish data agent dialog with a description" loading="lazy"></figure>

<div class="g-box" markdown="1">
### Draft and published are two different things

The test box talks to the **draft**. Copilot Studio, and anything else outside Fabric, talks to the **published** version. After every change: publish again.
</div>

If you have never built a data agent, this video builds one from scratch:

{% include yt-embed.html id="KOMo49vQUAc" title="Build a Fabric Data Agent in 5 Minutes (+ Prod Checklist)" duration="9:39" kicker="New to data agents? Start here" %}

<div class="g-step"><span class="n">7</span><div><small>Part 1 · the watching</small><h2 id="step-7">The rule that watches</h2></div></div>

Now the part that notices. A rule in **Activator** runs a query every minute. Every row the query returns is an alert.

So the query is written to return a region **only in the minute it stopped**: no orders in the last 10 minutes, but at least one in the minute before that.

**1.** Open the query editor again. Ctrl+A, paste, **Run**.

<div class="g-where"><b>KQL</b><span>Paste into the query editor, then Run</span></div>
{% raw %}
```kusto
// Returns a region only in the minute it stopped:
// no orders in the last 10 minutes, but at least one in the minute before that.
OrdersLive
| where OrderTime > ago(11m)
| summarize Last10Min = countif(OrderTime > ago(10m)), MinuteBefore = countif(OrderTime <= ago(10m)) by Region
| where Last10Min == 0 and MinuteBefore > 0
| project Region
```
{% endraw %}

The result is empty: *No rows to show*. That is the right answer. Nothing has stopped.

**2.** Click **Add alert** in the editor's toolbar. It is grey until a query has run.

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/ui-27-add-alert.webp' | relative_url }}" alt="The query editor toolbar with the Add alert button" loading="lazy"></figure>

**3.** Fill the top of the pane: a name, **Run query every 1 minute**, and leave the check on *On each event*.

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/ui-28-rule-top.webp' | relative_url }}" alt="The Add rule pane: name, the query, every 1 minute, on each event" loading="lazy"></figure>

**4.** Scroll down in the pane. For a first test, let the action be a **Teams message to you**. Write a headline, tick **Region** under *Context*, and name the new Activator item `AuroraOrdersWatch`. Click **Create**.

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/ui-29-rule-bottom.webp' | relative_url }}" alt="The Add rule pane: the action, the context column and the name of the new Activator item" loading="lazy"></figure>

The rule starts running right away.

<div class="g-box" markdown="1">
### Why 10 minutes?

A small region has quiet minutes even on a good day. With a 5 minute window, Latin America at night could go silent by chance and fire a false alert. Ten minutes makes that very unlikely. If your own events are denser, shorten it: change the three numbers in the query (`11m`, `10m`, `10m`).
</div>

### Test the rule

**1.** Open the notebook and click **Interrupt kernel** to stop the store.

**2.** In the first cell change `MUTE_REGION = None` to `MUTE_REGION = "North America"`. Click **Run all**. The store is open again, without one region.

**3.** Wait, and watch the dashboard.

<figure class="g-shot small"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/ui-21-dashboard-outage.webp' | relative_url }}" alt="The dashboard: the North America line drops to zero" loading="lazy"></figure>

**4.** After about ten minutes the rule fires. In my run the last order from North America arrived at 01:33:14 and the rule fired at 01:43:48: **10 minutes and 34 seconds**, once. To see it, open the item **AuroraOrdersWatch** in your workspace, click the rule, and open **History**.

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/ui-30-activation.webp' | relative_url }}" alt="The rule&#x27;s History tab: one activation, for North America" loading="lazy"></figure>

**5.** Put the store back: Interrupt kernel, `MUTE_REGION = None`, Run all.

<div class="g-box warn" markdown="1">
### Stop the rule before you stop the store

When the notebook stops, **every** region stops ordering, and the rule fires for all four. I did exactly that while building this. Click **Stop** on the rule first, and start it again when the store is running.
</div>

<div class="g-box ok" markdown="1">
### You have a working alert

If a Teams message is enough for you, you are done: data arriving, a dashboard, an agent you can ask in Fabric, and an alert. The next two steps put the alert and the agent **in the same Teams chat**, so you can answer the alert with a question.
</div>

<div class="g-step"><span class="n">8</span><div><small>Part 1 · the watching</small><h2 id="step-8">The agent in Teams</h2></div></div>

This step is in **Copilot Studio**, not in Fabric.

**First, a place for the agent to live.** My default Power Platform environment had no Dataverse and no license, and Copilot Studio refused to build there. This is what worked:

1. In the Azure portal, register the resource provider `Microsoft.PowerPlatform` on your subscription.
2. In the Power Platform admin center: **Licensing**, **Billing plans**, **New billing plan** (pay-as-you-go), linked to that subscription.
3. Create a new **Production** environment **with Dataverse**, and add it to the billing plan. A plan only lists environments of its own region, so create both in the same one.

**Then the agent.**

1. Open Copilot Studio **in the new environment** and create an agent. Mine is called `Aurora Watch`.
2. Paste these instructions:

<div class="g-where"><b class="txt">Text</b><span>Paste into the agent's Instructions box</span></div>
{% raw %}
```text
You are Aurora Watch, the operations assistant for Aurora Outdoor's online store (a simulated demo store). Answer questions about live orders by calling the Aurora Live Agent tool. Never guess a number: every number in your answer must come from the tool. All times in the data are UTC. Keep answers short: the answer first, then the numbers it is based on. When the user asks about an alert, check the most recent data for that region and compare it with the same hour on earlier days.
```
{% endraw %}

<ol start="3">
<li><strong>Add a tool</strong>, choose <strong>Fabric IQ Data MCP</strong>, and pick the published data agent from step 6.</li>
<li>Under <strong>Channels</strong> choose <strong>Teams + Microsoft 365</strong>, Teams only.</li>
<li><strong>Publish</strong>. Then open the agent in Teams and add it. You get a chat with it.</li>
</ol>

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/08-copilot-studio-agent.webp' | relative_url }}" alt="The Copilot Studio agent: instructions on the left; one channel and one tool on the right" loading="lazy"><figcaption><strong>The whole agent.</strong> (1) A short set of instructions. (2) One channel: Teams. (3) One tool: the Fabric data agent. No code.</figcaption></figure>

<div class="g-box warn" markdown="1">
### Three things that cost me time here

- The first **Save** after adding the tool failed with a message about connection permissions. Saving again half a minute later worked.
- The first **Publish** sat on "Publishing..." for five minutes and the agent stayed a draft. The second try went through.
- The agent does not appear in the Teams store search. Open it from Copilot Studio's "View in Teams" link.
</div>

<div class="g-step"><span class="n">9</span><div><small>Part 1 · the watching</small><h2 id="step-9">The flow that hands the alert to the agent</h2></div></div>

Now replace the test action from step 7 with the real one: a small flow that posts the alert in your chat with the agent.

**1.** In Fabric, open the item **AuroraOrdersWatch** and click the rule. In the *Definition* pane open the **Action** list, scroll to the bottom, and click **Create custom action**.

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/ui-31-custom-action-menu.webp' | relative_url }}" alt="The rule&#x27;s Action list, with Create custom action at the bottom" loading="lazy"></figure>

**2.** Name the action, add one input field called `Region` (type it and press Enter), click **Copy** next to the connection string, and click **Open flow builder**.

<figure class="g-shot small"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/ui-32-custom-action.webp' | relative_url }}" alt="The New custom action dialog: a name, the input field Region, the connection string and Open flow builder" loading="lazy"></figure>

**3.** Power Automate opens with a flow that already has its trigger, *When an activator rule is triggered*. Check the **environment** at the top right: it must be the agent's environment. Paste the connection string into the trigger.

**4.** Add one action: Teams, **Post message in a chat or channel**. Set it like this:

<div class="g-table" markdown="1">

| Field | Value |
|---|---|
| Post as | **User** |
| Post in | **Group chat** |
| Group chat | Your chat with the agent |
| Message | The text below, with the **Region** field from the trigger in the middle |

</div>

<div class="g-where"><b class="txt">Text</b><span>The message. Put the Region field where it says so</span></div>
{% raw %}
```text
Alert from Fabric: orders stopped in (the Region field). Check this region's orders in the last 15 minutes against the same hour on earlier days, and tell me what you see.
```
{% endraw %}

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/09-flow.webp' | relative_url }}" alt="The two-step Power Automate flow, with the Teams step open: Post as User, Post in Group chat, and the message" loading="lazy"><figcaption><strong>The flow from the video.</strong> (1) The trigger. (2) The Teams step. (3) Post as User. (4) Post in the chat with the agent. (5) The message. In my flow the field is called <em>Object instance</em>, because that rule was built around an object. With the rule from step 7, pick the field named <em>Region</em>, the input field you just defined.</figcaption></figure>

**5.** Save the flow. Back in Fabric, click **Done**, choose the new action in the rule's **Action** list, put the **Region** column into its `Region` field, and click **Save and update**.

<div class="g-box" markdown="1">
### Why does the flow post as you?

I wanted the agent to open the conversation itself. Posting *as the agent* failed for this kind of agent ("We couldn't find your bot"). So the flow posts the question **in your name**, into your chat with the agent, and the agent answers it. The result is the same single thread. Say it honestly when you demo: the rule raises the alert, not the agent.
</div>

<div class="g-box warn" markdown="1">
### "This flow's owner needs a Power Automate Premium license"

The Activator trigger is a premium connector. Without a Premium license the flow saves but cannot run. The fix that needed no new license: open the flow's details, **Edit**, **Plan**, **Copilot Studio**, and turn the flow on. It is then billed in Copilot credits on the plan you already have. This switch cannot be undone for that flow.
</div>

<div class="g-step"><span class="n">10</span><div><small>Part 1 · the result</small><h2 id="step-10">Test it: ask, break, get alerted</h2></div></div>

These three screenshots are from the recording of the video.

**Ask.** In the Teams chat with the agent:

<div class="g-where"><b class="txt">Text</b><span>Type in the chat with the agent</span></div>
{% raw %}
```text
How many orders came in over the last 15 minutes, by region?
```
{% endraw %}

<figure class="g-shot chat"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/10-teams-question.webp' | relative_url }}" alt="The agent&#x27;s answer in Teams: 434 orders in the last 15 minutes, split by region" loading="lazy"><figcaption><strong>40 seconds later:</strong> 434 orders, split by region, with the time of the last order in each. I ran the same count directly on the database: exact.</figcaption></figure>

**Break it.** Mute a region as in step 7, wait, and do not type anything.

<figure class="g-shot chat"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/11-teams-outage-alert.webp' | relative_url }}" alt="The agent&#x27;s analysis in Teams: This is a real outage, with a table of the same hours on the days before" loading="lazy"><figcaption><strong>The alert, and the answer.</strong> The message from the flow arrived, and about 50 seconds later the agent wrote: "This is a real outage." It compared the hour with the same hour on the seven days before (645 to 795 orders, against 26), and noted that the other regions were still ordering, so it was not a data delay. Every number in that table matched a direct query. In the video the rule used a 5 minute window, so the alert came after 7 minutes; with this guide's 10 minute window expect 10 to 11.</figcaption></figure>

**Keep going.** Because it is a chat:

<div class="g-where"><b class="txt">Text</b><span>A follow-up question</span></div>
{% raw %}
```text
Break down North America's last 30 minutes of orders by payment method.
```
{% endraw %}

<figure class="g-shot chat"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/12-teams-follow-up.webp' | relative_url }}" alt="The follow-up answer: all four payment methods stopped at the same time" loading="lazy"><figcaption><strong>43 seconds:</strong> all four payment methods stopped at the same moment, so it is not the payment provider. One sentence from me, in the thread where the alert came in.</figcaption></figure>

<div class="g-box ok" markdown="1">
### Part 1 is done

An order, an alert and an answer, in one thread. The agent's line about "a shared cause, such as a deployment" is its guess; the numbers are checked.
</div>

<div class="g-part" id="part-2"><h2>Part 2: real weather joins</h2><p>The same system, plus one outside feed. An outside feed joined with your own events is where this gets useful.</p></div>

{% include yt-embed.html id="1_e6TUSKjxs" title="Real Weather in Fabric: Rain Alert + AI Agent in Teams" duration="9:17" kicker="Watch part 2: a real rain alert" %}

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/f-real-weather-simulated-shoppers.webp' | relative_url }}" alt="Real weather, simulated shoppers: the weather is real, the shoppers were built to react to it" loading="lazy"><figcaption><strong>What is real here.</strong> The weather comes from a public weather service, for the real cities. The shoppers are simulated, and I built them to buy about three times more rain jackets when it rains in their city. So when the agent finds that pattern, it is not a discovery. The plumbing is the point: an outside feed, joined with your own data, as it happens.</figcaption></figure>

<div class="g-step"><span class="n">11</span><div><small>Part 2 · the data</small><h2 id="step-11">A weather table and a second Eventstream</h2></div></div>

You already know every click here. It is steps 1 and 2 again, with new names.

**1. The table.** Open the query editor. Ctrl+A, paste, **Run**.

<div class="g-where"><b>KQL</b><span>Paste into the query editor, then Run</span></div>
{% raw %}
```kusto
.create-merge table WeatherLive (
    ReadingTime: datetime, City: string, Region: string, Latitude: real, Longitude: real,
    TempC: real, PrecipMm: real, RainRate: real, SnowCm: real, WindKmh: real,
    WeatherCode: long, Condition: string, IntervalMin: long, Source: string)
```
{% endraw %}

`RainRate` is millimetres per hour. From 0.4 I count a city as raining.

**2. The Eventstream.** New item, **Eventstream**, name it `AuroraWeather`. **Use custom endpoint**, source name `WeatherFeed`. **Add destination**, Eventhouse, the same database, the table **WeatherLive**, Json. Connect the boxes, **Publish**.

<figure class="g-shot small"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/ui-33-two-tables.webp' | relative_url }}" alt="The database with two tables: OrdersLive and WeatherLive" loading="lazy"><figcaption><strong>One database, two tables.</strong> This is the important part: because both sit in the same Eventhouse, one query can use both.</figcaption></figure>

<div class="g-step"><span class="n">12</span><div><small>Part 2 · the data</small><h2 id="step-12">The store, now with weather</h2></div></div>

A second notebook replaces the first one. It does three things: it sends 28 days of **real** weather history, it asks the weather service for the current weather of the 17 cities every five minutes, and it runs the store, whose shoppers now react to that weather.

Weather data is by [Open-Meteo.com](https://open-meteo.com) (CC BY 4.0), free for non-commercial use and without a key.

**1. Stop the first notebook** (Interrupt kernel in *Aurora_Store*), so that two stores do not run together. Stop the rule first, as always.

**2. Get the file** [Aurora_Store_With_Weather.ipynb](https://github.com/Shai-Kr/pbi101-youtube/blob/main/videos/12-weather-joins-orders/in_fabric/Aurora_Store_With_Weather.ipynb) and import it, exactly as in step 3.

**3. Paste two connection strings** into the first cell: the one from **AuroraOrders** (the same as before) and the one from the new **AuroraWeather**. Each has its own line.

**4. Run all.** The first run sends the weather history (about 11,500 hourly readings), and then opens the store.

**5. Change one word.** In the first cell change `SEND_WEATHER_HISTORY = True` to `False`, so the next run does not send the history again. You do not need to restart for this.

<details class="g-details" markdown="1">
<summary>Prefer to paste the code? The three cells are here</summary>

<div class="g-where"><b class="nb">Notebook</b><span>Cell 1: the settings</span></div>
{% raw %}
```python
# ---- SETTINGS: this is the only cell you edit ----

# 1. The connection string of the ORDERS Eventstream (the same one as in part 1).
CONNECTION_STRING = "PASTE-YOUR-CONNECTION-STRING-HERE"

# 2. The connection string of the WEATHER Eventstream (the new one from this part).
#    Where to find it: open the Eventstream, click the source box (the custom endpoint),
#    then in the pane below: Event Hub > SAS Key Authentication > "Connection string-primary key".
WEATHER_CONNECTION_STRING = "PASTE-THE-WEATHER-CONNECTION-STRING-HERE"

ORDERS_PER_MINUTE = 20     # about 20 orders a minute, before the weather adds its own
MUTE_REGION = None         # to stage an outage, write a region: "North America", "Europe", "Asia Pacific" or "Latin America"
RUN_MINUTES = 120          # the store and the weather feed stop by themselves after this many minutes
SEND_WEATHER_HISTORY = True    # the first run sends 28 days of weather history; set this to False after that run
```
{% endraw %}

<div class="g-where"><b class="nb">Notebook</b><span>Cell 2: helpers, and the weather history on the first run</span></div>
{% raw %}
```python
# ---- HELPERS + (on the first run only) 28 days of REAL hourly weather for the 17 cities ----
# Weather data by Open-Meteo.com (CC BY 4.0, free for non-commercial use, no key).
import base64, hashlib, hmac, json, time, urllib.parse, urllib.request
from datetime import datetime, timezone

CITIES = {  # city: (latitude, longitude, region)
    "Vancouver": (49.28, -123.12, "North America"), "Seattle": (47.61, -122.33, "North America"),
    "Denver": (39.74, -104.99, "North America"), "Toronto": (43.65, -79.38, "North America"),
    "New York": (40.71, -74.01, "North America"), "London": (51.51, -0.13, "Europe"),
    "Berlin": (52.52, 13.41, "Europe"), "Oslo": (59.91, 10.75, "Europe"), "Madrid": (40.42, -3.70, "Europe"),
    "Zurich": (47.38, 8.54, "Europe"), "Tokyo": (35.68, 139.69, "Asia Pacific"),
    "Sydney": (-33.87, 151.21, "Asia Pacific"), "Auckland": (-36.85, 174.76, "Asia Pacific"),
    "Singapore": (1.35, 103.82, "Asia Pacific"), "Santiago": (-33.45, -70.67, "Latin America"),
    "Bogota": (4.71, -74.07, "Latin America"), "Sao Paulo": (-23.55, -46.63, "Latin America")}
CONDITIONS = {0: "Clear", 1: "Mostly clear", 2: "Partly cloudy", 3: "Overcast", 45: "Fog", 48: "Fog", 51: "Light drizzle",
              53: "Drizzle", 55: "Heavy drizzle", 61: "Light rain", 63: "Rain", 65: "Heavy rain", 71: "Light snow",
              73: "Snow", 75: "Heavy snow", 80: "Light showers", 81: "Showers", 82: "Heavy showers", 95: "Thunderstorm"}


def endpoint(connection_string, name):
    conn = dict(part.split("=", 1) for part in connection_string.strip().split(";") if "=" in part)
    if "Endpoint" not in conn or "EntityPath" not in conn:
        raise ValueError(f"Paste the connection string into {name} (the first cell), then run the cells again.")
    conn["url"] = "https://" + conn["Endpoint"].replace("sb://", "").strip("/") + "/" + conn["EntityPath"]
    return conn


def send(conn, events):
    uri = urllib.parse.quote_plus(conn["url"])
    expiry = str(int(time.time()) + 3600)
    signature = base64.b64encode(hmac.new(conn["SharedAccessKey"].encode(), f"{uri}\n{expiry}".encode(), hashlib.sha256).digest()).decode()
    token = f"SharedAccessSignature sr={uri}&sig={urllib.parse.quote_plus(signature)}&se={expiry}&skn={conn['SharedAccessKeyName']}"
    body = json.dumps([{"Body": json.dumps(e)} for e in events]).encode("utf-8")
    request = urllib.request.Request(conn["url"] + "/messages?timeout=60&api-version=2014-01", data=body, method="POST")
    request.add_header("Authorization", token)
    request.add_header("Content-Type", "application/vnd.microsoft.servicebus.json")
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.status


def weather_service(parameters):
    latitudes = ",".join(str(c[0]) for c in CITIES.values())
    longitudes = ",".join(str(c[1]) for c in CITIES.values())
    url = f"https://api.open-meteo.com/v1/forecast?latitude={latitudes}&longitude={longitudes}&timezone=UTC&{parameters}"
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "fabric-demo"}), timeout=60) as response:
        return json.loads(response.read())


def reading(city, time_text, temp, precipitation, snow, wind, code, minutes):
    latitude, longitude, region = CITIES[city]
    precipitation = precipitation or 0.0
    return {"ReadingTime": time_text + ":00Z", "City": city, "Region": region, "Latitude": latitude, "Longitude": longitude,
            "TempC": temp, "PrecipMm": precipitation, "RainRate": round(precipitation * 60 / minutes, 2),   # millimetres per hour
            "SnowCm": snow or 0.0, "WindKmh": wind, "WeatherCode": code, "Condition": CONDITIONS.get(code, str(code)),
            "IntervalMin": minutes, "Source": "open-meteo.com"}


weather = endpoint(WEATHER_CONNECTION_STRING, "WEATHER_CONNECTION_STRING")
if SEND_WEATHER_HISTORY:
    data = weather_service("hourly=temperature_2m,precipitation,snowfall,weather_code,wind_speed_10m&past_days=28&forecast_days=1")
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:00")
    history = []
    for city, place in zip(CITIES, data):
        h = place["hourly"]
        for i, t in enumerate(h["time"]):
            if t <= now and h["temperature_2m"][i] is not None:
                history.append(reading(city, t, h["temperature_2m"][i], h["precipitation"][i], h["snowfall"][i],
                                       h["wind_speed_10m"][i], h["weather_code"][i], 60))
    for start in range(0, len(history), 300):
        send(weather, history[start:start + 300])
    rainy = sum(1 for r in history if r["RainRate"] >= 0.4)
    print(f"Sent {len(history)} hourly readings. {rainy} of them are rainy hours.")
    print("Now set SEND_WEATHER_HISTORY = False in the first cell, so the next run does not send the history again.")
else:
    print("Weather history: skipped (SEND_WEATHER_HISTORY is False).")
```
{% endraw %}

<div class="g-where"><b class="nb">Notebook</b><span>Cell 3: the store and the weather feed</span></div>
{% raw %}
```python
# ---- THE STORE + THE WEATHER FEED: run this cell. It runs until RUN_MINUTES pass, or until you press Stop. ----
# (Run the cell above it first: it defines the cities and the helper functions.)
import math, random

PRODUCTS = [  # id, name, category, price, how popular
    (1, "Summit 2P Tent", "Camping", 331, 94), (2, "Basecamp 6P Tent", "Camping", 667, 50),
    (3, "Arctic Sleeping Bag", "Camping", 217, 70), (4, "Trailhead 45L Pack", "Hiking", 179, 120),
    (5, "Ridge Trekking Poles", "Hiking", 85, 85), (6, "Alpine Hiking Boots", "Hiking", 208, 104),
    (7, "Storm Shell Jacket", "Apparel", 247, 101), (8, "Thermal Base Layer", "Apparel", 75, 133),
    (9, "Summit Fleece", "Apparel", 122, 114), (10, "Glacier Water Bottle", "Accessories", 33, 154),
    (11, "Headlamp Pro", "Accessories", 56, 120), (12, "Trail First-Aid Kit", "Accessories", 43, 92)]
REGIONS = {"North America": (1, 39), "Europe": (2, 27), "Asia Pacific": (3, 16), "Latin America": (4, 9)}   # id, share of orders
PAYMENTS = [("Card", 62), ("PayPal", 20), ("Apple Pay", 12), ("Bank transfer", 6)]
QUANTITIES = [(1, 70), (2, 22), (3, 8)]
CHANNELS = [("Web", 64), ("App", 36)]
CURVE = [0.62, 0.55, 0.50, 0.48, 0.50, 0.56, 0.66, 0.78, 0.90, 1.00, 1.08, 1.14,
         1.20, 1.26, 1.32, 1.38, 1.42, 1.45, 1.42, 1.34, 1.20, 1.02, 0.84, 0.70]
# What the SIMULATED shoppers do with the REAL weather in their city:
RAIN, HEAVY_RAIN, COLD, HOT = 0.4, 2.0, 5.0, 26.0             # mm per hour, mm per hour, degrees C, degrees C
EFFECTS = {"rain": (["Storm Shell Jacket"], 3.0), "heavy rain": (["Storm Shell Jacket"], 4.0),
           "cold": (["Thermal Base Layer", "Summit Fleece"], 1.8), "hot": (["Glacier Water Bottle"], 2.2)}
CITY_NAMES = {region: [c for c, v in CITIES.items() if v[2] == region] for region in REGIONS}
TOTAL_POPULAR = sum(p[4] for p in PRODUCTS)
TOTAL_SHARE = sum(r[1] for r in REGIONS.values())


def pick(pairs):
    return random.choices([p[0] for p in pairs], weights=[p[1] for p in pairs])[0]


def order(product=None, city=None):
    pid, name, category, price, _ = product or random.choices(PRODUCTS, weights=[p[4] for p in PRODUCTS])[0]
    if city is None:
        region = random.choices(list(REGIONS), weights=[r[1] for r in REGIONS.values()])[0]
        city = random.choice(CITY_NAMES[region])
    region = CITIES[city][2]
    quantity = pick(QUANTITIES)
    now = datetime.now(timezone.utc)
    return {"OrderId": f"ORD-{int(now.timestamp() * 1000)}-{random.randint(100, 999)}",
            "OrderTime": now.strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z",
            "ProductId": pid, "Product": name, "Category": category, "RegionId": REGIONS[region][0], "Region": region,
            "City": city, "Quantity": quantity, "UnitPrice": price, "SalesAmount": quantity * price,
            "PaymentMethod": pick(PAYMENTS), "Channel": pick(CHANNELS)}


def weather_now():
    data = weather_service("current=temperature_2m,precipitation,snowfall,weather_code,wind_speed_10m")
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M")
    readings = []
    for city, place in zip(CITIES, data):
        c = place["current"]
        readings.append(reading(city, stamp, c["temperature_2m"], c["precipitation"], c["snowfall"], c["wind_speed_10m"],
                                c["weather_code"], int(c["interval"] // 60)))
    return readings


def what_weather_does(r):
    tags = ["heavy rain"] if r["RainRate"] >= HEAVY_RAIN else ["rain"] if r["RainRate"] >= RAIN else []
    if r["TempC"] is not None and r["TempC"] < COLD:
        tags.append("cold")
    if r["TempC"] is not None and r["TempC"] > HOT:
        tags.append("hot")
    return tags


def how_many(expected):                     # a random whole number around "expected"
    limit, count, p = math.exp(-expected), 0, 1.0
    while expected > 0:
        p *= random.random()
        if p <= limit:
            break
        count += 1
    return count


orders = endpoint(CONNECTION_STRING, "CONNECTION_STRING")
print("The store is open, and the weather feed is on." + (f" Muted region: {MUTE_REGION}." if MUTE_REGION else ""))
sent = extra = 0
latest, last_sent, last_fetch, started = {}, {}, 0.0, time.time()
while time.time() - started < RUN_MINUTES * 60:
    tick = time.time()
    if tick - last_fetch >= 300:                                    # every 5 minutes: ask the weather service
        try:
            readings = weather_now()
            changed = [r for r in readings
                       if last_sent.get(r["City"], (None, 0))[0] != (r["TempC"], r["PrecipMm"], r["WeatherCode"], r["WindKmh"])
                       or tick - last_sent[r["City"]][1] > 870]     # send when the values changed, or every 15 minutes
            if changed:
                send(weather, changed)
                for r in changed:
                    last_sent[r["City"]] = ((r["TempC"], r["PrecipMm"], r["WeatherCode"], r["WindKmh"]), tick)
            latest = {r["City"]: r for r in readings}
            raining = [c for c, r in latest.items() if r["RainRate"] >= RAIN]
            print(f"{datetime.now(timezone.utc):%H:%M:%S} UTC  orders: {sent} + {extra} because of the weather | "
                  f"weather readings sent: {len(changed)} | raining now: {', '.join(raining) or 'nowhere'}")
        except Exception as problem:                                # a failed call must not stop the store
            print("weather call failed, will try again:", str(problem)[:120])
        last_fetch = tick
    now = datetime.now(timezone.utc)
    busy = CURVE[now.hour] * (1.12 if now.weekday() >= 5 else 1.0)
    per_batch = ORDERS_PER_MINUTE * busy / 6                         # one batch every 10 seconds
    batch = [order() for _ in range(max(1, round(per_batch * random.uniform(0.6, 1.4))))]
    weather_orders = []
    for city, r in latest.items():                                  # the weather-driven extra orders
        city_share = REGIONS[CITIES[city][2]][1] / TOTAL_SHARE / len(CITY_NAMES[CITIES[city][2]])
        for tag in what_weather_does(r):
            names, times = EFFECTS[tag]
            for product in (p for p in PRODUCTS if p[1] in names):
                expected = per_batch * city_share * product[4] / TOTAL_POPULAR * (times - 1)
                weather_orders += [order(product, city) for _ in range(how_many(expected))]
    batch = [o for o in batch if o["Region"] != MUTE_REGION]
    weather_orders = [o for o in weather_orders if o["Region"] != MUTE_REGION]
    if batch or weather_orders:
        send(orders, batch + weather_orders)
        sent += len(batch)
        extra += len(weather_orders)
    time.sleep(max(0.0, 10 - (time.time() - tick)))
print("The store is closed. Orders sent:", sent, "+", extra, "because of the weather")
```
{% endraw %}

</details>

**6. Give the history its shoppers.** The 28 days of orders from step 4 know nothing about weather. This statement adds what the simulated shoppers would have bought in that weather. Wait a minute after the notebook reports the history as sent, then: query editor, Ctrl+A, paste, **Run**. Once.

<div class="g-where"><b>KQL</b><span>Paste into the query editor, then Run (once)</span></div>
{% raw %}
```kusto
.set-or-append OrdersLive <|
// What the SIMULATED shoppers did with the REAL weather of the last 28 days:
// rain = rain jackets x 3 (heavy rain x 4), cold = warm layers x 1.8, hot = water bottles x 2.2.
let effects = datatable(Weather: string, Product: string, ProductId: long, Category: string, UnitPrice: real, ExtraPerOrder: real) [
    "rain", "Storm Shell Jacket", 7, "Apparel", 247, 0.1633,
    "heavy rain", "Storm Shell Jacket", 7, "Apparel", 247, 0.2449,
    "cold", "Thermal Base Layer", 8, "Apparel", 75, 0.0860,
    "cold", "Summit Fleece", 9, "Apparel", 122, 0.0737,
    "hot", "Glacier Water Bottle", 10, "Accessories", 33, 0.1494];
let cities = datatable(City: string, RegionId: long, CityShare: real) [
    "Vancouver", 1, 0.0857,  "Seattle", 1, 0.0857,  "Denver", 1, 0.0857,  "Toronto", 1, 0.0857,  "New York", 1, 0.0857,
    "London", 2, 0.0593,     "Berlin", 2, 0.0593,   "Oslo", 2, 0.0593,    "Madrid", 2, 0.0593,   "Zurich", 2, 0.0593,
    "Tokyo", 3, 0.0440,      "Sydney", 3, 0.0440,   "Auckland", 3, 0.0440, "Singapore", 3, 0.0440,
    "Santiago", 4, 0.0330,   "Bogota", 4, 0.0330,   "Sao Paulo", 4, 0.0330];
let payments = dynamic(["Card", "Card", "Card", "Card", "Card", "Card", "PayPal", "PayPal", "Apple Pay", "Bank transfer"]);
let quantities = dynamic([1, 1, 1, 1, 1, 1, 1, 2, 2, 3]);
let channels = dynamic(["Web", "Web", "App"]);
let curve = dynamic([0.62, 0.55, 0.50, 0.48, 0.50, 0.56, 0.66, 0.78, 0.90, 1.00, 1.08, 1.14,
                     1.20, 1.26, 1.32, 1.38, 1.42, 1.45, 1.42, 1.34, 1.20, 1.02, 0.84, 0.70]);
WeatherLive
| where IntervalMin == 60 and ReadingTime > ago(28d) and ReadingTime <= now()
| extend HourStart = ReadingTime - 1h
| extend Weather = pack_array(iff(RainRate >= 2.0, "heavy rain", iff(RainRate >= 0.4, "rain", "")),
                              iff(TempC < 5, "cold", ""), iff(TempC > 26, "hot", ""))
| mv-expand Weather to typeof(string)
| where Weather != ""
| lookup kind=inner effects on Weather
| lookup kind=inner cities on City
| extend BaseOrders = 20 * 60 * todouble(curve[hourofday(HourStart)])
                      * iff(dayofweek(HourStart) == 0d or dayofweek(HourStart) == 6d, 1.12, 1.0) * CityShare
| extend Extra = toint(round(BaseOrders * ExtraPerOrder * (0.75 + 0.5 * rand())))
| where Extra > 0
| mv-expand i = range(1, Extra) to typeof(long)
| extend OrderTime = HourStart + totimespan(tolong(rand() * 36000000000)), Quantity = tolong(quantities[toint(rand() * 10)])
| project OrderId = strcat("ORD-", tolong((OrderTime - datetime(1970-01-01)) / 1ms), "-", toint(rand() * 900) + 100),
          OrderTime, ProductId, Product, Category, RegionId, Region, City, Quantity, UnitPrice,
          SalesAmount = round(Quantity * UnitPrice, 2),
          PaymentMethod = tostring(payments[toint(rand() * 10)]), Channel = tostring(channels[toint(rand() * 3)])
```
{% endraw %}

<div class="g-check"><b>Check.</b> Run <code>WeatherLive | count</code>. You should see about 11,500 rows, growing by a few every five minutes.</div>

<div class="g-step"><span class="n">13</span><div><small>Part 2 · the data</small><h2 id="step-13">Weather on the dashboard, and the join</h2></div></div>

**A map tile.** Open the dashboard, click **Add visual**, type **Map** and choose it. Paste the query, **Run**: the 17 cities appear on a world map, coloured by their weather. Name the tile, **Apply**, save.

<div class="g-where"><b>KQL</b><span>Paste into the tile's Query editor, then Run</span></div>
{% raw %}
```kusto
WeatherLive
| where IntervalMin == 15 and ReadingTime > ago(1h)
| summarize arg_max(ReadingTime, *) by City
| project Longitude, Latitude,
          Weather = iff(RainRate >= 0.4, "Raining now", iff(TempC < 5, "Cold", iff(TempC > 26, "Hot", "Mild"))),
          Size = iff(RainRate >= 0.4, 3.0, 1.0)
```
{% endraw %}

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/ui-34-map-tile.webp' | relative_url }}" alt="The tile editor with the Map visual: the cities on a world map" loading="lazy"></figure>

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/ui-35-dashboard-weather.webp' | relative_url }}" alt="The dashboard with two tiles: orders per minute by region, and the weather map" loading="lazy"><figcaption><strong>Both worlds on one page.</strong> On the left you can still see my test from step 7: North America at zero for ten minutes, and back.</figcaption></figure>

**The join.** Every order has a city and a time. Every reading has a city and a time. Put them side by side, hour by hour:

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/e-one-answer-two-tables.webp' | relative_url }}" alt="One answer from two tables: orders and weather joined on city and hour" loading="lazy"></figure>

<div class="g-where"><b>KQL</b><span>Try it in the query editor</span></div>
{% raw %}
```kusto
// Rain jackets sold per hour in every city: rainy hours next to dry hours (28 days).
let weather = WeatherLive
    | where IntervalMin == 60
    | project City, Hour = ReadingTime - 1h, Rainy = RainRate >= 0.4;
weather
| join kind=leftouter (
    OrdersLive
    | where Product == "Storm Shell Jacket"
    | summarize Units = sum(Quantity) by City, Hour = bin(OrderTime, 1h)
  ) on City, Hour
| summarize Hours = count(), JacketsPerHour = round(avg(coalesce(Units, 0)), 2) by City, Rainy
| order by City asc, Rainy asc
```
{% endraw %}

In my database this returned, for example, Auckland: 6.3 jackets an hour in dry hours and 16.8 in rainy ones. Berlin: 8.1 and 22.4. That is the planted pattern, found by a plain query.

Two details in that query: it starts from the weather rows and uses a left outer join, so the hours with no jacket sold still count as zero. And it compares **per hour**, never totals, because there are far more dry hours than rainy ones.

<div class="g-step"><span class="n">14</span><div><small>Part 2 · the watching</small><h2 id="step-14">Teach both agents about weather</h2></div></div>

**The Fabric data agent.** Open `Aurora Live Agent`, tick the table **WeatherLive**, click **Agent instructions**, paste the text below, and **Publish** again.

<div class="g-where"><b class="txt">Text</b><span>Paste into Agent instructions</span></div>
{% raw %}
```text
You answer questions about Aurora Outdoor's online store (a simulated demo store) from two tables in the AuroraLive KQL database. Every number in an answer must come from a query. Always state the time window you used. All times are UTC.

OrdersLive: one row per order (OrderTime, Product, Category, Region, City, Quantity, SalesAmount, PaymentMethod, Channel). It holds about 28 days of history plus orders arriving right now.

WeatherLive: REAL weather readings for the store's 17 cities (source: Open-Meteo). One row per city per reading.
- IntervalMin == 60: hourly history. ReadingTime is the END of the hour the reading covers.
- IntervalMin == 15: readings arriving now. Each covers the 15 minutes before ReadingTime.
- RainRate is millimetres per hour in both kinds of row. Raining means RainRate >= 0.4. Heavy rain means RainRate >= 2.
- Cold means TempC < 5. Hot means TempC > 26. Condition is the weather in words.

How to work with the weather:
- The weather in a city now: the latest reading, WeatherLive | where ReadingTime > ago(2h) | summarize arg_max(ReadingTime, *) by City.
- Weather and orders in the history: summarize OrdersLive by City and Hour = bin(OrderTime, 1h), and join to WeatherLive | where IntervalMin == 60 | extend Hour = ReadingTime - 1h, on City and Hour. Keep the hours with no orders of a product as 0 (start from the weather rows).
- Compare orders PER HOUR in rainy hours and in dry hours of the same city (or cold and not cold). Never compare totals: dry hours are far more numerous.
- "What does rain usually do in <city>": for the last 28 days give the average orders per hour of each product in rainy and in dry hours of that city, the ratio, and how many rainy hours that is based on. Name the products whose ratio stands out.
- "What to expect": the usual orders per hour in that weather, next to what the last 30 to 60 minutes actually show.
- The store's shoppers are simulated and were built to react to weather, so say what the data shows and do not present it as a discovery about real customers.
```
{% endraw %}

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/16-agent-instructions.webp' | relative_url }}" alt="The data agent with both tables ticked and the agent instructions pane open" loading="lazy"><figcaption><strong>The data agent, with weather.</strong> (1) Both tables ticked. (2) The Agent instructions button. (3) What a reading is, what counts as rain, and how to join the two tables.</figcaption></figure>

<div class="g-box warn" markdown="1">
### Wait about ten minutes

Right after the change, the agent answered that the new table "isn't accessible" and its queries failed. Ten minutes later the same question worked.
</div>

**Then the agent in Teams.** I expected it to just use the new data. It did not:

<figure class="g-shot chat"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/17-teams-before.webp' | relative_url }}" alt="The Teams agent answering that it cannot tell where it is raining because it has no weather data" loading="lazy"><figcaption><strong>Before.</strong> "I can't tell you where it's raining. My only data source is Aurora's live orders." The Fabric agent already knew the weather table. The Copilot Studio agent was still working from the description it got when the tool was added.</figcaption></figure>

The fix: add these lines to its instructions in Copilot Studio, and publish it again.

<div class="g-where"><b class="txt">Text</b><span>Add to the Copilot Studio agent's instructions</span></div>
{% raw %}
```text
The Aurora Live Agent tool also has real weather readings for the store's 17 cities (temperature and rain, right now and for the last 28 days). For any question about weather, rain or temperature, call the tool; never say you have no weather data. When an alert says rain started in a city, use the tool to report what rain usually does to orders in that city (orders per hour in rainy hours against dry hours, by product), what the last hour shows, and what to expect in the next hour.
```
{% endraw %}

<figure class="g-shot chat"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/19-teams-after.webp' | relative_url }}" alt="The Teams agent&#x27;s answer after the fix: rain jackets per hour in dry and rainy hours for three cities" loading="lazy"><figcaption><strong>After.</strong> Rain in three cities, and rain jackets per hour over 28 days, dry against rainy: Vancouver about 3.4 times more, Singapore 2.3, Sao Paulo 3.5. The full answer took 74 seconds. The rainy-hour numbers are exact. The dry-hour ones ran a little high, because its query dropped the hours with no jacket sold at all, which is exactly what the instruction about starting from the weather rows is for.</figcaption></figure>

<div class="g-step"><span class="n">15</span><div><small>Part 2 · the watching</small><h2 id="step-15">The second rule: rain started</h2></div></div>

A question is nice. Being told is better. The second rule is built exactly like the first one in step 7, with a different query.

The query returns a city only in the minute rain started there: a rainy reading just arrived, and no reading in the 30 minutes before it was rainy. Looking back 30 minutes keeps a drizzle that flickers on and off from firing again and again.

**1.** Query editor, Ctrl+A, paste, **Run**. Then **Add alert**.

<div class="g-where"><b>KQL</b><span>Paste into the query editor, then Run</span></div>
{% raw %}
```kusto
// Returns a city only in the minute rain started there:
// a rainy reading arrived in the last minute, and no reading in the 30 minutes before it was rainy.
let fresh = WeatherLive
    | where IntervalMin == 15 and ingestion_time() > ago(1m) and RainRate >= 0.4
    | summarize arg_max(ReadingTime, RainRate, TempC) by City;
let alreadyWet = WeatherLive
    | where IntervalMin == 15 and ReadingTime > ago(31m) and ingestion_time() <= ago(1m) and RainRate >= 0.4
    | distinct City;
fresh
| join kind=leftanti alreadyWet on City
| project City, RainRate, TempC
```
{% endraw %}

**2.** Name the rule `Rain started in a city`, every **1 minute**, tick **City** and **RainRate** under *Context*, and save it into the **same** Activator item, `AuroraOrdersWatch`.

<figure class="g-shot"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/ui-36-rain-rule.webp' | relative_url }}" alt="The Add rule pane for the rain rule, next to its query" loading="lazy"></figure>

**3.** To send the rain alert to the agent too, repeat step 9 with a second custom action and a second flow. Its message:

<div class="g-where"><b class="txt">Text</b><span>The message of the second flow. Put the City field where it says so</span></div>
{% raw %}
```text
Alert from Fabric: rain started in (the City field). Check what rain usually does to our orders in that city, and tell me what to expect in the next hour.
```
{% endraw %}

Both rules now sit in one place. The switches stop and start each one.

<figure class="g-shot small"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/ui-37-two-rules.webp' | relative_url }}" alt="The Rules pane with both rules and their on/off switches" loading="lazy"></figure>

<div class="g-step"><span class="n">16</span><div><small>Part 2 · the result</small><h2 id="step-16">A real rain alert</h2></div></div>

You cannot order rain for a test. On the day I recorded the video, the forecast said Seattle, a quarter to six, a light drizzle right on the threshold. I started watching the chat a few minutes early and typed nothing. These screenshots are from that recording.

<figure class="g-shot chat"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/21-teams-rain-alert.webp' | relative_url }}" alt="The agent&#x27;s answer to the rain alert: rain usually more than triples sales of the rain jacket in Seattle" loading="lazy"><figcaption><strong>The rain alert, answered.</strong> The reading turned to drizzle, and 49 seconds later the message was in the chat. 108 seconds after that: "In Seattle, rain usually more than triples sales of the Storm Shell Jacket, and barely moves anything else", with every product, dry hours against rainy hours (11.25 to 38.63 units an hour for the jacket: exact). It also said the rain was "just at the point where the data counts the city as rainy", so the increase might not happen. That is the caveat I would want from a person.</figcaption></figure>

Then the question a business actually asks:

<div class="g-where"><b class="txt">Text</b><span>A follow-up question</span></div>
{% raw %}
```text
So what should I put at the top of the home page for Seattle shoppers right now?
```
{% endraw %}

<figure class="g-shot chat"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/22-teams-home-page.webp' | relative_url }}" alt="The agent&#x27;s suggestion for the top of the home page for Seattle" loading="lazy"><figcaption><strong>39 seconds:</strong> the jacket in the main spot, the warm base layer next to it, the water bottle moved down, and a warning that this is only twenty minutes of orders. From a weather reading to a decision, in one sentence.</figcaption></figure>

<div class="g-box" markdown="1">
### A bonus I did not plan

While I was building part 2, my store stopped by mistake. All four regions went silent at once, and the outage rule fired four times. When I looked at the chat, the agent had written a summary of the day's alerts by itself, and its last line was not "four outages". It was: **"Data feed stalled. Every region was normal until then."** It was right. I had broken it.
</div>

<figure class="g-shot chat"><img src="{{ '/assets/blog/fabric-real-time-alert-agent/23-teams-data-feed-stalled.webp' | relative_url }}" alt="The agent&#x27;s own summary table of the day&#x27;s alerts, ending with &#x27;Data feed stalled&#x27;" loading="lazy"></figure>

## The numbers I measured
{: #numbers}

<div class="g-table" markdown="1">

| What | Time |
|---|---|
| Order sent → ready to query in the Eventhouse | About 3 seconds |
| A notebook session starting | 20 to 40 seconds |
| 28 days of history (811,000 orders), one statement | 7 seconds |
| A test question to the Fabric data agent | 11 seconds |
| Region stops → the rule fires (10 minute window) | 10 minutes 34 seconds |
| Weather reading turns rainy → alert message in the chat | 49 seconds |
| A question to the agent in Teams → the full answer | 40 to 75 seconds |
| A change to the data agent → the change actually working | About 10 minutes |

</div>

## What went wrong, and the fix
{: #troubleshooting}

<div class="g-table" markdown="1">

| What you see | What it was | The fix |
|---|---|---|
| The Eventstream destination shows a triangle: "No input source is configured" | It is not connected | Drag from the stream's dot to the destination |
| The triangle then says "Add a mapper to map schema" | Fabric has not seen an event yet | Ignore it and publish: the field names match the columns |
| The notebook stops with "Paste the connection string..." | The placeholder is still in the first cell | Paste the connection string between the quotes, Run all |
| Add alert is grey | No query has run in this editor yet | Run the query once |
| A KQL command returns a bare "bad request" | A column was called `last` or `first` | Use another name |
| Four alerts at once, for every region | The store had stopped | Stop the rule before you stop the store |
| Copilot Studio: "Dataverse isn't set up", or the agent type "isn't included in your license" | The default environment | A new environment with Dataverse, linked to a pay-as-you-go billing plan |
| The billing plan does not list your environment | They are in different regions | Create both in the same region |
| The flow saves but cannot run | The Activator trigger is a premium connector | Switch the flow's plan to Copilot Studio |
| "We couldn't find your bot" | Posting a Teams message *as* the agent | Post as User, into the chat with the agent |
| The Teams agent says it has no weather data | It keeps the tool description from the day the tool was added | Say it in the agent's own instructions and publish again |
| The data agent says a new table "isn't accessible" | The change has not reached the query generator yet | Wait about ten minutes |
| The agent's answer changes after you thought it was done | It posts an interim reply first, then the full one | Wait for the final message before you judge the answer |

</div>

## Costs and clean-up
{: #clean-up}

- **The Fabric capacity** bills for every hour it is on. Pause it when you stop working.
- **The notebook** uses the capacity while it runs. It stops by itself after two hours; stop it earlier with Interrupt kernel.
- **Stop the rules** when you are not testing. Every real rain start in one of the 17 cities posts in your chat and uses credits.
- **Copilot Studio**, pay-as-you-go, was about one cent per Copilot credit when I recorded this. A question to the agent cost me one to two credits. A flow on the Copilot Studio plan is billed in the same credits.
- **Do not pause and resume the capacity back to back.** After doing that, my published data agent returned authorization errors for twenty minutes while the draft worked.
- **To remove everything**: delete the items from the workspace (or the whole workspace), the agent and the flow in their environment, and the billing plan if you made it only for this.

<div class="g-box" markdown="1">
### How this guide was checked

Steps 1 to 7 and the Fabric parts of part 2 were built from zero in an empty workspace, by clicking, exactly as written here, and the screenshots are from that build. The rule in step 7 was tested with a staged outage: it fired once. The rain rule in step 15 was created the same way and ran for 45 minutes without a false alert, but no rain started in the 17 cities in that time, so I did not see it fire; the rain alert in the video came from a rule with the same logic that was created by a script. Steps 8 to 10, and the Teams screenshots, are from the build you see in the videos, where the rule was created by a script; I say so where a field is named differently.

The fast path was built from zero three times: once from my PC with a stand-in for the notebook's sign-in, once as a notebook run inside Fabric in an empty workspace (under three minutes), and once by clicking **Run all** on a workspace that was already built (seven seconds, nothing changed). The screenshots in that section are from the second build. I started the orders rule the notebook made and saw it fire in the rule's history; I did not see its rain rule fire.
</div>

<div class="g-box ok" markdown="1">
### Where to go from here

The pattern is the same for any events: something comes in, a rule watches it, and somebody gets a message they can answer. A machine that stops sending measurements. Support tickets about one product that suddenly double. A city with no delivery scans for twenty minutes. Swap the orders for your own events, and the weather for the outside feed that matters to you: prices, traffic, exchange rates.

The files are here: [part 1](https://github.com/Shai-Kr/pbi101-youtube/tree/main/videos/11-live-orders-alert/in_fabric) and [part 2](https://github.com/Shai-Kr/pbi101-youtube/tree/main/videos/12-weather-joins-orders/in_fabric). The same repository also holds the scripts I used to build the version in the videos.
</div>

<script>
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.article-body pre').forEach(function (pre) {
    var host = pre.closest('div.highlighter-rouge') || pre;
    if (host.classList.contains('g-code')) return;
    host.classList.add('g-code');
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'g-copy'; b.textContent = 'Copy';
    b.setAttribute('aria-label', 'Copy to clipboard');
    b.addEventListener('click', function () {
      var text = pre.innerText.replace(/\s+$/, '');
      var ok = function () { b.textContent = 'Copied'; b.classList.add('done'); setTimeout(function () { b.textContent = 'Copy'; b.classList.remove('done'); }, 1600); };
      if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(ok); }
      else { var t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); ok(); }
    });
    host.appendChild(b);
  });
  var closeZoom = function () { var z = document.querySelector('.g-zoom'); if (z) z.remove(); };
  document.querySelectorAll('.g-shot img').forEach(function (img) {
    img.addEventListener('click', function () {
      closeZoom();
      var z = document.createElement('div');
      z.className = 'g-zoom';
      var big = document.createElement('img');
      big.src = img.src; big.alt = img.alt;
      z.appendChild(big);
      z.addEventListener('click', closeZoom);
      document.body.appendChild(z);
    });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeZoom(); });
});
</script>
