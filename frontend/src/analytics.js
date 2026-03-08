import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Supabase client — null when env vars are missing (local dev without config)
const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

const IS_DEV = !supabase

function devLog(...args) {
  if (IS_DEV) console.log("[Analytics DEV — not persisted]", ...args)
}

// ─────────────────────────────────────────────────────────────────────────────
// Device detection helpers
// ─────────────────────────────────────────────────────────────────────────────
function getDeviceInfo() {
  const ua = navigator.userAgent
  let deviceType = "desktop"
  if (/Mobi|Android|iPhone/i.test(ua)) deviceType = "mobile"
  else if (/iPad|Tablet/i.test(ua)) deviceType = "tablet"

  let browserName = "unknown"
  if (/Edg\//i.test(ua)) browserName = "edge"
  else if (/Chrome\//i.test(ua)) browserName = "chrome"
  else if (/Firefox\//i.test(ua)) browserName = "firefox"
  else if (/Safari\//i.test(ua)) browserName = "safari"

  return {
    deviceType,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    browserName,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AnalyticsService
// ─────────────────────────────────────────────────────────────────────────────
class AnalyticsService {
  constructor() {
    this._resetState()
  }

  _resetState() {
    this.sessionUuid = null
    this.startTime = null
    this.isSessionActive = false

    // Event queue — flushed on finish or every 30 s
    this._eventQueue = []
    this._flushInterval = null
    this._visibilityHandler = null

    // Per-cube engagement tracking (cubeIndex → object)
    this._cubeEngagement = {}

    // Aggregate counters written to the sessions row on finish
    this.connectionOrder = 0
    this.totalFocuses = 0
    this.totalRotations = 0
    this.totalDrags = 0
    this.totalConnectionsCreated = 0
    this.totalConnectionsRemoved = 0
    this.totalFailedAttempts = 0
    this.resetCount = 0

    // Pre-session walkthrough flags — preserved across startSession calls
    this._walkthroughCompleted = false
    this._walkthroughSkipped = false
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  _offsetMs() {
    return this.startTime ? Date.now() - this.startTime : 0
  }

  _queueEvent(type, payload = {}) {
    if (!this.sessionUuid) return
    this._eventQueue.push({
      session_uuid: this.sessionUuid,
      event_type: type,
      offset_ms: this._offsetMs(),
      payload,
    })
    devLog("queued:", type, payload)
  }

  async _flushEvents() {
    if (!supabase || this._eventQueue.length === 0) return
    const batch = [...this._eventQueue]
    this._eventQueue = []
    const { error } = await supabase.from("events").insert(batch)
    if (error) {
      console.error("[Analytics] flush error", error)
      // Re-queue on failure so events aren't lost
      this._eventQueue = [...batch, ...this._eventQueue]
    }
  }

  async _flushEngagement() {
    if (!supabase) return
    const rows = Object.values(this._cubeEngagement).map((eng) => ({
      session_uuid: this.sessionUuid,
      cube_index: eng.cubeIndex,
      cube_phase: eng.cubePhase,
      focus_count: eng.focusCount,
      total_dwell_ms: eng.totalDwellMs,
      faces_seen: [...eng.facesSeen],
      faces_seen_count: eng.facesSeen.size,
      was_connected: eng.wasConnected,
      rotations_count: eng.rotationsCount,
    }))
    if (rows.length === 0) return
    const { error } = await supabase.from("cube_engagement").insert(rows)
    if (error) console.error("[Analytics] engagement flush error", error)
  }

  _getOrCreateEngagement(cubeIndex, phase) {
    if (!this._cubeEngagement[cubeIndex]) {
      this._cubeEngagement[cubeIndex] = {
        cubeIndex,
        cubePhase: phase,
        focusCount: 0,
        totalDwellMs: 0,
        facesSeen: new Set(),
        rotationsCount: 0,
        focusStartTime: null,
        wasConnected: false,
      }
    }
    return this._cubeEngagement[cubeIndex]
  }

  _setupAbandonHandlers() {
    this._visibilityHandler = () => {
      if (document.hidden && this.isSessionActive) {
        const sessionUuid = this.sessionUuid  // capture before async ops
        const durationMs = this._offsetMs()
        this._queueEvent("session_abandoned", {
          triggerReason: "tab_hidden",
          durationBeforeMs: durationMs,
        })
        // Write partial aggregate data to the sessions row before the browser
        // suspends the page — fire-and-forget is the best we can do here
        if (supabase) {
          supabase
            .from("sessions")
            .update({
              duration_ms: durationMs,
              total_cubes_focused: this.totalFocuses,
              total_face_rotations: this.totalRotations,
              total_drags: this.totalDrags,
              total_connections_created: this.totalConnectionsCreated,
              total_connections_removed: this.totalConnectionsRemoved,
              total_failed_attempts: this.totalFailedAttempts,
            })
            .eq("session_uuid", sessionUuid)
            .then(({ error }) => {
              if (error) console.error("[Analytics] abandon update error", error)
            })
        }
        // Flush both event queue AND engagement so no data is lost on abandon
        Promise.all([this._flushEvents(), this._flushEngagement()])
      }
    }
    document.addEventListener("visibilitychange", this._visibilityHandler)
  }

  _teardown() {
    if (this._flushInterval) clearInterval(this._flushInterval)
    if (this._visibilityHandler) {
      document.removeEventListener("visibilitychange", this._visibilityHandler)
    }
  }

  // ── Pre-session walkthrough notifications ─────────────────────────────────
  // Called from App.jsx before a session is started.

  notifyWalkthroughCompleted() {
    this._walkthroughCompleted = true
    this._queueEvent("walkthrough_completed", {})
  }

  notifyWalkthroughSkipped(atStep) {
    this._walkthroughSkipped = true
    this._queueEvent("walkthrough_skipped", { atStep })
  }

  // ── Session lifecycle ──────────────────────────────────────────────────────

  async startSession() {
    // Tear down any previous session cleanly
    this._teardown()
    this._resetState()

    this.sessionUuid = crypto.randomUUID()
    this.startTime = Date.now()
    this.isSessionActive = true

    const device = getDeviceInfo()

    if (supabase) {
      const { error } = await supabase.from("sessions").insert({
        session_uuid: this.sessionUuid,
        started_at: new Date(this.startTime).toISOString(),
        device_type: device.deviceType,
        screen_width: device.screenWidth,
        screen_height: device.screenHeight,
        browser_name: device.browserName,
        used_walkthrough: this._walkthroughCompleted,
        walkthrough_skipped: this._walkthroughSkipped,
      })
      if (error) console.error("[Analytics] startSession error", error)
    }

    this._queueEvent("session_start", { ...device })
    this._setupAbandonHandlers()
    this._flushInterval = setInterval(() => this._flushEvents(), 30_000)

    devLog("session started", this.sessionUuid)
    return this.sessionUuid
  }

  async finishSession({ finalConnectionCount, storyPath, phaseSequence, storyText }) {
    if (!this.sessionUuid) return
    // Capture UUID now — startSession() could overwrite this.sessionUuid
    // before the awaits below complete if the user starts a new session fast.
    const sessionUuid = this.sessionUuid
    const durationMs = Date.now() - this.startTime
    this.isSessionActive = false

    this._queueEvent("session_finished", {
      durationMs,
      finalConnectionCount,
      totalFocuses: this.totalFocuses,
      totalRotations: this.totalRotations,
      totalDrags: this.totalDrags,
      totalConnectionsCreated: this.totalConnectionsCreated,
      totalConnectionsRemoved: this.totalConnectionsRemoved,
      totalFailedAttempts: this.totalFailedAttempts,
    })

    await Promise.all([this._flushEvents(), this._flushEngagement()])

    if (supabase) {
      const { error } = await supabase
        .from("sessions")
        .update({
          completed_at: new Date().toISOString(),
          duration_ms: durationMs,
          was_completed: true,
          total_cubes_focused: this.totalFocuses,
          total_face_rotations: this.totalRotations,
          total_drags: this.totalDrags,
          total_connections_created: this.totalConnectionsCreated,
          total_connections_removed: this.totalConnectionsRemoved,
          total_failed_attempts: this.totalFailedAttempts,
          final_connection_count: finalConnectionCount,
          story_cube_sequence: storyPath,
          story_phase_sequence: phaseSequence,
          story_text: storyText,
          session_reset_count: this.resetCount,
        })
        .eq("session_uuid", sessionUuid)
      if (error) console.error("[Analytics] finishSession error", error)
    }

    this._teardown()
    devLog("session finished", { durationMs, finalConnectionCount })
  }

  // ── Granular event methods ─────────────────────────────────────────────────

  logCubeFocused(cubeIndex, phase, faceIndex, faceContent) {
    if (!this.isSessionActive) return
    this.totalFocuses++
    const eng = this._getOrCreateEngagement(cubeIndex, phase)
    eng.focusCount++
    eng.facesSeen.add(faceIndex)
    eng.focusStartTime = Date.now()
    this._queueEvent("cube_focused", { cubeIndex, phase, faceIndex, faceContent })
  }

  logCubeUnfocused(cubeIndex, faceIndex, faceContent) {
    if (!this.isSessionActive) return
    const eng = this._cubeEngagement[cubeIndex]
    let dwellMs = 0
    if (eng?.focusStartTime) {
      dwellMs = Date.now() - eng.focusStartTime
      eng.totalDwellMs += dwellMs
      eng.focusStartTime = null
    }
    this._queueEvent("cube_unfocused", { cubeIndex, faceIndex, faceContent, dwellMs })
  }

  logFaceRotated(cubeIndex, phase, direction, fromFace, toFace, toFaceContent) {
    if (!this.isSessionActive) return
    this.totalRotations++
    const eng = this._getOrCreateEngagement(cubeIndex, phase)
    eng.facesSeen.add(toFace)
    eng.rotationsCount++
    this._queueEvent("face_rotated", {
      cubeIndex,
      phase,
      direction,
      fromFace,
      toFace,
      toFaceContent,
    })
  }

  logCubeDragged(cubeIndex, fromXY, toXY) {
    if (!this.isSessionActive) return
    this.totalDrags++
    const distancePx = Math.round(
      Math.sqrt((toXY.x - fromXY.x) ** 2 + (toXY.y - fromXY.y) ** 2)
    )
    this._queueEvent("cube_dragged", { cubeIndex, fromXY, toXY, distancePx })
  }

  async logConnectionCreated({
    fromCube,
    fromPhase,
    fromFaceIndex,
    fromFaceContent,
    toCube,
    toPhase,
    toFaceIndex,
    toFaceContent,
    totalConnections,
  }) {
    if (!this.isSessionActive) return
    this.totalConnectionsCreated++
    this.connectionOrder++

    const fromEng = this._getOrCreateEngagement(fromCube, fromPhase)
    const toEng = this._getOrCreateEngagement(toCube, toPhase)
    fromEng.wasConnected = true
    toEng.wasConnected = true

    this._queueEvent("connection_created", {
      fromCube,
      fromPhase,
      fromFaceIndex,
      fromFaceContent,
      toCube,
      toPhase,
      toFaceIndex,
      toFaceContent,
      totalConnections,
    })

    if (supabase) {
      const { error } = await supabase.from("connections_log").insert({
        session_uuid: this.sessionUuid,
        connection_order: this.connectionOrder,
        from_cube_index: fromCube,
        from_cube_phase: fromPhase,
        from_face_index: fromFaceIndex,
        from_face_content: fromFaceContent,
        to_cube_index: toCube,
        to_cube_phase: toPhase,
        to_face_index: toFaceIndex,
        to_face_content: toFaceContent,
        cubes_focused_before_this: this.totalFocuses,
      })
      if (error) console.error("[Analytics] logConnectionCreated error", error)
    }
  }

  async logConnectionRemoved(fromCube, toCube) {
    if (!this.isSessionActive) return
    this.totalConnectionsRemoved++
    this._queueEvent("connection_removed", { fromCube, toCube })

    if (supabase) {
      const { error } = await supabase
        .from("connections_log")
        .update({ was_subsequently_removed: true })
        .eq("session_uuid", this.sessionUuid)
        .eq("from_cube_index", fromCube)
        .eq("to_cube_index", toCube)
        .eq("was_subsequently_removed", false)
      if (error) console.error("[Analytics] logConnectionRemoved error", error)
    }
  }

  logConnectionFailed(reason, fromCube, toCube) {
    if (!this.isSessionActive) return
    this.totalFailedAttempts++
    this._queueEvent("connection_failed", { reason, fromCube, toCube })
  }

  logStoryGenerated(cubeSequence, phaseSequence, faceContents, fullText) {
    if (!this.isSessionActive) return
    this._queueEvent("story_generated", {
      cubeSequence,
      phaseSequence,
      faceContents,
      fullText,
    })
  }

  async logSessionReset(connectionsAtReset, durationBeforeResetMs) {
    this.resetCount++
    if (!this.sessionUuid) return
    // Capture UUID now — startSession() could change it before the awaits complete
    const sessionUuid = this.sessionUuid

    // Mark session as inactive immediately so no further events get queued
    this.isSessionActive = false
    this._queueEvent("session_reset", { connectionsAtReset, durationBeforeResetMs })

    // Flush events AND engagement — engagement is lost without this
    await Promise.all([this._flushEvents(), this._flushEngagement()])

    // Write all accumulated aggregates so reset sessions have full data,
    // not just session_reset_count
    if (supabase) {
      const { error } = await supabase
        .from("sessions")
        .update({
          duration_ms: durationBeforeResetMs,
          session_reset_count: this.resetCount,
          total_cubes_focused: this.totalFocuses,
          total_face_rotations: this.totalRotations,
          total_drags: this.totalDrags,
          total_connections_created: this.totalConnectionsCreated,
          total_connections_removed: this.totalConnectionsRemoved,
          total_failed_attempts: this.totalFailedAttempts,
          final_connection_count: connectionsAtReset,
        })
        .eq("session_uuid", sessionUuid)
      if (error) console.error("[Analytics] logSessionReset update error", error)
    }

    // Stop the periodic flush and abandon listener
    this._teardown()
    devLog("session reset", { connectionsAtReset, durationBeforeResetMs })
  }
}

export const analytics = new AnalyticsService()
