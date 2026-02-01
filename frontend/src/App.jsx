import { useState, useRef, useEffect } from "react"
import "./App.css"

const cubeData = [
  ["begin", "once", "if only", "perhaps", "always", "never"],
  ["the moon", "a shadow", "silence", "whisper", "echo", "light"],
  ["she said", "he wondered", "they knew", "we forgot", "I dreamed", "you saw"],
  ["beneath", "through", "beyond", "within", "beside", "between"],
  ["waiting", "running", "falling", "rising", "floating", "sinking"],
  ["the door", "a window", "the path", "a bridge", "the edge", "a threshold"],
  ["remember", "forget", "imagine", "believe", "doubt", "hope"],
  ["crimson", "azure", "amber", "silver", "obsidian", "pearl"],
  ["morning", "twilight", "midnight", "dawn", "dusk", "noon"],
  ["secrets", "stories", "memories", "dreams", "fears", "wishes"],
  ["softly", "swiftly", "slowly", "suddenly", "silently", "surely"],
  ["the child", "an elder", "a stranger", "the lover", "a ghost", "the self"],
  ["lost", "found", "hidden", "revealed", "broken", "whole"],
  ["water", "fire", "earth", "air", "void", "spirit"],
  ["before", "after", "during", "while", "until", "since"],
  ["hunger", "thirst", "longing", "peace", "chaos", "calm"],
  ["a letter", "a key", "a map", "a coin", "a feather", "a stone"],
  ["spoke", "listened", "watched", "touched", "tasted", "felt"],
  ["ancient", "new", "eternal", "fleeting", "sacred", "mundane"],
  ["the forest", "the sea", "the city", "the desert", "the mountain", "the sky"],
  ["but then", "and so", "therefore", "however", "meanwhile", "finally"],
  ["growing", "fading", "changing", "staying", "leaving", "arriving"],
  ["trust", "betray", "protect", "abandon", "embrace", "release"],
  ["voices", "footsteps", "heartbeats", "breath", "thunder", "rain"],
  ["together", "alone", "apart", "united", "scattered", "gathered"],
]

// Basic geometry constants for spatial reasoning
const TILE_SIZE = 90 // must match CSS `.tile` size
const ADJACENCY_THRESHOLD = 130 // pixel distance within which cubes are considered connected

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
  const [positions, setPositions] = useState(() =>
    cubeData.map((_, i) => ({
      x: (i % 5) * 130,
      y: Math.floor(i / 5) * 130,
    }))
  )

  const [focused, setFocused] = useState(null)
  const [focusedPosition, setFocusedPosition] = useState(null)
  const [faceIndex, setFaceIndex] = useState(0)
  const [cubeFaceIndices, setCubeFaceIndices] = useState(() => 
    Array(cubeData.length).fill(0)
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

  // Timer state: elapsed milliseconds since session start
  const [elapsedMs, setElapsedMs] = useState(0)
  const startTimeRef = useRef(null)
  const timerRef = useRef(null)

  const dragging = useRef(null)
  const offset = useRef({ x: 0, y: 0 })
  const hasDragged = useRef(false)
  const startPos = useRef({ x: 0, y: 0 })
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
    
    showToast("Session finished.", "success")
  }

  const handleReset = () => {
    // Reset all connections and selections
    setConnections([])
    setSelectedNode(null)
    setResultSentence("")
    setInteractionLog([])
    setIsSessionActive(false)
    
    // Reset cube positions to initial grid
    setPositions(
      cubeData.map((_, i) => ({
        x: (i % 5) * 130,
        y: Math.floor(i / 5) * 130,
      }))
    )
    
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
    
    showToast("Story generated!", "success")
  }

  const onMouseDown = (e, index) => {
    if (focused !== null) return
    dragging.current = index
    hasDragged.current = false
    startPos.current = { x: e.clientX, y: e.clientY }
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
      showToast("Cannot connect a cube to itself.", "error")
      return
    }

    // Validation 2: Check max connections (1 outgoing, 1 incoming per cube)
    const fromCubeOutgoing = connections.filter((c) => c.from.cubeIndex === fromNode.cubeIndex).length
    const toCubeIncoming = connections.filter((c) => c.to.cubeIndex === toNode.cubeIndex).length

    if (fromCubeOutgoing >= 1) {
      showToast(`Cube ${fromNode.cubeIndex + 1} already has an outgoing connection.`, "error")
      return
    }

    if (toCubeIncoming >= 1) {
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
      showToast("Cannot create a cycle in the story.", "error")
      return
    }

    // Create the connection
    setConnections((prev) => [...prev, { from: fromNode, to: toNode }])
    setSelectedNode(null)
    showToast("Connection created!", "success")
    
    if (isSessionActive) {
      logSnapshot("connection-created")
    }
  }

  const rotateCube = (direction) => {
    setFaceIndex((prev) => {
      const directionMap = { left: 0, right: 1, up: 2, down: 3 }
      const newFaceIndex = navigationMap[prev][directionMap[direction]]
      
      // Update the face index for the focused cube
      if (focused !== null) {
        setCubeFaceIndices((prevIndices) => {
          const newIndices = [...prevIndices]
          newIndices[focused] = newFaceIndex
          return newIndices
        })
      }
      
      return newFaceIndex
    })
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
      </div>

      <div className={`grid ${focused !== null ? "blurred" : ""}`}>
        {cubeData.map((cube, index) => {
          const nodePositions = ["top", "right", "bottom", "left"]
          
          return (
            <div
              key={index}
              className="tile"
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
            width="550"
            height="550"
            viewBox="0 0 550 550"
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
                <polygon points="0 0, 5 2.5, 0 5" fill="#b37860" />
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
                    stroke="#b37860"
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
                        fill="#f7f3ee"
                        stroke="#b37860"
                        strokeWidth="3"
                      />
                      <text
                        x={badgeX}
                        y={badgeY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#b37860"
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
                  <div key={face} className={`face ${face}`}>
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

      <div className="hint">
        drag to move · click to focus · use arrows or swipe to flip cube · click nodes to connect
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
    </div>
  )
}

export default App
