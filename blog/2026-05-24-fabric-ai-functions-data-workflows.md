---
layout: post
title: "Fabric AI Functions Put GenAI Where the Data Work Already Happens"
date: 2026-05-24
author: Shai Karmani
author_url: https://www.linkedin.com/in/shai-kr
categories: [Microsoft Fabric, AI, Data Engineering, Data Science]
tags: [microsoftfabric, ai, dataengineering, datascience, analyticsengineering]
description: "A practical look at Microsoft Fabric AI Functions, what changed recently, and how data teams can use them inside real pandas, Spark, and multimodal workflows."
image: /assets/blog/fabric-ai-functions-data-workflows/01-ai-functions-pipeline.svg
---

![AI Functions in Fabric data workflow](../assets/blog/fabric-ai-functions-data-workflows/01-ai-functions-pipeline.svg)

Microsoft Fabric AI Functions are not just another way to call an LLM.

The useful part is where they run.

They let data teams use generative AI inside pandas and Spark workflows, close to the data engineering and data science work that already happens in Fabric. That matters because many practical AI use cases are not chat experiences. They are enrichment steps.

Classify these support tickets.

Summarize these notes.

Extract fields from these documents.

Translate these records.

Create embeddings for this content.

Compare the meaning of these two text columns.

Those tasks usually sit somewhere between data engineering, analytics engineering, and data science. Fabric AI Functions make that middle layer much easier to build.

## Since when is this available?

The official Microsoft Learn page for Fabric AI Functions currently has a documentation date of **November 13, 2025** and an updated timestamp of **May 7, 2026**.

The GitHub history for the Fabric documentation shows the AI Functions overview page existed by **February 28, 2025**. A later documentation commit on **November 24, 2025** is titled "Update AI Functions documentation for GA release with enhancements." Recent documentation updates in February, March, and May 2026 added more coverage around multimodal input, schema extraction, configuration, providers, and file workflows.

So the short version is:

- The documentation trail starts in early 2025.
- The GA documentation update appears in November 2025.
- The more interesting expansion for practical teams is the 2026 work around multimodal inputs, broader model/provider configuration, and better workflow support.

Sources:

