---
layout: post
title: "Power BI Semantics Can Travel Further With Apache Ossie"
description: "A practical acceptance model for exchanging semantic metadata across Power BI, Microsoft Fabric, Snowflake, AI agents, and analytics tools with Apache Ossie."
date: 2026-09-30
author: Shai Karmani
author_url: https://www.linkedin.com/in/shai-kr
sitemap: false
---

**Review draft. Direct link only. Not listed on the blog.**

Microsoft and Snowflake have committed to Apache Ossie, an incubating Apache project for exchanging semantic metadata across analytics, AI, and BI platforms.

The promise is easy to understand: define business meaning once, then reuse it across tools.

That could be a major upgrade for teams running Power BI and Snowflake together. Revenue, margin, active customer, product hierarchy, and model relationships should not need to be rebuilt from memory every time another platform or agent needs them.

The first Microsoft conversion scenario is already concrete. An Ossie document can be converted into both a Snowflake Semantic View and a Power BI semantic model. The Microsoft converter also supports the other direction, turning a Power BI `model.bim` or TMDL document into Ossie JSON or YAML.

This is not universal semantic portability yet. Apache Ossie is incubating, some Power BI constructs do not have portable equivalents, and DAX still needs its own validation path.

That is exactly why this announcement is useful now. Teams can start treating semantic metadata as an exchange contract, with explicit acceptance tests instead of assuming that a successful conversion preserved business meaning.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/apache-ossie-power-bi-semantic-portability/01-semantic-exchange-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/apache-ossie-power-bi-semantic-portability/01-semantic-exchange.svg' | relative_url }}" alt="Power BI and Snowflake reuse semantic metadata through an Apache Ossie exchange document while source data remains in place.">
</picture>

## What Apache Ossie changes

Most organizations already have a semantic layer. They usually have several.

A Power BI semantic model contains measures, fields, relationships, formats, hierarchies, security roles, and business language. A Snowflake team may define similar logic in Semantic Views. A dbt project may hold related definitions again. AI agents add another consumer that needs the same meaning.

The technical problem is not only duplication. The larger problem is drift.

Two definitions can use the same label and return different numbers. A metric can keep its formula but lose its relationship behavior. A model can move successfully while security, formatting, translations, or calculation details stay behind.

Apache Ossie provides a JSON and YAML specification that tools can read and write. Its core model includes datasets, fields, relationships, metrics, expressions, and related semantic metadata. Converters translate between Ossie and platform-specific formats.

Microsoft says its current collaboration with Snowflake focuses on cross-platform semantic-layer conversion without moving or duplicating the underlying data. Microsoft also plans to help establish DAX as an Ossie-recognized query language and advance support for ontologies.

The useful architectural separation is this:

- the data stays where the chosen platform reads it;
- the semantic contract becomes exchangeable;
- each target engine still evaluates its own supported expressions and behavior;
- platform-specific details need preservation, mapping, or an explicit exception.

That is a better model than pretending every platform has identical semantics.

## Start with the Microsoft converter boundary

The Apache Ossie Microsoft converter provides an honest view of what portability means today.

It maps core Power BI structures into Ossie:

- model name and description;
- tables to datasets;
- columns to fields;
- measures to metrics;
- relationships;
- data types and selected key or time semantics;
- DAX and SQL expressions with their dialect identified.

It deliberately does not rewrite DAX into SQL. That is the right decision. DAX depends on filter context and has evaluation behavior that cannot be preserved safely through a casual language translation.

The converter also reports constructs it cannot carry into the vendor-neutral model faithfully. Power BI-specific details can be preserved in a `POWER_BI` custom extension for round trips back to Power BI, but another consumer will not automatically understand them.

Examples include row-level security roles, perspectives, cultures, hierarchies, calculation groups, incremental refresh policies, KPIs, and some relationship types.

That creates three categories for every model:

1. **Portable core:** semantics another tool can read directly from the Ossie document.
2. **Preserved extension:** platform details retained for a Power BI round trip but not represented as portable semantics.
3. **Conversion exception:** a construct that needs redesign, manual mapping, or a decision not to exchange it.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/apache-ossie-power-bi-semantic-portability/02-portability-boundary-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/apache-ossie-power-bi-semantic-portability/02-portability-boundary.svg' | relative_url }}" alt="Semantic portability boundary separating portable core metadata, Power BI preserved extensions, and conversion exceptions.">
</picture>

A model is not portable because a file was produced. It is portable when the receiving platform can reproduce the approved business answers and the team understands every exception.

## Use strict conversion as the first gate

The Microsoft converter includes a `--strict` mode. It exits with a failure when something could not be converted faithfully, while still writing the output so the team can inspect it.

That is the mode I would use in an automated pipeline.

```bash
ossie-microsoft import \
  --strict \
  -i model.bim \
  -o semantic-model.yaml
```

A warning should not disappear inside a build log. It should become a review item with an owner and a disposition:

- accepted as Power BI-only behavior;
- mapped deliberately in the target platform;
- redesigned into a portable construct;
- excluded from this exchange scenario;
- blocked because it changes an approved business definition.

This turns converter output into architecture evidence instead of build noise.

## Validate structure and engine behavior separately

The converter can validate a generated `model.bim` against Microsoft's Tabular Object Model offline when the optional TOM components are installed. That checks model structure and object references.

It does not compile DAX.

