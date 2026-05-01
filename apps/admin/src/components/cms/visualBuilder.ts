export type CmsVisualBlockType = 'hero' | 'text' | 'features' | 'cta' | 'image' | 'html';

interface CmsVisualBlockBase {
  id: string;
  type: CmsVisualBlockType;
  sectionId: string;
}

export interface CmsHeroBlock extends CmsVisualBlockBase {
  type: 'hero';
  eyebrow: string;
  title: string;
  subtitle: string;
  buttonLabel: string;
  buttonUrl: string;
}

export interface CmsTextBlock extends CmsVisualBlockBase {
  type: 'text';
  heading: string;
  body: string;
}

export interface CmsFeaturesBlock extends CmsVisualBlockBase {
  type: 'features';
  heading: string;
  items: string[];
  faqItems: Array<{
    id: string;
    question: string;
    answer: string;
  }>;
}

export interface CmsCtaBlock extends CmsVisualBlockBase {
  type: 'cta';
  title: string;
  description: string;
  buttonLabel: string;
  buttonUrl: string;
}

export interface CmsImageBlock extends CmsVisualBlockBase {
  type: 'image';
  imageUrl: string;
  altText: string;
  caption: string;
  width: string;
  height: string;
  maxWidth: string;
  minWidth: string;
  maxHeight: string;
  minHeight: string;
  lockAspectRatio: boolean;
  aspectRatio: string;
  objectFit: 'cover' | 'contain' | 'fill';
  alignment: 'left' | 'center' | 'right';
  position: 'static' | 'relative' | 'absolute' | 'fixed';
  borderWidth: string;
  borderStyle: 'none' | 'solid' | 'dashed' | 'dotted' | 'double';
  borderColor: string;
  borderRadius: string;
  boxShadow: string;
  opacity: number;
  backgroundColor: string;
  padding: string;
  margin: string;
  brightness: number;
  contrast: number;
  blur: number;
  grayscale: number;
  sepia: number;
}

export interface CmsHtmlBlock extends CmsVisualBlockBase {
  type: 'html';
  html: string;
}

export type CmsVisualBlock =
  | CmsHeroBlock
  | CmsTextBlock
  | CmsFeaturesBlock
  | CmsCtaBlock
  | CmsImageBlock
  | CmsHtmlBlock;

interface CmsVisualBuilderPayload {
  version: number;
  blocks: CmsVisualBlock[];
}

export interface CmsVisualBuilderParseResult {
  blocks: CmsVisualBlock[];
  isLegacyHtml: boolean;
}

