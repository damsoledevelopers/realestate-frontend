import { Booking } from '@/lib/types';
import { getStoredLocale } from '@/lib/locale';
import { translate } from '@/lib/i18n';
import { formatCurrency, formatDateTime } from '@/lib/formatLocale';
import { getLocalizedLayoutName, getLocalizedLocation } from '@/lib/localizedText';

export function downloadBookingReceipt(booking: Booking) {
  const locale = getStoredLocale();
  const t = (key: string) => translate(locale, key);
  const layoutName = booking.layout
    ? getLocalizedLayoutName(booking.layout.name, locale, booking.layout.nameMr)
    : '—';
  const layoutLocation = booking.layout
    ? getLocalizedLocation(booking.layout.location, locale, booking.layout.locationMr)
    : '—';

  const receipt = `
${t('receipt.title')}
=============================

${t('receipt.bookingId')}: ${booking._id}
${t('receipt.date')}: ${formatDateTime(booking.createdAt, locale)}
${t('receipt.status')}: ${booking.status.toUpperCase()}

${t('receipt.customer')}
--------
${t('receipt.name')}: ${booking.fullName}
${t('receipt.email')}: ${booking.email}
${t('receipt.phone')}: ${booking.phone}

${t('receipt.plotDetails')}
------------
${t('receipt.plotNumber')}: ${booking.plot?.plotNumber || '—'}
${t('receipt.layout')}: ${layoutName}
${t('receipt.location')}: ${layoutLocation}
${t('receipt.size')}: ${booking.plot?.size || '—'}
${t('receipt.price')}: ${booking.plot?.price != null ? formatCurrency(booking.plot.price, locale) : '—'}

${booking.approvedAt ? `${t('receipt.approved')}: ${formatDateTime(booking.approvedAt, locale)}\n` : ''}
${t('receipt.thankYou')}
`.trim();

  const blob = new Blob([receipt], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `booking-receipt-${booking.plot?.plotNumber || booking._id}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadPaymentReceipt(payment: import('@/lib/types').PaymentRecord) {
  const locale = getStoredLocale();
  const t = (key: string) => translate(locale, key);
  const layoutName = payment.layout?.name || '—';
  const plotNumber = payment.plot?.plotNumber || '—';

  const receipt = `
${t('paymentReceipt.title')}
=============================

${t('paymentReceipt.receiptNo')}: ${payment.receiptNumber}
${t('paymentReceipt.date')}: ${formatDateTime(payment.paymentDate, locale)}
${t('paymentReceipt.status')}: ${payment.status.toUpperCase()}

${t('paymentReceipt.customer')}
--------
${t('receipt.name')}: ${payment.customerName}
${t('receipt.email')}: ${payment.customerEmail || '—'}
${t('receipt.phone')}: ${payment.customerPhone || '—'}

${t('paymentReceipt.property')}
------------
${t('receipt.plotNumber')}: ${plotNumber}
${t('receipt.layout')}: ${layoutName}

${t('paymentReceipt.details')}
------------
${t('paymentReceipt.amount')}: ${formatCurrency(payment.amount, locale)}
${t('paymentReceipt.mode')}: ${payment.paymentMode.replace(/_/g, ' ').toUpperCase()}
${t('paymentReceipt.reference')}: ${payment.referenceNumber || '—'}
${payment.remarks ? `${t('paymentReceipt.remarks')}: ${payment.remarks}\n` : ''}
${t('paymentReceipt.thankYou')}
`.trim();

  const blob = new Blob([receipt], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `payment-receipt-${payment.receiptNumber}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

export function printPaymentReceipt(payment: import('@/lib/types').PaymentRecord) {
  const locale = getStoredLocale();
  const t = (key: string) => translate(locale, key);
  const layoutName = payment.layout?.name || '—';
  const plotNumber = payment.plot?.plotNumber || '—';

  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=640,height=800');
  if (!printWindow) return;

  printWindow.document.write(`
    <html>
      <head><title>${payment.receiptNumber}</title></head>
      <body style="font-family: sans-serif; padding: 24px; line-height: 1.5;">
        <h2>${t('paymentReceipt.title')}</h2>
        <p><strong>${t('paymentReceipt.receiptNo')}:</strong> ${payment.receiptNumber}</p>
        <p><strong>${t('paymentReceipt.date')}:</strong> ${formatDateTime(payment.paymentDate, locale)}</p>
        <p><strong>${t('paymentReceipt.status')}:</strong> ${payment.status}</p>
        <hr />
        <h3>${t('paymentReceipt.customer')}</h3>
        <p>${payment.customerName}<br/>${payment.customerEmail || ''}<br/>${payment.customerPhone || ''}</p>
        <h3>${t('paymentReceipt.property')}</h3>
        <p>${t('receipt.plotNumber')}: ${plotNumber}<br/>${t('receipt.layout')}: ${layoutName}</p>
        <h3>${t('paymentReceipt.details')}</h3>
        <p><strong>${t('paymentReceipt.amount')}:</strong> ${formatCurrency(payment.amount, locale)}</p>
        <p><strong>${t('paymentReceipt.mode')}:</strong> ${payment.paymentMode}</p>
        <p><strong>${t('paymentReceipt.reference')}:</strong> ${payment.referenceNumber || '—'}</p>
        ${payment.remarks ? `<p><strong>${t('paymentReceipt.remarks')}:</strong> ${payment.remarks}</p>` : ''}
        <p style="margin-top: 24px;">${t('paymentReceipt.thankYou')}</p>
        <script>window.onload = () => { window.print(); };</script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
