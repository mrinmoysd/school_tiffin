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
      };
    case 'html':
      return {
        id,
        type: 'html',
        sectionId,
        html: typeof value.html === 'string' ? value.html : '',
      };
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

  const altText = isNonEmptyString(block.altText) ? escapeHtml(block.altText) : '';
  const caption = isNonEmptyString(block.caption)
    ? hasHtmlMarkup(block.caption)
      ? `<figcaption style="margin-top:12px;color:#64748b;font-size:14px;line-height:1.6;">${block.caption}</figcaption>`
      : `<figcaption style="margin-top:12px;color:#64748b;font-size:14px;line-height:1.6;">${escapeHtml(
          block.caption,
        )}</figcaption>`
    : '';

  return `<figure style="margin:0 0 22px;"><img src="${escapeHtml(
    imageUrl,
  )}" alt="${altText}" style="width:100%;height:auto;border-radius:14px;border:1px solid #e2e8f0;" />${caption}</figure>`;
};

const renderHtmlBlock = (block: CmsHtmlBlock) => block.html.trim();

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
