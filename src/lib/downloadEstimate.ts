import type { EstimateRecord } from '@/lib/types';
import { getStoredLocale, type AppLocale } from '@/lib/locale';
import { translate } from '@/lib/i18n';
import { formatCurrency, formatDateTime } from '@/lib/formatLocale';
import { resolveMediaUrl } from '@/lib/media';

function buildEstimateHtml(estimate: EstimateRecord, t: (key: string) => string, locale: AppLocale) {
  const issuer = estimate.issuer || {};
  const logo = issuer.logoUrl ? `<img src="${resolveMediaUrl(issuer.logoUrl)}" alt="Logo" style="max-height:64px; margin-bottom:12px;" />` : '';
  const issuerAddress = [issuer.address, issuer.city, issuer.state, issuer.pincode].filter(Boolean).join(', ');
  const bankLines = [
    issuer.bankName && `${t('billing.bankName')}: ${issuer.bankName}`,
    issuer.bankAccountName && `${t('billing.accountName')}: ${issuer.bankAccountName}`,
    issuer.bankAccountNumber && `${t('billing.accountNumber')}: ${issuer.bankAccountNumber}`,
    issuer.bankIfsc && `${t('billing.ifsc')}: ${issuer.bankIfsc}`,
  ].filter(Boolean);

  const lineRows = estimate.lineItems
    .map(
      (item) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${item.description}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatCurrency(item.unitPrice, locale)}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatCurrency(item.amount, locale)}</td>
      </tr>`
    )
    .join('');

  return `
    <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.5;max-width:800px;margin:0 auto;">
      <div style="display:flex;justify-content:space-between;gap:24px;margin-bottom:24px;">
        <div>
          ${logo}
          <h1 style="margin:0 0 8px;font-size:24px;">${t('estimates.docTitle')}</h1>
          <p style="margin:0;color:#6b7280;">${estimate.estimateNumber}</p>
        </div>
        <div style="text-align:right;font-size:14px;">
          <p style="margin:0 0 4px;"><strong>${issuer.companyName || estimate.layout?.name || '—'}</strong></p>
          ${issuer.gstNumber ? `<p style="margin:0;">${t('billing.gst')}: ${issuer.gstNumber}</p>` : ''}
          ${issuerAddress ? `<p style="margin:4px 0 0;">${issuerAddress}</p>` : ''}
          ${issuer.phone ? `<p style="margin:4px 0 0;">${issuer.phone}</p>` : ''}
          ${issuer.email ? `<p style="margin:0;">${issuer.email}</p>` : ''}
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;">
        <div style="background:#f9fafb;padding:16px;border-radius:12px;">
          <h3 style="margin:0 0 8px;font-size:14px;">${t('estimates.customer')}</h3>
          <p style="margin:0;">${estimate.customerName}</p>
          <p style="margin:4px 0 0;color:#6b7280;">${estimate.customerEmail || ''}</p>
          <p style="margin:0;color:#6b7280;">${estimate.customerPhone || ''}</p>
          ${estimate.customerAddress ? `<p style="margin:4px 0 0;color:#6b7280;">${estimate.customerAddress}</p>` : ''}
        </div>
        <div style="background:#f9fafb;padding:16px;border-radius:12px;">
          <h3 style="margin:0 0 8px;font-size:14px;">${t('estimates.property')}</h3>
          <p style="margin:0;">${estimate.propertyLabel || estimate.layout?.name || '—'}</p>
          <p style="margin:4px 0 0;color:#6b7280;">${estimate.propertyDetails || estimate.layout?.location || ''}</p>
          <p style="margin:8px 0 0;color:#6b7280;">${t('estimates.date')}: ${formatDateTime(estimate.createdAt, locale)}</p>
          ${estimate.validUntil ? `<p style="margin:0;color:#6b7280;">${t('estimates.validUntil')}: ${formatDateTime(estimate.validUntil, locale)}</p>` : ''}
          <p style="margin:0;color:#6b7280;">${t('estimates.status')}: ${estimate.status}</p>
        </div>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;font-size:14px;">
        <thead>
          <tr style="background:#f3f4f6;">
            <th style="padding:8px;text-align:left;">${t('estimates.item')}</th>
            <th style="padding:8px;text-align:center;">${t('estimates.qty')}</th>
            <th style="padding:8px;text-align:right;">${t('estimates.rate')}</th>
            <th style="padding:8px;text-align:right;">${t('estimates.amount')}</th>
          </tr>
        </thead>
        <tbody>${lineRows}</tbody>
      </table>

      <div style="margin-left:auto;max-width:320px;font-size:14px;">
        <p style="display:flex;justify-content:space-between;"><span>${t('estimates.subtotal')}</span><span>${formatCurrency(estimate.subtotal, locale)}</span></p>
        ${estimate.discountAmount > 0 ? `<p style="display:flex;justify-content:space-between;"><span>${t('estimates.discount')}</span><span>-${formatCurrency(estimate.discountAmount, locale)}</span></p>` : ''}
        ${estimate.taxAmount > 0 ? `<p style="display:flex;justify-content:space-between;"><span>${t('estimates.tax')} (${estimate.taxRate}%)</span><span>${formatCurrency(estimate.taxAmount, locale)}</span></p>` : ''}
        <p style="display:flex;justify-content:space-between;font-size:18px;font-weight:700;border-top:1px solid #e5e7eb;padding-top:8px;"><span>${t('estimates.total')}</span><span>${formatCurrency(estimate.total, locale)}</span></p>
      </div>

      ${estimate.notes ? `<div style="margin-top:24px;"><h3 style="margin:0 0 8px;font-size:14px;">${t('estimates.notes')}</h3><p style="margin:0;color:#4b5563;">${estimate.notes}</p></div>` : ''}
      ${estimate.terms ? `<div style="margin-top:16px;"><h3 style="margin:0 0 8px;font-size:14px;">${t('estimates.terms')}</h3><p style="margin:0;color:#4b5563;">${estimate.terms}</p></div>` : ''}
      ${bankLines.length ? `<div style="margin-top:16px;"><h3 style="margin:0 0 8px;font-size:14px;">${t('billing.bankDetails')}</h3>${bankLines.map((line) => `<p style="margin:0;color:#4b5563;">${line}</p>`).join('')}</div>` : ''}
    </div>
  `;
}

export function downloadEstimateDocument(estimate: EstimateRecord) {
  const locale = getStoredLocale();
  const t = (key: string) => translate(locale, key);
  const content = `