const BUILDER_META_PREFIX = '<!--CMS_VISUAL_BUILDER:';
const BUILDER_META_SUFFIX = '-->';
const BUILDER_VERSION = 1;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const generateId = () => `blk_${Math.random().toString(36).slice(2, 10)}`;
const generateStableFaqItemId = (question: string, answer: string, index: number) => {
  const seed = `${question}::${answer}::${index}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return `faq_${index}_${Math.abs(hash)}`;
};

const getDefaultSectionId = (type: CmsVisualBlockType): string => {
  switch (type) {
    case 'hero':
      return 'hero';
    case 'features':
      return 'features';
    default:
      return 'content';
  }
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatMultilineText = (value: string) => escapeHtml(value).replace(/\n/g, '<br />');
const hasHtmlMarkup = (value: string) => /<\/?[a-z][\s\S]*>/i.test(value.trim());

const sanitizeUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('/')) return trimmed;
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('http://') ||
    lower.startsWith('https://') ||
    lower.startsWith('mailto:') ||
    lower.startsWith('tel:')
  ) {
    return trimmed;
  }

  return '';
};

const CSS_LENGTH_PATTERN = /^-?\d+(\.\d+)?(px|%|rem|em|vw|vh)$/i;
const CSS_RATIO_PATTERN = /^\d+(\.\d+)?\s*(?:\/|:)\s*\d+(\.\d+)?$/;
const CSS_COLOR_PATTERN =
  /^(#[0-9a-f]{3}|#[0-9a-f]{6}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)|hsla?\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)|transparent)$/i;
const CSS_BOX_SHADOW_PATTERN =
  /^-?\d+(\.\d+)?px\s+-?\d+(\.\d+)?px(?:\s+\d+(\.\d+)?px)?(?:\s+\d+(\.\d+)?px)?(?:\s+(?:#[0-9a-f]{3}|#[0-9a-f]{6}|rgba?\([^)]+\)|hsla?\([^)]+\)))?$/i;

const clampNumber = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const sanitizeCssLength = (value: unknown, allowAuto = false): string => {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (allowAuto && trimmed.toLowerCase() === 'auto') return 'auto';
  return CSS_LENGTH_PATTERN.test(trimmed) ? trimmed : '';
};

const sanitizeCssColor = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  return CSS_COLOR_PATTERN.test(trimmed) ? trimmed : '';
};

const sanitizeAspectRatio = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!CSS_RATIO_PATTERN.test(trimmed)) return '';
  return trimmed.replace(/\s+/g, '').replace(':', '/');
};

const sanitizeEnumValue = <T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T => (typeof value === 'string' && allowed.includes(value as T) ? (value as T) : fallback);

const sanitizeCssBoxShadow = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed || trimmed === 'none') return trimmed || '';
  return CSS_BOX_SHADOW_PATTERN.test(trimmed) ? trimmed : '';
};

const sanitizeNumber = (
  value: unknown,
  min: number,
  max: number,
  fallback: number,
  precision = 0,
) => {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  const clamped = clampNumber(numeric, min, max);
  const factor = 10 ** precision;
  return Math.round(clamped * factor) / factor;
};

export interface HtmlSanitizationResult {
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

export const sanitizeCmsCodeBlockHtml = (value: string): HtmlSanitizationResult => {
  if (!value) {
    return { sanitized: '', wasModified: false };
  }

  const original = value;
  let sanitized = value;

  UNSAFE_BLOCK_ELEMENT_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  // Remove inline event handlers such as onclick="..."
  sanitized = sanitized.replace(/\son[a-z]+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, '');

  // Remove URL-bearing attributes with dangerous protocols.
  sanitized = sanitized.replace(
    /\s(?:href|src|xlink:href|action|formaction|poster)\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi,
    match => {
      const rawValue = match.split('=').slice(1).join('=');
      return isDangerousUrlValue(rawValue) ? '' : match;
    },
  );

  // Remove source document and inline style expressions/import tricks.
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

const parseFaqLine = (line: string): { question: string; answer: string } => {
  const separators = [' - ', ' – ', ' — ', ': '];
  for (const separator of separators) {
    const index = line.indexOf(separator);
    if (index > -1) {
      return {
        question: line.slice(0, index).trim(),
        answer: line.slice(index + separator.length).trim(),
      };
    }
  }
  return {
    question: line.trim(),
    answer: '',
  };
};

const normalizeFaqItems = (
  value: unknown,
): Array<{ id: string; question: string; answer: string }> => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item, index) => {
      if (!isRecord(item)) {
        return null;
      }

      const question = typeof item.question === 'string' ? item.question : '';
      const answer = typeof item.answer === 'string' ? item.answer : '';
      if (!question.trim() && !answer.trim()) {
        return null;
      }

      return {
        id:
          typeof item.id === 'string' && item.id.trim()
            ? item.id.trim()
            : generateStableFaqItemId(question, answer, index),
        question,
        answer,
      };
    })
    .filter((item): item is { id: string; question: string; answer: string } => !!item);
};

const normalizeArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map(item => item.trim())
    .filter(Boolean);
};

const normalizeBlock = (value: unknown): CmsVisualBlock | null => {
  if (!isRecord(value) || typeof value.type !== 'string') {
    return null;
  }

  const id = typeof value.id === 'string' && value.id.trim() ? value.id : generateId();
  const sectionId =
    typeof value.sectionId === 'string' && value.sectionId.trim()
      ? value.sectionId.trim()
      : getDefaultSectionId(value.type as CmsVisualBlockType);

  switch (value.type) {
    case 'hero':
      return {
        id,
        type: 'hero',
        sectionId,
        eyebrow: typeof value.eyebrow === 'string' ? value.eyebrow : '',
        title: typeof value.title === 'string' ? value.title : '',
        subtitle: typeof value.subtitle === 'string' ? value.subtitle : '',
        buttonLabel: typeof value.buttonLabel === 'string' ? value.buttonLabel : '',
        buttonUrl: typeof value.buttonUrl === 'string' ? value.buttonUrl : '',
      };
    case 'text':
      return {
        id,
        type: 'text',
        sectionId,
        heading: typeof value.heading === 'string' ? value.heading : '',
        body: typeof value.body === 'string' ? value.body : '',
      };
    case 'features': {
      const normalizedItems = normalizeArray(value.items);
      const normalizedFaqItems = normalizeFaqItems(value.faqItems);
      const fallbackFaqItems =
        normalizedFaqItems.length > 0
          ? normalizedFaqItems
          : normalizedItems
              .map(item => parseFaqLine(item))
              .filter(item => item.question || item.answer)
              .map((item, index) => ({
                id: generateStableFaqItemId(item.question, item.answer, index),
                question: item.question,
                answer: item.answer,
              }));
      return {
        id,
        type: 'features',
        sectionId,
        heading: typeof value.heading === 'string' ? value.heading : '',
        items: normalizedItems,
        faqItems: fallbackFaqItems,
      };
    }
    case 'cta':
      return {
        id,
        type: 'cta',
        sectionId,
        title: typeof value.title === 'string' ? value.title : '',
        description: typeof value.description === 'string' ? value.description : '',
        buttonLabel: typeof value.buttonLabel === 'string' ? value.buttonLabel : '',
        buttonUrl: typeof value.buttonUrl === 'string' ? value.buttonUrl : '',
      };
    case 'image':
      return {
        id,
        type: 'image',
        sectionId,
        imageUrl: typeof value.imageUrl === 'string' ? value.imageUrl : '',
        altText: typeof value.altText === 'string' ? value.altText : '',
        caption: typeof value.caption === 'string' ? value.caption : '',
        width: sanitizeCssLength(value.width, true) || '100%',
        height: sanitizeCssLength(value.height, true) || 'auto',
        maxWidth: sanitizeCssLength(value.maxWidth),
        minWidth: sanitizeCssLength(value.minWidth),
        maxHeight: sanitizeCssLength(value.maxHeight),
        minHeight: sanitizeCssLength(value.minHeight),
        lockAspectRatio: Boolean(value.lockAspectRatio),
        aspectRatio: sanitizeAspectRatio(value.aspectRatio) || '16/9',
        objectFit: sanitizeEnumValue(
          value.objectFit,
          ['cover', 'contain', 'fill'] as const,
          'cover',
        ),
        alignment: sanitizeEnumValue(
          value.alignment,
          ['left', 'center', 'right'] as const,
          'center',
        ),
        position: sanitizeEnumValue(
          value.position,
          ['static', 'relative', 'absolute', 'fixed'] as const,
          'static',
        ),
        borderWidth: sanitizeCssLength(value.borderWidth) || '1px',
        borderStyle: sanitizeEnumValue(
          value.borderStyle,
          ['none', 'solid', 'dashed', 'dotted', 'double'] as const,
          'solid',
        ),
        borderColor: sanitizeCssColor(value.borderColor) || '#e2e8f0',
        borderRadius: sanitizeCssLength(value.borderRadius) || '14px',
        boxShadow: sanitizeCssBoxShadow(value.boxShadow),
        opacity: sanitizeNumber(value.opacity, 0, 1, 1, 2),
        backgroundColor: sanitizeCssColor(value.backgroundColor),
        padding: sanitizeCssLength(value.padding) || '0px',
        margin: sanitizeCssLength(value.margin) || '0px',
        brightness: sanitizeNumber(value.brightness, 0, 200, 100),
        contrast: sanitizeNumber(value.contrast, 0, 200, 100),
        blur: sanitizeNumber(value.blur, 0, 20, 0),
        grayscale: sanitizeNumber(value.grayscale, 0, 100, 0),
        sepia: sanitizeNumber(value.sepia, 0, 100, 0),
      };
    case 'html': {
      const sanitizedHtml =
        typeof value.html === 'string' ? sanitizeCmsCodeBlockHtml(value.html).sanitized : '';
      return {
        id,
        type: 'html',
        sectionId,
        html: sanitizedHtml,
      };
    }
    default:
      return null;
  }
};

const renderHeroBlock = (block: CmsHeroBlock) => {
  if (!isNonEmptyString(block.title) && !isNonEmptyString(block.subtitle)) {
    return '';
  }

  const eyebrow = isNonEmptyString(block.eyebrow)
    ? hasHtmlMarkup(block.eyebrow)
      ? `<div style="margin:0 0 12px;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#0f766e;font-weight:700;">${block.eyebrow}</div>`
      : `<p style="margin:0 0 12px;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#0f766e;font-weight:700;">${escapeHtml(
          block.eyebrow,
        )}</p>`
    : '';
  const title = isNonEmptyString(block.title)
    ? hasHtmlMarkup(block.title)
      ? `<div style="margin:0 0 14px;color:#0f172a;font-weight:700;">${block.title}</div>`
      : `<h1 style="margin:0 0 14px;font-size:40px;line-height:1.2;color:#0f172a;font-weight:700;">${escapeHtml(
          block.title,
        )}</h1>`
    : '';
  const subtitle = isNonEmptyString(block.subtitle)
    ? hasHtmlMarkup(block.subtitle)
      ? `<div style="margin:0 auto 20px;font-size:18px;line-height:1.6;color:#334155;max-width:760px;">${block.subtitle}</div>`
      : `<p style="margin:0 auto 20px;font-size:18px;line-height:1.6;color:#334155;max-width:760px;">${formatMultilineText(
          block.subtitle,
        )}</p>`
    : '';
  const buttonUrl = sanitizeUrl(block.buttonUrl);
  const button =
    isNonEmptyString(block.buttonLabel) && buttonUrl
      ? `<a href="${escapeHtml(
          buttonUrl,
        )}" style="display:inline-block;margin-top:8px;padding:12px 22px;background:#0f766e;color:#ffffff;text-decoration:none;border-radius:999px;font-weight:600;">${escapeHtml(
          block.buttonLabel,
        )}</a>`
      : '';

  return `<section style="padding:56px 24px;background:linear-gradient(180deg,#ecfeff 0%,#f8fafc 100%);border:1px solid #ccfbf1;border-radius:18px;margin:0 0 22px;text-align:center;">${eyebrow}${title}${subtitle}${button}</section>`;
};

const renderTextBlock = (block: CmsTextBlock) => {
  if (!isNonEmptyString(block.heading) && !isNonEmptyString(block.body)) {
    return '';
  }

  const heading = isNonEmptyString(block.heading)
    ? hasHtmlMarkup(block.heading)
      ? `<div style="margin:0 0 14px;color:#0f172a;">${block.heading}</div>`
      : `<h2 style="margin:0 0 14px;font-size:30px;line-height:1.3;color:#0f172a;">${escapeHtml(block.heading)}</h2>`
    : '';
  const bodyValue = block.body?.trim() || '';
  const body = isNonEmptyString(bodyValue)
    ? hasHtmlMarkup(bodyValue)
      ? `<div style="margin:0;font-size:17px;line-height:1.8;color:#334155;">${bodyValue}</div>`
      : `<p style="margin:0;font-size:17px;line-height:1.8;color:#334155;">${formatMultilineText(bodyValue)}</p>`
    : '';

  return `<section style="padding:28px 8px;margin:0 0 22px;">${heading}${body}</section>`;
};

const renderFeaturesBlock = (block: CmsFeaturesBlock) => {
  const faqItems = (block.faqItems || []).filter(item => item.question || item.answer);
  if (!isNonEmptyString(block.heading) && block.items.length === 0 && faqItems.length === 0) {
    return '';
  }

  const heading = isNonEmptyString(block.heading)
    ? hasHtmlMarkup(block.heading)
      ? `<div style="margin:0 0 16px;color:#0f172a;">${block.heading}</div>`
      : `<h3 style="margin:0 0 16px;font-size:26px;line-height:1.35;color:#0f172a;">${escapeHtml(block.heading)}</h3>`
    : '';

  const listItems = block.items
    .map(
      item =>
        `<li style="margin:0;padding:14px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;color:#334155;line-height:1.6;">${
          hasHtmlMarkup(item) ? item : escapeHtml(item)
        }</li>`,
    )
    .join('');

  const list = listItems
    ? `<ul style="margin:0;padding:0;list-style:none;display:grid;gap:12px;">${listItems}</ul>`
    : '';

  const accordion = faqItems.length
    ? faqItems
        .map(
          item =>
            `<details style="border:1px solid #e2e8f0;border-radius:12px;padding:0 14px;background:#ffffff;">
              <summary style="cursor:pointer;list-style:none;padding:14px 0;font-weight:600;color:#0f172a;">${
                hasHtmlMarkup(item.question)
                  ? item.question
                  : escapeHtml(item.question || 'Question')
              }</summary>
              <div style="padding:0 0 14px;color:#334155;line-height:1.7;">${
                hasHtmlMarkup(item.answer) ? item.answer : formatMultilineText(item.answer)
              }</div>
            </details>`,
        )
        .join('')
    : '';

  return `<section style="padding:28px 8px;margin:0 0 22px;">${heading}${
    faqItems.length ? `<div style="display:grid;gap:12px;">${accordion}</div>` : list
  }</section>`;
};

const renderCtaBlock = (block: CmsCtaBlock) => {
  if (!isNonEmptyString(block.title) && !isNonEmptyString(block.description)) {
    return '';
  }

  const title = isNonEmptyString(block.title)
    ? hasHtmlMarkup(block.title)
      ? `<div style="margin:0 0 12px;color:#ffffff;">${block.title}</div>`
      : `<h3 style="margin:0 0 12px;font-size:28px;line-height:1.3;color:#ffffff;">${escapeHtml(block.title)}</h3>`
    : '';
  const description = isNonEmptyString(block.description)
    ? hasHtmlMarkup(block.description)
      ? `<div style="margin:0 0 18px;font-size:17px;line-height:1.7;color:#e2e8f0;">${block.description}</div>`
      : `<p style="margin:0 0 18px;font-size:17px;line-height:1.7;color:#e2e8f0;">${formatMultilineText(
          block.description,
        )}</p>`
    : '';
  const buttonUrl = sanitizeUrl(block.buttonUrl);
  const button =
    isNonEmptyString(block.buttonLabel) && buttonUrl
      ? `<a href="${escapeHtml(
          buttonUrl,
        )}" style="display:inline-block;padding:11px 20px;background:#ffffff;color:#0f172a;text-decoration:none;border-radius:999px;font-weight:700;">${escapeHtml(
          block.buttonLabel,
        )}</a>`
      : '';

  return `<section style="padding:34px 28px;background:#0f172a;border-radius:18px;margin:0 0 22px;">${title}${description}${button}</section>`;
};

const renderImageBlock = (block: CmsImageBlock) => {
  const imageUrl = sanitizeUrl(block.imageUrl);
  if (!imageUrl) {
    return '';
  }

  const width = sanitizeCssLength(block.width, true) || '100%';
  const height = sanitizeCssLength(block.height, true) || 'auto';
  const maxWidth = sanitizeCssLength(block.maxWidth);
  const minWidth = sanitizeCssLength(block.minWidth);
  const maxHeight = sanitizeCssLength(block.maxHeight);
  const minHeight = sanitizeCssLength(block.minHeight);
  const aspectRatio = block.lockAspectRatio ? sanitizeAspectRatio(block.aspectRatio) : '';
  const objectFit = sanitizeEnumValue(
    block.objectFit,
    ['cover', 'contain', 'fill'] as const,
    'cover',
  );
  const alignment = sanitizeEnumValue(
    block.alignment,
    ['left', 'center', 'right'] as const,
    'center',
  );
  const position = sanitizeEnumValue(
    block.position,
    ['static', 'relative', 'absolute', 'fixed'] as const,
    'static',
  );
  const borderWidth = sanitizeCssLength(block.borderWidth) || '1px';
  const borderStyle = sanitizeEnumValue(
    block.borderStyle,
    ['none', 'solid', 'dashed', 'dotted', 'double'] as const,
    'solid',
  );
  const borderColor = sanitizeCssColor(block.borderColor) || '#e2e8f0';
  const borderRadius = sanitizeCssLength(block.borderRadius) || '14px';
  const boxShadow = sanitizeCssBoxShadow(block.boxShadow);
  const opacity = sanitizeNumber(block.opacity, 0, 1, 1, 2);
  const backgroundColor = sanitizeCssColor(block.backgroundColor);
  const padding = sanitizeCssLength(block.padding) || '0px';
  const margin = sanitizeCssLength(block.margin) || '0px';
  const brightness = sanitizeNumber(block.brightness, 0, 200, 100);
  const contrast = sanitizeNumber(block.contrast, 0, 200, 100);
  const blur = sanitizeNumber(block.blur, 0, 20, 0);
  const grayscale = sanitizeNumber(block.grayscale, 0, 100, 0);
  const sepia = sanitizeNumber(block.sepia, 0, 100, 0);
  const textAlign = alignment === 'left' ? 'left' : alignment === 'right' ? 'right' : 'center';

  const altText = isNonEmptyString(block.altText) ? escapeHtml(block.altText) : '';
  const caption = isNonEmptyString(block.caption)
    ? hasHtmlMarkup(block.caption)
      ? `<figcaption style="margin-top:12px;color:#64748b;font-size:14px;line-height:1.6;">${block.caption}</figcaption>`
      : `<figcaption style="margin-top:12px;color:#64748b;font-size:14px;line-height:1.6;">${escapeHtml(
          block.caption,
        )}</figcaption>`
    : '';

  const imageStyle = [
    `width:${width}`,
    `height:${height}`,
    maxWidth ? `max-width:${maxWidth}` : '',
    minWidth ? `min-width:${minWidth}` : '',
    maxHeight ? `max-height:${maxHeight}` : '',
    minHeight ? `min-height:${minHeight}` : '',
    aspectRatio ? `aspect-ratio:${aspectRatio}` : '',
    `object-fit:${objectFit}`,
    `position:${position}`,
    `border-width:${borderWidth}`,
    `border-style:${borderStyle}`,
    `border-color:${borderColor}`,
    `border-radius:${borderRadius}`,
    boxShadow ? `box-shadow:${boxShadow}` : '',
    `opacity:${opacity}`,
    `padding:${padding}`,
    `margin:${margin}`,
    backgroundColor ? `background-color:${backgroundColor}` : '',
    `filter:brightness(${brightness}%) contrast(${contrast}%) blur(${blur}px) grayscale(${grayscale}%) sepia(${sepia}%)`,
    'display:inline-block',
  ]
    .filter(Boolean)
    .join(';');

  return `<figure style="margin:0 0 22px;text-align:${textAlign};"><img src="${escapeHtml(
    imageUrl,
  )}" alt="${altText}" style="${imageStyle}" />${caption}</figure>`;
};

