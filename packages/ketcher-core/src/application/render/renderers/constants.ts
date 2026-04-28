import { KetMonomerClass } from 'application/formatters/types/ket';

export const UNRESOLVED_MONOMER_COLOR = '#585858';

export const BAD_VALENCE_WARNING_COLOR = '#F00';
export const BAD_VALENCE_LINE_OFFSET = 2;

export const SELECTION_COLOR = '#3b82f6';
export const SELECTION_HOVERED_COLOR = '#bfdbfe';

export const BOND_MADE_COLOR = '#97cda8';
export const BOND_BROKEN_COLOR = '#e6a8a6';
export const BOND_MADE_THICKNESS_MULTIPLIER = 2;

export const MONOMER_SYMBOLS_IDS = {
  [KetMonomerClass.AminoAcid]: {
    hover: '#peptide-hover',
    body: '#peptide',
    autochainPreview: '#peptide-autochain-preview',
  },
  [KetMonomerClass.CHEM]: {
    hover: '#chem-selection',
    body: '#chem',
    autochainPreview: '#chem-autochain-preview',
  },
  [KetMonomerClass.Sugar]: {
    hover: '#sugar-selection',
    body: '#sugar',
    variant: '#sugar-variant',
    autochainPreview: '#sugar-autochain-preview',
  },
  [KetMonomerClass.Base]: {
    hover: '#rna-base-selection',
    body: '#rna-base',
    variant: '#rna-base-variant',
    autochainPreview: '#rna-base-autochain-preview',
  },
  [KetMonomerClass.Phosphate]: {
    hover: '#phosphate-selection',
    body: '#phosphate',
    variant: '#phosphate-variant',
    autochainPreview: '#phosphate-autochain-preview',
  },
  [KetMonomerClass.RNA]: {
    hover: '#nucleotide-hover',
    body: '#nucleotide',
    autochainPreview: '#nucleotide-autochain-preview',
  },
};