- [Microsoft Learn: Transform and Enrich Data with AI Functions](https://learn.microsoft.com/en-us/fabric/data-science/ai-functions/overview)
- [MicrosoftDocs Fabric commit history for the AI Functions overview](https://github.com/MicrosoftDocs/fabric-docs/commits/main/docs/data-science/ai-functions/overview.md)

## What is new in practical terms

The basic idea is simple: AI Functions expose common LLM operations as DataFrame-friendly functions.

Microsoft lists functions such as:

- `ai.analyze_sentiment`
- `ai.classify`
- `ai.embed`
- `ai.extract`
- `ai.fix_grammar`
- `ai.generate_response`
- `ai.similarity`
- `ai.summarize`
- `ai.translate`

That list is useful, but the bigger shift is not the names of the functions. It is the workflow.

A data team can now treat AI enrichment as a normal transformation step inside Fabric. The output can become another column, another table, another quality review queue, or another curated dataset used downstream by Power BI, notebooks, semantic models, search, or an AI application.

That is a much cleaner pattern than exporting data to a separate script, calling an external AI workflow, and stitching the result back later.

![Before and after workflow for Fabric AI Functions](../assets/blog/fabric-ai-functions-data-workflows/02-before-after-workflow.svg)

## The multimodal part is where this gets more useful

Text classification is valuable, but many organizations have the same problem in a less convenient format.

PDFs.

Screenshots.

Images.

CSV files.

JSON files.

Markdown notes.

Operational documents that never quite made it into a clean table.

Fabric AI Functions now support multimodal input patterns. Microsoft documents support for image files such as JPG, PNG, GIF, and WebP, documents such as PDF, and common text formats such as MD, TXT, CSV, JSON, and XML.

That opens a better class of Fabric workflows.

Instead of treating documents as a side process, a team can bring them into the lakehouse workflow, use AI to extract or summarize what matters, and store the result in a structured table for review and reporting.

That is where I think this feature becomes more than a demo.

## What you can actually build with it

Here are three practical patterns I would start with.

### 1. Support ticket enrichment

Most support datasets contain useful signal, but the text is messy.

A Fabric notebook can add AI-generated columns for:

- topic classification
- urgency
- sentiment
- short summary
- product area
- likely ownership team

The key is not to pretend the model is perfect. The key is to create a reviewable enrichment layer that helps analysts and operations teams move faster.

A good output table might include the original text, AI-generated labels, confidence or review flags where available, and a human-reviewed status column.

That gives Power BI a better dataset without hiding the uncertainty.

### 2. Document extraction into structured tables

A lot of business data is trapped in semi-structured documents.

Invoices, forms, reports, agreements, field notes, inspection PDFs, and vendor files often contain fields that teams later retype manually.

With AI Functions, the useful pattern is:

1. Store the files in the lakehouse.
2. List file paths as input.
3. Use extraction or generation instructions to pull out the fields.
4. Store the result as a structured table.
5. Review exceptions before the data becomes trusted.

That does not replace proper document processing for every scenario. It does make small and medium internal automation projects much easier to test inside Fabric.

### 3. Embeddings for search and RAG preparation

`ai.embed` is interesting because it turns Fabric into a stronger preparation layer for semantic search and retrieval workflows.

A team can take product documentation, policy files, support resolutions, internal wiki pages, or knowledge base articles and create embeddings as part of the data pipeline.

That creates a cleaner path from raw content to a retrieval-ready dataset.

The important part is governance. The data team still needs to decide what content is approved, what should be excluded, how often embeddings are refreshed, and how downstream AI applications use the result.

![Good use cases for Fabric AI Functions](../assets/blog/fabric-ai-functions-data-workflows/03-use-case-map.svg)

## Where I would be careful

Positive does not mean careless.

AI Functions make enrichment easier, but the usual production questions still matter:

- Which data is allowed to be sent to the model?
- Is the Fabric tenant setting for Copilot and Azure OpenAI enabled intentionally?
- Does the workload require cross-geo processing approval?
- Which Fabric capacity will pay for the work?
- Which model/provider is configured?
- How will output quality be reviewed?
- Which outputs are allowed to flow into reports or user-facing apps?
- How will failures, blanks, and hallucinated values be handled?

Microsoft notes that Fabric AI Functions require a paid Fabric capacity, F2 or higher, or any P capacity. The documentation also states that AI Functions are supported in Fabric Runtime 1.3 and later, and that the default model is `gpt-4.1-mini` unless a different model is configured.

Those details matter. They turn this from a cool notebook feature into a platform decision.

## The right mental model

I would not position AI Functions as a chatbot feature.

I would position them as a data enrichment feature.

That framing makes the architecture clearer.

A normal data pipeline takes raw data, applies transformations, and produces curated data.

An AI-enriched pipeline does the same thing, but one of the transformation steps uses an LLM for work that traditional code handles poorly: language, meaning, summarization, extraction, and classification.

The output still needs engineering discipline.

The pipeline still needs review.

The data still needs ownership.

But the capability is useful because it puts AI closer to the actual work of turning messy business data into something the organization can analyze.

## My take

Fabric AI Functions are a good example of where enterprise AI is heading.

Not every AI feature needs to become a chat window.

Some of the most valuable AI work will happen quietly inside pipelines, notebooks, quality checks, enrichment jobs, and semantic preparation steps.

That is the practical opportunity here.

Take the data you already manage in Fabric. Add AI where language, documents, and meaning slow the team down. Store the result as a governed data asset. Review it before it reaches users.

That is a much better direction than treating AI as a separate island next to the data platform.

**Shai Karmani**  
[Let’s connect on LinkedIn](https://www.linkedin.com/in/shai-kr)
