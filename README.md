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
