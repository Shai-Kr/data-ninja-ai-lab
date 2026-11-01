---
layout: post
title: "Give Fabric a Durable Identity for SharePoint List Ingestion"
date: 2026-11-01
description: Microsoft Fabric Dataflow Gen2 now documents certificate-based service principal authentication for SharePoint Online Lists. Here is the identity, Key Vault, rotation, and operating model needed to use it well.
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

Fabric teams often begin a SharePoint ingestion flow with an organizational account because it is fast. Someone signs in, the connection succeeds, and the dataflow starts moving rows.

That is enough for exploration. It is a weak production identity.

Microsoft's SharePoint Online List connector documentation now describes certificate-based service principal authentication for Dataflow Gen2. The application is registered in Microsoft Entra ID, its public certificate is added to the registration, the certificate is referenced through Azure Key Vault, and Fabric uses that application identity for the connection.

The benefit is straightforward: scheduled ingestion no longer depends on one employee's sign-in lifecycle.

The design work does not end when the connection test passes. A service principal moves ownership from a person to an application. That application still needs a clear permission boundary, certificate rotation, workload ownership, and recovery evidence.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/sharepoint-certificate-identity/01-identity-chain-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/sharepoint-certificate-identity/01-identity-chain.webp" alt="An identity chain connects a Microsoft Entra application, Azure Key Vault certificate, Fabric connection, and Dataflow Gen2 workload"></picture></figure>

## What Microsoft documents

For SharePoint Online Lists, Fabric supports three authentication paths across its connector experiences:

- organizational account
- workspace identity
- service principal

The support matrix matters. Microsoft's current documentation says certificate-based service principal authentication is supported for Dataflow Gen2. It also says that this method is not supported for Pipeline Copy Activity or Copy Job.

That is not a footnote. It is an architecture boundary.

If the workload must run as a pipeline copy or Copy Job, do not assume that a Dataflow Gen2 authentication pattern will carry over. Choose the workload first, then verify the connector and authentication combination that the workload supports.

For the Dataflow Gen2 path, Microsoft lists these setup elements:

1. Register an application in Microsoft Entra ID.
2. Add the public certificate to the app registration.
3. Grant the SharePoint application permission `Sites.Read.All` and admin consent.
4. Store and manage the certificate through an Azure Key Vault connection.
5. Create the Fabric SharePoint connection with the tenant ID, application ID, credential type, Key Vault reference, certificate, and certificate version.

That creates the technical connection. Production readiness requires a little more.

## A durable identity is better than a durable password

An organizational account is tied to a person. Password changes, conditional-access changes, role changes, leave, and offboarding can all affect a workload that was quietly built around that identity.

A service principal gives the workload its own identity. That makes ownership easier to express and the authentication lifecycle easier to manage deliberately. It also removes the habit of keeping an employee account alive because a dataflow might still depend on it.

But an application identity is not automatically safer. The documented SharePoint permission is broad enough that the application boundary deserves explicit review. The team should record which site and lists the workload is intended to read, even when the platform permission is wider than the business purpose.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/sharepoint-certificate-identity/02-auth-choice-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/sharepoint-certificate-identity/02-auth-choice.webp" alt="A comparison shows the different lifecycle requirements of an organizational account and certificate service principal"></picture></figure>

## Separate the four managed objects

I would model this connection as four objects with separate owners and evidence.

### 1. The Entra application

Record the application ID, tenant, approved permission, consent owner, business purpose, and review date. The display name is useful for people, but the application ID is the durable key.

### 2. The certificate in Key Vault

Record the vault, certificate name, active version, expiry date, rotation owner, and the alert path. The certificate is not a one-time setup artifact. It is an expiring production dependency.

### 3. The Fabric connection

Give the connection a name that identifies the source, environment, and identity pattern. Record who can administer it and which dataflows use it. Avoid a generic name such as `SharePoint Connection` that becomes meaningless once the workspace has several sources.

