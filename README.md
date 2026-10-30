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

## Demo Pro / Supabase kurulumu
1. Supabase projenin SQL Editor bölümünde depodaki `supabase-demo-pro.sql` dosyasını bir kez çalıştır.
2. Render servisinin **Environment** bölümünde `SUPABASE_URL` ve `SUPABASE_PUBLISHABLE_KEY` değerlerinin WebForge arayüzündeki aynı Supabase projesine ait olduğunu doğrula.
3. Render'a `SUPABASE_SERVICE_ROLE_KEY` değişkenini ekle. Bu anahtarı Supabase Project Settings → API bölümünden al; yalnızca Render'da sakla, GitHub'a veya tarayıcı koduna koyma.
4. Demo Pro yönetici panelini kullanacaksan `WEBFORGE_TEST_PRO_EMAIL` değerine yönetici hesabının e-posta adresini yaz.
5. Render servisini yeniden deploy et. Kullanıcı girişi ve Demo Pro durumu aynı Supabase projesi üzerinden doğrulanır.

Not: `SUPABASE_URL` ve `SUPABASE_PUBLISHABLE_KEY` arayüzdeki herkese açık Supabase ayarlarıyla eşleşmelidir. Servis rolü anahtarı gizlidir.
