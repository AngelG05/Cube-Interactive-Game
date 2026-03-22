import { useState, useRef, useEffect } from "react"
import "./App.css"
import { analytics } from "./analytics"
import FeedbackSection from "./Feedback"

// HIJLI STORY - 25 Cubes organized into 5 narrative phases
const cubeData = [
  // PHASE 1 — BEGINNING (Cubes 1-5)
  ["A provincial dream settling into captivity.", "Administrative walls bending into detention.", "The 1930 Act lingering like a shadow.", "Preventive detention shaping Bengal's horizon.", "Overflowed prisons echoing inside new boundaries.", "Hijli emerging from abandoned intentions."],
  ["Barbed wire holding the landscape still.", "Watchtowers cutting silence into the sky.", "A Panopticon breathing across dry earth.", "Segregated barracks muting organisation.", "Isolation deepening control near Kharagpur.", "Minimal care suspended beneath maximum surveillance."],
  ["Young radicals marked by intelligence murmurs.", "Revolutionaries and pacifists sharing confinement.", "\"Subversive intent\" replacing evidence entirely.", "Anushilan and Jugantar voices compressed inward.", "No charge, no trial, only containment.", "Networks held still by silence."],
  ["Emergency ordinances pressing Bengal's breath.", "A thousand arrests shaping the mood.", "Hijli absorbing the strain of unrest.", "Preventive detention thickening the air.", "A province watched more than heard.", "Fear and policy woven tightly together."],
  ["Three names slipping beyond the boundary.", "An escape humming under the night.", "Strict watch folding over the camp.", "A birthday imagined inside confinement.", "The atmosphere waiting for a break.", "Darkness preparing its own vocabulary."],
  // PHASE 2 — TENSIONS & APPROACH (Cubes 6-10)
  ["A cry tearing through Hijli's night.", "\"They are going to kill!\" (Prisoner)", "Panic suspended in unseen corners.", "Fear spreading without direction.", "Darkness carrying unsteady truths.", "Voices rising before meaning forms."],
  ["An alarm trembling through the barracks.", "Havildar Bakshi's authority thick in the air.", "Rifles forming their own geometry.", "Shadows moving like command.", "A charged stillness preceding violence.", "Hierarchy breathing through narrow corridors."],
  ["\"They attacked us first.\" (Officials)", "\"We were unarmed.\" (Prisoners)", "Truth suspended between competing lights.", "Darkness editing every perspective.", "Two narratives refusing to meet.", "Certainty dissolving into contradiction."],
  ["Close quarters thickening tempers.", "Barracks holding unspoken friction.", "Force gathering without direction.", "Tension rising like trapped heat.", "Camp walls absorbing unrest quietly.", "Anger accumulating in confined spaces."],
  ["Tarakeswar's presence against a stone boundary.", "Santosh's stillness beside unfolding danger.", "Youth framed by unlit corners.", "A night balancing on two names.", "Lives poised within tightening shadows.", "Hijli holding its breath."],
  // PHASE 3 — THE FIRING (Cubes 11-15)
  ["Tarakeswar's name carried by two bullets.", "Santosh's body answering silent rifles.", "Blood settling on the prison floor.", "Unarmed detainees shaped by gunfire.", "Hijli remembered through two fallen youths.", "A night marked by irreversible violence."],
  ["Nearly forty bodies holding pain.", "Saili Ghosh among the injured breath.", "First aid rising from trembling hands.", "Hospital refusal hanging in the air.", "Wounds spreading quiet testimony.", "A barrack saturated with suffering."],
  ["\"Only two are dead.\" (Officer)", "\"They should be taught a good lesson.\" (Officer)", "Authority speaking through cruelty.", "Humiliation settling on fresh blood.", "News held back under command.", "Power tightening its language."],
  ["Tear gas drifting through women's quarters.", "Grief disciplined under surveillance.", "Rifle butt-ends bruising the night.", "Violence pressing close to the skin.", "Chaos echoing through narrow walls.", "A camp inhaling fear deeply."],
  ["A sketch pencil lying beside silence.", "Santosh's unfinished drawing becoming witness.", "Art interrupted by gunfire.", "Memory anchored in small things.", "A final trace left on the floor.", "Testimony surviving as a fragment."],
  // PHASE 4 — AFTERMATH (Cubes 16-20)
  ["Bose's resolve standing at Hijli's gate.", "Police resistance folding into protest.", "Two coffins gathering a city's sorrow.", "Mourning travelling from Kharagpur to Calcutta.", "Resignation becoming a political gesture.", "A leader shaped by grief."],
  ["Three hundred girls entering the movement's fire.", "Midnight slogans shaking quiet streets.", "\"Atyacharir Rakta Chai!\" (Students)", "Youth turning pain into thunder.", "A province stirred by young voices.", "Resistance rising from restless hearts."],
  ["Bodies refusing food to claim justice.", "Hunger shaping a collective stance.", "Inquiry forced by moral pressure.", "\"Altogether unjustified.\" (Committee)", "Truth opening through refusal.", "A demand pressed into history."],
  ["\"I am not a political leader.\" (Tagore)", "\"This firing has darkened our minds.\" (Tagore)", "Prashna rising from wounded vision.", "\"Hidden violence, cruelty of night's shadows.\" (Tagore)", "A poet standing before tragedy.", "Words carrying unbearable light."],
  ["\"How long will the British murder our youths?\" (Bose)", "Unity called across ideological lines.", "Town Hall swelling before sunrise.", "Bengal's leaders naming the injustice.", "Protest forming its own architecture.", "A province speaking without restraint."],
  // PHASE 5 — RESPONSE & LEGACY (Cubes 21-25)
  ["\"Wanton firing in Hijli.\" (Gandhi)", "\"Detenus—kept without trial—shot dead.\" (Gandhi)", "Nonviolence asked to endure provocation.", "Barbarity staining the freedom struggle.", "A moral wound shaping response.", "Calm carried through storm."],
  ["\"Shocking incidents at Hijli.\" (Nehru)", "\"Altogether inhuman and unpardonable.\" (Nehru)", "Bengal demanding attention at last.", "Inquiry called from Delhi's letters.", "Leadership stirred by outrage.", "A nation absorbing the blow."],
  ["\"Never be caught doing anything.\" (Assembly comment)", "Prisoners guarding the bodies as shields.", "\"Shoot us also,\" they declare.", "Goondas moving under official sanction.", "Ordinance arrests shaping everyday fear.", "Hijli becoming symbol and warning."],
  ["\"This is our answer to Hijli.\" (Note)", "A magistrate struck; a youth hanged.", "Sacrifice echoing through Bengal's veins.", "\"Our sacrifices will awaken India.\" (Note)", "Violence circling back to its source.", "Vande Mataram carried in resolve."],
  ["Hijli closing, reopening, finally emptying out.", "War shifting prisoners into new shadows.", "A camp reborn as IIT Kharagpur.", "\"Symbolic of India's future.\" (Nehru)", "From barbed wire to convocation cloth.", "Memory built into new walls."],
]

