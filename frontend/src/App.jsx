import { useState, useRef } from "react"
import "./App.css"

const words = [
  "once", "the moon", "she said", "beneath", "waiting",
  "the door", "remember", "crimson", "morning", "secrets",
  "softly", "the child", "lost", "water", "before",
  "hunger", "a letter", "spoke", "ancient", "the forest",
  "but then", "growing", "trust", "voices", "together",
]

function App() {
  const [positions, setPositions] = useState(() =>
    words.map((_, i) => ({
      x: (i % 5) * 110,
      y: Math.floor(i / 5) * 110,
    }))
  )

  const [focused, setFocused] = useState(null)
  const [rotation, setRotation] = useState({ x: 0, y: 0 })

  const dragging = useRef(null)
  const offset = useRef({ x: 0, y: 0 })

  const onMouseDown = (e, index) => {
    if (focused !== null) return
    dragging.current = index
    offset.current = {
      x: e.clientX - positions[index].x,
      y: e.clientY - positions[index].y,
    }
  }

  const onMouseMove = (e) => {
    if (dragging.current === null || focused !== null) return
    const i = dragging.current
    setPositions((prev) =>
      prev.map((p, idx) =>
        idx === i
          ? { x: e.clientX - offset.current.x, y: e.clientY - offset.current.y }
          : p
      )
    )
  }

  const onMouseUp = () => {
    dragging.current = null
  }

  const handleCubeMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const dx = e.clientX - (rect.left + rect.width / 2)
    const dy = e.clientY - (rect.top + rect.height / 2)

    setRotation({
      x: (-dy / rect.height) * 30, 
      y: (dx / rect.width) * 30, 
    })
  }

  return (
    <div
      className="scene"
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <div className={`grid ${focused !== null ? "blurred" : ""}`}>
        {words.map((word, index) => (
          <div
            key={index}
            className="tile"
            onMouseDown={(e) => onMouseDown(e, index)}
            onDoubleClick={() => setFocused(index)}
            style={{
              transform: `translate(${positions[index].x}px, ${positions[index].y}px)`,
            }}
          >
            {word}
          </div>
        ))}
      </div>

      {focused !== null && (
        <>
          <div className="focused-cube-wrapper">
            <div
              className="cube"
              onMouseMove={handleCubeMove}
              onMouseLeave={() => setRotation({ x: 0, y: 0 })}
              style={{
                transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
              }}
            >
              {["front", "back", "right", "left", "top", "bottom"].map(
                (face) => (
                  <div key={face} className={`face ${face}`}>
                    {words[focused]}
                  </div>
                )
              )}
            </div>
          </div>
          
          <div
            className="overlay"
            onClick={() => {
              setFocused(null)
              setRotation({ x: 0, y: 0 })
            }}
          />
        </>
      )}

      <div className="hint">
        drag to move · double-click to focus · move mouse to tilt
      </div>
    </div>
  )
}

export default App
