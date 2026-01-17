import OpenAI from "openai";

export default async function handler(req, res) {
  // CORS para GitHub Pages
  res.setHeader("Access-Control-Allow-Origin", "https://rubennnn08.github.io");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  try {
    // ✅ ahora recibimos { messages: [...] }
    const { messages } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Missing messages[]" });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const system = `
Eres ZARA Style Assistant. Responde SIEMPRE en español.
Recomendaciones cortas (máximo 3 ítems o 1 párrafo corto).

REGLAS CLAVE:
- Si es otoño/invierno en España: NUNCA recomiendes sandalias ni calzado abierto. Usa botines, botas, mocasines o tacón cerrado.
- NO hagas preguntas repetidas: si el usuario ya ha dicho (cena / noche / formal / elegante), NO lo vuelvas a preguntar.
- Haz como máximo 1 pregunta breve SOLO si falta un dato imprescindible.
- Si el usuario pide “una sola prenda” o pregunta por una prenda concreta (ej: “qué parte de arriba…”), responde con UNA ÚNICA prenda y nada más.
- Si el usuario pide “look completo”, entonces sí: propone conjunto (ropa + calzado + accesorio) pero corto.
`.trim();

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: system },
        ...messages, // ✅ aquí va el historial
      ],
    });

    const text = response.output_text ?? "Lo siento, no he podido generar una respuesta.";
    return res.status(200).json({ reply: text });
  } catch (err) {
    return res.status(500).json({ error: "Server error", details: String(err) });
  }
}
