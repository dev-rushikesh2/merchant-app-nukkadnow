import * as QRCode from 'qrcode';

export function getCustomerStorefrontBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const { hostname, protocol } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:4300`;
    }
    return window.location.origin;
  }
  return 'http://localhost:4300';
}

export function buildCustomerOrderUrl(outletId: string, sourceTag: string): string {
  const safeOutlet = encodeURIComponent(outletId || 'outlet-merchant-kirana-00');
  const safeSource = encodeURIComponent(sourceTag || 'COUNTER');
  return `${getCustomerStorefrontBaseUrl()}/merchant/${safeOutlet}?source=${safeSource}`;
}

/**
 * Generates a real, camera-scannable SVG QR code synchronously using the `qrcode` matrix encoder.
 */
export function generateMerchantQrSvg(targetUrl: string): string {
  const qr = QRCode.create(targetUrl || 'http://localhost:4300', {
    errorCorrectionLevel: 'M'
  });
  const count = qr.modules.size;
  const margin = 2;
  const total = count + margin * 2;
  const parts: string[] = [];

  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (qr.modules.get(row, col)) {
        parts.push(`M${col + margin},${row + margin}h1v1h-1z`);
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="220" height="220" shape-rendering="crispEdges" role="img" aria-label="Scannable Shop Order QR"><rect width="${total}" height="${total}" fill="#ffffff"/><path d="${parts.join('')}" fill="#0f172a"/></svg>`;
}

export function downloadQrSvg(fileSlug: string, targetUrl: string): void {
  const svg = generateMerchantQrSvg(targetUrl);
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  triggerBrowserDownload(URL.createObjectURL(blob), `${sanitizeFilename(fileSlug)}-shop-qr.svg`, true);
}

export async function downloadStandeePosterPng(opts: {
  shopName: string;
  locality?: string;
  city?: string;
  label: string;
  targetUrl: string;
  sourceTag?: string;
}): Promise<void> {
  const width = 1080;
  const height = 1480;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Orange branded header banner
  const grad = ctx.createLinearGradient(0, 0, width, 240);
  grad.addColorStop(0, '#f97316');
  grad.addColorStop(1, '#ea580c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, 240);

  // Brand Title
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 56px Inter, system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('NukkadNow', width / 2, 108);

  ctx.fillStyle = '#ffedd5';
  ctx.font = '600 28px Inter, system-ui, -apple-system, sans-serif';
  ctx.fillText('NEIGHBOURHOOD EXPRESS ORDERING', width / 2, 165);

  // Shop Name & Location
  ctx.fillStyle = '#0f172a';
  ctx.font = '800 52px Inter, system-ui, -apple-system, sans-serif';
  ctx.fillText(truncateText(opts.shopName || 'NukkadNow Store', 28), width / 2, 340);

  const locationLine = [opts.locality, opts.city].filter(Boolean).join(', ');
  if (locationLine) {
    ctx.fillStyle = '#475569';
    ctx.font = '600 28px Inter, system-ui, -apple-system, sans-serif';
    ctx.fillText(truncateText(locationLine, 42), width / 2, 392);
  }

  // Standee Label Pill
  const badgeText = (opts.label || 'Shop Counter QR').toUpperCase();
  ctx.fillStyle = '#fff7ed';
  roundRect(ctx, width / 2 - 220, 428, 440, 56, 28);
  ctx.fill();
  ctx.strokeStyle = '#fdba74';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#ea580c';
  ctx.font = '700 24px Inter, system-ui, -apple-system, sans-serif';
  ctx.fillText(truncateText(badgeText, 26), width / 2, 464);

  // Scan Callout
  ctx.fillStyle = '#1e293b';
  ctx.font = '800 38px Inter, system-ui, -apple-system, sans-serif';
  ctx.fillText('SCAN QR TO ORDER ONLINE', width / 2, 558);

  // QR Container Box
  const qrBoxSize = 680;
  const qrBoxX = (width - qrBoxSize) / 2;
  const qrBoxY = 600;
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 36);
  ctx.fill();
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 4;
  ctx.stroke();

  const qrDataUrl = await QRCode.toDataURL(opts.targetUrl, {
    width: 600,
    margin: 2,
    errorCorrectionLevel: 'H',
    color: { dark: '#0f172a', light: '#ffffff' }
  });

  const qrImg = await loadImage(qrDataUrl);
  ctx.drawImage(qrImg, qrBoxX + 40, qrBoxY + 40, 600, 600);

  // Footer Instructions & Link
  ctx.fillStyle = '#334155';
  ctx.font = '700 26px Inter, system-ui, -apple-system, sans-serif';
  ctx.fillText('Self-Pickup  •  Home Delivery  •  UPI & Pay at Shop', width / 2, 1345);

  ctx.fillStyle = '#64748b';
  ctx.font = '500 22px ui-monospace, SFMono-Regular, monospace';
  ctx.fillText(truncateText(opts.targetUrl, 60), width / 2, 1400);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 20px Inter, system-ui, -apple-system, sans-serif';
  ctx.fillText('Point your phone camera or Google Lens to scan & order', width / 2, 1445);

  const pngUrl = canvas.toDataURL('image/png');
  triggerBrowserDownload(pngUrl, `${sanitizeFilename(opts.shopName)}-${sanitizeFilename(opts.label)}-qr-poster.png`, false);
}

function triggerBrowserDownload(href: string, filename: string, revokeAfter: boolean): void {
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  if (revokeAfter) {
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  }
}

function sanitizeFilename(input: string): string {
  return (input || 'nukkadnow').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'nukkadnow';
}

function truncateText(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}...` : text;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
