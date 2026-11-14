const SYSTEM = "Kamu adalah Pixel, chatbot AI ramah di portfolio Muhamad Rafli Pratama. Jawab bahasa Indonesia, singkat, jelas, natural. Jika ditanya siapa kamu, jawab bahwa kamu Pixel, chatbot AI di portfolio Rafli.";

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const messages = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
    if (!messages.length) return Response.json({ error: "Pesan kosong" }, { status: 400 });
    if (!env.GEMINI_API_KEY) return Response.json({ error: "GEMINI_API_KEY belum terbaca. Simpan variable di Production lalu redeploy." }, { status: 500 });
    const model = env.GEMINI_MODEL || "gemini-2.5-flash-lite";
    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: String(m.content || "").slice(0, 1000) }]
    }));
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: SYSTEM }] }, contents, generationConfig: { temperature: 0.7, maxOutputTokens: 300 } })
    });
    const data = await r.json();
    if (!r.ok) return Response.json({ error: "Gemini API gagal", detail: data.error?.message || r.statusText }, { status: 502 });
    const reply = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("").trim();
    if (!reply) return Response.json({ error: "Gemini tidak mengirim jawaban" }, { status: 502 });
    return Response.json({ reply, model });
  } catch (e) { return Response.json({ error: "Request chatbot gagal", detail: String(e.message || e) }, { status: 500 }); }
}
