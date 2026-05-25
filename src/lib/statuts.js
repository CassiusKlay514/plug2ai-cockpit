// Métadonnées des statuts — utilisées pour les couleurs et l'ordre d'affichage
export const STATUTS = [
  { code: 'CLIENT_SIGNE',        label: 'Client signé',         color: 'bg-ink text-paper',          dot: 'bg-ink' },
  { code: 'PROSPECT_CHAUD',      label: 'Prospect chaud',       color: 'bg-rust text-paper',         dot: 'bg-rust' },
  { code: 'PROSPECT_PUBLIC',     label: 'AO public',            color: 'bg-ink2 text-paper',         dot: 'bg-ink2' },
  { code: 'PROSPECT_PARTENAIRE', label: 'Partenaire',           color: 'bg-ocre-d text-paper',       dot: 'bg-ocre-d' },
  { code: 'PROSPECT_WEALTH',     label: 'Wealth Management',    color: 'bg-ocre text-ink',           dot: 'bg-ocre' },
  { code: 'PROSPECT_CGP',        label: 'CGP',                  color: 'bg-ocre text-ink',           dot: 'bg-ocre' },
  { code: 'PROSPECT_SECTORIEL',  label: 'Sectoriel',            color: 'bg-grey text-paper',         dot: 'bg-grey' },
  { code: 'PROSPECT_FROID',      label: 'Froid',                color: 'bg-grey-l text-ink',         dot: 'bg-grey-l' },
  { code: 'EQUIPE',              label: 'Équipe',               color: 'bg-paper border border-ink', dot: 'bg-ink' },
  { code: 'COMPTABLE',           label: 'Comptable',            color: 'bg-paper border border-ink', dot: 'bg-grey' },
  { code: 'PERDU',               label: 'Perdu',                color: 'bg-grey-l text-ink',         dot: 'bg-grey-l' },
]

export const STATUTS_BY_CODE = Object.fromEntries(STATUTS.map(s => [s.code, s]))

export function statutMeta(code) {
  return STATUTS_BY_CODE[code] ?? { code, label: code, color: 'bg-grey-l text-ink', dot: 'bg-grey-l' }
}
