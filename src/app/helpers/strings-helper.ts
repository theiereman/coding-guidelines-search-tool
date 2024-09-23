const accentsMap = new Map<string, string[]>([
  ['A', ['Á', 'À', 'Ã', 'Â', 'Ä']],
  ['a', ['á', 'à', 'ã', 'â', 'ä']],
  ['E', ['É', 'È', 'Ê', 'Ë']],
  ['e', ['é', 'è', 'ê', 'ë']],
  ['I', ['Í', 'Ì', 'Î', 'Ï']],
  ['i', ['í', 'ì', 'î', 'ï']],
  ['O', ['Ó', 'Ò', 'Ô', 'Õ', 'Ö']],
  ['o', ['ó', 'ò', 'ô', 'õ', 'ö']],
  ['U', ['Ú', 'Ù', 'Û', 'Ü']],
  ['u', ['ú', 'ù', 'û', 'ü']],
  ['C', ['Ç']],
  ['c', ['ç']],
  ['N', ['Ñ']],
  ['n', ['ñ']],
]);

const reducer = (acc: string, [key]: [string, string[]]) => {
  const values = accentsMap.get(key);
  if (values) {
    const regexPattern = new RegExp(`[${values.join('')}]`, 'g');
    return acc.replace(regexPattern, key);
  }
  return acc;
};

const removeAccents = (text: string) => [...accentsMap].reduce(reducer, text);

export const normalize = (text: string) =>
  removeAccents(text.trim().toLowerCase().replace(/\s+/g, ' '));

export const capitalizeFirstLetter = (text: string) =>
  text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
