export interface CmsHtmlSanitizationResult {
  sanitized: string;
  wasModified: boolean;
}

const UNSAFE_BLOCK_ELEMENT_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^>]*>/gi,
  /<link\b[^>]*>/gi,
  /<meta\b[^>]*>/gi,
  /<base\b[^>]*>/gi,
  /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi,
  /<input\b[^>]*>/gi,
  /<textarea\b[^<]*(?:(?!<\/textarea>)<[^<]*)*<\/textarea>/gi,
  /<select\b[^<]*(?:(?!<\/select>)<[^<]*)*<\/select>/gi,
  /<button\b[^<]*(?:(?!<\/button>)<[^<]*)*<\/button>/gi,
];

const stripWrappingQuotes = (value: string) => {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
};

const isDangerousUrlValue = (value: string) => {
  const lowered = stripWrappingQuotes(value).toLowerCase();
  return (
    lowered.startsWith('javascript:') ||
    lowered.startsWith('data:') ||
    lowered.startsWith('vbscript:') ||
    lowered.startsWith('file:')
  );
};

export const sanitizeCmsHtmlContent = (value: string): CmsHtmlSanitizationResult => {
  if (!value) {
    return { sanitized: '', wasModified: false };
  }

  const original = value;
  let sanitized = value;

  UNSAFE_BLOCK_ELEMENT_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  sanitized = sanitized.replace(/\son[a-z]+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, '');

  sanitized = sanitized.replace(
    /\s(?:href|src|xlink:href|action|formaction|poster)\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi,
    match => {
      const rawValue = match.split('=').slice(1).join('=');
      return isDangerousUrlValue(rawValue) ? '' : match;
    },
  );

  sanitized = sanitized.replace(/\ssrcdoc\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, '');
  sanitized = sanitized.replace(/\sstyle\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, styleMatch => {
    const rawValue = styleMatch.split('=').slice(1).join('=');
    const styleValue = stripWrappingQuotes(rawValue);
    const loweredStyle = styleValue.toLowerCase();
    if (
      loweredStyle.includes('expression(') ||
      loweredStyle.includes('javascript:') ||
      loweredStyle.includes('@import')
    ) {
      return '';
    }
    return styleMatch;
  });

  return {
    sanitized,
    wasModified: sanitized !== original,
  };
};