// Basic geometry constants for spatial reasoning
const TILE_SIZE = 110 // must match CSS `.tile` size
const ADJACENCY_THRESHOLD = 150 // pixel distance within which cubes are considered connected

// Get narrative phase for a cube (0-indexed)
const getPhase = (cubeIndex) => {
  if (cubeIndex < 5) return 1 // Beginning
  if (cubeIndex < 10) return 2 // Tensions & Approach
  if (cubeIndex < 15) return 3 // The Firing
  if (cubeIndex < 20) return 4 // Aftermath
  return 5 // Response & Legacy
}

// ============================================================================
// ZONE-BASED PLACEMENT SYSTEM
// ============================================================================
// Zones are invisible spatial regions that guide initial cube placement.
// Each narrative phase is assigned a zone, creating soft spatial clustering
// without enforcing any gameplay constraints.

const GRID_SIZE = 5 // 5x5 grid
const CELL_SPACING = 150 // pixels between cube centers

// Define spatial zones for each narrative phase
// Each zone specifies a region as {minX, maxX, minY, maxY} in grid coordinates (0-4)
const PHASE_ZONES = {
  1: { minX: 0, maxX: 1, minY: 0, maxY: 1 }, // Beginning: Top-left
  2: { minX: 3, maxX: 4, minY: 0, maxY: 1 }, // Tension: Top-right
  3: { minX: 1, maxX: 3, minY: 2, maxY: 3 }, // Event: Center
  4: { minX: 0, maxX: 2, minY: 3, maxY: 4 }, // Aftermath: Bottom-left
  5: { minX: 2, maxX: 4, minY: 3, maxY: 4 }, // Legacy: Bottom-right
}

