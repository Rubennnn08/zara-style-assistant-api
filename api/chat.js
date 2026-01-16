import OpenAI from "openai";

export default async function handler(req, res) {
  // Permite CORS para que tu web (GitHub Pages) pueda llamar a esta API
  res.setHeader("Access-Control-Allow-Origin", "https://rubennnn08.github.io");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Preflight (CORS)
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  try {
    const { message } = req.body || {};
    if (!message) return res.status(400).json({ error: "Missing message" });

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Llamada a OpenAI (Responses API)
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "Eres ZARA Style Assistant. Responde SIEMPRE en español. Recomendaciones cortas (máx 3 items). En otoño/invierno NUNCA recomiendes sandalias ni calzado abierto; prioriza botines, botas, mocasines o tacón cerrado según formalidad. Antes de recomendar, haz 1 pregunta breve sobre el plan si falta contexto."
        },
        { role: "user", content: message }
      ]
    });

    // El SDK devuelve el texto; lo extraemos de forma segura
    const text =
      response.output_text ?? "Lo siento, no he podido generar una respuesta.";

    return res.status(200).json({ reply: text });
  } catch (err) {
    return res.status(500).json({ error: "Server error", details: String(err) });
  }
}
