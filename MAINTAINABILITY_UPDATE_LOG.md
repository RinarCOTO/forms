# Maintainability Update Log

Last updated: 2026-07-01

## Completed in Current Cleanup Stack

- Stopped tracking nested `services/**/.next/**` build outputs and updated `.gitignore`.
- Extracted shared number, date, amount, and year formatting helpers into `utils/form-helpers.ts`.
- Added shared form draft/storage mapping in `utils/form-draft-storage.ts`.
- Centralized submit/review workflow rules in `lib/faas/workflow.ts`.
- Centralized FAAS photo upload/list route logic in `lib/faas/photo-route-handlers.ts`.
- Extracted building preview DB-to-localStorage seeding into `seedBuildingStructureDraftStorage`.
- Extracted land preview step-1 localStorage fallback mapping into `mergeLandPreviewStorageFallbacks`.
- Centralized preview comment field highlighting in `useFaasCommentHighlight` and removed inline `innerHTML` rendering.
- Replaced preview-page `localStorage.clear()` calls with targeted form-draft cleanup helpers.
- Extracted building/land preview comment loading into `useFaasReviewComments`.
- Extracted building/machinery preview photo loading into `useFaasPhotos`.
- Extracted preview user permission flags into `useFaasUserPermissions` and print blocking into `usePrintBlocker`.
- Extracted building preview status/data loading into `useBuildingStructurePreviewData`.
- Extracted land preview status/data loading into `useLandImprovementPreviewData`.
- Extracted machinery preview status/data loading into `useMachineryPreviewData`.
- Extracted machinery preview save/submit actions into `useMachineryPreviewActions`.
- Extracted building preview save/submit actions into `useBuildingStructurePreviewActions`.
- Extracted land preview save/submit actions into `useLandImprovementPreviewActions`.
- Removed runtime debug `console.log` calls from app code.
- Replaced preview comment DOM class toggling with `FaasCommentHighlightScope` so field highlights render through React around the RPFAAS forms.
- Centralized FAAS draft id storage with namespaced keys for building, land, and machinery while keeping legacy `draft_id` fallback during transition.
- Added the base notification system: migration, helper, API routes, and sidebar notification bell.
- Wired FAAS building/land submit, review, return, approve, and assignment routes to create sidebar notifications through `lib/faas/notification-rules.ts`.

## Next Update Queue

- Add an LAOO municipality workload report: submitted count and LAOO-approved count per municipality, LAOO, and month.

## Maintainability Rule For Future Features

- Keep feature code understandable by a human maintainer.
- Prefer small helpers with plain names over large hidden abstractions.
- Keep UI components focused on display and user interaction.
- Keep database writes, workflow rules, notifications, offline sync, and storage logic in separate helpers or API layers.
- Add one feature in small verified steps, then run typecheck/build before continuing.

### 1. Split preview pages into smaller modules

Priority: High

Files:
- `app/building-other-structure/fill/preview-form/page.tsx`
- `app/land-other-improvements/fill/preview-form/page.tsx`

Why:
- The preview pages still handle too many jobs in one place: draft loading, DB state, photo fetching, comments, save/submit, print blocking, and UI highlighting.

Suggested update:
- Continue shrinking preview-page UI sections only when they need feature changes.
- Keep the page focused on layout and wiring.

### 2. Keep improving comment UX rendering

Priority: Medium

Files:
- `app/building-other-structure/fill/preview-form/page.tsx`
- `app/land-other-improvements/fill/preview-form/page.tsx`
- `app/machinery/fill/preview-form/page.tsx`
- `hooks/useFaasCommentHighlight.ts`

Why:
- Comment highlighting is now centralized and no longer toggles classes on DOM nodes, but inline building comments still use a small inserted table row to preserve the current reviewer annotation behavior.

Suggested update:
- When the RPFAAS forms are next refactored, move the inline annotation row into the form components themselves.

### 3. Continue namespacing draft storage

Priority: Medium

Files:
- `app/building-other-structure/fill/preview-form/page.tsx`
- `app/land-other-improvements/fill/preview-form/page.tsx`
- `utils/form-draft-storage.ts`
- Future form step pages

Why:
- Preview pages now clear only known form-draft keys instead of all browser storage.
- Draft id storage now uses namespaced helpers, but many older form-step field values are still generic `_p1`-style keys.

Suggested update:
- Namespace new field-level draft keys by form type.
- Avoid adding new generic `localStorage` keys.

### 4. Split `useRPFAASData`

Priority: Medium

File:
- `app/components/forms/RPFAAS/hooks/useRPFAASData.ts`

Why:
- The hook still owns too much RPFAAS loading and mapping behavior.

Suggested update:
- Split by data source or form area, then keep `useRPFAASData` as a small coordinator.

### 5. Add offline draft and sync support

Priority: Medium

Files to plan around:
- `utils/form-draft-storage.ts`
- Future offline sync queue helper
- Future network status hook
- Form step save/submit flows
- Photo upload flows

Why:
- Users may need to keep working when the internet drops.
- Offline support should not be placed directly inside RPFAAS form components because that would make those components harder to maintain.

Suggested update:
- Allow create/edit/save draft while offline using local browser storage.
- Allow photos to be attached offline, then queued for upload when online.
- Show offline submit as "Queue for Submission" and only mark as submitted after the server confirms sync.
- Keep official submit, review, and approve actions server-confirmed.

### 6. Improve submission and workflow notifications

Priority: Medium

Files to plan around:
- Future `notifications` database table
- Future notification helper/service
- Future notification API routes
- Sidebar/header notification bell
- Review queue and dashboard badges
- Submit/save/review/return/approve workflow routes

Why:
- Current feedback can be easy to miss when a form is submitted, returned, reviewed, or approved.
- Users need clearer confirmation that an action happened and what status the form is now in.
- Notifications should be visible globally, not only inside the review queue.
- Review queue and dashboards should still show contextual badges so users know where to act.

Suggested update:
- `database/20260701_notifications.sql` has been applied to Supabase with RLS enabled for user-owned read/update access.
- Keep review queue/dashboard badges as page-specific indicators.
- Continue with rejected/cancelled notifications if those workflow actions are added later.
- Add review queue/dashboard badges as page-specific indicators.
- Clicking a notification should open the related form or review item and mark the notification as read.

Code simplicity rule:
- The sidebar bell should only display notifications.
- Workflow routes should only call a helper like `createNotification(...)`.
- The notification helper should own the database insert details.
- Avoid putting notification rules directly inside UI components.

### 7. Centralize workflow side effects

Priority: Medium

Files:
- `app/api/faas/building-structures/[id]/submit/route.ts`
- `app/api/faas/land-improvements/[id]/submit/route.ts`
- Related review/approval routes

Why:
- The pure submit/review rules are centralized, but side effects are still spread around: returned-comment generation, realtime broadcast, audit inserts, and previous-TD cancellation.

Suggested update:
- Add a workflow side-effects helper that receives the table/config and performs the shared operations.

### 8. Continue reducing large files

Priority: Low

Files to watch:
- `app/manage-users/page.tsx`
- `app/review-queue/[id]/page.tsx`
- `components/faas/FaasDashboard.tsx`
- `app/building-other-structure/fill/step-2/page.tsx`
- `app/components/forms/RPFAAS/building_structure_form.tsx`

Why:
- These files are still large enough that routine edits require extra care.

Suggested update:
- Extract repeated UI sections, table controls, filtering logic, and data hooks only when touching those files for real feature work.
