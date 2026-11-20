---
name: tandem-domain
description: Product context for Tandem (study-group platform): entities, roles, required exam features and the project's source-of-truth documents. Use at the start of any task in this repo.
---

Read `docs/PROJECT.md` (topic, entities, use cases, ER, feature map) and `docs/EXAM.md` (grading) before working. They are the source of truth; if code and docs disagree, fix the docs in the same branch.

Non-negotiables from the exam: 5+ working functionalities, en/ru/kk UI with a switcher, search across groups+materials+users, admin panel with CRUD and role guard, ER with 5+ entities with PK/FK, use-case diagram with 3+ actors and 5+ use cases.
Secrets: never read, edit or print `.env`; use `.env.example` for documentation.
