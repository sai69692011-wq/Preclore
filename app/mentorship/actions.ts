// src/app/mentorship/actions.ts
// ─────────────────────────────────────────────────────────────────────────────
// The Legal Facilitator Shield — Instagram-style mentorship requests.
// Contact stays locked until the RESEARCHER accepts (the Parental Buffer
// hook: the accept step is where a guardian-approval gate can slot in later).
// Email visibility itself is enforced by RLS + the researcher_directory view
// (migration.sql); these actions only manage request state.
// ─────────────────────────────────────────────────────────────────────────────

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

export interface MentorshipResult {
  ok: boolean;
  error?: string;
  status?: "pending" | "accepted" | "declined";
}

/** Requester side: send (or re-send after a decline) a mentorship request. */
export async function requestMentorship(
  researcherId: string,
  message: string | null
): Promise<MentorshipResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to request mentorship." };
  if (user.id === researcherId)
    return { ok: false, error: "That's your own profile." };

  const { error } = await supabase.from("mentorship_requests").upsert(
    {
      requester_id: user.id,
      researcher_id: researcherId,
      message: message?.trim() || null,
      status: "pending",
      created_at: new Date().toISOString(),
      responded_at: null,
    },
    { onConflict: "requester_id,researcher_id" }
  );

  if (error) return { ok: false, error: error.message };
  revalidatePath("/mentor");
  return { ok: true, status: "pending" };
}

/** Researcher side: the Parental Buffer decision point. Only the researcher
 *  the request targets may respond (RLS double-enforces this). */
export async function respondToMentorship(
  requestId: string,
  decision: "accepted" | "declined"
): Promise<MentorshipResult> {
  if (decision !== "accepted" && decision !== "declined")
    return { ok: false, error: "Invalid response." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in required." };

  const { error } = await supabase
    .from("mentorship_requests")
    .update({ status: decision, responded_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("researcher_id", user.id); // belt-and-suspenders with RLS

  if (error) return { ok: false, error: error.message };
  revalidatePath("/mentor");
  return { ok: true, status: decision };
}

/** Current state of the caller's request to a researcher (for button state). */
export async function getMentorshipStatus(
  researcherId: string
): Promise<{ status: "none" | "pending" | "accepted" | "declined" }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "none" };

  const { data } = await supabase
    .from("mentorship_requests")
    .select("status")
    .eq("requester_id", user.id)
    .eq("researcher_id", researcherId)
    .maybeSingle();

  return { status: (data?.status as any) ?? "none" };
}