const renderHtmlBlock = (block: CmsHtmlBlock) =>
  sanitizeCmsCodeBlockHtml(block.html).sanitized.trim();

export const renderVisualBlocksToHtml = (blocks: CmsVisualBlock[]) =>
  blocks
    .map(block => {
      switch (block.type) {
        case 'hero':
          return renderHeroBlock(block);
        case 'text':
          return renderTextBlock(block);
        case 'features':
          return renderFeaturesBlock(block);
        case 'cta':
          return renderCtaBlock(block);
        case 'image':
          return renderImageBlock(block);
        case 'html':
          return renderHtmlBlock(block);
        default:
          return '';
      }
    })
    .filter(Boolean)
    .join('\n');

export const createVisualBlock = (
  type: CmsVisualBlockType,
  sectionId = getDefaultSectionId(type),
): CmsVisualBlock => {
  const id = generateId();
  switch (type) {
    case 'hero':
      return {
        id,
        type: 'hero',
        sectionId,
        eyebrow: '',
        title: '',
        subtitle: '',
        buttonLabel: '',
        buttonUrl: '',
      };
    case 'text':
      return {
        id,
        type: 'text',
        sectionId,
        heading: '',
        body: '',
      };
    case 'features':
      return {
        id,
        type: 'features',
        sectionId,
        heading: '',
        items: [],
        faqItems: [],
      };
    case 'cta':
      return {
        id,
        type: 'cta',
        sectionId,
        title: '',
        description: '',
        buttonLabel: '',
        buttonUrl: '',
      };
    case 'image':
      return {
        id,
        type: 'image',
        sectionId,
        imageUrl: '',
        altText: '',
        caption: '',
        width: '100%',
        height: 'auto',
        maxWidth: '',
        minWidth: '',
        maxHeight: '',
        minHeight: '',
        lockAspectRatio: false,
        aspectRatio: '16/9',
        objectFit: 'cover',
        alignment: 'center',
        position: 'static',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: '#e2e8f0',
        borderRadius: '14px',
        boxShadow: '',
        opacity: 1,
        backgroundColor: '',
        padding: '0px',
        margin: '0px',
        brightness: 100,
        contrast: 100,
        blur: 0,
        grayscale: 0,
        sepia: 0,
      };
    case 'html':
      return {
        id,
        type: 'html',
        sectionId,
        html: '',
      };
    default:
      return {
        id,
        type: 'text',
        sectionId,
        heading: '',
        body: '',
      };
  }
};

