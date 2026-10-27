# 27 Eki 2026 — Figma giriş/kayıt + Cloudflare

## Cloudflare

NS **döndü.** 27 Eki sabah ölçüldü:

- NS: `harleigh.ns.cloudflare.com` / `tanner.ns.cloudflare.com`
- `api.meerk.com.tr` → Cloudflare anycast (`172.67.179.60`, `104.21.83.170`)
- `GET /health` → `1.1.9+45a49c4…`, header `server: cloudflare`, `cf-ray`

**Eksik:** public **MX yok.** Gelen `info@` kopabilir. Cloudflare DNS’e (gri) ekle:

- MX `@` → `mx-01.kurumsaleposta.com` (10)
- MX `@` → `mx-02.kurumsaleposta.com` (20)
- CNAME `mail` → `mail.kurumsaleposta.com`
- SPF / DKIM: Webim ticket 15 Eyl satırları

SSL Full (strict), WebSockets, `/uploads` cache, `/api`+`/hubs` bypass henüz script ile basılmadı. Token sohbete koyma. Script: `~/RiderProjects/AD_BlueDateApp/deploy/cloudflare/apply-api-proxy.sh`.

## Figma giriş / kayıt (file `4aA12PtSRUwMdCPiKWOX4J`)

Light frame’ler (isimler Figma’da hâlâ “Yakındakiler”):

| Ekran | Node | Konum |
|---|---|---|
| Giriş | `318:13179` | x=2292 y=2258 |
| Kayıt | `318:13393` | x=2700 y=2258 |
| Şifremi unuttum | `318:13067` | header Şifreyi Sıfırlayın + e-posta + Gönder |
| Reset OTP | `318:12823` | Doğrulama Kodu + 6 kutu + Onayla |
| Yeni şifre | `318:12921` | Yeni Şifre Oluşturma + 2 pill + Oluştur |
| Şifre başarı | `318:13023` | Şifreniz Oluşturulmuştur + Giriş Yap |
| Kayıt OTP | `318:13627` | Hesabınızı / doğrulayın + timer + Onayla |
| Profil tamamla | `318:13709` | Kendini Tanıt — foto + kullanıcı adı + ad soyad + doğum/cinsiyet + favoriler + Devam Et |
| Premium | `318:14021` | Daha iyi bağlantılar + tablo + 2 paket + Premium’a geç |
| Ayarlar | `318:17605` | Görünüm / Tercihler / Hesap / Uygulama / Gizlilik + Çıkış |
| Tema | `318:17787` | Açık Mod / Koyu Mod / Otomatik |
| Dil | `318:17843` | satır listesi — uygulama dilleri (IT/FR yok) |
| Bildirimler | `318:18198` | anlık / yakın / mesaj / kampanya switch |
| Filtreler | `318:17951` | Yaş Aralığı + Seçili Aralık + Görmek İstediklerim + Beni Görenler + Kaydet |

Uygulanan:

- Foto cluster (Figma hero PNG, `src/assets/auth/hero-*.png`) + turuncu noktalar
- Başlık: son kelime `plusCta` (Giriş: “katıl”, Kayıt: “başlar”)
- Krem pill input (`authField` / `authFieldBorder`), radius 15, yükseklik 53
- Turuncu CTA 51 / 15
- Giriş: Şifremi Unuttum, ve ya, Google / Apple (OAuth yok — “yakında”), Kayıt Ol
- Kayıt: email + 2 şifre + kural metni + KVKK satırı + Kayıt Ol + Giriş Yap

API hâlâ ad, soyad, kullanıcı adı, doğum, cinsiyet istiyor; bu alanlar kayıtta **Figma’dan sonra** aynı pill stilde duruyor.

Profil tamamla `318:13709` (27 Eki, kota yok — XML): `OnboardingSetupScreen` — “Kendini / Tanıt”, “İnsanlar sen nasıl tanısın?”, 100 avatar + “Profil fotoğrafı ekle”, kullanıcı adı / ad soyad pill, doğum (tarih + burç) + cinsiyet “Seçiniz”, Favoriler satırları (Ekle / Değiştir), **Devam Et** `BottomActionDock` + `AuthPrimaryButton`. Gate aynı: tüm favori + en az 1 foto. Identity `updateUserBasics`.

Premium `318:14021` (kota yok — XML): karşılaştırma tablosu (Plus / Premium), iki paket kartı, **Premium’a geç** / **Plus’a geç**, geri yükle + KVKK. Reklamsız satır yok (ürün vaadi kalkmıştı). IAP fiyatı varsa o basılır.

Ayarlar `318:17605` (27 Eki, kota yok — XML): krem 50h pill satırlar, bölüm başlıkları, Tema/Filtreler/Şifre/Premium/Hayalet/Bildirimler/Dil/Engellenenler/Gizlilik/Destek/Çıkış. Alt sayfalar: Tema `318:17787`, Dil `318:17843` (yalnız TR/EN/AR/RU), Bildirimler `318:18198`. Debug crash satırı Figma’da yok, kaldırıldı.

Şifre sıfırlama / OTP (27 Eki öğleden sonra, kota yok — XML + giriş chrome):

- Ortak `AuthFlowBar` + `AuthFlowHero` (blob + sms/kilit, pill, `AuthPrimaryButton`)
- Unuttum: “Şifreni mi unuttun?” + e-posta pill + satır içi “kayıtlı kullanıcı yok” + Gönder
- Reset OTP: “Doğrulama Kodu” + 6 kutu (58h) + hatalı kod satırı + Onayla
- Kayıt OTP: “Hesabınızı / doğrulayın” + yenile + `mm:ss` + Onayla
- Yeni şifre `318:12921`: “Yeni Şifre Oluşturma” + “Yeni şifre” / “Tekrar yeni şifre” + kural + Oluştur
- Başarı `318:13023`: “Şifreniz Oluşturulmuştur” + “Yeni şifreniz başarıyla oluşturulmuştur.” + Giriş Yap

## 27 Eki öğleden sonra — Filtreler + profil + 1.0.9

Filtreler `318:17951`: `FilterScreen` — Yaş Aralığı kartı (Seçili Aralık + 18–65+ kaydırıcı), Görmek İstediklerim / Beni Görenler chip (Erkek / LGBTQ+ / Herkes / Kadın), CTA **Kaydet**. `BottomActionDock` **`forceAboveTabBar`** (tab gizlenince alta gömülmesin). Prefill/save aynı `filterPrefs`.

Profil kapağı: 2–3 foto eklenince üstte beyaz çizgi. Pager çubuğu + iOS `RefreshControl` kaldırıldı. Foto okları duruyor. **Preview profile yok** — üç nokta Ayarlar.

Sürüm **1.0.9** (iOS 22 ASC, Android 10 AAB). Logo `app-logo.png` gerçek PNG (AAPT). UserProfile footer’a dokunulmadı.

## Yapma

UserProfile footer’a dokunma. Secret / token sohbet-git yok.
