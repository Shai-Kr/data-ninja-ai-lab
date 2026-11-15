---
layout: post
title: "I Put a Power BI Dashboard in VR. Here's What Fabric Apps Change."
date: 2026-11-15
author: Shai Karmani
author_url: https://www.linkedin.com/in/shai-kr
categories: [Microsoft Fabric, Power BI, Fabric Apps, AI Agents]
tags: [microsoftfabric, powerbi, fabricapps, semanticmodel, vr, webxr, aiagents, dataagent]
description: "A room you can walk around in, built on a real Power BI semantic model. The story of how it was made, what a Fabric App really is, how an AI agent built a simple one from a single prompt, and why I think the screen is now yours."
image: /assets/blog/power-bi-dashboard-in-vr/00-hero-room.webp
---

<style>
@media (max-width: 760px) {
  .site-shell { width: min(100% - 24px, var(--max)); }
  .site-header { gap: 12px; margin-bottom: 18px; }
  .nav { display: none; }
  .article { max-width: 100%; overflow-x: hidden; }
  .article-header { padding: 20px 14px; border-radius: 18px; }
  .article-header h1 { font-size: clamp(1.12rem, 5vw, 1.6rem); line-height: 1.17; }
  .article-body { overflow-x: hidden; font-size: 0.98rem; }
  .article-body img { width: 100%; max-width: 100%; height: auto; border-radius: 16px; }
  .article-body pre { max-width: 100%; overflow-x: auto; font-size: 0.78rem; }
  .subscribe-orbit { display: none; }
}
.vr-shot { width: 100%; max-width: 100%; margin: 30px 0 8px; overflow: hidden; }
.vr-shot img { display: block; width: 100%; max-width: 100%; height: auto; border-radius: 16px; }
.vr-shot figcaption { font-size: 0.86rem; opacity: 0.75; margin-top: 8px; text-align: center; }
.vr-links { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin: 22px 0 30px; }
.vr-links a { display: block; padding: 14px 16px; border-radius: 14px; border: 1px solid rgba(120,190,255,0.35); text-decoration: none; }
.vr-links a b { display: block; margin-bottom: 4px; }
.vr-links a span { font-size: 0.88rem; opacity: 0.8; }
</style>

It started as a silly question. Microsoft Fabric has a new kind of item, a Fabric App, that hosts your own web application next to your data. A web application can be anything. So could it be a room? Could I put on a headset, open a browser, sign in to Fabric, and stand inside my Power BI numbers?

It could. The first test worked on the first evening, far better than I expected. And then it turned into a real project.

<figure class="vr-shot"><img src="{{ '/assets/blog/power-bi-dashboard-in-vr/00-hero-room.webp' | relative_url }}" alt="A VR room with three floating glass boards showing revenue by region, by month and by product, Saturn with a ring of months above them, and two hand controllers in front"><figcaption>The room. Every number in it comes from a Power BI semantic model.</figcaption></figure>

{% include yt-embed.html id="wNoeba0Glvs" title="I Put My Power BI Dashboard in VR (Fabric Apps Guide)" duration="16:09" kicker="Watch the video: the full guide, then the room" %}

<div class="vr-links">
<a href="https://github.com/Shai-Kr/pbi101-youtube/tree/main/videos/13-fabric-apps-vr"><b>The materials</b><span>The prompts, the whole VR room project and the install steps</span></a>
<a href="https://youtu.be/wNoeba0Glvs"><b>The video</b><span>Part one: Fabric Apps, step by step. Part two: the room</span></a>
<a href="https://github.com/Shai-Kr/pbi101-youtube/tree/main/videos/09-copilot-build-report"><b>The semantic model</b><span>Aurora Sales, a small synthetic model, as a Power BI project</span></a>
</div>

This article is the thinking behind the video. What a Fabric App is, how a simple one gets built, why I took it somewhere strange, and what I learned on the way.

## Two things are changing

The first is how we build. You describe what you want and an AI agent writes the code. Work that took a team a few weeks can take one person an afternoon. That's not a slogan anymore; in the video you watch it happen in fourteen minutes.

