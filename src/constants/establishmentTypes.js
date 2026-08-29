/**
 * Establishment Types Configuration
 * Centralized constants for establishment type values
 */

// Valid establishment types for type_etablissement column
export const ESTABLISHMENT_TYPES = {
  COMMUNE: 'commune',
  UNIVERSITE: 'universite',
  SPORT: 'sport',
  ENTREPRISE: 'entreprise',
  ASSOCIATION: 'association',
  RESTAURANT: 'restaurant',
  HOPITAL: 'hopital',
  MOSQUEE: 'mosquee',
};

// Array of all valid types (useful for validation/mapping)
export const ESTABLISHMENT_TYPE_LIST = Object.values(ESTABLISHMENT_TYPES);

// Map type to label keys for i18n
export const TYPE_TO_LABEL_KEY = {
  [ESTABLISHMENT_TYPES.COMMUNE]: 'commune',
  [ESTABLISHMENT_TYPES.UNIVERSITE]: 'universite',
  [ESTABLISHMENT_TYPES.SPORT]: 'sport',
  [ESTABLISHMENT_TYPES.ENTREPRISE]: 'entreprise',
  [ESTABLISHMENT_TYPES.ASSOCIATION]: 'association',
  [ESTABLISHMENT_TYPES.RESTAURANT]: 'restaurant',
  [ESTABLISHMENT_TYPES.HOPITAL]: 'hopital',
  [ESTABLISHMENT_TYPES.MOSQUEE]: 'mosquee',
};

export default ESTABLISHMENT_TYPES;
