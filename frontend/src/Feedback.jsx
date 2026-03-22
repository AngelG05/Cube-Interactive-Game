import { useState, useEffect } from "react";

const STORAGE_KEY = "cube-game-feedback";

const FeedbackSection = () => {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [message, setMessage] = useState("");
  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setFeedbacks(JSON.parse(stored));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !message.trim() || rating === 0) {
      alert("Please fill all fields and select a rating");
      return;
    }
    const newFeedback = {
      id: crypto.randomUUID(),
      name: name.trim(),
      rating,
      message: message.trim(),
      date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
    };
    const updated = [newFeedback, ...feedbacks];
    setFeedbacks(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setName("");
    setRating(0);
    setMessage("");
  };

  return (
    <section style={{ maxWidth: 720, margin: "0 auto", padding: "48px 16px" }}>
      <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>Share Your Feedback</h2>
      <p style={{ color: "#888", fontSize: 14, marginBottom: 32 }}>Let us know what you think about the Cube Interactive Game.</p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 48 }}>
        <input
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ padding: "8px 12px", border: "1px solid #ccc", borderRadius: 6, maxWidth: 280 }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 14, color: "#888", marginRight: 8 }}>Rating:</span>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: star <= (hoveredRating || rating) ? "#f59e0b" : "#ccc" }}
            >
              ★
            </button>
          ))}
        </div>
        <textarea
          placeholder="Write your feedback..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          style={{ padding: "8px 12px", border: "1px solid #ccc", borderRadius: 6 }}
        />
        <button type="submit" style={{ alignSelf: "flex-start", padding: "8px 20px", background: "#333", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>
          Submit Feedback
        </button>
      </form>

      {feedbacks.length > 0 && (
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 500, marginBottom: 16 }}>Recent Feedback</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#f5f5f5" }}>
                <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 500, color: "#666" }}>Name</th>
                <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 500, color: "#666" }}>Rating</th>
                <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 500, color: "#666" }}>Feedback</th>
                <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 500, color: "#666" }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {feedbacks.map((fb) => (
                <tr key={fb.id} style={{ borderTop: "1px solid #eee" }}>
                  <td style={{ padding: "10px 16px", fontWeight: 500 }}>{fb.name}</td>
                  <td style={{ padding: "10px 16px", color: "#f59e0b" }}>{"★".repeat(fb.rating)}{"☆".repeat(5 - fb.rating)}</td>
                  <td style={{ padding: "10px 16px", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fb.message}</td>
                  <td style={{ padding: "10px 16px", color: "#888", whiteSpace: "nowrap" }}>{fb.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default FeedbackSection;
