---
layout: post
title: "The Fabric Notebook Secret Pattern That Keeps Credentials Under Control"
description: "A practical security pattern for Fabric notebooks using Azure Key Vault, NotebookUtils runtime boundaries, least privilege, and validation evidence."
date: 2026-09-24
author: Shai Karmani
author_url: https://www.linkedin.com/in/shai-kr
sitemap: false
---

**Review draft. Direct link only. Not listed on the blog.**

A secret stored in Azure Key Vault is safer than a secret copied into a notebook.

That is the starting point, not the complete security design.

Microsoft has clarified two details in the Fabric NotebookUtils credentials documentation that are easy to miss:

1. `putSecret` works only in notebooks that use the Python runtime. It does not work in Fabric Spark notebooks, even when the Spark notebook is running PySpark.
2. Notebook output redaction is a best-effort safeguard against accidental disclosure. It is not a security boundary.

Those details change how I would design and review secret handling in a Fabric notebook.

The useful pattern is simple: **Key Vault owns the secret, identity controls access, the notebook retrieves only what it needs, and the workflow proves that plaintext does not escape into durable output.**

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/fabric-notebook-secrets/01-secret-control-path-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/fabric-notebook-secrets/01-secret-control-path.svg' | relative_url }}" alt="Controlled secret path from Azure Key Vault through Fabric identity to a notebook and target service, with no secret stored in code or output.">
</picture>

## The runtime detail that can break an otherwise good design

Fabric supports Python notebooks and Fabric Spark notebooks. A Spark notebook can run PySpark code, but that does not make it a Python-runtime notebook.

That distinction matters for `notebookutils.credentials.putSecret`.

According to the updated Microsoft documentation, `putSecret` is supported only in notebooks using the Python runtime. It is not supported in Spark notebooks using PySpark, Scala, or R.

This is a runtime boundary, not a syntax preference.

A team can write valid Python-looking code in a PySpark cell and still be using the wrong execution environment for this method. That is exactly the kind of mismatch that passes a quick code review and fails in deployment.

My preference is to keep secret creation and rotation out of analytical notebooks entirely. Use infrastructure automation, a deployment process, or a tightly controlled Python-runtime workflow to write the secret. Let production notebooks retrieve the value through `getSecret` with read-only permissions where possible.

That separation reduces the number of workloads with permission to change credentials.

## What redaction protects, and what it does not

Fabric attempts to redact the original secret value when notebook code prints or displays it directly.

That is useful. It can reduce accidental disclosure during a demo, screen share, or routine debugging session.

It does not remove the plaintext from the running notebook.

After `getSecret` succeeds, authorized code receives the value and can use it. The code can also transform it, concatenate it with other text, write it to a file, pass it as a parameter, include it in an exception, or send it to another service.

The redaction behavior cannot be the control that makes those actions safe.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/fabric-notebook-secrets/02-redaction-boundary-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/fabric-notebook-secrets/02-redaction-boundary.svg' | relative_url }}" alt="Diagram separating best-effort notebook output redaction from enforceable controls such as Key Vault permissions, identity, network boundaries, and audit logs.">
</picture>

The enforceable controls live elsewhere:

- Azure Key Vault access policy or role assignment;
- the user or service principal identity running the notebook;
- least-privilege access to the target service;
- network controls around Key Vault and the destination;
- notebook permissions and workspace roles;
- logging and audit evidence;
- code review rules that reject secret output and persistence.

Redaction is still worth having. It is the last guard against one class of mistake, not the first line of defense.

## A production pattern I would use

### 1. Put the secret lifecycle outside the data transformation

Create and rotate the secret through a controlled administrative path. Avoid giving a notebook both read and write access to the same vault unless the notebook's job genuinely is secret administration.

For most data engineering workloads, the notebook should retrieve a secret, use it for one bounded connection, and discard the in-memory reference when the task ends.

### 2. Use a workload identity for scheduled runs

Interactive development and scheduled execution are different identity contexts.

A notebook that succeeds under a developer's identity can fail under a service principal. The reverse is also dangerous: a broad service identity can hide permissions that the normal developer should not have.

Test both paths deliberately. Record which identity runs each environment and which vault permissions it owns.

### 3. Retrieve late and keep scope narrow

