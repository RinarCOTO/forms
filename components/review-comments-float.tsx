"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageSquare, X, User, Clock, MousePointerClick } from "lucide-react";

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
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

interface Props {
  draftId: string | null;
}

const FOCUS_CLASS = "laoo-field-focused";
const FOCUS_DURATION_MS = 2500;

export function ReviewCommentsFloat({ draftId }: Props) {
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!draftId) return;
    fetch(`/api/building-other-structure/${draftId}/comments`)
      .then((r) => r.json())
      .then((result) => {
        if (result.data) {
          const allComments = result.data as ReviewComment[];
          setComments(allComments);

          // Apply .has-laoo-comment badge to fields with LAOO comments
          const laooComments = allComments.filter(
            (c) => !c.parent_id && c.author_role !== "tax_mapper"
          );
          const commentedFields = new Set<string>();
          for (const c of laooComments) {
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
        }
      })
      .catch(() => {});
  }, [draftId]);

  // Scroll to and briefly highlight the first DOM element matching a field name
  const focusField = useCallback((fieldName: string | null | undefined, commentId: string) => {
    if (!fieldName) return;

    // Toggle off if already active
    if (activeId === commentId) {
      setActiveId(null);
      return;
    }

    setActiveId(commentId);

    const firstField = fieldName.split(",").map((f) => f.trim()).filter(Boolean)[0];
    if (!firstField) return;

    const el = document.querySelector<HTMLElement>(`[data-comment-field~="${firstField}"]`);
    if (!el) return;

    // Remove focus class from any previously focused element
    document.querySelectorAll(`.${FOCUS_CLASS}`).forEach((e) => e.classList.remove(FOCUS_CLASS));

    // Scroll to the element
    el.scrollIntoView({ behavior: "smooth", block: "center" });

    // Apply focus class
    el.classList.add(FOCUS_CLASS);

    // Remove after duration
    setTimeout(() => {
      el.classList.remove(FOCUS_CLASS);
      setActiveId(null);
    }, FOCUS_DURATION_MS);
  }, [activeId]);

  // Separate LAOO comments and tax mapper responses
  const laooComments = comments.filter((c) => !c.parent_id && c.author_role !== "tax_mapper");
  const responseMap = new Map<string, ReviewComment[]>();
  comments.filter((c) => c.parent_id).forEach((c) => {
    if (!responseMap.has(c.parent_id!)) responseMap.set(c.parent_id!, []);
    responseMap.get(c.parent_id!)!.push(c);
  });

  if (laooComments.length === 0 || dismissed) return null;

  return (
    <>
      {/* Floating trigger button */}
      {!open && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-1">
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-orange-600 transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            Reviewer Comments
            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-orange-600 text-xs font-bold">
              {laooComments.length}
            </span>
          </button>
          {/* Dismiss button — fully hides the float for this session */}
          <button
            onClick={() => setDismissed(true)}
            title="Hide reviewer comments"
            className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-200 text-orange-700 hover:bg-orange-300 transition-colors shadow"
          >
            <X className="h-3 w-3" />
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
                {laooComments.length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {/* Close panel → back to trigger button */}
              <button
                onClick={() => setOpen(false)}
                title="Minimize"
                className="rounded p-1 text-muted-foreground hover:bg-orange-100 hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              {/* Dismiss entirely */}
              <button
                onClick={() => { setOpen(false); setDismissed(true); }}
                title="Hide reviewer comments"
                className="rounded p-1 text-muted-foreground hover:bg-red-100 hover:text-red-600 transition-colors text-xs font-medium"
              >
                Hide
              </button>
            </div>
          </div>

          {/* Warning banner */}
          <div className="border-b bg-orange-50 px-4 py-2 text-xs text-orange-700">
            This form was <strong>returned for review</strong>. Click a comment to jump to that field.
          </div>

          {/* Comment list */}
          <div className="flex-1 overflow-y-auto divide-y">
            {laooComments.map((c) => {
              const fields = c.field_name
                ? c.field_name.split(",").map((f) => f.trim()).filter(Boolean)
                : [];
              const responses = responseMap.get(c.id) ?? [];
              const isActive = activeId === c.id;
              const hasField = fields.length > 0;
              return (
                <div
                  key={c.id}
                  onClick={() => focusField(c.field_name, c.id)}
                  className={`px-4 py-3 space-y-1.5 transition-colors ${
                    hasField
                      ? "cursor-pointer hover:bg-orange-50 active:bg-orange-100"
                      : ""
                  } ${isActive ? "bg-orange-50 border-l-4 border-orange-500" : ""}`}
                >
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

                  {/* Tax mapper responses */}
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
      )}
    </>
  );
}
