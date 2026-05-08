export function formatShortDate(iso?: string): string {
  if (!iso) return '—';

  try {
    return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  } catch {
    return iso;
  }
}