Fetch the secret immediately before the connection that needs it. Do not retrieve every credential at the top of a long notebook.

Keep the variable local to the smallest practical block. Do not place it in shared configuration dictionaries, notebook parameters, widgets, Spark configuration, or files.

### 4. Prevent disclosure by design

Review code for direct and indirect output:

- `print`, `display`, logging, and exception messages;
- string interpolation around connection errors;
- notebook return values and pipeline output;
- files written to OneLake or another storage location;
- parameters passed to child notebooks;
- debug cells left behind after troubleshooting.

A secret can leak without ever appearing in a line called `print(secret)`.

### 5. Validate the failure path

Good secret handling is visible when something fails.

Use a controlled test secret and deliberately trigger an authentication error. Confirm that the exception, notebook output, pipeline log, and monitoring surface do not expose the original value or a useful derivative.

Do not run this test with a production credential.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/fabric-notebook-secrets/03-five-gate-review-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/fabric-notebook-secrets/03-five-gate-review.svg' | relative_url }}" alt="Five-gate review for Fabric notebook secrets: lifecycle, identity, retrieval scope, disclosure controls, and failure-path validation.">
</picture>

## A small acceptance test before production

I would make the secret path pass six checks:

| Check | Evidence |
| --- | --- |
| The correct runtime is used | Notebook runtime recorded; `putSecret` excluded from Spark notebooks |
| The execution identity is explicit | User and scheduled identity documented |
| Vault access is minimal | Read-only secret access unless write access is required |
| The secret is absent from code and parameters | Repository and notebook review |
| Output paths do not expose it | Notebook, pipeline, file, and error-log inspection |
| Rotation does not require code edits | Test secret version changed in Key Vault, notebook still succeeds |

The last check is especially useful.

If rotating a secret requires changing notebook source, the credential lifecycle is still coupled to the transformation. Key Vault should let the value change without rewriting the code that consumes it.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/fabric-notebook-secrets/04-acceptance-evidence-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/fabric-notebook-secrets/04-acceptance-evidence.svg' | relative_url }}" alt="Acceptance evidence matrix for runtime, identity, permission, output, failure, and rotation checks in a Fabric notebook secret workflow.">
</picture>

## One practical code rule

A production notebook should make secret retrieval boring.

```python
from notebookutils import credentials

vault = (
    "https://contoso-data-kv."
    "vault.azure.net/"
)
api_key = credentials.getSecret(
    vault,
    "partner-api-key"
)

# Use only in the client that needs it.
# Never print, return, or persist it.
```

The code is intentionally uninteresting. The important work is in identity, permissions, review, and evidence.

I would also avoid examples that show a realistic secret literal in `putSecret`. Even when the value is fake, copy-and-paste examples shape production habits.

## My take

This documentation clarification is useful because it removes two unsafe assumptions.

PySpark is not the same runtime as a Python notebook for every NotebookUtils method. Redacted output is not proof that a secret cannot escape.

Fabric teams do not need a complicated secret framework. They need a clear division of responsibility:

- Key Vault manages the value;
- identity decides who can retrieve it;
- the notebook uses it for one bounded task;
- code review prevents persistence and output;
- validation checks both success and failure paths.

That pattern keeps credentials out of notebook source without pretending the running code never sees plaintext.

Treat redaction as a helpful safety net. Build the real boundary with permissions, identity, network controls, and evidence.

## Sources

- [NotebookUtils credentials utilities for Fabric](https://learn.microsoft.com/en-us/fabric/data-engineering/notebookutils/notebookutils-credentials)
- [MicrosoftDocs change clarifying runtime support and secret redaction](https://github.com/MicrosoftDocs/fabric-docs/commit/4c6a2ac395f85101827a66f7f041284cd19ee0f6)
- [Azure Key Vault best practices](https://learn.microsoft.com/en-us/azure/key-vault/general/best-practices)
- [Fabric Updates Blog](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blogs/bg-p/fbc_fabricupdatesblogs)
- [Power BI Updates Blog](https://community.fabric.microsoft.com/t5/Power-BI-Updates-Blog/bg-p/fbc_pbiupdatesblog)

---

**Shai Karmani**<br>
Microsoft Data and AI practitioner<br>
[Connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr)
