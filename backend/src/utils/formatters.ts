/**
 * Formats a numeric string or float into an Indian Rupee string format.
 */
export function formatRupees(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Formats an ISO date string into DD/MM/YYYY.
 */
export function formatDate(dateString?: string | null): string {
  if (!dateString) return '—';
  try {
    const dt = new Date(dateString);
    if (isNaN(dt.getTime())) return dateString;
    return String(dt.getDate()).padStart(2, '0') + '/' +
           String(dt.getMonth() + 1).padStart(2, '0') + '/' +
           dt.getFullYear();
  } catch {
    return dateString;
  }
}

/**
 * Converts a numeric amount into Indian Rupee words (Lakhs/Crores).
 */
export function numberToWords(n: number): string {
  if (isNaN(n) || n === 0) return 'Zero Rupees only';
  
  const a = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  
  const iw = (num: number): string => {
    if (num < 20) return a[num];
    if (num < 100) return b[Math.floor(num / 10)] + (num % 10 ? ' ' + a[num % 10] : '');
    if (num < 1000) return a[Math.floor(num / 100)] + ' hundred' + (num % 100 ? ' ' + iw(num % 100) : '');
    if (num < 100000) return iw(Math.floor(num / 1000)) + ' thousand' + (num % 1000 ? ' ' + iw(num % 1000) : '');
    if (num < 10000000) return iw(Math.floor(num / 100000)) + ' lakh' + (num % 100000 ? ' ' + iw(num % 100000) : '');
    return iw(Math.floor(num / 10000000)) + ' crore' + (num % 10000000 ? ' ' + iw(num % 10000000) : '');
  };

  const fixedStr = n.toFixed(2);
  const parts = fixedStr.split('.');
  const integerPart = parseInt(parts[0], 10);
  const decimalPart = parseInt(parts[1], 10);

  let words = iw(integerPart).trim();
  words = words.charAt(0).toUpperCase() + words.slice(1);

  if (decimalPart > 0) {
    words += ' and ' + iw(decimalPart).trim() + ' paise';
  }

  return words + ' only';
}
