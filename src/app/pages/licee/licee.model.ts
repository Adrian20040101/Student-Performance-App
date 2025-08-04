export interface HighSchoolOptionInterface {
  ja: string;
  jp: string;
  s: string;
  sc: string;
  sp: string;
  lm: string;
  n: string;
  mabs: string;
  madm: string;
  mev: string;
  nmate: string;
  nro: string;
  nlm: string;
  an?: number;
}

export interface FilteredHighSchoolEntry {
  liceu: string;
  specializare: string;
  primaMedie: string;
  primaAbs: string;
  pozMin: number;
  idMin: string;
  ultimaMedie: string;
  ultimaAbs: string;
  pozMax: number;
  idMax: string;
  limba: string;
}