### 4. The Dataflow Gen2 workload

Record the intended SharePoint site and lists, refresh schedule, destination, support owner, and recovery steps. A connection can authenticate successfully while the dataflow still reads the wrong scope, breaks on a schema change, or writes incomplete output.

Keeping these objects separate makes incident response much faster. When a refresh fails, the team can ask whether the problem is identity, certificate, connection configuration, source behavior, or transformation logic instead of treating the whole path as one opaque credential issue.

## Make certificate rotation a normal release

Certificate authentication trades password churn for certificate lifecycle management. That is a good trade only when rotation is practiced.

I would use this release sequence:

1. Create or renew the certificate under the team's approved process.
2. Add the new public certificate to the Entra application before removing the old one.
3. Make the new certificate version available through the Key Vault connection.
4. Update or validate the Fabric connection against the new version.
5. Run a controlled Dataflow Gen2 refresh and verify both source read and destination output.
6. Preserve the test evidence, then retire the old certificate after the overlap period.

The exact overlap and approval process depends on the organization's security policy. The important design choice is to avoid a single cutover moment with no tested rollback.

## Use an acceptance test, not a green connection icon

A successful connection test proves authentication at one moment. It does not prove that the production flow is correct.

The acceptance test should cover:

- the expected application identity is used
- the intended SharePoint site and list can be read
- an out-of-scope source is not part of the configured workload
- the dataflow refresh completes under its scheduled identity
- row counts or control totals match the source expectation
- the destination receives the expected schema and data
- the support team can identify the active certificate version
- expiry and failure alerts reach a named owner
- the recovery procedure has been rehearsed

The evidence can be simple. A dated run record with the connection ID, dataflow ID, source scope, certificate version, result, control totals, and owner is enough to turn a hidden dependency into an operable one.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/sharepoint-certificate-identity/03-production-gates-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/sharepoint-certificate-identity/03-production-gates.webp" alt="Six production gates cover source scope, permission approval, credential custody, runtime boundary, rotation rehearsal, and operational evidence"></picture></figure>

## A practical rollout

Start with one noncritical Dataflow Gen2 workload and one clearly owned SharePoint List.

Build the application, certificate, Key Vault reference, and Fabric connection. Run the existing user-based path and the new application-based path against the same controlled source. Compare the output, refresh behavior, and operational evidence.

Then rotate the certificate once in a safe environment. A team that has never tested rotation does not yet have a durable identity, even if the first certificate has a long expiry date.

Finally, inventory the remaining SharePoint connections. Classify each one as exploration, user-owned production, workspace identity, or certificate service principal. The goal is not to convert everything blindly. The goal is to make the identity choice explicit and supportable.

## The practical takeaway

Certificate-based service principal authentication gives Fabric Dataflow Gen2 a cleaner production path for SharePoint Online List ingestion.

Use it to remove scheduled workloads from a person's sign-in lifecycle. Keep the Entra application, Key Vault certificate, Fabric connection, and dataflow as separately owned objects. Respect the documented Dataflow Gen2 boundary. Test rotation before expiry becomes an incident.

That is how a connector setting becomes a durable operating model.

## Sources

- [Fabric Updates Blog](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blogs/bg-p/fbc_fabricupdatesblogs)
- [Power BI Updates Blog](https://community.fabric.microsoft.com/t5/Power-BI-Updates-Blog/bg-p/fbc_pbiupdatesblog)
- [Set up your SharePoint connection](https://learn.microsoft.com/en-us/fabric/data-factory/connector-sharepoint-online-list)
- [Microsoft Fabric documentation change: certificate-based SharePoint service principal guidance](https://github.com/MicrosoftDocs/fabric-docs/commit/a26a0d4045f1df5a09d057960a5ea1bf4c443185)

---

Written by **[Shai Karmani](https://www.linkedin.com/in/shai-kr)**.

If you work on Microsoft Fabric, Power BI, data engineering, or practical AI systems, feel free to [connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr).
