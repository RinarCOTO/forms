"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageSquare, X, User, Clock, MousePointerClick, LayoutList, ListFilter } from "lucide-react";

interface ReviewComment {
  id: string;
  field_name?: string | null;
  comment_text: string;
  suggested_value?: string | null;
  author_name: string;
  author_role?: string | null;
  created_at: string;
  parent_id?: string | null;
}

const FIELD_LABELS: Record<string, string> = {
  arp_no: "ARP No.", oct_tct_cloa_no: "OCT/TCT/CLOA No.", survey_no: "Survey No.",
  pin: "PIN", lot_no: "Lot No.",
  owner_name: "Owner Name", admin_care_of: "Admin / Care Of", owner_address: "Owner Address",
  location_province: "Province", location_municipality: "Municipality", location_barangay: "Barangay",
  type_of_building: "Type of Building", structure_type: "Structure Type",
  building_permit_no: "Building Permit No", cct: "CCT",
  completion_issued_on: "Completion Date", date_constructed: "Date Constructed",
  date_occupied: "Date Occupied", building_age: "Building Age",
  number_of_storeys: "No. of Storeys", total_floor_area: "Total Floor Area",
  unit_cost: "Unit Cost", land_owner: "Land Owner", td_arp_no: "Land TD/ARP No.", land_area: "Land Area",
  roofing_material: "Roofing Material", flooring_material: "Flooring Material", wall_material: "Wall Material",
  selected_deductions: "Standard Deductions", market_value: "Market Value",
  actual_use: "Actual Use", assessment_level: "Assessment Level",
  assessed_value: "Assessed Value", amount_in_words: "Amount in Words",
  effectivity_of_assessment: "Effectivity", appraised_by: "Appraised By", memoranda: "Memoranda",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

function dayKey(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}

function fmtDayHeader(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" });
}

// Maps each field to the step number it lives on
const FIELD_STEP: Record<string, number> = {
  // Step 1 — Property identification & owner
  arp_no: 1, oct_tct_cloa_no: 1, survey_no: 1, pin: 1, lot_no: 1,
  owner_name: 1, owner_address: 1, admin_care_of: 1,
  location_province: 1, location_municipality: 1, location_barangay: 1,
  // Step 2 — Building details
  type_of_building: 2, structure_type: 2, building_permit_no: 2, cct: 2,
  completion_issued_on: 2, date_constructed: 2, date_occupied: 2,
  building_age: 2, unit_cost: 2, number_of_storeys: 2, total_floor_area: 2,
  land_owner: 2, td_arp_no: 2, land_area: 2,
  // Step 3 — Structural materials
  roofing_material: 3, flooring_material: 3, wall_material: 3,
  // Step 4 — Deductions & valuation
  selected_deductions: 4, market_value: 4,
  // Step 5 — Supporting documents
  additional_items: 5,
  // Step 6 — Assessment
  actual_use: 6, assessment_level: 6, assessed_value: 6,
  amount_in_words: 6, effectivity_of_assessment: 6, appraised_by: 6, memoranda: 6,
};

function getCommentStep(fieldName: string | null | undefined): number | null {
  if (!fieldName) return null;
  const fields = fieldName.split(",").map((f) => f.trim()).filter(Boolean);
  for (const f of fields) {
    if (FIELD_STEP[f]) return FIELD_STEP[f];
  }
  return null;
}

interface Props {
  draftId: string | null;
  stepFields?: string[];
  formType?: "building" | "land";
}

const FOCUS_CLASS = "laoo-field-focused";
const FOCUS_DURATION_MS = 2500;
const LS_OPEN_KEY = "review_comments_panel_open";

// Roles that should NOT see municipal-tier comments
const LAOO_TIER = new Set(["laoo", "assistant_provincial_assessor", "provincial_assessor"]);
// Comments authored by municipal-tier that LAOO should not see
const MUNICIPAL_AUTHOR_ROLES = new Set(["municipal_tax_mapper", "municipal_assessor"]);

function CommentSkeleton() {
  return (
    <div className="px-4 py-3 space-y-2 border-b animate-pulse">
      <div className="flex gap-1">
        <div className="h-4 w-20 bg-orange-100 rounded" />
      </div>
      <div className="space-y-1.5">
        <div className="h-3 w-full bg-gray-100 rounded" />
        <div className="h-3 w-4/5 bg-gray-100 rounded" />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 bg-gray-100 rounded-full" />
        <div className="h-3 w-24 bg-gray-100 rounded" />
        <div className="h-3 w-3 bg-gray-100 rounded-full ml-1" />
        <div className="h-3 w-20 bg-gray-100 rounded" />
      </div>
    </div>
  );
}

export function ReviewCommentsFloat({ draftId, stepFields, formType = "building" }: Props) {
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [viewerRole, setViewerRole] = useState<string | null>(null);
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(LS_OPEN_KEY) === "true";
  });
  const [showAll, setShowAll] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(LS_OPEN_KEY, open ? "true" : "false");
  }, [open]);

  useEffect(() => {
    fetch("/api/users/permissions")
      .then((r) => r.json())
      .then((d) => { if (d?.role) setViewerRole(d.role); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!draftId) {
      setHasLoaded(true);
      return;
    }
    setIsLoading(true);

    const endpoint = formType === "land"
      ? `/api/faas/land-improvements/${draftId}/comments`
      : `/api/faas/building-structures/${draftId}/comments`;

    fetch(endpoint)
      .then((r) => r.json())
      .then((result) => {
        if (!result.data) return;
        const allComments = result.data as ReviewComment[];
        setComments(allComments);

        // Apply .has-laoo-comment badge to fields with reviewer comments on this page
        const reviewerComments = allComments.filter(
          (c) => !c.parent_id && c.author_role !== "tax_mapper"
        );
        const commentedFields = new Set<string>();
        for (const c of reviewerComments) {
          if (c.field_name) {
            c.field_name.split(",").map((f) => f.trim()).filter(Boolean).forEach((f) => commentedFields.add(f));
          }
        }
        setTimeout(() => {
          commentedFields.forEach((field) => {
            document.querySelectorAll(`[data-comment-field~="${field}"]`).forEach((el) =>
              el.classList.add("has-laoo-comment")
            );
          });
        }, 100);
      })
      .catch(() => {})
      .finally(() => { setIsLoading(false); setHasLoaded(true); });
  }, [draftId, formType]);

  // Scroll to and briefly highlight the DOM element matching a field name
  const focusField = useCallback((fieldName: string | null | undefined, commentId: string) => {
    if (!fieldName) return;

    if (activeId === commentId) {
      setActiveId(null);
      return;
    }
    setActiveId(commentId);

    const firstField = fieldName.split(",").map((f) => f.trim()).filter(Boolean)[0];
    if (!firstField) return;

    const el = document.querySelector<HTMLElement>(`[data-comment-field~="${firstField}"]`);
    if (!el) return;

    document.querySelectorAll(`.${FOCUS_CLASS}`).forEach((e) => e.classList.remove(FOCUS_CLASS));
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add(FOCUS_CLASS);

    setTimeout(() => {
      el.classList.remove(FOCUS_CLASS);
      setActiveId(null);
    }, FOCUS_DURATION_MS);
  }, [activeId]);

  // All reviewer top-level comments (sorted latest first)
  const allTopLevel = comments
    .filter((c) => {
      if (c.parent_id) return false;
      if (c.author_role === "tax_mapper") return false;
      // LAOO-tier viewers don't see municipal-tier comments
      if (viewerRole && LAOO_TIER.has(viewerRole) && c.author_role && MUNICIPAL_AUTHOR_ROLES.has(c.author_role)) return false;
      return true;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Filtered to current step only
  const filteredTopLevel = allTopLevel.filter((c) => {
    if (!stepFields?.length) return true;
    if (!c.field_name) return true;
    const fields = c.field_name.split(",").map((f) => f.trim()).filter(Boolean);
    return fields.some((f) => stepFields.includes(f));
  });

  const displayedTopLevel = showAll ? allTopLevel : filteredTopLevel;

  const responseMap = new Map<string, ReviewComment[]>();
  comments.filter((c) => c.parent_id).forEach((c) => {
    if (!responseMap.has(c.parent_id!)) responseMap.set(c.parent_id!, []);
    responseMap.get(c.parent_id!)!.push(c);
  });

  // Group displayed comments by day
  const grouped: { day: string; comments: ReviewComment[] }[] = [];
  for (const c of displayedTopLevel) {
    const key = dayKey(c.created_at);
    const last = grouped[grouped.length - 1];
    if (last?.day === key) last.comments.push(c);
    else grouped.push({ day: key, comments: [c] });
  }

  // Hide everything until initial load completes, and then if there are truly no reviewer comments
  if (!hasLoaded || (!isLoading && allTopLevel.length === 0)) return null;

  const hasStepFilter = !!stepFields?.length;

  return (
    <>
      {/* Floating trigger */}
      {!open && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-orange-600 transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            Reviewer Comments
            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-orange-600 text-xs font-bold">
              {isLoading ? "…" : allTopLevel.length}
            </span>
          </button>
        </div>
      )}

      {/* Slide-in panel */}
      {open && (
        <div className="fixed bottom-0 right-0 z-50 flex h-full max-h-screen w-80 flex-col border-l bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b bg-orange-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-semibold text-orange-900">Reviewer Comments</span>
              <span className="ml-1 rounded-full bg-orange-500 px-2 py-0.5 text-xs font-bold text-white">
                {isLoading ? "…" : allTopLevel.length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setOpen(false)}
                title="Minimize"
                className="rounded p-1 text-muted-foreground hover:bg-orange-100 hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              <button
                onClick={() => setOpen(false)}
                title="Minimize panel"
                className="rounded p-1 text-muted-foreground hover:bg-orange-100 hover:text-foreground transition-colors text-xs font-medium"
              >
                Hide
              </button>
            </div>
          </div>

          <div className="border-b bg-orange-50 px-4 py-2 text-xs text-orange-700">
            This form was <strong>returned for review</strong>. Click a comment to jump to that field.
          </div>

          {/* View all / this step toggle — only shown when there's a step filter */}
          {hasStepFilter && !isLoading && (
            <div className="flex items-center justify-between border-b px-4 py-2 bg-gray-50">
              <span className="text-xs text-muted-foreground">
                {showAll
                  ? `All comments (${allTopLevel.length})`
                  : `This step (${filteredTopLevel.length} of ${allTopLevel.length})`}
              </span>
              <button
                onClick={() => setShowAll((v) => !v)}
                className="flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-800 transition-colors"
              >
                {showAll ? (
                  <><ListFilter className="h-3 w-3" /> This step only</>
                ) : (
                  <><LayoutList className="h-3 w-3" /> View all</>
                )}
              </button>
            </div>
          )}

          {/* Comment list */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <>
                <CommentSkeleton />
                <CommentSkeleton />
                <CommentSkeleton />
              </>
            ) : displayedTopLevel.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No comments for this step.
              </div>
            ) : (
              grouped.map(({ day, comments: dayComments }) => (
                <div key={day}>
                  <div className="sticky top-0 z-10 flex items-center gap-2 bg-gray-50 border-y px-4 py-1.5">
                    <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-xs font-semibold text-muted-foreground">{fmtDayHeader(day)}</span>
                  </div>

                  <div className="divide-y">
                    {dayComments.map((c) => {
                      const fields = c.field_name
                        ? c.field_name.split(",").map((f) => f.trim()).filter(Boolean)
                        : [];
                      const responses = responseMap.get(c.id) ?? [];
                      const isActive = activeId === c.id;
                      const hasField = fields.length > 0;
                      const commentStep = getCommentStep(c.field_name);
                      const isOtherStep = commentStep !== null && stepFields?.length
                        ? !fields.some((f) => stepFields.includes(f))
                        : false;

                      return (
                        <div
                          key={c.id}
                          onClick={() => focusField(c.field_name, c.id)}
                          className={`px-4 py-3 space-y-1.5 transition-colors
                            ${hasField ? "cursor-pointer hover:bg-orange-50 active:bg-orange-100" : ""}
                            ${isActive ? "bg-orange-50 border-l-4 border-orange-500" : ""}`}
                        >
                          {/* Step indicator for comments from other pages */}
                          {isOtherStep && commentStep && (
                            <div className="flex items-center gap-1 mb-0.5">
                              <span className="text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200 rounded px-1.5 py-0.5">
                                Step {commentStep}
                              </span>
                            </div>
                          )}
                          {fields.length > 0 && (
                            <div className="flex flex-wrap gap-1 items-center">
                              {fields.map((f) => (
                                <span
                                  key={f}
                                  className="text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200 rounded px-1.5 py-0.5"
                                >
                                  {FIELD_LABELS[f] ?? f}
                                </span>
                              ))}
                              <MousePointerClick className="h-3 w-3 text-orange-400 ml-auto" />
                            </div>
                          )}
                          <p className="text-sm text-foreground">{c.comment_text}</p>
                          {c.suggested_value && (
                            <p className="text-xs text-green-700 bg-green-50 rounded px-2 py-1">
                              Suggested: {c.suggested_value}
                            </p>
                          )}
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>{c.author_name}</span>
                            <Clock className="h-3 w-3 ml-1" />
                            <span>{fmtDate(c.created_at)}</span>
                          </div>

                          {responses.map((r) => (
                            <div
                              key={r.id}
                              className="mt-2 ml-3 border-l-2 border-green-400 pl-2 space-y-0.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <p className="text-xs font-semibold text-green-700">Tax Mapper Response</p>
                              <p className="text-xs text-foreground">{r.comment_text}</p>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <User className="h-3 w-3" />
                                <span>{r.author_name}</span>
                                <Clock className="h-3 w-3 ml-1" />
                                <span>{fmtDate(r.created_at)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
