const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Valide une adresse e-mail simple (local@domaine.tld).
 */
export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

// Chiffres seuls ; séparateurs autorisés entre groupes : espaces, points, tirets, parenthèses.
const PHONE_SEPARATORS = /[^\d+]/g;

/**
 * Valide un numéro de téléphone au format international.
 * Accepte un préfixe international facultatif `+` (ou `00`), des groupes
 * séparés par des espaces, points, tirets ou parenthèses, et 8 à 15 chiffres
 * au total (norme E.164).
 */
export function isValidInternationalPhone(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  const startsWithPlus = trimmed.startsWith('+');
  const normalized = trimmed.replace(PHONE_SEPARATORS, '');
  if (!normalized) {
    return false;
  }

  if (startsWithPlus) {
    if (!/^\+[1-9][0-9]{7,14}$/.test(normalized)) {
      return false;
    }
  } else if (normalized.startsWith('00')) {
    // Préfixe international `00` explicite.
    if (!/^00[1-9][0-9]{7,14}$/.test(normalized)) {
      return false;
    }
  } else if (/^[0-9]{8,15}$/.test(normalized)) {
    // Sans indicatif : on exige au moins 8 chiffres.
    return true;
  } else {
    return false;
  }

  return true;
}