The second is how we look at data. A while ago I showed [how to talk to your Power BI data by voice](https://youtu.be/8n7tPQphRkA). No report at all. You just ask. So a report page is not the only way anymore.

Put the two together and something shifts. For years the question was "which visual do I pick from the pane?" Now the question is "what should this screen be?" And you can answer it any way you like.

A Fabric App is where that answer lives.

## What a Fabric App really is

It's an item in your workspace. It sits next to your reports and your semantic models. But inside it there's a web application that you wrote. Well, you, or your AI.

Fabric gives that application four things:

- **A home.** Fabric hosts it and gives it an address.
- **A door.** People sign in with the same account they use for Power BI. You never build a login page.
- **Your data.** The app can ask a semantic model a question in DAX, or work with a warehouse, a database or a lakehouse.
- **A back room.** Its own database if it needs to save things, and small functions on the server if it needs to do something privately.

<figure class="vr-shot"><img src="{{ '/assets/blog/power-bi-dashboard-in-vr/02-what-fabric-gives.webp' | relative_url }}" alt="Four cards: a home (hosting), a door (sign in), your data (connectors), a back room (its own database and functions). You bring the screen, Fabric brings everything behind it." loading="lazy"><figcaption>You bring the screen. Fabric brings everything behind it.</figcaption></figure>

The part I care about most is security. When the app asks the model for numbers, it asks **as the person who signed in**. Not as some hidden super user. The permissions you already set on the model still decide what each person gets. You don't rebuild security. You inherit it.

And the cost? There's no separate price tag. The app runs on the capacity the workspace already sits on, and every question it sends to the model is a normal query, just like a report would send. One thing to remember: it only works while that capacity is running.

## A simple one first, built by an AI

Before the headset, the basics. I didn't want to start with the crazy thing, because the crazy thing hides how simple the path is.

One command creates an empty project. The project comes with its own instructions for AI agents, written by Microsoft: how to connect to a semantic model, how to write the DAX, how to design the page, how to deploy. Then I typed one prompt:

```text
Turn this new project into a simple Fabric App called Aurora Pulse. One page: three big numbers for 2026 (revenue,
orders and margin percent) and a bar chart of revenue by region. Take the numbers from my Power BI semantic model
"Aurora Sales" in the workspace "pbi101". When it works, deploy it to that same workspace and give me the link.
Don't open a browser to test it, I'll check it myself.
```

Fourteen minutes later there was a new item in my workspace, of type App.

<figure class="vr-shot"><img src="{{ '/assets/blog/power-bi-dashboard-in-vr/03-aurora-pulse.webp' | relative_url }}" alt="The simple app inside Fabric: revenue 9.56 million dollars, 4,485 orders, 45.1 percent margin, and a bar chart of revenue by region" loading="lazy"><figcaption>Aurora Pulse, inside Fabric. Same model as my report, same numbers.</figcaption></figure>

What I liked is how the agent worked. It wrote the DAX, and before it drew a single screen it ran the query against the real model and checked that the regions add up to the total. At the end it told me what it had checked and what it had not: it never opened the app in a browser. That part was mine.

And I did check. I compared its numbers with my report before I trusted them. The AI did the typing. The result is still yours.

## From a page to a room

A page with three numbers is nice. But the app is your code, so nothing says it has to look like a report at all. Same model. Same sign in. So I asked how far it could go.

The room asks the semantic model **one DAX query** when it opens: revenue, cost, orders and units by year, month, region, category and product. About a thousand rows. Everything you do inside is worked out from those rows in the browser, so the room answers instantly.

It starts with three boards, because people need something familiar. Then come the things only a room can do.

<figure class="vr-shot"><img src="{{ '/assets/blog/power-bi-dashboard-in-vr/05-saturn.webp' | relative_url }}" alt="Saturn above the boards, with a ring made of twelve pieces, one per month, each labelled with its revenue" loading="lazy"><figcaption>Saturn is the company. Its ring is the year, one piece per month. The light in the sky is this year against last year.</figcaption></figure>

**A filter can be a place.** The regions are planets. Size is share, speed is growth. Point at one, press a button, and you're inside it: the wall says so, and every board around you shows that region only. A drill down, by walking into something.

<figure class="vr-shot"><img src="{{ '/assets/blog/power-bi-dashboard-in-vr/06-inside-a-region.webp' | relative_url }}" alt="Inside North America: a sign on the wall says INSIDE NORTH AMERICA, and the boards show that region only" loading="lazy"></figure>

**A question can be something you throw.** There's a shelf of balls (measures, regions, products) and a basket. Throw in Revenue, Europe and Asia Pacific, and the basket builds the comparison. No query. No visual pane. Three balls.

<figure class="vr-shot"><img src="{{ '/assets/blog/power-bi-dashboard-in-vr/07-basket.webp' | relative_url }}" alt="The basket's answer: two tall columns, Europe 5.74 million and Asia Pacific 3.46 million, with a label saying Europe is 66 percent above Asia Pacific" loading="lazy"></figure>

**A comparison can have weight.** Put North America on one pan of the scales and Latin America on the other, and it tips. Change the measure on top, and it weighs them again. You don't just see that one is four times the other. You feel it.

<figure class="vr-shot"><img src="{{ '/assets/blog/power-bi-dashboard-in-vr/08-scales.webp' | relative_url }}" alt="A pair of scales with North America on one pan and Latin America on the other, tipped, and a board above showing 3,875 orders against 923" loading="lazy"></figure>

**And the room can talk to an agent.** The guide (that's me, on a small projector) answers quick questions from the numbers already in the room. But one button sends your question to a published Fabric data agent, and half a minute later the answer is hanging in the air.

<figure class="vr-shot"><img src="{{ '/assets/blog/power-bi-dashboard-in-vr/10-data-agent.webp' | relative_url }}" alt="The answer from the Fabric data agent above the guide: Europe had the strongest growth, 32.1 percent, with the numbers for every region" loading="lazy"><figcaption>A question typed inside the room, answered by a Fabric data agent.</figcaption></figure>

The entry is the part people don't expect. There's no app to install on the headset. I opened the browser of a Quest 3, pasted the address, got the regular Fabric sign in, and pressed Enter VR.

<figure class="vr-shot"><img src="{{ '/assets/blog/power-bi-dashboard-in-vr/04-quest-browser.webp' | relative_url }}" alt="The room as a normal web page in the browser of a Quest headset, with an Enter VR button" loading="lazy"><figcaption>It's a web page. That's the whole trick.</figcaption></figure>

## What the headset taught me

The first version made me dizzy. I mean it. A few things I'd tell anyone who tries this:

- **Move slowly.** No jumps and no sudden turns. Glide like a slow walk, turn smoothly.
- **Make everything big.** Text that looks fine on a monitor is unreadable in a headset.
- **Let people act from where they stand.** Squeeze, and the ball flies to your hand. Nobody wants to walk to a shelf.
- **Answer with a picture, not a sentence.** The basket used to print a line of text. Now it builds two columns you can't miss.
- **Explain at the door.** The first thing you see is a board with every control on it.

None of that is about Fabric. It's about respecting the person inside.

## The honest part

- Fabric Apps are a preview. Expect things to change, and check whether your region has them.
- The model is synthetic and the room was built for that one model. On yours it needs a different query and different labels.
- The data agent takes about thirty seconds, and it answers in the fiscal year of its own instructions.
- This doesn't replace a report. A report is still the fastest way to explore data, and it takes no code. An app is for the moment a report page is not enough.
- Most of the room in the video is shown from a desktop browser, where the same app runs with drawn controllers. The entry was recorded on the headset.

## Do it yourself

Everything is in the materials: the prompts for the simple app, the whole room as a Fabric App project, and the install steps. In short:

1. A workspace on a Fabric capacity, with the admin switch **Enable Fabric App items (preview)** turned on.
2. Publish the Aurora Sales model to your workspace.
3. Download the project, run `npm install`, and put two ids in one file so the app knows where your model is.
4. `npx rayfin up`. It signs you in, creates the App item and prints the address.
5. Open the address. In a headset, press Enter VR.

No headset? The room runs in a normal browser, with the mouse standing in for a controller.

<div class="vr-links">
<a href="https://github.com/Shai-Kr/pbi101-youtube/tree/main/videos/13-fabric-apps-vr"><b>Get the materials</b><span>Prompts, project, install steps, controls</span></a>
<a href="https://youtu.be/KOMo49vQUAc"><b>Build the data agent</b><span>The agent the room talks to, in a video of its own</span></a>
<a href="{{ '/blog/2026-11-02-fabric-action-hub.html' | relative_url }}"><b>The practical side of Fabric Apps</b><span>From insight to action in one place</span></a>
</div>

## Why a room

I know. VR is not the first thing that comes to mind for a dashboard. That's exactly the point.

A Fabric App gives you almost total freedom. The sign in, the security and the model stay in Fabric. The screen is yours. From here on, our imagination is the only real limit on how we show data. We're not tied to a dashboard anymore.

Think about people who take in information differently. People for whom a flat screen is hard to work with. Jobs where your hands and your eyes are busy somewhere else. A room is one answer. Voice was another. Yours might be a planning page, a small portal for one team, or something nobody has a name for yet.

VR is only one example. Get out of the box.

## Sources

- [Fabric Apps overview](https://learn.microsoft.com/fabric/apps/overview)
- [Bring insights and action together with Fabric Apps in Org apps](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blog/Bring-insights-and-action-together-with-Fabric-Apps-in-Org-apps/ba-p/5377690)

---

Written by **[Shai Karmani](https://www.linkedin.com/in/shai-kr)**.

If you work on Microsoft Fabric, Power BI, data engineering, or practical AI systems, feel free to [connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr).
