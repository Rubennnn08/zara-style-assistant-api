import OpenAI from "openai";

export default async function handler(req, res) {
  // CORS (para GitHub Pages)
  res.setHeader("Access-Control-Allow-Origin", "https://rubennnn08.github.io");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
   // Preflight
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

try {
    // ✅ Compatibilidad:
    // - Si tu web manda { message: "..." } -> lo convertimos a historial
    // - Si tu web manda { messages: [...] } -> usamos el historial real
    const body = req.body || {};

    let messages = [];

    if (Array.isArray(body.messages) && body.messages.length > 0) {
      messages = body.messages;
    } else if (typeof body.message === "string" && body.message.trim() !== "") {
      messages = [{ role: "user", content: body.message.trim() }];
    } else {
      return res.status(400).json({ error: "Missing message/messages" });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // ✅ Detectar si el usuario pide UNA sola prenda
    const lastUser =
      [...messages].reverse().find((m) => m.role === "user")?.content || "";
    const m = lastUser.toLowerCase();

    const wantsSingleItem =
      m.includes("solo una prenda") ||
      m.includes("una sola prenda") ||
      m.includes("solo una") ||
      m.includes("una prenda") ||
      m.includes("parte de arriba") ||
      m.includes("prenda de arriba") ||
      m.includes("qué top") ||
      m.includes("que top") ||
      m.includes("camisa") ||
      m.includes("blusa") ||
      m.includes("top");

    // ✅ Instrucciones del asistente (anti-bucle + invierno + corto)
    const systemText = `
Eres ZARA Style Assistant. Responde SIEMPRE en español. Sé breve: máximo 3 bullets o 1 párrafo corto.

TEMPORADA (España, invierno/otoño):
- NUNCA recomiendes sandalias ni calzado abierto.
- Solo botines, botas, mocasines o tacón cerrado, según formalidad.

REGLAS ANTI-BUCLE:
- Haz COMO MÁXIMO 1 pregunta CORTA SOLO si falta una información imprescindible.
- Si el usuario ya ha dicho (ocasión) + (formalidad) + (momento día/noche), NO preguntes más: recomienda el look directamente.
- No repitas preguntas que ya estén respondidas en el historial.

MODO “UNA SOLA PRENDA”:
- Si el usuario pide una sola prenda (ej: “parte de arriba” / “solo una prenda”), responde SOLO esa prenda, sin look completo, sin accesorios, sin zapatos.
${wantsSingleItem ? "IMPORTANTE: ahora responde SOLO UNA PRENDA." : ""}
`;

    // ✅ Llamada a OpenAI usando historial completo (clave para que no repita)
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [{ role: "system", content: systemText }, ...messages],
    });

    const text =
      response.output_text ?? "Lo siento, no he podido generar una respuesta.";

    return res.status(200).json({ reply: text });
  } catch (err) {
    return res.status(500).json({
      error: "Server error",
      details: String(err),
    });
  }
}
