# BlueDate — Mobil Uygulama (React Native CLI)

Sosyal / tanışma uygulaması **BlueDate**’in mobil istemcisi. Proje **bare React Native CLI** ile kurulmuştur (**Expo kullanılmaz**), hem **Android** hem **iOS** hedefler.

> **Aşama 1 — UI/UX & Projelendirme.** Bu sürümde yalnızca **frontend ekranları** vardır. Backend, API, authentication ve veri işlemleri **henüz bağlanmamıştır**; ekranlar `src/utils/mockData.ts` içindeki statik veriden beslenir. Mimari, ileride backend’in sorunsuz bağlanabilmesi için katmanlı kurulmuştur.

## Öne çıkanlar

- 🎮 **PlayStation / gaming hissiyatı**: akıcı animasyonlu, gradient “pill” seçimli özel bottom tab bar.
- 🌗 **Light / Dark / Sistem** tema modu + **3 değiştirilebilir renk teması** (Cosmic, Aurora, Sunset) → Ayarlar ekranından canlı değişir.
- 🧩 **Component bazlı temiz mimari**, tamamen yeniden kullanılabilir UI kütüphanesi.
- 📐 Merkezî **renk / typography / spacing / radii / shadow** tasarım sistemi.
- 📱 **Responsive** ölçekleme yardımcıları (`src/utils/responsive.ts`).
- 🖼️ İkonlar **SVG** ile çizilir (font-linking gerektirmez, her iki platformda nettir).

## Teknoloji

- React Native `0.86` (New Architecture) + React `19` + TypeScript
- React Navigation 7 (native-stack + bottom-tabs)
- react-native-reanimated 4 (+ worklets), react-native-gesture-handler
- react-native-svg, react-native-linear-gradient, react-native-safe-area-context

## Klasör yapısı

```
src/
├── assets/        # Görsel/font kayıt noktası (ikonlar SVG component'tir)
├── components/    # Yeniden kullanılabilir UI (Button, Input, Card, Avatar, ...)
├── hooks/         # useThemedStyles, useDebouncedValue, tema hook'ları
├── navigation/    # RootNavigator, Auth/Main stack'leri, özel tab bar, AuthContext
├── screens/       # Ekranlar (auth, home, nearby, friends, premium, profile, settings)
├── theme/         # Tema sistemi: palette, typography, spacing, ThemeProvider
└── utils/         # responsive, layout sabitleri, mockData
```

### Ekranlar
- **Auth**: `SplashScreen`, `LoginScreen`, `RegisterScreen`
- **Ana**: `HomeScreen`, `NearbyScreen`, `FriendsScreen` + `SearchUsersScreen`, `PremiumScreen`
- **Profil**: `ProfileScreen`, `EditProfileScreen`, `FriendsListScreen`
- **Ayarlar**: `SettingsScreen` (tema modu + renk teması seçici, bildirimler, gizlilik, çıkış)

## Tema sistemi

Tüm renk/spacing/typography değerleri `src/theme` altından gelir. Ekranlar sabit renk/ölçü yazmaz.

```tsx
import { useTheme } from '../theme';

const theme = useTheme();
theme.colors.primary;      // aktif renk temasının ana rengi
theme.spacing.lg;          // 20
theme.gradients.primary;   // gaming gradient
```

Tema modunu/rengini değiştirmek:

```tsx
import { useThemeController } from '../theme';

const { preference, setPreference, accentKey, setAccent } = useThemeController();
setPreference('dark');     // 'light' | 'dark' | 'system'
setAccent('aurora');       // 'cosmic' | 'aurora' | 'sunset'
```

> Tercihler şu an bellekte tutulur. Kalıcılık için ileride `@react-native-async-storage/async-storage` ekleyip `ThemeProvider`’a okuma/yazma bağlanabilir.

## Kurulum & Çalıştırma

Ön koşullar: Node ≥ 18, JDK 17, Android Studio / Xcode, CocoaPods. Resmi [React Native ortam kurulumu](https://reactnative.dev/docs/set-up-your-environment).

```bash
# Bağımlılıklar
npm install

# iOS pod'ları (yalnızca ilk kez ve native değişiklikten sonra)
cd ios && bundle install && bundle exec pod install && cd ..

# Metro
npm start

# Android
npm run android

# iOS
npm run ios
```

Testler ve statik kontrol:

```bash
npm test          # Jest (tema birim testi)
npm run lint      # ESLint
npx tsc --noEmit  # TypeScript tip kontrolü
```

## Sonraki aşama (backend entegrasyonu) için notlar

- `src/utils/mockData.ts` → gerçek API yanıtlarıyla değiştirin; ekranlar dokunmadan çalışır.
- `src/navigation/AuthContext.tsx` → mock `signIn/signOut`’u gerçek auth akışına bağlayın.
- Tipler (`Friend`, `UserProfile`, `NearbyUser`, ...) DTO sözleşmesi için başlangıç noktasıdır.
