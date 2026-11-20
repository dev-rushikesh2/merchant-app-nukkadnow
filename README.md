# NukkadNow Merchant Portal (`merchant-app-nukkadnow`)

The standalone web and mobile merchant management application for NukkadNow quick-commerce.

## 🚀 Features (30 Screens)
- **Merchant Authentication & 7-Step Onboarding Wizard**: Store details, FSSAI/GSTIN documents, bank details, delivery zones, operating hours.
- **Merchant Dashboard**: Live shop open/paused toggle, today's GMV, order volume, live queue size, and instant order alerts.
- **Live Order Management**: Real-time incoming, in-kitchen, ready, completed tabs, customer calling, and pickup token verification.
- **Kitchen Queue Board (KDS)**: Fullscreen TV Kitchen Display System, token status progression, and voice announcement chime.
- **Walk-in POS & Counter Billing**: Instant barcode search, quick category pills, multi-mode payment (Cash, UPI, Card, Due), and print receipt generator.
- **Product & Category Management**: Dynamic image uploader, dietary tagging, MRP vs selling discount calculator, low stock threshold.
- **Inventory & Stock Adjustment**: Audit trail, stock restock/wastage drawer, projected inventory preview.
- **Capacity & Slots**: 15m/30m/45m intervals, slot order limits, blackout window scheduler, and scheduled pre-orders.
- **Delivery & Staff Management**: Self-delivery radius slider, serviceable pincodes, 4-digit staff PIN switcher, and role permissions.
- **Business Analytics & Settings**: GMV revenue trend chart, sales channel distribution, sound alerts, and store profile.

---

## 📋 Comprehensive Changelog & Architectural Log

### [Release: 2026-11-19] — Android Native APK & Mandatory Splash / Authentication Gate
- **Capacitor 6 Android Integration:** Configured `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, and `@capacitor/splash-screen` with `appId: com.nukkadnow.merchant`.
- **Mandatory Splash Screen & Auth Gate:**
  - Launching the Android APK displays the native brand splash screen (`#2E1065` background).
  - Webview initial landing enforces the Splash Screen view mode with 3D storefront vector illustration and two primary actions: **"Login to Shop"** and **"Register New Shop"**.
  - All store management routes (`/dashboard`, `/order-inbox`, `/walkin-orders`, `/queue-board`, `/catalogue`, `/inventory`, `/preorders`, `/outlets`, etc.) are protected with `merchantAuthGuard`.
  - Unauthenticated visits automatically redirect to `/auth/login` (splash view mode).
  - Verified OTP and Demo Shop logins persist session credentials (`nk_merchant_user`) to local storage and route immediately to `/dashboard`.
- **Standalone Android APK Generation:**
  - Compiled using Android Studio toolchain (Microsoft OpenJDK 17 + Android SDK 34 + Gradle 8.2.1).
  - Generated output debug APK: `c:\Nukkadnow\NukkadNow-Merchant.apk` (4.20 MB).

### [Release: 2026-11-18] — Dynamic POS Billing, OpenStreetMap Leaflet Geofencing & Audio Chime Alerts

#### 1. Delivery & Fleet Management with Real OpenStreetMap Leaflet Map (`/delivery-settings`)
- **Interactive Leaflet Map Integration:** Replaced static vector diagram with live OpenStreetMap tiles centered dynamically on the active merchant's coordinates (`Nagpur Sitabuldi`, `Nagpur Dharampeth`, `Akola Civil Lines`, `Akola Ramdaspeth`).
- **Dynamic Store Marker Beacon:** Animated store pin featuring the merchant's avatar icon, store name, and full street address popup.
- **Reactive Geofence Radius Circle:** Dynamic `L.circle` that expands/contracts smoothly in real time as the merchant adjusts the radius slider ($1.0\text{ to }15.0\text{ km}$) or taps quick preset buttons ($2, 3, 5, 6, 8, 10, 15\text{ km}$).
- **Coverage Area Calculation:** Computes total coverage surface in square kilometers ($\text{km}^2 = \pi r^2$) dynamically.
- **Fullscreen Interactive Map View:** Added fullscreen mode toggle (`⛶ Fullscreen`) with floating controls, auto-reflow (`map.invalidateSize()`), store re-centering button (`🎯 Re-center`), and floating radius selector.
- **In-Store Rider Fleet:** Roster for managing personal store riders (name, phone, two-wheeler registration).

#### 2. Walk-in Order & Counter POS Billing (`/walkin-orders`)
- **Backend API Integration:** Connected directly to `CatalogueApi.fetchProducts()` with tenant-scoped outlet resolution.
- **Category Filter Pills:** Dynamic category pills (`All`, `Beverages`, `Snacks`, `Dairy`, `Grocery`, etc.) derived from real catalogue items.
- **Fast-Touch Item Addition:** Instant addition to ticket with stock status checks and item counter.
- **Discount & Tax Computation:** Quick discount selectors ($0\%, 5\%, 10\%, 15\%$), automated $5\%$ GST calculation, subtotal, and grand total.
- **Multi-Mode Payment & Token Creation:** Support for `UPI`, `Cash`, `Card`, and `Udhaar (Due)` payments with thermal receipt preview and direct KDS kitchen dispatch.
- **Empty States:** Enhanced empty state distinguishing between active search query non-matches and empty category collections.

#### 3. Notifications, Audio Chimes & Pilot UAT (`/notifications`)
- **Realtime WebSocket Monitor:** Visual indicator displaying live WebSocket connection state with offline queue fallback.
- **Web Audio API Dual-Chime Synthesizer:** Built-in synthesizer generating dual-frequency order alert chimes ($800\text{ Hz} / 1200\text{ Hz}$) audible across noisy bazaar counters without MP3 dependencies.
- **Background Push Alerts:** Notification preference switch for background alert reception.
- **Nagpur Pilot Launch UAT Sign-Off:** 6-point checklist verifying device accessibility (4GB Android), offline transaction safety, address masking, and ESC/POS thermal printing.


## 🛠️ Development Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Start development server (runs on http://localhost:4200)
pnpm start
# or
npm start

# 3. Production build
pnpm run build:prod
# or
npm run build:prod
```
