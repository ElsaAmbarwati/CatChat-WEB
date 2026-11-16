// Penjelasan file controller ini dan tujuannya.
// Nama file: ai.controller.js.
// Deskripsi: Controller ini bertanggung jawab untuk mengintegrasikan layanan Chat AI.
// Fungsi utamanya adalah memproses pesan yang diterima dari pengguna,
// menambahkan instruksi sistem (system prompt) yang telah ditentukan,
// lalu meneruskan informasi tersebut ke API Google Gemini untuk mendapatkan balasan.
// Keterkaitan (Connections):
// - Eksternal: Berkomunikasi dengan library @google/generative-ai, yang merupakan wrapper untuk REST-API Google Gemini.
// - Frontend: Setelah mendapatkan balasan dari AI, controller ini akan mengirimkan teks balasan tersebut
//   kembali ke `chat_controller.dart` di aplikasi Flutter, yang akan menampilkannya di antarmuka pengguna.
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Inisialisasi Gemini API dengan key dari .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Daftar model dengan auto-fallback agar tidak mudah terkena limit
const CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-2.5-flash-lite',
];

// Mendefinisikan fungsi asynchronous `generateAIResponse` yang akan menangani permintaan dan mengirimkan respons.
const generateAIResponse = async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Pesan tidak boleh kosong.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ success: false, message: 'GEMINI_API_KEY belum dikonfigurasi di server.' });
    }

    // System Prompt untuk membentuk karakter AI sebagai teman curhat psikologis
    const systemInstruction = `Kamu adalah teman curhat anonim di aplikasi CatChat (juga dikenal sebagai AnonHeart).
Tugasmu adalah mendengarkan dengan penuh empati, ramah, dan suportif.
Gunakan bahasa Indonesia yang santai, gaul, namun tetap sopan (seperti ngobrol dengan teman sebaya).
Jangan menghakimi (non-judgmental).
Jangan berlagak seperti robot atau AI, bertingkahlah seperti manusia yang peduli.
Selain mendengarkan dengan empati, kamu HARUS selalu memberikan 1 pertanyaan pancingan yang lembut dan relevan di akhir balasanmu. Tujuannya untuk menggali lebih dalam perasaan pengguna, memancing mereka agar mau bercerita lebih banyak, atau membantu mereka mencari akar permasalahannya sendiri. Jangan pasif.
Jika pengguna menyebutkan kata-kata terkait menyakiti diri sendiri (bunuh diri, self-harm, putus asa yang parah), 
berikan dukungan moral ekstra dan sarankan mereka untuk menghubungi psikolog profesional atau layanan darurat.
Jaga balasanmu tetap ringkas (maksimal 3-4 kalimat pendek) agar nyaman dibaca di layar HP.`;

    // Format riwayat chat untuk Gemini
    const formattedHistory = [];
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        if (!msg.text) continue;
        formattedHistory.push({
          role: msg.isAi ? 'model' : 'user',
          parts: [{ text: msg.text }],
        });
      }
    }

    // PENTING: Gemini API mewajibkan riwayat chat harus dimulai dengan role "user".
    while (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
      formattedHistory.shift();
    }

    // Coba model secara berurutan (Auto-Fallback jika salah satu model terkena limit)
    let responseText = null;
    let lastError = null;

    for (const modelName of CANDIDATE_MODELS) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemInstruction,
        });

        const chat = model.startChat({
          history: formattedHistory,
        });

        const result = await chat.sendMessage(message);
        responseText = result.response.text();
        if (responseText) {
          console.log(`✅ AI responded using model: ${modelName}`);
          break;
        }
      } catch (err) {
        console.warn(`⚠️ Model ${modelName} failed or limit reached (${err.message}). Trying fallback model...`);
        lastError = err;
      }
    }

    if (!responseText) {
      throw lastError || new Error('Semua model AI sedang mencapai batas kuota.');
    }

    res.status(200).json({
      success: true,
      data: {
        reply: responseText,
      },
    });
  } catch (error) {
    console.error('❌ AI Chat Error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal terhubung ke AI.',
      error: error.message,
    });
  }
};

module.exports = {
  generateAIResponse,
};
