/**
 * Formatting Utilities
 *
 * Common formatting functions for currency, dates, and text
 */

/**
 * Format number as Thai Baht currency
 *
 * @example
 * formatCurrency(1000) // "฿1,000.00"
 * formatCurrency(99.5) // "฿99.50"
 * formatCurrency(0) // "ฟรี"
 */
export function formatCurrency(amount: number): string {
  // Special case for free
  if (amount === 0) {
    return 'ฟรี';
  }

  return `฿${amount.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format date to Thai format
 *
 * @param date - Date to format
 * @param format - Format string:
 *   - 'short': 'DD/MM/YYYY' (e.g., '19/12/2025')
 *   - 'medium': 'DD MMM YYYY' (e.g., '19 ธ.ค. 2025')
 *   - 'long': 'DD MMMM YYYY' (e.g., '19 ธันวาคม 2025')
 *   - 'full': 'วันที่ DD MMMM YYYY' (e.g., 'วันที่ 19 ธันวาคม 2025')
 *
 * @example
 * formatDate(new Date('2025-12-19'), 'short') // "19/12/2025"
 * formatDate(new Date('2025-12-19'), 'medium') // "19 ธ.ค. 2025"
 * formatDate(new Date('2025-12-19'), 'long') // "19 ธันวาคม 2025"
 */
export function formatDate(date: Date | string | null, format: 'short' | 'medium' | 'long' | 'full' = 'medium'): string {
  if (!date) return '-';

  const d = typeof date === 'string' ? new Date(date) : date;

  // Check if valid date
  if (isNaN(d.getTime())) return '-';

  const day = d.getDate();
  const month = d.getMonth();
  const year = d.getFullYear() + 543; // Convert to Buddhist Era

  const thaiMonthsShort = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];

  const thaiMonthsFull = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  switch (format) {
    case 'short':
      return `${day.toString().padStart(2, '0')}/${(month + 1).toString().padStart(2, '0')}/${year}`;
    case 'medium':
      return `${day} ${thaiMonthsShort[month]} ${year}`;
    case 'long':
      return `${day} ${thaiMonthsFull[month]} ${year}`;
    case 'full':
      return `วันที่ ${day} ${thaiMonthsFull[month]} ${year}`;
    default:
      return `${day} ${thaiMonthsShort[month]} ${year}`;
  }
}

/**
 * Format time remaining until a date
 *
 * @example
 * formatTimeRemaining(tomorrow) // "เหลือ 1 วัน"
 * formatTimeRemaining(nextWeek) // "เหลือ 7 วัน"
 * formatTimeRemaining(nextMonth) // "เหลือ 30 วัน"
 * formatTimeRemaining(yesterday) // "หมดอายุแล้ว"
 * formatTimeRemaining(null) // "ตลอดชีพ"
 */
export function formatTimeRemaining(endDate: Date | string | null): string {
  // Lifetime subscription
  if (!endDate) {
    return 'ตลอดชีพ';
  }

  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  const now = new Date();

  // Check if valid date
  if (isNaN(end.getTime())) return '-';

  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Already expired
  if (diffDays < 0) {
    return 'หมดอายุแล้ว';
  }

  // Same day
  if (diffDays === 0) {
    return 'วันนี้';
  }

  // Less than 7 days
  if (diffDays < 7) {
    return `เหลือ ${diffDays} วัน`;
  }

  // Less than 30 days
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `เหลือ ${weeks} สัปดาห์`;
  }

  // Less than 365 days
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `เหลือ ${months} เดือน`;
  }

  // More than 1 year
  const years = Math.floor(diffDays / 365);
  return `เหลือ ${years} ปี`;
}

/**
 * Pluralize word based on count
 *
 * For Thai language, this is simpler as there's no plural form
 * But useful for displaying count with word
 *
 * @example
 * pluralize(1, 'วัน', 'วัน') // "1 วัน"
 * pluralize(5, 'วัน', 'วัน') // "5 วัน"
 * pluralize(1, 'item', 'items') // "1 item"
 * pluralize(5, 'item', 'items') // "5 items"
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  const word = count === 1 ? singular : (plural || singular);
  return `${count} ${word}`;
}

/**
 * Format file size to human-readable string
 *
 * @example
 * formatFileSize(1024) // "1 KB"
 * formatFileSize(1048576) // "1 MB"
 * formatFileSize(500) // "500 B"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Truncate text with ellipsis
 *
 * @example
 * truncate('Hello World', 5) // "Hello..."
 * truncate('Hello', 10) // "Hello"
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}
