# RPFAAS Maintainability Audit Staging Tasks

Source: Companion Review - Code Health, Not Security: RPFAAS Maintainability Audit.

Goal: stage the maintainability updates so active copy-paste bugs are fixed first, then shared FAAS rules are centralized, then larger refactors and safe cleanup can happen in smaller reviewable passes.

Scope: full app - pages, components, hooks, API routes, lib, and utils.

Summary from audit:
- 26 findings total.
- 8 active bugs.
- 8 drift risks.
- 6 large-file / "god file" risks.
- 4 dead-code or duplicate-code cleanup items.

Working rule:
- Do not change user-facing behavior unless the finding is already an active bug.
- Prefer shared helpers in `lib/faas/`, `utils/`, or focused hooks when three modules currently duplicate the same rule.
- Keep each stage small enough to test and review independently.

## Stage 1 - Fix Active Copy-Paste Bugs

Status: in progress.

Priority: highest.

Purpose: fix the copied-and-drifted behavior that is already wrong today across building structures, land improvements, machinery, and review queue flows.

Findings covered:
- Finding 1: land-improvement updates broadcast on the wrong realtime channel.
- Finding 2: machinery PUT route has no input validation.
- Finding 3: land step-1 form hardcodes `isDirty={false}`.
- Finding 4: save draft silently does nothing on brand-new land/machinery forms.
- Finding 5: review queue list/detail pages disagree on municipal and LAOO role groups.
- Finding 6: dashboard editable statuses are redeclared instead of using workflow rules.
- Finding 7: land-improvement photos cannot be annotated while building photos can.
- Finding 8: land-improvements cannot delete a returned record while building and machinery can.

Likely files:
- `app/api/faas/land-improvements/[id]/review/route.ts`
- `app/api/faas/land-improvements/[id]/submit/route.ts`
- `app/api/faas/machinery/[id]/route.ts`
- `app/land-other-improvements/fill/step-1/page.tsx`
- `app/building-other-structure/fill/step-1/page.tsx`
- `app/machinery/fill/step-1/page.tsx`
- `hooks/useLandImprovementPreviewActions.ts`
- `hooks/useMachineryPreviewActions.ts`
- `hooks/useBuildingStructurePreviewActions.ts`
- `app/review-queue/page.tsx`
- `app/review-queue/[id]/page.tsx`
- `components/faas/FaasDashboard.tsx`
- `lib/faas/workflow.ts`
- `app/api/faas/land-improvements/photos/[photoId]/route.ts`
- `app/api/faas/building-structures/photos/[photoId]/route.ts`
- `lib/faas/photo-route-handlers.ts`
- `app/api/faas/land-improvements/[id]/route.ts`
- `app/api/faas/building-structures/[id]/route.ts`
- `app/api/faas/machinery/[id]/route.ts`

Tasks:
- Replace hardcoded land-improvement realtime topics with a shared topic helper derived from form type.
- Add a shared `sanitizeFaasUpdatePayload()` or equivalent validation layer for all FAAS PUT handlers, including machinery.
- Port the working dirty-state wiring from building step 1 into land step 1, and verify machinery step 1 behavior.
- Make brand-new land and machinery save-draft flows create a draft record instead of returning silently.
- Export canonical municipal, LAOO, and provincial role groups from `lib/faas/workflow.ts`.
- Replace local review queue role arrays with the shared role groups.
- Replace `components/faas/FaasDashboard.tsx` local editable-status list with the shared workflow constant.
- Add land photo note PATCH support or centralize single-photo PATCH/DELETE handlers so building and land match.
- Decide and document whether returned land records should be deletable, then align land/building/machinery behavior.

