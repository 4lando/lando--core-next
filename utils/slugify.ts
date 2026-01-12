/* eslint-disable require-jsdoc */
import _ from 'lodash';

// Character map for common replacements (subset of slugify package)
const charMap: Record<string, string> = {
  // Currency
  '$': 'dollar', '%': 'percent', '&': 'and', '<': 'less', '>': 'greater',
  '|': 'or', '¢': 'cent', '£': 'pound', '¥': 'yen', '€': 'euro',
  // Latin
  'À': 'A', 'Á': 'A', 'Â': 'A', 'Ã': 'A', 'Ä': 'A', 'Å': 'A', 'Æ': 'AE',
  'Ç': 'C', 'È': 'E', 'É': 'E', 'Ê': 'E', 'Ë': 'E', 'Ì': 'I', 'Í': 'I',
  'Î': 'I', 'Ï': 'I', 'Ð': 'D', 'Ñ': 'N', 'Ò': 'O', 'Ó': 'O', 'Ô': 'O',
  'Õ': 'O', 'Ö': 'O', 'Ø': 'O', 'Ù': 'U', 'Ú': 'U', 'Û': 'U', 'Ü': 'U',
  'Ý': 'Y', 'Þ': 'TH', 'ß': 'ss', 'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a',
  'ä': 'a', 'å': 'a', 'æ': 'ae', 'ç': 'c', 'è': 'e', 'é': 'e', 'ê': 'e',
  'ë': 'e', 'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i', 'ð': 'd', 'ñ': 'n',
  'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o', 'ø': 'o', 'ù': 'u',
  'ú': 'u', 'û': 'u', 'ü': 'u', 'ý': 'y', 'þ': 'th', 'ÿ': 'y',
  // Spaces and punctuation
  ' ': '-', '_': '-', '.': '-', '~': '-',
};

/**
 * Convert a string to a URL-friendly slug.
 * Inlined replacement for slugify package to avoid CommonJS bundling issues.
 * @param {string} input - String to slugify
 * @param {object} options - Slugify options
 * @return {string} URL-friendly slug
 */
function slugify(input: string, options: {lower?: boolean; strict?: boolean; replacement?: string} = {}): string {
  const {lower = false, strict = false, replacement = '-'} = options;

  let result = input;

  // Replace characters from charMap
  result = result.split('').map(char => charMap[char] || char).join('');

  // Normalize unicode
  result = result.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (lower) {
    result = result.toLowerCase();
  }

  // Replace spaces and special chars with replacement
  result = result.replace(/[\s_]+/g, replacement);

  if (strict) {
    // Remove anything that's not alphanumeric or the replacement char
    const escapedReplacement = replacement.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(`[^a-zA-Z0-9${escapedReplacement}]`, 'g'), '');
    // Remove consecutive replacements
    result = result.replace(new RegExp(`${escapedReplacement}+`, 'g'), replacement);
    // Trim replacement from ends
    result = result.replace(new RegExp(`^${escapedReplacement}|${escapedReplacement}$`, 'g'), '');
  }

  return result;
}

export default (data: unknown) => slugify(_.toString(data), {lower: true, strict: true});
