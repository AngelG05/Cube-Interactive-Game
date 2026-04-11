import { useState } from "react"
import { submitUserFeedback } from "./feedbackSubmit"
import "./feedback.css"

const NAME_MAX = 200
const MESSAGE_MAX = 4000

const ratingLabels = ["", "Poor", "Fair", "Good", "Very good", "Excellent"]

const FeedbackSection = ({ sessionId, onSubmitted }) => {
  const [name, setName] = useState("")
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const displayRating = hoveredRating || rating
  const messageLen = message.length

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    const trimmedName = name.trim()
    const trimmedMessage = message.trim()

    if (!trimmedName || !trimmedMessage || rating === 0) {
      setError("Please enter your name, choose a star rating, and write a short review.")
      return
    }

    if (trimmedName.length > NAME_MAX || trimmedMessage.length > MESSAGE_MAX) {
      setError(`Name may be up to ${NAME_MAX} characters and your review up to ${MESSAGE_MAX}.`)
      return
    }

    setSubmitting(true)
    const result = await submitUserFeedback({
      name: trimmedName,
      rating,
      message: trimmedMessage,
      sessionId,
    })
    setSubmitting(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    setSubmitted(true)
    setName("")
    setRating(0)
    setMessage("")
    onSubmitted?.()
  }

  const handleAnother = () => {
    setSubmitted(false)
    setError("")
  }

  if (submitted) {
    return (
      <section className="feedback-root" aria-live="polite">
        <div className="feedback-card">
          <div className="feedback-card-accent" aria-hidden />
          <div className="feedback-success">
            <div className="feedback-success-icon" aria-hidden>
              ✓
            </div>
            <h2 className="feedback-success-title">Thank you</h2>
            <p className="feedback-success-text">
              Your feedback has been recorded. It helps us improve this experience.
            </p>
            <div className="feedback-success-actions">
              <button type="button" className="feedback-link-btn" onClick={handleAnother}>
                Send another
              </button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="feedback-root" aria-labelledby="feedback-heading">
      <div className="feedback-card">
        <div className="feedback-card-accent" aria-hidden />
        <div className="feedback-inner">
          <p className="feedback-eyebrow">After your visit</p>
          <h2 id="feedback-heading" className="feedback-title">
            Share your feedback
          </h2>
          <p className="feedback-subtitle">
            A brief review of the Hijli Story Cubes experience is welcome. Your response is stored
            securely for our team only.
          </p>

          <form className="feedback-form" onSubmit={handleSubmit} noValidate>
            <div className="feedback-field">
              <label htmlFor="feedback-name" className="feedback-label">
                Name
              </label>
              <input
                id="feedback-name"
                className="feedback-input"
                type="text"
                name="name"
                autoComplete="name"
                maxLength={NAME_MAX}
                placeholder="How should we refer to you?"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="feedback-field">
              <span id="feedback-rating-label" className="feedback-label">
                Overall rating
              </span>
              <div className="feedback-stars-row">
                <div
                  className="feedback-stars"
                  role="radiogroup"
                  aria-labelledby="feedback-rating-label"
                >
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = star <= displayRating
                    const id = `feedback-star-${star}`
                    return (
                      <label
                        key={star}
                        htmlFor={id}
                        className="feedback-star-label"
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                      >
                        <input
                          id={id}
                          className="feedback-star-input"
                          type="radio"
                          name="feedback-rating"
                          value={star}
                          checked={rating === star}
                          onChange={() => setRating(star)}
                          onFocus={() => setHoveredRating(star)}
                          onBlur={() => setHoveredRating(0)}
                        />
                        <span
                          className={`feedback-star-btn${active ? " feedback-star-btn--active" : ""}`}
                          aria-hidden
                        >
                          ★
                        </span>
                        <span className="feedback-star-sr">{`${star} star${star === 1 ? "" : "s"}`}</span>
                      </label>
                    )
                  })}
                </div>
                <span className="feedback-rating-hint" aria-live="polite">
                  {displayRating > 0 ? ratingLabels[displayRating] : "Select 1–5 stars"}
                </span>
              </div>
            </div>

            <div className="feedback-field">
              <label htmlFor="feedback-message" className="feedback-label">
                Review
              </label>
              <textarea
                id="feedback-message"
                className="feedback-textarea"
                name="message"
                rows={4}
                maxLength={MESSAGE_MAX}
                placeholder="What stood out, or what could be improved?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <div className="feedback-meta">
                <span className="feedback-char-count" aria-live="polite">
                  {messageLen} / {MESSAGE_MAX}
                </span>
              </div>
            </div>

            {error ? (
              <div className="feedback-alert feedback-alert--error" role="alert">
                {error}
              </div>
            ) : null}

            <div className="feedback-footer">
              <button
                type="submit"
                className="feedback-submit"
                disabled={submitting}
              >
                {submitting ? "Sending…" : "Submit feedback"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}

export default FeedbackSection
