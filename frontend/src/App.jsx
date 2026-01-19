import { useState, useRef } from "react"
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

function App() {
  const [positions, setPositions] = useState(() =>
    cubeData.map((_, i) => ({
      x: (i % 5) * 110,
      y: Math.floor(i / 5) * 110,
    }))
  )

  const [focused, setFocused] = useState(null)
  const [focusedPosition, setFocusedPosition] = useState(null)
  const [faceIndex, setFaceIndex] = useState(0)
  const [cubeFaceIndices, setCubeFaceIndices] = useState(() => 
    Array(cubeData.length).fill(0)
  )
  const [isExiting, setIsExiting] = useState(false)

  const dragging = useRef(null)
  const offset = useRef({ x: 0, y: 0 })
  const hasDragged = useRef(false)
  const startPos = useRef({ x: 0, y: 0 })
  const touchStart = useRef({ x: 0, y: 0 })
  const isSwiping = useRef(false)

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
    if (dragging.current !== null && !hasDragged.current && index !== undefined) {
      // It was a click, not a drag - focus the cube
      const tile = e.currentTarget
      const rect = tile.getBoundingClientRect()
      setFocused(index)
      setFocusedPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      })
      setFaceIndex(cubeFaceIndices[index])
    }
    dragging.current = null
    hasDragged.current = false
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

  const handleTouchMove = (e) => {
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
      <div className={`grid ${focused !== null ? "blurred" : ""}`}>
        {cubeData.map((cube, index) => (
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
          </div>
        ))}
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
                setFocused(null)
                setFocusedPosition(null)
                setIsExiting(false)
              }, 300)
            }}
          />
        </>
      )}

      <div className="hint">
        drag to move · click to focus · use arrows or swipe to flip cube
      </div>
    </div>
  )
}

export default App