Acceptance checks:
- Land submit/review broadcasts use a land-specific topic or a shared form-type-derived topic.
- Machinery PUT strips protected fields before update.
- Land step 1 warns before losing unsaved edits.
- Save draft on a fresh land or machinery form creates a draft or shows a real error.
- Admin, super admin, municipal, and LAOO action visibility is consistent between review queue list and detail pages.
- Dashboard editable actions follow the same statuses as `lib/faas/workflow.ts`.
- Land photo annotations work like building photo annotations.
- Delete behavior for returned records is consistent or explicitly documented.

## Stage 2 - Centralize Shared FAAS Sources Of Truth

Status: not started.

Priority: high.

Purpose: remove duplicated business rules that can drift the next time a role, municipality alias, status, or workflow transition changes.

Findings covered:
- Finding 9: role-group constants are redeclared in 8+ files.
- Finding 10: municipality-name matching is implemented three different ways.
- Finding 11: dashboard record counts reimplement visibility rules as raw SQL-filter strings.
- Finding 12: review-queue status lists are not sourced from the workflow module.
- Finding 13: the shared workflow module is not table-driven.
- Finding 14: review-transition config is copied between building and land routes.
- Finding 15: return-action precedence is an unexplained nested ternary outside the workflow module.
- Finding 16: machinery has no assign/review/submit routes and no documented intended scope.

Likely files:
- `lib/faas/workflow.ts`
- `lib/faas/access-control.ts`
- `lib/notifications.ts`
- `app/api/review/route.ts`
- `app/api/faas/counts/route.ts`
- `app/api/faas/building-structures/[id]/assign/route.ts`
- `app/api/faas/land-improvements/[id]/assign/route.ts`
- `app/api/faas/building-structures/[id]/review/route.ts`
- `app/api/faas/land-improvements/[id]/review/route.ts`
- `app/review-queue/page.tsx`
- `app/review-queue/[id]/page.tsx`

Tasks:
- Export canonical role-group constants from `lib/faas/workflow.ts`.
- Replace every local `MUNICIPAL_ROLES`, `LAOO_ROLES`, and `PROVINCIAL_ROLES` array with imports.
- Create one shared `normalizeMunicipality()` helper and alias table for all municipality comparisons.
- Update access control, notifications, and review API filters to use the shared municipality normalizer.
- Move review queue status visibility into a role-keyed workflow lookup.
- Use the same lookup for review queue filtering and stat-card counts.
- Refactor submit target status logic into a table keyed by form type and role.
- Move review action config into workflow code, parameterized by form type/table where needed.
- Replace the review detail nested return-action ternary with a named helper such as `getReviewReturnAction()`.
- Document machinery workflow scope in `lib/faas/workflow.ts`, even if the decision is "machinery does not use assign/review/submit yet."

Acceptance checks:
- Adding a new role group member requires editing one workflow location, not several route/page files.
- Municipality aliases are handled consistently anywhere municipality strings are compared.
- Dashboard counts and record access rules cannot silently diverge without touching the same shared rule source.
- Review queue visibility and count cards use the same status list.
- Submit/review/return behavior is easier to audit from `lib/faas/workflow.ts`.
- Machinery workflow status is documented.

## Stage 3 - Reduce Large Files When Touching Them

Status: not started.

Priority: medium.

Purpose: split large files only when already working in that area, so refactoring reduces risk without becoming a broad behavior-changing sprint.

Findings covered:
- Finding 17: `FaasDashboard.tsx` combines fetching, pagination, search, filters, delete, export, and rendering.
- Finding 18: `useRPFAASData.ts` combines state, financial math, and localStorage.
- Finding 19: building step-2 fill page mixes currency formatting, calculations, data loading, and rendering.
- Finding 20: `collectFormData()` and step-1 logic is duplicated across all three modules.
- Finding 21: print-readiness state machine is reimplemented in all three print-only pages.
- Finding 22: FAAS PUT handlers use incompatible validation strategies.

