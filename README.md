# Takip Listem

Okuduğun kitapları, izlediğin dizi ve filmleri takip etmek için kişisel bir uygulama. Netflix tarzı bir arayüzü var, kayıtlar bilgisayarındaki bir SQLite veritabanında saklanır.

## Özellikler

- Kitap, dizi ve film ekleme, düzenleme, silme: ad, yazar/yönetmen, tarih, 1–5 yıldız puan, durum (bitirdim / devam ediyorum / listemde), kısa not ve isteğe bağlı kapak görseli
- Ana sayfada dönen vitrin, yatay raflar, "Top 10" rafı, fareyle üzerine gelince açılan önizleme
- Türe, duruma ve puana göre filtreleme, isimle arama, sıralama
- İstatistikler: yıla göre bitirilenler, ortalama puanlar, aylara göre grafik
- JSON olarak dışa / içe aktarma (yedekleme)
- Telefon ekranına uyumlu

## Kurulum ve çalıştırma

[Node.js](https://nodejs.org) 22.13 veya üstü gerekir (veritabanı için Node'un yerleşik `node:sqlite` modülü kullanılır, ek bir veritabanı kurulumu gerekmez).

```bash
npm install
npm run build
npm start
```

Ardından tarayıcıda **http://localhost:5178** adresini aç.

macOS'ta `Takip Listem.command` dosyasına çift tıklamak da aynı işi yapar: gerekirse bağımlılıkları kurar, derler, sunucuyu başlatır ve tarayıcıyı açar.

### Geliştirme

```bash
npm start      # bir terminalde API sunucusu
npm run dev    # diğerinde Vite geliştirme sunucusu (API isteklerini 5178'e yönlendirir)
```

## Veriler nerede?

- Kayıtlar `data/takip.db` dosyasında saklanır. Bu klasör `.gitignore` ile depoya eklenmez.
- Farklı bir konum için: `DB_FILE=/yol/takip.db npm start`. Farklı port için: `PORT=3000 npm start`.
- Sunucu yalnızca `127.0.0.1` adresini dinler, başka cihazlardan erişilemez.
- `dist/index.html` sunucusuz da açılabilir; bu durumda kayıtlar tarayıcının yerel deposunda tutulur.

## Proje yapısı

```
server/         Node.js HTTP sunucusu (REST API) ve SQLite katmanı
src/            React arayüzü
src/shared/     Sunucu ve arayüzün ortak kullandığı veri doğrulama kuralları
```

### API

| Yöntem | Adres | Açıklama |
|---|---|---|
| GET | `/api/items` | Tüm kayıtlar |
| POST | `/api/items` | Yeni kayıt |
| PUT | `/api/items/:id` | Kaydı güncelle |
| DELETE | `/api/items/:id` | Kaydı sil |
| POST | `/api/import` | `{ items, mode: "merge" \| "replace" }` ile toplu içe aktarma |
| GET | `/api/health` | Sunucu durumu |
