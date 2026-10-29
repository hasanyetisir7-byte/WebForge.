# WebForge Studio — Gemini AI + elle düzenleme

## Render kurulumu
1. https://aistudio.google.com/ adresinden Gemini API anahtarı oluştur.
2. https://render.com/ adresinde WebForge servisinin **Environment** bölümünü aç.
3. `GEMINI_API_KEY` adında bir ortam değişkeni ekle ve API anahtarını değer olarak gir.
4. `GEMINI_MODEL` değerini `gemini-3.1-flash-lite` olarak ayarla.
5. Kaydet ve servisi yeniden deploy et. `/api/health` adresinde `aiConfigured: true` görünmeli.

API anahtarını GitHub'a, site koduna veya herkese açık bir yere koyma.

## Önemli
- Gemini API'nin bazı modellerinde ücretsiz kullanım katmanı vardır; limitler ve erişim koşulları değişebilir.
- Ücretsiz katmanda istek sınırına ulaşılırsa bir süre bekleyip yeniden dene. Güncel limitleri Google AI Studio'dan kontrol et.
- GitHub Pages statik barındırmadır; Node.js backend'i çalıştırmaz. WebForge'un gerçek AI özelliği Render sunucusunu kullanır.
- Bu başlangıç uygulamasını herkese açık üretim servisi yapmadan önce hız sınırı ve kullanıcı doğrulama ekle.
