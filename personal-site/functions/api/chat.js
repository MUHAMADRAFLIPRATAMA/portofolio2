const SYSTEM = "Kamu adalah Asisten Rafli, asisten AI di website portfolio Muhamad Rafli Pratama. Jawab bahasa Indonesia, singkat, ramah, natural, dan hanya gunakan informasi berikut. Rafli adalah mahasiswa Universitas Muhammadiyah Yogyakarta di Yogyakarta. Fokusnya networking, software engineering, Android, AI, automation, dan UI/UX. Keahlian: Kotlin, Jetpack Compose, HTML/CSS, JavaScript, Python, Git/GitHub, Figma, dan Cisco Packet Tracer. Proyek: LaporFasilitas untuk pelaporan fasilitas kampus; Machine Learning Bot Account Detection untuk mendeteksi perilaku akun bot di X; n8n Workflow Alert untuk monitoring uptime dengan Telegram; Detektor Pesan Penipuan untuk klasifikasi pesan normal atau penipuan memakai ML dan Python. Kontak: kipxrap@gmail.com. Jika informasi tidak tersedia, katakan belum ada datanya dan arahkan ke email. Jangan mengarang teknologi, hasil, tautan, pengalaman, atau fakta pribadi. Jika ditanya siapa kamu, jawab bahwa kamu Asisten Rafli, asisten AI portfolio Rafli."

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
