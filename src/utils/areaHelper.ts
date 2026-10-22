/**
 * Helper to identify if a dependency is a boundary fence or facade (vertical surface).
 */
export const isFachadaOCierre = (name: string): boolean => {
  const nameLower = (name || '').trim().toLowerCase();
  return (
    nameLower.includes('cierre') ||
    nameLower.includes('fachada') ||
    nameLower.includes('perimetral')
  );
};

/**
 * Calculates the surface area in square meters (M²) for a dependency.
 * Boundary fences and facades (cierre, fachada, perimetral) return 0 M²
 * so they do NOT sum wall surface into the total floor area of the house.
 */
export const getRoomArea = (largo: number, ancho: number, _alto: number, name: string): number => {
  if (isFachadaOCierre(name)) {
    return 0; // Fachadas and cierres do not count towards floor square meters
  }
  
  const l = Number(largo) || 0;
  const a = Number(ancho) || 0;
  
  if (l > 0 && a > 0) {
    return (l / 100) * (a / 100);
  }

  return 0;
};