The converter documentation is explicit about that boundary. Engine validation is the step that deploys a generated model to a Fabric workspace, refreshes it so the engine compiles DAX, evaluates tables and measures, then deletes the temporary item.

That test consumes real capacity and creates real Fabric items, so it is opt-in and should run in a controlled validation workspace.

I would keep four proofs separate:

- **Schema proof:** the Ossie document conforms to the specification.
- **Mapping proof:** the converter reported no unapproved loss or approximation.
- **Engine proof:** Power BI can load, refresh, and evaluate the generated model.
- **Business proof:** known questions return the approved results in every target.

The last proof matters most.

A model can be structurally valid and still be semantically wrong. A relationship can point in the wrong direction. A missing security role can expose more data. A format or culture change can confuse users. A measure can compile and still return a plausible but incorrect number.

## Build a semantic portability acceptance suite

Before exchanging a production model, I would create a small test pack around it.

### 1. Inventory the semantic surface

List the datasets, fields, relationships, metrics, hierarchies, cultures, security roles, refresh policies, and platform-specific features in the source model.

Mark each item as portable core, preserved extension, or exception.

### 2. Convert in strict mode

Fail the pipeline on unreviewed conversion warnings. Save the Ossie document, warning report, converter version, and source-model commit together.

### 3. Validate the exchange document

Validate the JSON or YAML against the Ossie schema. Review the diff as semantic code, not as a generated file nobody reads.

### 4. Build each target in isolation

Generate the Power BI semantic model and Snowflake Semantic View in controlled environments. Do not test by replacing a live production model.

### 5. Run known-answer tests

Use a compact set of business questions that exercise:

- base measures;
- filtered measures;
- time intelligence;
- relationship paths;
- null and unknown-member behavior;
- currency and unit handling;
- representative security personas;
- one high-value report or agent question.

### 6. Approve exceptions explicitly

Every difference needs a named owner, business impact, chosen handling, and retest condition. No silent downgrade should reach production.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/apache-ossie-power-bi-semantic-portability/03-acceptance-suite-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/apache-ossie-power-bi-semantic-portability/03-acceptance-suite.svg' | relative_url }}" alt="Six-gate semantic portability acceptance suite from inventory through explicit approval of exceptions.">
</picture>

## Keep one exchange record per model version

A lightweight evidence record is enough:

```text
Model: Commercial Analytics
Source: Power BI semantic model
Source version: 8c217af
Ossie spec version: recorded with artifact
Converter version: recorded with artifact
Portable core: 42 fields, 18 metrics, 7 relationships
Preserved extensions: RLS roles, 2 perspectives, 1 hierarchy
Strict conversion: reviewed
Schema validation: PASS
Power BI engine validation: PASS
Snowflake target validation: PASS
Known-answer tests: 12 of 12 PASS
Exceptions: 3 approved
Owner: Semantic Model Lead
Decision: Approved for pilot
```

This gives the team a repeatable answer to a basic question: what exactly did we prove when we said the model was portable?

## What I would pilot first

I would not begin with the largest enterprise semantic model.

Start with a bounded model that has:

- a small number of well-understood measures;
- simple one-to-many relationships;
- known business owners;
- a reliable source query path in both platforms;
- few platform-specific features;
- an existing set of reconciled report totals.

The goal of the first pilot is not to prove that every Power BI feature can move anywhere. It is to learn where the organization's business semantics are truly shared and where they are coupled to one engine.

That distinction is valuable even if the team never moves the model.

It exposes duplicated definitions, undocumented behavior, and security assumptions that were already creating risk.

## The bigger opportunity for AI agents

AI agents need more than table names and column descriptions. They need approved business concepts, metric logic, relationship context, and clear boundaries around what can be queried or acted on.

A vendor-neutral exchange format can make that context available to more tools without asking every agent team to recreate it.

The hard part remains governance:

- Which model is authoritative?
- Which version may an agent use?
- Which metrics are certified?
- Which security behavior travels with the user or target platform?
- Which target has passed known-answer tests?
- Who approves a semantic change?

Apache Ossie can make semantic metadata easier to exchange. It does not remove the need for semantic ownership.

That is the practical value of this announcement.

Microsoft and Snowflake are not promising that every semantic feature is identical. They are creating a shared surface where business meaning can travel further, while converters and validation expose the boundaries.

For Power BI teams, this is a good time to make semantic models more explicit, testable, and reviewable. The organizations that already treat metrics as code will be in the best position to use an open semantic standard safely.

## Sources

- [Microsoft & Snowflake's Commitment to Apache Ossie](https://community.fabric.microsoft.com/t5/Power-BI-Updates-Blog/Microsoft-Snowflake-s-Commitment-to-Apache-Ossie/ba-p/5369534)
- [Apache Ossie project](https://ossie.apache.org/)
- [Apache Ossie repository](https://github.com/apache/ossie/)
- [Apache Ossie Microsoft Converter](https://github.com/apache/ossie/tree/main/converters/microsoft)
- [Power BI semantic models for AI](https://aka.ms/SemanticModelsForAI)
- [Power BI Updates Blog](https://community.fabric.microsoft.com/t5/Power-BI-Updates-Blog/bg-p/fbc_pbiupdatesblog)
- [Fabric Updates Blog](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blogs/bg-p/fbc_fabricupdatesblogs)

---

**Shai Karmani**<br>
Data, Microsoft Fabric, Power BI, Analytics Engineering, and AI<br>
[Connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr)
