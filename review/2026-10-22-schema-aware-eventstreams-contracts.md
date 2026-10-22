---
layout: post
title: "Schema-Aware Eventstreams Turn Mixed Feeds Into Clear, Testable Data Products"
date: 2026-10-22
description: Fabric Eventstreams can now distinguish registered, classified, and untyped events while data is moving. This practical operating model turns that capability into explicit contracts, safe routing, and measurable schema evolution.
author: Shai Karmani
author_url: https://www.linkedin.com/in/shai-kr
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
  .article-header h1 { font-size: clamp(1.12rem, 5vw, 1.6rem); line-height: 1.17; letter-spacing: -0.025em; }
  .article-header .dek { font-size: 0.94rem; margin-top: 14px; }
  .article-body { overflow-x: hidden; font-size: 0.98rem; }
  .article-body img { width: 100%; max-width: 100%; height: auto; border-radius: 16px; }
  .article-body p:has(> img) { max-width: 100%; width: 100%; }
  .subscribe-orbit { display: none; }
}
.review-visual { width: 100%; max-width: 100%; margin: 34px 0 10px; overflow: hidden; }
.review-visual img { display: block; width: 100%; max-width: 100%; height: auto; }
</style>

**Review draft. Direct link only.**

A single real-time feed can carry thermostat readings, occupancy changes, access events, and air-quality measurements.

Treating that feed as one wide table creates a familiar mess. Most columns are irrelevant for most records. Every downstream consumer rebuilds the same event-type logic. A new producer field can quietly change routing or break a query far from the source.

Schema-aware Fabric Eventstreams, now in preview, changes where that meaning is handled. Eventstreams can distinguish multiple event types while data is still moving, expose the fields that belong to each shape, and let supported operators or destinations work against the selected event type.

The practical opportunity is larger than a cleaner preview screen. Event type can become an explicit production contract with an owner, routing policy, compatibility rule, and evidence trail.

## Three levels of contract maturity

The feature supports three useful states rather than forcing every producer into a schema registry on day one.

**Schematized events** use registered definitions from an Event SchemaSet and Fabric Schema Registry. They use the CloudEvents format, with the `ce_type` header identifying the registered event type. This is the strongest contract because producers and consumers share an explicit, reusable definition.

**Classified events** already contain a field such as `eventType`, `deviceType`, or `entityType`. The Classifier workflow uses that field to organize one mixed feed into distinct event shapes. Classification makes existing structure usable, but it does not turn detected fields into a registered compatibility contract.

**Untyped events** remain visible when no registered schema or selected classifier applies. In a classified stream, a missing or null classifier value remains untyped. That is useful because unknown traffic can be observed instead of disappearing behind a default branch.

There is one important exception. When a source is associated with an Event SchemaSet, events that fail schema validation are dropped and reported in runtime logs. They do not become untyped events.

That difference should shape the operating model. Untyped means "not yet classified." Validation failure means "rejected against a declared contract." Those are different conditions and need different owners.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/schema-aware-eventstreams/01-contract-ladder-mobile.svg"><img src="/data-ninja-ai-lab/assets/blog/schema-aware-eventstreams/01-contract-ladder.svg" alt="A contract maturity ladder for untyped, classified, and schematized events in Fabric Eventstreams"></picture></figure>

## Move type detection to one controlled boundary

Without schema awareness, every consumer tends to repeat the same work:

1. inspect a payload field
2. decide which event it represents
3. guard against fields that do not apply
4. route or transform the record
5. repeat the logic in the next application

That duplication creates drift. One consumer recognizes `ThermostatReadingV2`; another still expects `ThermostatReading`; a third treats an unknown value as a generic telemetry event.

With schema-aware Eventstreams, the stream can expose a selected event shape to a Filter operator or supported destination. The available configuration fields then correspond to that event type rather than the union of every field observed in the feed.

For a building stream, high-temperature logic can use the thermostat event and its temperature field. Occupancy and badge-reader events continue through their own paths. Eventhouse, Lakehouse, custom endpoints, and derived streams can consume the selected shape where supported.

This does not remove downstream validation. It gives the team one earlier boundary where event identity is visible, testable, and reviewable.

## Give every event type a six-part contract

I would document each event type with six fields before calling the stream production-ready:

| Contract field | Decision to record |
|---|---|
| Identity | Registered `ce_type` or classifier value |
| Shape | Required, optional, nested, and sensitive fields |
| Owner | Producer team and consumer owner |
| Routing | Operators and destinations allowed to consume it |
| Evolution | Compatible changes, version rule, and retirement window |
| Evidence | Accepted, rejected, untyped, and destination counts |

For classified events, include the exact classifier field and allowed values. Do not let spelling, case, or a producer-specific alias become undocumented routing logic.

