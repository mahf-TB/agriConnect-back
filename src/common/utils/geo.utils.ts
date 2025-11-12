
/**
 * Supprime un fichier uploadé s’il existe.
 * @param lat1 - latitude du premier point
 * @param lon2 - longitude du premier point
 * @param lat3 - latitude du second point
 * @param lon4 - longitude du second point
 * @return distance en kilomètres entre les deux points
 * 
 * Utilise la formule de Haversine pour calculer la distance entre deux points
 */

export function calculerDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // rayon de la Terre en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
