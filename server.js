import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const port = Number(process.env.PORT || 3000);
const root = path.dirname(fileURLToPath(import.meta.url));

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin === 'https://hasanyetisir7-byte.github.io' || !origin) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(root, 'public')));

const instructions = `Sen WebForge içindeki genel amaçlı bir yapay zekâ asistanısın. Türkçe konuş, doğal ve yardımcı ol. Kullanıcı normal bir soru soruyorsa, sohbet ediyorsa veya bir şeyin açıklamasını istiyorsa doğrudan cevap ver; web sitesi üretmeye çalışma. Bu durumda yalnızca {"type":"chat","reply":"cevap"} JSON'u döndür.
Kullanıcı açıkça bir web sitesi oluşturmanı, mevcut siteyi değiştirmeyi veya kod üretmeni isterse doğrudan sonucu üret; nasıl yapılacağını anlatma. Bu durumda yalnızca {"type":"site","html":"tam bağımsız HTML belgesi"} JSON'u döndür. Eğer kullanıcı mesajında CURRENT WEBSITE HTML bölümü varsa ve kullanıcı bir özellik ekleme, ürün ekleme, buton ekleme, tasarım değiştirme veya başka bir site düzenlemesi istiyorsa MUTLAKA type=site döndür. chat döndürme, sadece yapacağını söyleme, 'bir saniye' gibi bir cevap verme. Yeni boş sayfa oluşturma. Verilen HTML'nin tamamını düzenleyerek geri döndür; mevcut sayfanın tasarımını, ürünlerini, sepetini ve diğer özelliklerini koru. İstek bir ekleme veya değişiklikse sadece o değişikliği mevcut siteye entegre et. Örneğin 'Patates Kahvesi ürününü menüye 100 TL ile ekle' isteğinde menüye gerçekten yeni ürün kartı ve fiyat ekle, mevcut sayfadaki ürünleri silme. Butonlara işlev eklerken JavaScript'i de yaz ve HTML içinde uygula. Örneğin mevcut mağazaya ödeme butonu istendiğinde ürünleri ve sepeti silme; ödeme butonunu ve uygun ödeme akışını aynı siteye ekle. Sohbet isteği gelse bile mevcut site bağlamı verilmişse site değişikliği değilse normal sohbet yanıtı verilebilir.
Site üretirken isteği başlık olarak kopyalama. Konuya uygun gerçek başlıklar, modern responsive tasarım ve işe yarayan etkileşimler üret. İstenen butonlar, formlar, arama, menüler, sepet vb. gerçekten JavaScript ile çalışsın. CSS <style>, JavaScript <script> içinde olsun. Arka plan/renk değişikliği istenirse uygula. Gereksiz açıklama, yönerge veya kod dışı metin ekleme. HTML çıktısı dışa aktarılabilir ve tamamlanmış olsun. JSON dışında hiçbir şey döndürme.`

const dailyUsage = new Map();
let usageDay = new Date().toISOString().slice(0, 10);
const DAILY_LIMIT = 20;

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, aiConfigured: Boolean(process.env.GEMINI_API_KEY) });
});

app.post('/api/generate', async (req, res) => {
  const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
  const currentHtml = typeof req.body?.currentHtml === 'string' ? req.body.currentHtml.slice(0, 90000) : '';
  if (!prompt) return res.status(400).json({ error: 'Lütfen site fikrini yaz.' });
  if (prompt.length > 4000) return res.status(400).json({ error: 'İstek en fazla 4000 karakter olabilir.' });
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: 'Render sunucusunda GEMINI_API_KEY ayarlanmamış.' });
  }

  try {
    const model = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: instructions }] },
        contents: [{ role: 'user', parts: [{ text: currentHtml ? `CURRENT WEBSITE HTML (preserve and modify this exact site):\\n${currentHtml}\\n\\nUSER REQUEST: ${prompt}` : prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          maxOutputTokens: 12000,
          temperature: 0.7
        }
      })
    });

    const result = await response.json();
    if (!response.ok) {
      const error = new Error(result?.error?.message || 'Gemini API isteği başarısız.');
      error.status = response.status;
      throw error;
    }
    const raw = result?.candidates?.[0]?.content?.parts
      ?.map(part => part.text || '')
      .join('')
      .trim() || '';
    if (!raw) throw new Error('Gemini boş yanıt döndürdü.');
    const data = JSON.parse(raw);
    if (data.type === 'chat' && typeof data.reply === 'string') {
      return res.json({ type: 'chat', reply: data.reply.slice(0, 12000) });
    }
    if (typeof data.html === 'string' && data.html.trim()) {
      return res.json({ type: 'site', html: data.html.slice(0, 100000) });
    }
    if (!Array.isArray(data.blocks)) throw new Error('Model geçerli blok listesi döndürmedi.');
    const allowed = new Set(['hero', 'text', 'cards', 'image']);
    const blocks = data.blocks.filter(b => b && allowed.has(b.kind)).slice(0, 8);
    if (!blocks.length) throw new Error('Düzenlenebilir blok bulunamadı.');
    const style = {};
    if (typeof data.style?.background === 'string' && /^#[0-9a-fA-F]{6}$/.test(data.style.background)) style.background = data.style.background;
    if (typeof data.style?.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(data.style.color)) style.color = data.style.color;
    return res.json({ blocks, style });
  } catch (error) {
    console.error('WebForge generation error:', error?.status || '', error?.message || error);
    const status = Number(error?.status || 0);
    let message = 'Gemini isteği başarısız oldu. Render Logs bölümündeki hatayı kontrol et.';
    if (status === 400) message = 'Gemini isteği kabul edilmedi. Model ayarını veya API isteğini kontrol et.';
    else if (status === 401 || status === 403) message = 'Gemini API anahtarı geçersiz veya erişim izni yok. Render Environment bölümündeki GEMINI_API_KEY değerini kontrol et.';
    else if (status === 429) message = 'Gemini ücretsiz kullanım sınırına ulaşıldı. Biraz bekleyip tekrar dene veya AI Studio limitlerini kontrol et.';
    else if (status === 404) message = 'Gemini modeli bulunamadı. GEMINI_MODEL değerini kontrol et.';
    else if (error instanceof SyntaxError) message = 'Gemini geçerli JSON döndürmedi. Tekrar dene.';
    return res.status(502).json({ error: message });
  }
});

app.listen(port, () => console.log(`WebForge Gemini server listening on port ${port}`));