For registered events, define what happens when the schema changes. Adding an optional field is different from renaming a required field or changing a datatype. The registry stores the contract, but the release process still needs compatibility checks and consumer sign-off.

For untyped events, set a time-bound decision. An unknown event can be accepted temporarily for discovery, classified under an existing type, promoted to a registered schema, or rejected. "Leave it untyped forever" is not an ownership model.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/schema-aware-eventstreams/02-routing-boundary-mobile.svg"><img src="/data-ninja-ai-lab/assets/blog/schema-aware-eventstreams/02-routing-boundary.svg" alt="A schema-aware routing boundary sends thermostat, occupancy, and access events to type-specific processing paths while keeping unknown traffic visible"></picture></figure>

## Build an unknown-event lane on purpose

Unknown traffic is where many streaming designs lose evidence.

A default branch that silently accepts everything hides producer drift. A hard reject with no usable telemetry hides the same problem in another place. Schema-aware Eventstreams gives teams enough distinction to design a better response.

I would separate three signals:

- **Untyped count:** events that are visible but have no usable contract or classifier value.
- **Unknown classifier count:** events with a classifier value outside the approved set.
- **Schema rejection count:** events dropped because they failed a registered schema.

Each signal needs the source, event timestamp, observed type value, reason, sample reference, and owner. Payload capture must follow the data-classification policy. Operational evidence does not justify copying sensitive event bodies into logs.

Set thresholds that match the stream. A new integration may tolerate a short discovery period. A stable access-control stream may treat one schema rejection as an incident. The useful metric is not simply "the Eventstream is running." It is whether known types are flowing, unknown traffic is bounded, and rejected events are investigated.

## Test evolution, not only the happy path

A representative acceptance pack should include:

1. one valid event for every registered or classified type
2. one event with a missing classifier
3. one event with an unknown classifier value
4. one registered event that violates its schema
5. nested JSON and optional fields where the type allows them
6. a compatible schema change
7. an incompatible change that should be blocked or versioned
8. replayed events to confirm routing stays deterministic
9. destination checks for row counts, fields, and timestamps
10. runtime-log checks for rejected events

The expected result should be written before the test runs. "The data arrived" is too weak. Record which branch received the event, which shape the operator exposed, which destination stored it, and which counter or log entry proved the outcome.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/schema-aware-eventstreams/03-acceptance-matrix-mobile.svg"><img src="/data-ninja-ai-lab/assets/blog/schema-aware-eventstreams/03-acceptance-matrix.svg" alt="An acceptance matrix checks valid, untyped, unknown, invalid, changed, and replayed events before release"></picture></figure>

## A practical adoption sequence

Start with one mixed stream where downstream teams already duplicate event-type logic.

1. Inventory observed event types and current routing rules.
2. Choose registered, classified, or temporarily untyped status for each type.
3. Assign producer and consumer owners.
4. Configure the classifier or Event SchemaSet association.
5. Build type-specific processing branches and destinations.
6. Add counts and runtime-log checks for unknown and rejected traffic.
7. Run the acceptance pack against representative events.
8. Version the contract and record the release evidence.

Do not register every detected shape simply to make the architecture look mature. Registration is useful when a producer and its consumers can own the contract. Classification is a sensible transition when the event already carries a reliable type field. Untyped visibility is useful during discovery, provided it has a deadline and an owner.

## The practical takeaway

Schema-aware Eventstreams lets Fabric preserve event meaning earlier in the real-time path.

The strongest implementation will not be the one with the most registered schemas. It will be the one where each event type has a clear identity, owner, route, evolution rule, and measurable outcome.

That turns a mixed feed from a collection of payloads into a set of real-time data products the team can test and change deliberately.

## Sources

- [Explore and process multiple event types with Schema-aware Fabric Eventstreams (Preview)](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blog/Explore-and-process-multiple-event-types-with-Schema-aware/ba-p/5376384)
- [Schema-Aware Eventstreams Overview (Preview)](https://learn.microsoft.com/en-us/fabric/real-time-intelligence/event-streams/schema-aware-eventstreams-overview)
- [Preview Data in Schema-Aware Eventstreams](https://learn.microsoft.com/en-us/fabric/real-time-intelligence/event-streams/preview-data-schema-aware)
- [Process Events with a Classifier](https://learn.microsoft.com/en-us/fabric/real-time-intelligence/event-streams/process-events-with-classifier)
- [Fabric Schema Registry overview](https://learn.microsoft.com/en-us/fabric/real-time-intelligence/schema-sets/schema-registry-overview)

---

Written by **[Shai Karmani](https://www.linkedin.com/in/shai-kr)**.

If you work on Microsoft Fabric, Power BI, data engineering, or practical AI systems, feel free to [connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr).
