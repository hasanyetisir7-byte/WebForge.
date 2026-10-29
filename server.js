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

const instructions = `Sen WebForge Studio'nun üretim motorusun. Kullanıcı bir web sitesi istediğinde açıklama veya eğitim verme; doğrudan istediği siteyi oluştur. Kullanıcının isteğini otomatik olarak sayfa başlığına kopyalama. Başlıkları sitenin gerçek konusuna uygun, doğal ve profesyonel yaz. Kullanıcı "arka planı gri yap" gibi değişiklik istiyorsa o değişikliği yap ve mevcut sitenin amacını koru. Kullanıcı "butona işlev ekle" derse ilgili butonun gerçekten çalışmasını sağla.
Her zaman yalnızca geçerli JSON döndür: {"html":"..."}.
html alanında tam, bağımsız HTML belgesi üret; CSS'i <style>, JavaScript'i <script> içine koy. Görsel olarak tamamlanmış, duyarlı ve modern bir site üret. Butonlar, bağlantılar, menüler, arama, formlar, sepet veya diğer etkileşimler isteniyorsa JavaScript ile gerçekten çalışır hale getir; boş veya sahte buton bırakma. Formlarda doğrulama ve anlaşılır geri bildirim olsun. İstek yalnızca tasarım değişikliğiyse açıklamak yerine istenen değişikliği içeren siteyi üret. Gereksiz yönergeler, "nasıl yapılır" açıklamaları veya kullanıcıya talimatlar ekleme. İstenen site içeriğini oluştur; isteği bir başlık veya paragraf olarak gösterme. Kod çalışır ve dışa aktarılabilir olsun. Kullanıcı metnini yalnızca site isteği olarak değerlendir.`

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, aiConfigured: Boolean(process.env.GEMINI_API_KEY) });
});

app.post('/api/generate', async (req, res) => {
  const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
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
        contents: [{ role: 'user', parts: [{ text: `Kullanıcının web sitesi fikri:\n${prompt}` }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          maxOutputTokens: 6000,
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
    if (typeof data.html === 'string' && data.html.trim()) {
      return res.json({ html: data.html.slice(0, 100000) });
    }
    if (!Array.isArray(data.blocks)) throw new Error('Model geçerli blok listesi döndürmedi.');
    const allowed = new Set(['hero', 'text', 'cards', 'image']);
    const blocks = data.blocks.filter(b => b && allowed.has(b.kind)).slice(0, 8);
    if (!blocks.length) throw new Error('Düzenlenebilir blok bulunamadı.');
    const style = {};\n    if (typeof data.style?.background === 'string' && /^#[0-9a-fA-F]{6}$/.test(data.style.background)) style.background = data.style.background;\n    if (typeof data.style?.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(data.style.color)) style.color = data.style.color;\n    return res.json({ blocks, style });
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