export const serializeVisualBuilderContent = (blocks: CmsVisualBlock[]) => {
  const normalizedBlocks = blocks
    .map(block => normalizeBlock(block))
    .filter((block): block is CmsVisualBlock => !!block);
  const html = renderVisualBlocksToHtml(normalizedBlocks);

  if (!html.trim()) {
    return '';
  }

  // Keep legacy HTML untouched to avoid accidental format changes on older pages.
  if (normalizedBlocks.length === 1 && normalizedBlocks[0]?.type === 'html') {
    return normalizedBlocks[0].html.trim();
  }

  const payload: CmsVisualBuilderPayload = {
    version: BUILDER_VERSION,
    blocks: normalizedBlocks,
  };
  const encodedPayload = encodeURIComponent(JSON.stringify(payload));

  return `${BUILDER_META_PREFIX}${encodedPayload}${BUILDER_META_SUFFIX}\n${html}`;
};

export const deserializeVisualBuilderContent = (content?: string): CmsVisualBuilderParseResult => {
  const value = content?.trim() ?? '';
  if (!value) {
    return {
      blocks: [createVisualBlock('hero')],
      isLegacyHtml: false,
    };
  }

  const metadataRegex = /^<!--CMS_VISUAL_BUILDER:([\s\S]*?)-->\s*/;
  const match = value.match(metadataRegex);

  if (!match) {
    return {
      blocks: [
        {
          ...createVisualBlock('html'),
          type: 'html',
          html: content ?? '',
        },
      ],
      isLegacyHtml: true,
    };
  }

  try {
    const decoded = decodeURIComponent(match[1]);
    const parsed = JSON.parse(decoded) as unknown;
    if (!isRecord(parsed) || !Array.isArray(parsed.blocks)) {
      throw new Error('Invalid builder payload');
    }
    const blocks = parsed.blocks
      .map(block => normalizeBlock(block))
      .filter((block): block is CmsVisualBlock => !!block);

    if (!blocks.length) {
      throw new Error('No blocks found');
    }

    return {
      blocks,
      isLegacyHtml: false,
    };
  } catch {
    return {
      blocks: [
        {
          ...createVisualBlock('html'),
          type: 'html',
          html: content ?? '',
        },
      ],
      isLegacyHtml: true,
    };
  }
};