${t('estimates.docTitle')}
${estimate.estimateNumber}
=============================

${t('estimates.customer')}: ${estimate.customerName}
${estimate.customerEmail || ''}
${estimate.customerPhone || ''}

${t('estimates.property')}: ${estimate.propertyLabel}
${estimate.propertyDetails || ''}

${estimate.lineItems.map((item) => `${item.description} | ${item.quantity} x ${formatCurrency(item.unitPrice, locale)} = ${formatCurrency(item.amount, locale)}`).join('\n')}

${t('estimates.subtotal')}: ${formatCurrency(estimate.subtotal, locale)}
${estimate.discountAmount > 0 ? `${t('estimates.discount')}: -${formatCurrency(estimate.discountAmount, locale)}\n` : ''}${estimate.taxAmount > 0 ? `${t('estimates.tax')}: ${formatCurrency(estimate.taxAmount, locale)}\n` : ''}${t('estimates.total')}: ${formatCurrency(estimate.total, locale)}
`.trim();

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${estimate.estimateNumber}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

export function printEstimateDocument(estimate: EstimateRecord) {
  const locale = getStoredLocale();
  const t = (key: string) => translate(locale, key);
  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=900,height=1000');
  if (!printWindow) return;

  printWindow.document.write(`
    <html>
      <head>
        <title>${estimate.estimateNumber}</title>
        <style>@media print { body { margin: 0; } }</style>
      </head>
      <body style="padding:24px;">
        ${buildEstimateHtml(estimate, t, locale)}
        <script>window.onload = () => { window.print(); };</script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

export async function shareEstimateDocument(estimate: EstimateRecord) {
  const locale = getStoredLocale();
  const t = (key: string) => translate(locale, key);
  const text = `${t('estimates.docTitle')} ${estimate.estimateNumber}\n${estimate.customerName}\n${t('estimates.total')}: ${formatCurrency(estimate.total, locale)}`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: estimate.estimateNumber,
        text,
      });
      return;
    } catch {
      // fall through to clipboard
    }
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
  }
}

export function previewEstimateHtml(estimate: EstimateRecord) {
  const locale = getStoredLocale();
  const t = (key: string) => translate(locale, key);
  return buildEstimateHtml(estimate, t, locale);
}
