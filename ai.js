// Vercel serverless function: verifies the Supabase login, then calls Gemini with a server-side key.
module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const tok = (req.headers.authorization || "").replace(/^Bearer /, "");
  if (!tok) return res.status(401).json({ error: "Please sign in." });
  const who = await fetch(process.env.SUPABASE_URL + "/auth/v1/user", { headers: { Authorization: "Bearer " + tok, apikey: process.env.SUPABASE_ANON_KEY } });
  if (!who.ok) return res.status(401).json({ error: "Session expired. Sign in again." });
  const m = req.body && req.body.messages;
  if (!Array.isArray(m) || !m.length || m.length > 40 || m.some(x => !x || !["user", "assistant"].includes(x.role) || typeof x.content !== "string")) return res.status(400).json({ error: "Bad request." });
  if (m.reduce((a, x) => a + x.content.length, 0) > 24000) return res.status(413).json({ error: "Message too long." });
  const busy = { error: "The AI service is busy. Try again shortly." };
  try {
    if (process.env.GEMINI_API_KEY) {
      const model = process.env.AI_MODEL || "gemini-2.5-flash";
      const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent", {
        method: "POST",
        headers: { "x-goog-api-key": process.env.GEMINI_API_KEY, "content-type": "application/json" },
        body: JSON.stringify({ contents: m.map(x => ({ role: x.role === "assistant" ? "model" : "user", parts: [{ text: x.content }] })), generationConfig: { maxOutputTokens: 1000 } })
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) return res.status(r.status === 429 ? 429 : 502).json(busy);
      const t = ((j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || []).map(p => p.text || "").join("");
      return res.status(200).json({ text: t });
    }
    return res.status(500).json({ error: "AI is not configured." });
  } catch (e) { res.status(502).json(busy); }
};
