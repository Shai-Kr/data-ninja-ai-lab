---
layout: post
title: "Power BI Can Search Meaning, Not Just Strings"
description: "A practical rollout and acceptance playbook for Power BI full-text indexing, TEXTCONTAINS, and TEXTSIMILARITY across Import, Dual, and Direct Lake semantic models."
date: 2026-10-01
author: Shai Karmani
author_url: https://www.linkedin.com/in/shai-kr
sitemap: false
---

**Review draft. Direct link only. Not listed on the blog.**

Power BI semantic models are getting a new way to work with text.

The September 2026 Power BI feature summary announced full-text indexing and two new DAX functions: `TEXTCONTAINS` and `TEXTSIMILARITY`. Instead of limiting a search to exact character sequences, a model can use language-aware tokenization, stemming, phrase matching, typo-tolerant matching, and lexical relevance ranking.

That opens useful scenarios for customer feedback, support tickets, incident notes, product descriptions, and knowledge articles. A report can find reviews related to “good breakfast” even when the wording is different. A support dashboard can rank incident summaries by relevance. A product explorer can tolerate small spelling errors.

The opportunity is bigger than adding two DAX functions. This capability adds an index to the semantic model, changes refresh and memory behavior, and makes model culture part of the search contract.

I would roll it out as a semantic-model feature with measurable acceptance gates, not as a clever expression copied into a report.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/power-bi-full-text-search-playbook/01-search-stack-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/power-bi-full-text-search-playbook/01-search-stack.svg' | relative_url }}" alt="Power BI full-text search stack from source text through a persisted index to DAX filtering and relevance ranking.">
</picture>

## Two indexing capabilities solve different jobs

Microsoft announced string indexing and full-text indexing together, but they are not the same feature.

**String indexing** accelerates supported substring operations such as `SEARCH` and `CONTAINSSTRING`. It helps the engine locate character sequences without repeatedly scanning a large string dictionary. It requires compatibility level 1707 or later.

**Full-text indexing** analyzes words and language. It supports the new `TEXTCONTAINS` and `TEXTSIMILARITY` functions. It requires compatibility level 1708 and a persisted full-text index on the searched column.

The distinction matters:

- use string indexing when the question is “does this text contain these characters?”;
- use `TEXTCONTAINS` when the question is “does this text match this word, phrase, or typo-tolerant term?”;
- use `TEXTSIMILARITY` when the question is “which rows are most relevant to this search?”

`TEXTCONTAINS` returns a Boolean value. It supports `TEXTMATCHING`, `FUZZYMATCHING`, and `PHRASEMATCHING` modes.

`TEXTSIMILARITY` returns a floating-point lexical relevance score. That score is useful for ranking rows inside one evaluation. Microsoft is clear that it is not a percentage, probability, or normalized similarity measure. Scores should not be compared across different searches, filter contexts, index generations, columns, or execution plans.

That boundary belongs in the design before anyone builds a KPI from the score.

## Model culture becomes part of search behavior

Full-text search applies language-specific stemming and stop-word removal based on the model culture.

A search for `run` can match `running`, `runs`, and `runner`. Common filler words can be ignored. Phrase matching evaluates analyzed tokens in sequence. Fuzzy matching tolerates a small edit distance.

This is useful, but it means search behavior is not language-neutral.

The supported cultures listed in the DAX documentation receive language-specific analysis. Unsupported cultures fall back to a generic lowercase tokenizer without stemming or stop-word removal. Accent folding is not supported, so `café` does not match `cafe`.

For a multilingual model, I would test every supported business language separately. Model culture should be recorded next to the acceptance results because changing it can change which rows match and how relevance is ranked.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/power-bi-full-text-search-playbook/02-search-contract-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/power-bi-full-text-search-playbook/02-search-contract.svg' | relative_url }}" alt="Search contract separating model culture, match mode, result type, and storage or refresh behavior.">
</picture>

## Choose the index before writing the report

Full-text search requires a persisted index on each searched string column. During preview, Microsoft supports Import, Dual, and Direct Lake. Other storage modes return an error.

The September announcement recommends Full mode during preview. Configuration is through TMDL on the web or XMLA metadata. A dedicated graphical editor is planned for later.

For ordinary string indexing, Microsoft documents four behaviors: `auto`, `full`, `explicit`, and `off`. `Auto` builds lazily for a qualifying query and keeps the index only while the column remains loaded. `Full` builds during processing and persists. `Explicit` gives more control but requires a separate `indexes` refresh through XMLA. `Off` disables indexing.

The operational tradeoff is straightforward:

- persisted indexes improve predictable query performance;
- index construction adds refresh work;
- indexes increase semantic-model size;
- high-cardinality or large Unicode columns can increase memory pressure;
- Direct Lake indexing can delay data visibility when auto-sync is involved;
- older client libraries may not understand the new compatibility level or metadata properties.

Do not enable indexing on every text column. Start with columns that participate in a real search workload and prove the benefit against their cost.

## Build a representative test corpus

Text search is difficult to validate with one happy-path query.

I would create a compact test corpus with rows that deliberately exercise the behavior:

| Test class | Example | Expected proof |
| --- | --- | --- |
| Exact token | `wireless headphones` | Expected rows match |
| Word variation | `run`, `running`, `runs` | Stemming follows model culture |
| Phrase | `noise cancel` | Order and adjacency are respected |
| Typo | `headfone` | Fuzzy mode finds the intended token |
| Stop words | `the`, `and`, `of` | Analyzer behavior is understood |
| Accent | `café` versus `cafe` | Known non-match is recorded |
| Relevance | `good breakfast` | Approved rows rank in the expected order |
| Security | same search under two users | RLS still limits the searchable corpus |

The final line matters. Full-text search should be tested under representative security personas, not only as a model owner. A useful search feature cannot become a shortcut around the model’s existing access rules.

## Keep filtering and ranking separate

A clean pattern is to use `TEXTCONTAINS` to define the eligible set and `TEXTSIMILARITY` to rank that set.

```dax
EVALUATE
TOPN (
    10,
    FILTER (
        FactFeedback,
        TEXTCONTAINS (
            FactFeedback[Comment],
            "delivery delay",
            PHRASEMATCHING
        )
    ),
    TEXTSIMILARITY (
        FactFeedback[Comment],
        "late shipment customer impact"
    ),
    DESC
)
```

The two functions execute independently. Filtering rows with `TEXTCONTAINS` does not change the index scope used to calculate `TEXTSIMILARITY` scores.

For a production report, I would also expose the search text, selected match mode, model refresh time, and a short explanation that relevance is a ranking signal rather than a confidence percentage.

## Use a six-gate rollout

### 1. Select one bounded use case

Pick one text column and one audience. Customer comments, incident summaries, or product descriptions are better pilots than an entire enterprise knowledge estate.

### 2. Record the model contract

Capture storage mode, compatibility level, model culture, indexed column, expected refresh cadence, and the chosen search modes.

Compatibility upgrades need care. Microsoft documents the 1707 upgrade for string indexing as irreversible. Use current tools, test in a copy, and keep the model definition in source control.

### 3. Measure the baseline

Record representative query duration, first-query behavior, warm-query behavior, refresh duration, model size, and capacity memory before indexing.

### 4. Build and validate the index

Apply metadata in a controlled environment. Refresh or process the model as required. Confirm that the target query actually uses an eligible storage and execution path.

### 5. Run semantic acceptance tests

Test exact, word-variation, phrase, fuzzy, accent, language, relevance, empty input, and security cases. Save the approved expected results.

### 6. Compare value with operating cost

Measure query improvement against refresh time, model growth, memory pressure, and data-freshness impact. Promote only if the user-facing gain justifies the model cost.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/power-bi-full-text-search-playbook/03-rollout-gates-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/power-bi-full-text-search-playbook/03-rollout-gates.svg' | relative_url }}" alt="Six-gate rollout from a bounded search use case to measured production approval.">
</picture>

## Save one search acceptance record

A lightweight record makes the decision repeatable:

```text
Model: Customer Experience
Column: FactFeedback[Comment]
Storage mode: Direct Lake
Compatibility level: 1708
Model culture: en-CA
Index mode: full
Search modes: text, phrase, fuzzy
Security personas tested: 3
Baseline query: recorded
Indexed query: recorded
Refresh duration change: recorded
Model size change: recorded
Known-result tests: PASS
Accent behavior: accepted limitation
Owner: Semantic Model Lead
Decision: Approved for pilot
```

This is more useful than saying “full-text search is enabled.” It tells the next engineer what was configured, what was proved, and which limitation was accepted.

## What I would build first

I would start with a support or customer-feedback model where users already struggle with exact keyword matching.

The first report page would have:

- a text input for the search phrase;
- a clear match-mode selector;
- a ranked result table;
- a Boolean filter for strict inclusion;
- category, date, product, and severity filters;
- a relevance score used only for ordering;
- a detail panel showing the source text;
- a short explanation of culture and fuzzy-match behavior.

Then I would test it against the real questions analysts type today, including misspellings and local terminology.

That is where this feature becomes valuable. Power BI can move beyond exact substring filters and make text-heavy operational data explorable inside the governed semantic model teams already use.

The engineering standard should stay familiar: one bounded workload, one explicit contract, representative tests, measured capacity impact, and a promotion decision backed by evidence.

## Sources

- [Power BI September 2026 Feature Summary](https://community.fabric.microsoft.com/t5/Power-BI-Updates-Blog/Power-BI-September-2026-Feature-Summary/ba-p/5325831)
- [Configure string indexing in Power BI semantic models](https://learn.microsoft.com/en-us/analysis-services/azure-analysis-services/string-indexing?view=power-bi-premium-current)
- [Full-text indexing for Power BI semantic models](https://aka.ms/FullTextIndexing)
- [TEXTCONTAINS function](https://learn.microsoft.com/en-us/dax/textcontains-function-dax)
- [TEXTSIMILARITY function](https://learn.microsoft.com/en-us/dax/textsimilarity-function-dax)
- [Fabric Updates Blog](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blogs/bg-p/fbc_fabricupdatesblogs)
- [Power BI Updates Blog](https://community.fabric.microsoft.com/t5/Power-BI-Updates-Blog/bg-p/fbc_pbiupdatesblog)

---

**Shai Karmani**<br>
Data, Microsoft Fabric, Power BI, Analytics Engineering, and AI<br>
[Connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr)