// Seeded random number generator (simple Linear Congruential Generator)
const seededRandom = (seed) => {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

// Get all available grid cells for a zone (optionally including spillover)
const getZoneCells = (zone, allowSpillover = false) => {
  const cells = []
  
  // Core zone cells
  for (let x = zone.minX; x <= zone.maxX; x++) {
    for (let y = zone.minY; y <= zone.maxY; y++) {
      cells.push({ x, y, isCore: true })
    }
  }
  
  // Add spillover cells (adjacent to zone boundaries)
  if (allowSpillover) {
    for (let x = Math.max(0, zone.minX - 1); x <= Math.min(GRID_SIZE - 1, zone.maxX + 1); x++) {
      for (let y = Math.max(0, zone.minY - 1); y <= Math.min(GRID_SIZE - 1, zone.maxY + 1); y++) {
        // Skip if already in core zone
        if (x >= zone.minX && x <= zone.maxX && y >= zone.minY && y <= zone.maxY) continue
        cells.push({ x, y, isCore: false })
      }
    }
  }
  
  return cells
}

// Shuffle array using Fisher-Yates algorithm with seeded random
const shuffleArray = (arr, random) => {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Generate zone-based initial positions for all cubes
const generateZoneBasedPositions = (seed = 12345) => {
  const random = seededRandom(seed)
  const positions = []
  const usedCells = new Set()
  
  // Group cubes by phase
  const cubesByPhase = {}
  for (let i = 0; i < cubeData.length; i++) {
    const phase = getPhase(i)
    if (!cubesByPhase[phase]) cubesByPhase[phase] = []
    cubesByPhase[phase].push(i)
  }
  
  // Place cubes for each phase
  for (const [phase, cubeIndices] of Object.entries(cubesByPhase)) {
    const zone = PHASE_ZONES[parseInt(phase)]
    const numCubes = cubeIndices.length
    // Allow 1-2 cubes per phase to spill into neighboring zones
    const numSpillover = Math.min(2, Math.floor(random() * 3)) // 0-2 cubes
    
    // Get available cells (core + spillover)
    let availableCells = getZoneCells(zone, true)
    
    // Filter out already used cells
    availableCells = availableCells.filter(
      cell => !usedCells.has(`${cell.x},${cell.y}`)
    )
    
    // Separate core and spillover cells
    const coreCells = availableCells.filter(c => c.isCore)
    const spilloverCells = availableCells.filter(c => !c.isCore)
    
    // Shuffle for randomization
    const shuffledCore = shuffleArray(coreCells, random)
    const shuffledSpillover = shuffleArray(spilloverCells, random)
    
    // Assign positions
    for (let i = 0; i < numCubes; i++) {
      const cubeIndex = cubeIndices[i]
      let cell
      
      // First (numCubes - numSpillover) cubes go to core zone
      if (i < numCubes - numSpillover && shuffledCore.length > 0) {
        cell = shuffledCore.shift()
      } else if (shuffledSpillover.length > 0) {
        // Spillover cubes
        cell = shuffledSpillover.shift()
      } else if (shuffledCore.length > 0) {
        // Fallback to core if spillover exhausted
        cell = shuffledCore.shift()
      } else {
        // Last resort: find any unused cell
        for (let x = 0; x < GRID_SIZE; x++) {
          for (let y = 0; y < GRID_SIZE; y++) {
            if (!usedCells.has(`${x},${y}`)) {
              cell = { x, y }
              break
            }
          }
          if (cell) break
        }
      }
      
      if (cell) {
        usedCells.add(`${cell.x},${cell.y}`)
        positions[cubeIndex] = {
          x: cell.x * CELL_SPACING,
          y: cell.y * CELL_SPACING,
        }
      }
    }
  }
  
  return positions
}

// ============================================================================
// END ZONE-BASED PLACEMENT SYSTEM
// ============================================================================

// Face rotations: [rotateX, rotateY] for each face
const faceRotations = [
  [0, 0],      // front
  [0, -90],    // right (rotate counter-clockwise to bring right to front)
  [0, 180],    // back
  [0, 90],     // left (rotate clockwise to bring left to front)
  [-90, 0],    // top
  [90, 0],     // bottom
]

// Navigation map: [left, right, up, down]
const navigationMap = {
  0: [3, 1, 4, 5],  // front -> left, right, top, bottom
  1: [0, 2, 4, 5],  // right -> front, back, top, bottom
  2: [1, 3, 4, 5],  // back -> right, left, top, bottom
  3: [2, 0, 4, 5],  // left -> back, front, top, bottom
  4: [3, 1, 2, 0],  // top -> left, right, back, front
  5: [3, 1, 0, 2],  // bottom -> left, right, front, back
}

// Compute an undirected spatial graph of cubes based on their positions.
// Nodes: cube indices. Edges: cubes whose centers are within ADJACENCY_THRESHOLD.
const computeSpatialGraph = (positions) => {
  const nodes = positions.map((pos, index) => ({
    id: index,
    x: pos.x,
    y: pos.y,
  }))

  const edges = []
  const adjacency = positions.map(() => [])

  for (let i = 0; i < positions.length; i++) {
    const a = positions[i]
    const ax = a.x + TILE_SIZE / 2
    const ay = a.y + TILE_SIZE / 2

    for (let j = i + 1; j < positions.length; j++) {
      const b = positions[j]
      const bx = b.x + TILE_SIZE / 2
      const by = b.y + TILE_SIZE / 2

      const dx = ax - bx
      const dy = ay - by
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist <= ADJACENCY_THRESHOLD) {
        edges.push({ from: i, to: j, distance: dist })
        adjacency[i].push(j)
        adjacency[j].push(i)
      }
    }
  }

  const visited = new Array(positions.length).fill(false)
  const components = []

  for (let i = 0; i < positions.length; i++) {
    if (visited[i]) continue
    const stack = [i]
    const component = []

    while (stack.length) {
      const current = stack.pop()
      if (visited[current]) continue
      visited[current] = true
      component.push(current)
      adjacency[current].forEach((neighbor) => {
        if (!visited[neighbor]) {
          stack.push(neighbor)
        }
      })
    }

    if (component.length) {
      components.push(component)
    }
  }

  return { nodes, edges, adjacency, components }
}

function App() {
  const [positions, setPositions] = useState(() => generateZoneBasedPositions())

  const [focused, setFocused] = useState(null)
  const [focusedPosition, setFocusedPosition] = useState(null)
  const [faceIndex, setFaceIndex] = useState(0)
  const [cubeFaceIndices, setCubeFaceIndices] = useState(() => 
    Array(cubeData.length).fill(0).map(() => Math.floor(Math.random() * 6))
  )
  const [isExiting, setIsExiting] = useState(false)

  // --- Node-based connection state ---
  // Connections: array of {from: {cubeIndex, nodePosition}, to: {cubeIndex, nodePosition}}
  const [connections, setConnections] = useState([])
  // Selected node: {cubeIndex, nodePosition} or null
  const [selectedNode, setSelectedNode] = useState(null)
  // Toast notifications
  const [toasts, setToasts] = useState([])
  
  // --- Interaction analytics state ---
  // eslint-disable-next-line no-unused-vars
  const [interactionLog, setInteractionLog] = useState([])
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [sessionId, setSessionId] = useState(0)
  const [resultSentence, setResultSentence] = useState("")
  const [sessionFinished, setSessionFinished] = useState(false)

  // Timer state: elapsed milliseconds since session start
  const [elapsedMs, setElapsedMs] = useState(0)
  const startTimeRef = useRef(null)
  const timerRef = useRef(null)

  // Walkthrough state
  const [showWalkthrough, setShowWalkthrough] = useState(false)
  const [walkthroughStep, setWalkthroughStep] = useState(0)

  const dragging = useRef(null)
  const offset = useRef({ x: 0, y: 0 })
  const hasDragged = useRef(false)
  const startPos = useRef({ x: 0, y: 0 })
  const dragStartCubePos = useRef({ x: 0, y: 0 })
  const touchStart = useRef({ x: 0, y: 0 })
  const isSwiping = useRef(false)

  // Toast notification helper
  const showToast = (message, type = "info") => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }

  // Walkthrough steps configuration
  const walkthroughSteps = [
    {
      target: ".tile",
      title: "Welcome to Hijli Story Cubes! 📖",
      content: "Explore the Hijli Detention Camp story through interactive cubes. Each cube contains fragments of this historical narrative.",
      position: "center",
    },
    {
      target: ".tile",
      title: "Drag Cubes",
      content: "Click and drag any cube to move it around the canvas. Arrange them as you explore the story.",
      position: "bottom",
    },
    {
      target: ".tile",
      title: "Focus on a Cube",
      content: "Click on any cube to focus and see it in 3D. Each cube has 6 different text fragments!",
      position: "bottom",
    },
    {
      target: ".session-controls",
      title: "Session Controls",
      content: "Start a session to begin creating story connections. The timer tracks your exploration time.",
      position: "bottom",
    },
    {
      target: ".connection-node",
      title: "Connect the Story",
      content: "Click on nodes (small circles on cubes) to create connections. Build your narrative path by linking cubes together.",
      position: "bottom",
    },
    {
      target: ".session-button-result",
      title: "Generate Your Story",
      content: "Once you've created connections, click Result to see your unique story sequence!",
      position: "bottom",
    },
  ]

  // Check if user has seen walkthrough
  useEffect(() => {
    const hasSeenWalkthrough = localStorage.getItem("hijli-walkthrough-completed")
    if (!hasSeenWalkthrough) {
      // Small delay before showing walkthrough
      setTimeout(() => setShowWalkthrough(true), 500)
    }
  }, [])

  const handleNextStep = () => {
    if (walkthroughStep < walkthroughSteps.length - 1) {
      setWalkthroughStep((prev) => prev + 1)
    } else {
      handleCompleteWalkthrough()
    }
  }

  const handlePrevStep = () => {
    if (walkthroughStep > 0) {
      setWalkthroughStep((prev) => prev - 1)
    }
  }

  const handleSkipWalkthrough = () => {
    analytics.notifyWalkthroughSkipped(walkthroughStep)
    setShowWalkthrough(false)
    localStorage.setItem("hijli-walkthrough-completed", "true")
  }

  const handleCompleteWalkthrough = () => {
    analytics.notifyWalkthroughCompleted()
    setShowWalkthrough(false)
    setWalkthroughStep(0)
    localStorage.setItem("hijli-walkthrough-completed", "true")
    showToast("Walkthrough completed! Start exploring.", "success")
  }

  const handleRestartWalkthrough = () => {
    setWalkthroughStep(0)
    setShowWalkthrough(true)
  }

  const logSnapshot = (reason) => {
    const timestamp = Date.now()
    const spatialGraph = computeSpatialGraph(positions)

    setInteractionLog((prev) => {
      const snapshot = {
        type: "snapshot",
        reason,
        timestamp,
        sessionId,
        connections: [...connections],
        spatialGraph,
      }

      const nextLog = [...prev, snapshot]

      if (typeof window !== "undefined") {
        window.cubeInteractionData = {
          log: nextLog,
          lastSnapshot: snapshot,
        }
      }

      console.log("Cube interaction snapshot:", snapshot)

      return nextLog
    })
  }

  const handleStartSession = () => {
    setSessionId((prev) => prev + 1)
    setConnections([])
    setSelectedNode(null)
    setInteractionLog([])
    setIsSessionActive(true)
    setResultSentence("")
    setSessionFinished(false)

    if (typeof window !== "undefined") {
      window.cubeInteractionData = null
    }
    // start timer
    if (timerRef.current) clearInterval(timerRef.current)
    startTimeRef.current = Date.now()
    setElapsedMs(0)
    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startTimeRef.current)
    }, 100)

    analytics.startSession()
    showToast("Session started. Click nodes to create connections.", "success")
  }

  const handleFinishSession = () => {
    if (!isSessionActive) return
    // Final snapshot for this session
    logSnapshot("finish-button")
    setIsSessionActive(false)
    setSelectedNode(null)
    // stop timer and record final elapsed
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (startTimeRef.current) {
      setElapsedMs(Date.now() - startTimeRef.current)
      startTimeRef.current = null
    }

    // Compute final story path for analytics
    const storyOrder = computeStoryOrder()
    const storyPhases = storyOrder.map(getPhase)
    const storyText = storyOrder.map((i) => cubeData[i][cubeFaceIndices[i]]).join(" ")
    analytics.finishSession({
      finalConnectionCount: connections.length,
      storyPath: storyOrder,
      phaseSequence: storyPhases,
      storyText,
    })

    setSessionFinished(true)
    showToast("Session finished.", "success")
  }

  const handleReset = () => {
    const durationBeforeReset = startTimeRef.current ? Date.now() - startTimeRef.current : 0
    analytics.logSessionReset(connections.length, durationBeforeReset)
    // Reset all connections and selections
    setConnections([])
    setSelectedNode(null)
    setResultSentence("")
    setInteractionLog([])
    setIsSessionActive(false)
    setSessionFinished(false)
    
    // Reset cube positions to zone-based layout
    setPositions(generateZoneBasedPositions())
    
    // Reset timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    startTimeRef.current = null
    setElapsedMs(0)
    
    showToast("Reset complete.", "success")
  }

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const centiseconds = Math.floor((ms % 1000) / 10)
    const mm = String(minutes).padStart(2, "0")
    const ss = String(seconds).padStart(2, "0")
    const cs = String(centiseconds).padStart(2, "0")
    return `${mm}:${ss}.${cs}`
  }

  // Compute story order from connections graph
  const computeStoryOrder = () => {
    if (connections.length === 0) return []

    // Build adjacency map: cubeIndex -> {next: cubeIndex, order: number}
    const outgoing = new Map()
    const incoming = new Map()

    connections.forEach((conn) => {
      outgoing.set(conn.from.cubeIndex, conn.to.cubeIndex)
      incoming.set(conn.to.cubeIndex, conn.from.cubeIndex)
    })

    // Find the starting cube (has outgoing but no incoming)
    let start = null
    for (const [cube] of outgoing) {
      if (!incoming.has(cube)) {
        start = cube
        break
      }
    }

    if (start === null) return []

    // Follow the chain
    const order = []
    let current = start
    const visited = new Set()

    while (current !== null && !visited.has(current)) {
      visited.add(current)
      order.push(current)
      current = outgoing.get(current) ?? null
    }

    return order
  }

  const handleShowResult = () => {
    const order = computeStoryOrder()

    if (order.length === 0) {
      setResultSentence("")
      showToast("No connected cubes to show.", "error")
      return
    }

    const words = order.map((cubeIndex) => {
      const face = cubeFaceIndices[cubeIndex] ?? 0
      return cubeData[cubeIndex][face]
    })

    const sentence = words.join(" ")
    setResultSentence(sentence)

    if (typeof window !== "undefined") {
      window.cubeResultSentence = sentence
    }

    if (isSessionActive) {
      logSnapshot("result-button")
    }

    analytics.logStoryGenerated(
      order,
      order.map(getPhase),
      words,
      sentence
    )
    showToast("Story generated!", "success")
  }

  const onMouseDown = (e, index) => {
    if (focused !== null) return
    dragging.current = index
    hasDragged.current = false
    startPos.current = { x: e.clientX, y: e.clientY }
    dragStartCubePos.current = { ...positions[index] }
    offset.current = {
      x: e.clientX - positions[index].x,
      y: e.clientY - positions[index].y,
    }
  }

  const onMouseMove = (e) => {
    if (dragging.current === null || focused !== null) return
    
    // Check if mouse has moved enough to be considered a drag
    const dx = e.clientX - startPos.current.x
    const dy = e.clientY - startPos.current.y
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      hasDragged.current = true
    }
    
    const i = dragging.current
    setPositions((prev) =>
      prev.map((p, idx) =>
        idx === i
          ? { x: e.clientX - offset.current.x, y: e.clientY - offset.current.y }
          : p
      )
    )
  }

  const onMouseUp = (e, index) => {
    if (dragging.current !== null) {
      if (!hasDragged.current && index !== undefined) {
        // It was a click, not a drag - focus the cube
        const tile = e.currentTarget
        const rect = tile.getBoundingClientRect()
        setFocused(index)
        setFocusedPosition({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        })
        setFaceIndex(cubeFaceIndices[index])

        analytics.logCubeFocused(
          index,
          getPhase(index),
          cubeFaceIndices[index],
          cubeData[index][cubeFaceIndices[index]]
        )

        if (isSessionActive) {
          setInteractionLog((prev) => [
            ...prev,
            {
              type: "focus",
              timestamp: Date.now(),
              cubeIndex: index,
              faceIndex: cubeFaceIndices[index],
              positions: [...positions],
              sessionId,
            },
          ])
        }
      } else if (hasDragged.current && dragging.current !== null) {
        // Drag finished - log the final position of the dragged cube
        const draggedIndex = dragging.current
        const finalPos = {
          x: e.clientX - offset.current.x,
          y: e.clientY - offset.current.y,
        }
        analytics.logCubeDragged(draggedIndex, dragStartCubePos.current, finalPos)
        if (isSessionActive) {
          setInteractionLog((prev) => [
            ...prev,
            {
              type: "dragEnd",
              timestamp: Date.now(),
              cubeIndex: draggedIndex,
              position: { ...positions[draggedIndex] },
              sessionId,
            },
          ])
        }
      }
    }
    dragging.current = null
    hasDragged.current = false
  }

  // Node click handler
  const handleNodeClick = (e, cubeIndex, nodePosition) => {
    e.stopPropagation()
    
    if (!isSessionActive) {
      showToast("Start a session first to create connections.", "error")
      return
    }

    // Check if clicking an already connected pair to remove connection
    const existingConnIdx = connections.findIndex(
      (conn) =>
        (conn.from.cubeIndex === cubeIndex && conn.from.nodePosition === nodePosition) ||
        (conn.to.cubeIndex === cubeIndex && conn.to.nodePosition === nodePosition)
    )

    if (existingConnIdx !== -1 && selectedNode) {
      const conn = connections[existingConnIdx]
      const isMatchingPair =
        (conn.from.cubeIndex === selectedNode.cubeIndex && conn.from.nodePosition === selectedNode.nodePosition) ||
        (conn.to.cubeIndex === selectedNode.cubeIndex && conn.to.nodePosition === selectedNode.nodePosition)

      if (isMatchingPair) {
        // Remove the connection
        analytics.logConnectionRemoved(conn.from.cubeIndex, conn.to.cubeIndex)
        setConnections((prev) => prev.filter((_, i) => i !== existingConnIdx))
        setSelectedNode(null)
        showToast("Connection removed.", "info")
        if (isSessionActive) {
          logSnapshot("connection-removed")
        }
        return
      }
    }

    // If no node is selected, select this one
    if (!selectedNode) {
      setSelectedNode({ cubeIndex, nodePosition })
      showToast("Node selected. Click another node to connect.", "info")
      return
    }

    // If clicking the same node, deselect
    if (selectedNode.cubeIndex === cubeIndex && selectedNode.nodePosition === nodePosition) {
      setSelectedNode(null)
      showToast("Node deselected.", "info")
      return
    }

    // Trying to create a connection
    const fromNode = selectedNode
    const toNode = { cubeIndex, nodePosition }

    // Validation 1: No self-connections
    if (fromNode.cubeIndex === toNode.cubeIndex) {
      analytics.logConnectionFailed("self_connection", fromNode.cubeIndex, toNode.cubeIndex)
      showToast("Cannot connect a cube to itself.", "error")
      return
    }

    // Validation 2: Check max connections (1 outgoing, 1 incoming per cube)
    const fromCubeOutgoing = connections.filter((c) => c.from.cubeIndex === fromNode.cubeIndex).length
    const toCubeIncoming = connections.filter((c) => c.to.cubeIndex === toNode.cubeIndex).length

    if (fromCubeOutgoing >= 1) {
      analytics.logConnectionFailed("max_outgoing", fromNode.cubeIndex, toNode.cubeIndex)
      showToast(`Cube ${fromNode.cubeIndex + 1} already has an outgoing connection.`, "error")
      return
    }

    if (toCubeIncoming >= 1) {
      analytics.logConnectionFailed("max_incoming", fromNode.cubeIndex, toNode.cubeIndex)
      showToast(`Cube ${toNode.cubeIndex + 1} already has an incoming connection.`, "error")
      return
    }

    // Validation 3: Detect cycles
    const wouldCreateCycle = (from, to) => {
      const tempConnections = [...connections, { from, to }]
      const outgoing = new Map()
      tempConnections.forEach((conn) => {
        outgoing.set(conn.from.cubeIndex, conn.to.cubeIndex)
      })

      const visited = new Set()
      let current = from.cubeIndex

      while (current !== null) {
        if (visited.has(current)) return true
        visited.add(current)
        current = outgoing.get(current) ?? null
      }

      return false
    }

    if (wouldCreateCycle(fromNode, toNode)) {
      analytics.logConnectionFailed("would_create_cycle", fromNode.cubeIndex, toNode.cubeIndex)
      showToast("Cannot create a cycle in the story.", "error")
      return
    }

    // Create the connection
    const newTotalConnections = connections.length + 1
    analytics.logConnectionCreated({
      fromCube: fromNode.cubeIndex,
      fromPhase: getPhase(fromNode.cubeIndex),
      fromFaceIndex: cubeFaceIndices[fromNode.cubeIndex],
      fromFaceContent: cubeData[fromNode.cubeIndex][cubeFaceIndices[fromNode.cubeIndex]],
      toCube: toNode.cubeIndex,
      toPhase: getPhase(toNode.cubeIndex),
      toFaceIndex: cubeFaceIndices[toNode.cubeIndex],
      toFaceContent: cubeData[toNode.cubeIndex][cubeFaceIndices[toNode.cubeIndex]],
      totalConnections: newTotalConnections,
    })
    setConnections((prev) => [...prev, { from: fromNode, to: toNode }])
    setSelectedNode(null)
    showToast("Connection created!", "success")

    if (isSessionActive) {
      logSnapshot("connection-created")
    }
  }

  const rotateCube = (direction) => {
    const directionMap = { left: 0, right: 1, up: 2, down: 3 }
    const newFaceIndex = navigationMap[faceIndex][directionMap[direction]]

    setFaceIndex(newFaceIndex)

    if (focused !== null) {
      setCubeFaceIndices((prevIndices) => {
        const newIndices = [...prevIndices]
        newIndices[focused] = newFaceIndex
        return newIndices
      })
      analytics.logFaceRotated(
        focused,
        getPhase(focused),
        direction,
        faceIndex,
        newFaceIndex,
        cubeData[focused][newFaceIndex]
      )
    }
  }

  const handleTouchStart = (e) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    }
    isSwiping.current = false
  }

  const handleTouchMove = () => {
    if (!touchStart.current) return
    isSwiping.current = true
  }

  const handleTouchEnd = (e) => {
    if (!isSwiping.current) return
    
    const deltaX = e.changedTouches[0].clientX - touchStart.current.x
    const deltaY = e.changedTouches[0].clientY - touchStart.current.y
    
    const threshold = 25

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > threshold) {
        rotateCube(deltaX > 0 ? "left" : "right")
      }
    } else {
      if (Math.abs(deltaY) > threshold) {
        rotateCube(deltaY > 0 ? "up" : "down")
      }
    }
    
    isSwiping.current = false
  }

  const handleMouseDownCube = (e) => {
    touchStart.current = { x: e.clientX, y: e.clientY }
    isSwiping.current = false
  }

  const handleMouseMoveCube = (e) => {
    if (touchStart.current.x === 0) return
    const deltaX = Math.abs(e.clientX - touchStart.current.x)
    const deltaY = Math.abs(e.clientY - touchStart.current.y)
    if (deltaX > 3 || deltaY > 3) {
      isSwiping.current = true
    }
  }

  const handleMouseUpCube = (e) => {
    if (!isSwiping.current || touchStart.current.x === 0) {
      touchStart.current = { x: 0, y: 0 }
      return
    }
    
    const deltaX = e.clientX - touchStart.current.x
    const deltaY = e.clientY - touchStart.current.y
    
    const threshold = 25

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > threshold) {
        rotateCube(deltaX > 0 ? "left" : "right")
      }
    } else {
      if (Math.abs(deltaY) > threshold) {
        rotateCube(deltaY > 0 ? "up" : "down")
      }
    }
    
    touchStart.current = { x: 0, y: 0 }
    isSwiping.current = false
  }

  return (
    <div
      className="scene"
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <div className="session-controls">
        <button
          className="session-button"
          onClick={handleStartSession}
          disabled={isSessionActive}
        >
          Start
        </button>
        <button
          className="session-button"
          onClick={handleFinishSession}
          disabled={!isSessionActive}
        >
          Finish
        </button>
        <button
          className="session-button"
          onClick={handleReset}
          disabled={connections.length === 0 && elapsedMs === 0 && !resultSentence}
        >
          Reset
        </button>
        <div className="session-timer" aria-live="polite">
          {formatTime(elapsedMs)}
        </div>
        <button
          className="session-button session-button-result"
          onClick={handleShowResult}
          disabled={connections.length === 0}
        >
          Result
        </button>
        <button
          className="session-button help-button"
          onClick={handleRestartWalkthrough}
          title="Show walkthrough"
        >
          ?
        </button>
      </div>

      <div className={`grid ${focused !== null ? "blurred" : ""}`}>
        {cubeData.map((cube, index) => {
          const nodePositions = ["top", "right", "bottom", "left"]
          const phase = getPhase(index)
          
          return (
            <div
              key={index}
              className={`tile phase-${phase}`}
              onMouseDown={(e) => onMouseDown(e, index)}
              onMouseUp={(e) => onMouseUp(e, index)}
              style={{
                transform: `translate(${positions[index].x}px, ${positions[index].y}px)`,
              }}
            >
              <span key={cubeFaceIndices[index]}>
                {cube[cubeFaceIndices[index]]}
              </span>
              
              {/* Connection nodes */}
              {nodePositions.map((nodePos) => {
                const isSelected = selectedNode?.cubeIndex === index && selectedNode?.nodePosition === nodePos
                const isConnected = connections.some(
                  (conn) =>
                    (conn.from.cubeIndex === index && conn.from.nodePosition === nodePos) ||
                    (conn.to.cubeIndex === index && conn.to.nodePosition === nodePos)
                )
                
                return (
                  <div
                    key={nodePos}
                    className={`connection-node node-${nodePos} ${
                      isSelected ? "selected" : ""
                    } ${isConnected ? "connected" : ""}`}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => handleNodeClick(e, index, nodePos)}
                  />
                )
              })}
            </div>
          )
        })}

        {connections.length > 0 && (
          <svg
            className="connections"
            width="800"
            height="800"
            viewBox="0 0 800 800"
            style={{ overflow: "visible" }}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="5"
                markerHeight="5"
                refX="4.5"
                refY="2.5"
                orient="auto"
              >
                <polygon points="0 0, 5 2.5, 0 5" fill="#C28B47" />
              </marker>
            </defs>
            {connections.map((conn, idx) => {
              const fromPos = positions[conn.from.cubeIndex]
              const toPos = positions[conn.to.cubeIndex]

              if (!fromPos || !toPos) return null

              // Calculate node position offsets
              const getNodeOffset = (nodePosition) => {
                const offset = 45 // TILE_SIZE / 2
                switch (nodePosition) {
                  case "top":
                    return { x: offset, y: 0 }
                  case "right":
                    return { x: TILE_SIZE, y: offset }
                  case "bottom":
                    return { x: offset, y: TILE_SIZE }
                  case "left":
                    return { x: 0, y: offset }
                  default:
                    return { x: offset, y: offset }
                }
              }

              const fromOffset = getNodeOffset(conn.from.nodePosition)
              const toOffset = getNodeOffset(conn.to.nodePosition)

              const x1 = fromPos.x + fromOffset.x
              const y1 = fromPos.y + fromOffset.y
              const x2 = toPos.x + toOffset.x
              const y2 = toPos.y + toOffset.y

              // Calculate control point for curved line
              const dx = x2 - x1
              const dy = y2 - y1
              const distance = Math.sqrt(dx * dx + dy * dy)
              
              // Create a smooth curve by offsetting the control point perpendicular to the line
              const midX = (x1 + x2) / 2
              const midY = (y1 + y2) / 2
              
              // Perpendicular offset for curve (adjust the divisor for more/less curve)
              const curvature = distance * 0.15
              const perpX = -dy / distance
              const perpY = dx / distance
              
              const controlX = midX + perpX * curvature
              const controlY = midY + perpY * curvature

              // Create the curved path
              const pathData = `M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`

              // Calculate the position and angle for the arrow at the end
              const t = 0.5 // Position on curve for badge (0.5 = middle)
              const badgeX = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * controlX + t * t * x2
              const badgeY = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * controlY + t * t * y2

              // Compute story order for this connection
              const storyOrder = computeStoryOrder()
              const fromOrder = storyOrder.indexOf(conn.from.cubeIndex)
              const orderNumber = fromOrder >= 0 ? fromOrder + 1 : null

              return (
                <g key={`conn-${idx}`}>
                  <path
                    d={pathData}
                    stroke="#C28B47"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                    markerEnd="url(#arrowhead)"
                  />
                  {orderNumber !== null && (
                    <>
                      <circle
                        cx={badgeX}
                        cy={badgeY}
                        r="16"
                        fill="#1B1F26"
                        stroke="#C28B47"
                        strokeWidth="3"
                      />
                      <text
                        x={badgeX}
                        y={badgeY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#C28B47"
                        fontSize="13"
                        fontWeight="700"
                      >
                        {orderNumber}
                      </text>
                    </>
                  )}
                </g>
              )
            })}
          </svg>
        )}
      </div>

      {focused !== null && focusedPosition && (
        <>
          <div 
            className={`focused-cube-wrapper ${isExiting ? "exiting" : ""}`}
            style={{
              '--start-x': `${focusedPosition.x}px`,
              '--start-y': `${focusedPosition.y}px`
            }}
          >
            <div
              className="cube"
              onMouseDown={handleMouseDownCube}
              onMouseMoveCapture={handleMouseMoveCube}
              onMouseUp={handleMouseUpCube}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{
                transform: `rotateX(${faceRotations[faceIndex][0]}deg) rotateY(${faceRotations[faceIndex][1]}deg)`,
                transition: isSwiping.current ? "none" : "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              {["front", "right", "back", "left", "top", "bottom"].map(
                (face, idx) => (
                  <div key={face} className={`face ${face} phase-${getPhase(focused)}`}>
                    {cubeData[focused][idx]}
                  </div>
                )
              )}
            </div>
            
            <button
              className="arrow-control arrow-up"
              onClick={() => rotateCube("up")}
              aria-label="Rotate up"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
            </button>
            <button
              className="arrow-control arrow-down"
              onClick={() => rotateCube("down")}
              aria-label="Rotate down"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <button
              className="arrow-control arrow-left"
              onClick={() => rotateCube("left")}
              aria-label="Rotate left"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <button
              className="arrow-control arrow-right"
              onClick={() => rotateCube("right")}
              aria-label="Rotate right"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
          
          <div
            className="overlay"
            onClick={() => {
              analytics.logCubeUnfocused(
                focused,
                cubeFaceIndices[focused],
                cubeData[focused][cubeFaceIndices[focused]]
              )
              setIsExiting(true)
              setTimeout(() => {
                // Capture a snapshot of the current spatial arrangement
                // and the cumulative sequence of cube choices for analysis,
                // but only while a session is active.
                if (isSessionActive) {
                  logSnapshot("overlay-close")
                }
                setFocused(null)
                setFocusedPosition(null)
                setIsExiting(false)
              }, 300)
            }}
          />
        </>
      )}

      {/* Phase Legend */}
      <div className="phase-legend">
        <span className="legend-title">Phases</span>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-dot phase-1-color"></span>
            <span className="legend-label">Beginning</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot phase-2-color"></span>
            <span className="legend-label">Tensions</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot phase-3-color"></span>
            <span className="legend-label">The Firing</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot phase-4-color"></span>
            <span className="legend-label">Aftermath</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot phase-5-color"></span>
            <span className="legend-label">Legacy</span>
          </div>
        </div>
      </div>

      {/* Toast notifications */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.message}
          </div>
        ))}
      </div>

      {resultSentence && (
        <div className="result-banner">
          <span className="result-label">Result</span>
          <span className="result-text">{resultSentence}</span>
        </div>
      )}

      {/* Walkthrough overlay and tooltip */}
      {showWalkthrough && (
        <>
          <div className="walkthrough-overlay" onClick={handleSkipWalkthrough} />
          <div className="walkthrough-tooltip">
            <div className="walkthrough-header">
              <h3>{walkthroughSteps[walkthroughStep].title}</h3>
              <button 
                className="walkthrough-close"
                onClick={handleSkipWalkthrough}
                aria-label="Close walkthrough"
              >
                ×
              </button>
            </div>
            <div className="walkthrough-content">
              <p>{walkthroughSteps[walkthroughStep].content}</p>
            </div>
            <div className="walkthrough-footer">
              <div className="walkthrough-progress">
                Step {walkthroughStep + 1} of {walkthroughSteps.length}
              </div>
              <div className="walkthrough-buttons">
                {walkthroughStep > 0 && (
                  <button 
                    className="walkthrough-button walkthrough-back"
                    onClick={handlePrevStep}
                  >
                    Back
                  </button>
                )}
                <button 
                  className="walkthrough-button walkthrough-skip"
                  onClick={handleSkipWalkthrough}
                >
                  Skip
                </button>
                <button 
                  className="walkthrough-button walkthrough-next"
                  onClick={handleNextStep}
                >
                  {walkthroughStep === walkthroughSteps.length - 1 ? "Finish" : "Next"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {(sessionFinished || resultSentence) && (
        <div
          className={`app-end-feedback${resultSentence ? " app-end-feedback--with-result" : ""}`}
        >
          <FeedbackSection />
        </div>
      )}
    </div>
  )
}

export default App
