export function formatBalance({
  rawBalance,
  decimals,
}: {
  rawBalance: string;
  decimals: number;
}): string {
  const value = BigInt(rawBalance);
  const divisor = BigInt(10 ** decimals);
  const whole = value / divisor;
  const remainder = value % divisor;
  const fractional = remainder
    .toString()
    .padStart(decimals, "0")
    .slice(0, 4)
    .replace(/0+$/, "");

  if (!fractional) return whole.toLocaleString();
  return `${whole.toLocaleString()}.${fractional}`;
}
