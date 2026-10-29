# WebForge Studio — gerçek AI + elle düzenleme

## Hızlı yayınlama (Render)
1. https://render.com/ adresinde GitHub ile giriş yap.
2. New + → Blueprint seç ve `hasanyetisir7-byte/WebForge.` deposunu bağla.
3. Render `render.yaml` dosyasını algılar. `OPENAI_API_KEY` alanına OpenAI Platform API anahtarını Render ortam değişkeni olarak gir; anahtarı GitHub'a veya site koduna koyma.
4. Deploy tamamlanınca Render sana `https://...onrender.com` adresi verir. Bu adresi açtığında frontend ve `/api/generate` aynı sunucuda çalışır.

## Önemli
- GitHub Pages statik barındırmadır; Node.js backend'i çalıştırmaz. Gerçek AI için Render gibi bir Node servisi gerekir.
- OpenAI API kullanımı ChatGPT aboneliğinden ayrıdır ve ayrıca ücretlendirilebilir.
- Bu başlangıç uygulamasını herkese açık üretim servisi yapmadan önce hız sınırı, kullanıcı doğrulama ve maliyet limitleri ekle.
