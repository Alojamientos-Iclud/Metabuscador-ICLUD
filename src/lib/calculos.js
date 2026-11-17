export function precioPorHuesped(precioPorNoche, huespedes) {
  if (!Number.isFinite(precioPorNoche) || !Number.isInteger(huespedes) || huespedes < 1) return null;
  return Math.round((precioPorNoche / huespedes) * 100) / 100;
}