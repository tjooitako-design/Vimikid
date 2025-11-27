import { Language } from '../types';

export const numberToWords = (num: number, lang: Language): string => {
  if (num === 0) {
    if (lang === 'en') return 'zero';
    if (lang === 'ms') return 'kosong'; // or sifar
    if (lang === 'zh') return '零';
  }

  if (lang === 'en') {
    return numToEnglish(num);
  } else if (lang === 'ms') {
    return numToMalay(num);
  } else if (lang === 'zh') {
    return numToChinese(num);
  }
  return num.toString();
};

const numToEnglish = (n: number): string => {
  const units = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  if (n < 20) return units[n];
  if (n < 100) {
    const t = Math.floor(n / 10);
    const u = n % 10;
    return `${tens[t]}${u ? '-' + units[u] : ''}`; // twenty-one
  }
  if (n === 100) return 'one hundred';
  return n.toString();
};

const numToMalay = (n: number): string => {
  const units = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'lapan', 'sembilan'];
  
  if (n < 10) return units[n];
  if (n === 10) return 'sepuluh';
  if (n === 11) return 'sebelas';
  if (n < 20) return `${units[n % 10]} belas`;
  if (n < 100) {
    const t = Math.floor(n / 10);
    const u = n % 10;
    return `${units[t]} puluh${u ? ' ' + units[u] : ''}`;
  }
  if (n === 100) return 'seratus';
  return n.toString();
};

const numToChinese = (n: number): string => {
  const units = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  
  if (n <= 10) return units[n];
  if (n < 20) return `十${units[n % 10]}`;
  if (n < 100) {
    const t = Math.floor(n / 10);
    const u = n % 10;
    // e.g. 20 -> 二十, 21 -> 二十一
    return `${units[t]}十${u !== 0 ? units[u] : ''}`;
  }
  if (n === 100) return '一百';
  return n.toString();
};

export const normalizeAnswer = (input: string, lang: Language): string => {
  let cleaned = input.toLowerCase().trim().replace(/\s+/g, ' '); // normalize spaces
  
  if (lang === 'en') {
    // allow user to type "twenty one" instead of "twenty-one"
    cleaned = cleaned.replace('-', ' ');
  }
  return cleaned;
};

// Returns true if the user's string matches the number
export const checkAnswer = (input: string, number: number, lang: Language): boolean => {
  const correctWord = numberToWords(number, lang);
  const normalizedInput = normalizeAnswer(input, lang);
  const normalizedCorrect = normalizeAnswer(correctWord, lang);

  return normalizedInput === normalizedCorrect;
};

export const getInstructionText = (lang: Language): string => {
  switch (lang) {
    case 'ms': return 'Taip jawapan dalam perkataan (Contoh: enam)';
    case 'zh': return '请用文字输入答案 (例如: 六)';
    default: return 'Type the answer in words (Example: six)';
  }
};

export const getSuccessMessage = (lang: Language): string => {
  switch (lang) {
    case 'ms': return 'Tahniah!';
    case 'zh': return '恭喜!';
    default: return 'Great Job!';
  }
};
