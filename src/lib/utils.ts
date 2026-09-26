export function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(iso));
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function whatsappLink(number: string, message: string): string {
  const digits = number.replace(/[^\d]/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

// Normalizes user-entered voting codes: uppercase, trimmed, ensures the AWD- prefix.
export function normalizeCode(raw: string): string {
  let code = raw.trim().toUpperCase();
  if (!code.startsWith('AWD-') && code.length > 0) {
    code = 'AWD-' + code.replace(/^AWD-?/, '');
  }
  return code;
}
