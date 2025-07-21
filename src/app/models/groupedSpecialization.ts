export interface GroupedSpecialization {
  sanitizedName: string,     // Liceu + Specializare
  positionsOccupied: number, // Poziții ocupate (total capacity)
  placesOccupied: number,    // Locuri ocupate
  placesFree: number,        // Locuri libere
  percentage: number,        // % Ocupare
  lastAverage: string        // Ultima medie
}
