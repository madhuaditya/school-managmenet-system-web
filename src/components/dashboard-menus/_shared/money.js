export const formatMoney = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '0.00';
  return amount.toFixed(2);
};

export const normalizeMoneyInput = (value) => {
  if (value === '' || value === null || value === undefined) return '';

  const cleaned = String(value).replace(/[^\d.]/g, '');
  if (!cleaned) return '';

  const [integerPart, ...decimalParts] = cleaned.split('.');
  if (decimalParts.length === 0) return integerPart;

  const decimalPart = decimalParts.join('').slice(0, 2);
  return `${integerPart}.${decimalPart}`;
};
