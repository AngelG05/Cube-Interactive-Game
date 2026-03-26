import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const client =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

/**
 * @param {{ name: string; rating: number; message: string; sessionId?: string }} payload
 * @returns {Promise<{ ok: true } | { ok: false; error: string }>}
 */
export async function submitUserFeedback(payload) {
  if (!client) {
    return {
      ok: false,
      error:
        "Feedback storage is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, and apply the user_feedback migration.",
    }
  }

  const { error } = await client.from("user_feedback").insert({
    name: payload.name.trim(),
    rating: payload.rating,
    message: payload.message.trim(),
    session_id: payload.sessionId,
  })

  if (error) {
    console.error("[Feedback]", error)
    return {
      ok: false,
      error: error.message || "Could not save your feedback. Please try again.",
    }
  }

  return { ok: true }
}
