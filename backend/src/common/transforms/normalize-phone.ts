export function normalizeVietnamesePhone(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const compact = value.trim().replace(/[\s().-]/g, '');
  if (compact.startsWith('+84')) return `0${compact.slice(3)}`;
  if (compact.startsWith('84')) return `0${compact.slice(2)}`;
  return compact;
}