Likely files:
- `components/faas/FaasDashboard.tsx`
- `app/components/forms/RPFAAS/hooks/useRPFAASData.ts`
- `app/building-other-structure/fill/step-2/page.tsx`
- `app/building-other-structure/fill/step-1/page.tsx`
- `app/land-other-improvements/fill/step-1/page.tsx`
- `app/machinery/fill/step-1/page.tsx`
- `app/building-other-structure/print-only/page.tsx`
- `app/land-other-improvements/print-only/page.tsx`
- `app/machinery/print-only/page.tsx`
- `app/api/faas/building-structures/[id]/route.ts`
- `app/api/faas/land-improvements/[id]/route.ts`
- `app/api/faas/machinery/[id]/route.ts`

Tasks:
- Split `FaasDashboard.tsx` into data/action hooks plus a presentational table when the dashboard is next changed.
- Split `useRPFAASData.ts` into data hydration, pure calculations, and a thin composing hook.
- Extract the building step-2 currency input behavior into a shared hook or formatter.
- Extract building step-2 derived calculations and loaded-data mapping into named pure helpers.
- Extract shared step-1 owner/admin/location/title/previous-TD collection into a form-type-configured helper.
- Extract print photo readiness into a shared hook.
- Extract repeated photo attachment page rendering into a shared component.
- Create one shared Zod schema or sanitizer factory for all FAAS PUT routes.

Acceptance checks:
- Dashboard fetch/delete/export changes can be reviewed without reading unrelated table JSX.
- RPFAAS financial calculations can be tested without localStorage setup.
- Building step-2 formatting/calculation helpers can be reused or tested independently.
- Step-1 dirty-state and form-data collection behavior stays consistent across building, land, and machinery.
- Print-only pages share readiness logic.
- All FAAS PUT handlers share one validation strategy.

## Stage 4 - Delete Dead Code And Consolidate Low-Risk Duplication

Status: not started.

Priority: low risk / opportunistic.

Purpose: remove unused code and repeated CSS that increases confusion without changing app behavior.

Findings covered:
- Finding 23: legacy save/load subsystem is unused.
- Finding 24: every FAAS route defines its own admin-client factory.
- Finding 25: identical CSS rules repeat between screen and print media queries.
- Finding 26: print-density magic numbers are manually recalculated instead of using a shared scale.

Likely files:
- `hooks/useLoadDraft.ts`
- `hooks/useSaveForm.ts`
- `lib/formStorage.ts`
- `components/SaveButton.tsx`
- FAAS API route files using local `getAdmin()` or inline `createSupabaseClient(...)`
- `lib/supabase/admin.ts` or new equivalent
- `app/components/forms/RPFAAS/faas_table_forms.css`
- `app/components/forms/RPFAAS/components/taxDec.css`

Tasks:
- Confirm zero call sites for `useLoadDraft`, `useSaveForm`, `formStorage`, and `SaveButton`.
- Delete the unused legacy save/load files after confirmation.
- Add one shared Supabase admin-client factory.
- Replace repeated per-route admin-client factories with the shared helper.
- Move identical `.rpfaas-field-value` and `.floor-area-print` CSS declarations out of duplicated media blocks.
- Express tax declaration print density through shared CSS custom properties and land-specific overrides.

Acceptance checks:
- `rg` confirms deleted legacy save/load files had no remaining references.
- FAAS routes import one admin-client helper instead of redefining it.
- Screen and print CSS still render the same for unchanged properties.
- Building and land tax declaration print density stays visually aligned through shared variables.

## Suggested Execution Order

1. Complete Stage 1 active bugs first.
2. Move Stage 2 shared workflow/access rules one rule family at a time.
3. Handle Stage 3 refactors only when already touching the affected area.
4. Do Stage 4 dead-code and CSS cleanup any time, because it has the lowest behavior risk.

## Cross-Reference

The earlier security audit Stage 6 already tracks root-level SQL migration hygiene. Keep that work under `SECURITY_AUDIT_STAGING_TASKS.md` and do not duplicate it here.
