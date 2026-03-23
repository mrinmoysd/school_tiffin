export type CmsVisualBlockType = 'hero' | 'text' | 'features' | 'cta' | 'image' | 'html';

interface CmsVisualBlockBase {
  id: string;
  type: CmsVisualBlockType;
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

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatMultilineText = (value: string) => escapeHtml(value).replace(/\n/g, '<br />');

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

  switch (value.type) {
    case 'hero':
      return {
        id,
        type: 'hero',
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
        heading: typeof value.heading === 'string' ? value.heading : '',
        body: typeof value.body === 'string' ? value.body : '',
      };
    case 'features':
      return {
        id,
        type: 'features',
        heading: typeof value.heading === 'string' ? value.heading : '',
        items: normalizeArray(value.items),
      };
    case 'cta':
      return {
        id,
        type: 'cta',
        title: typeof value.title === 'string' ? value.title : '',
        description: typeof value.description === 'string' ? value.description : '',
        buttonLabel: typeof value.buttonLabel === 'string' ? value.buttonLabel : '',
        buttonUrl: typeof value.buttonUrl === 'string' ? value.buttonUrl : '',
      };
    case 'image':
      return {
        id,
        type: 'image',
        imageUrl: typeof value.imageUrl === 'string' ? value.imageUrl : '',
        altText: typeof value.altText === 'string' ? value.altText : '',
        caption: typeof value.caption === 'string' ? value.caption : '',
      };
    case 'html':
      return {
        id,
        type: 'html',
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
    ? `<p style="margin:0 0 12px;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#0f766e;font-weight:700;">${escapeHtml(
        block.eyebrow,
      )}</p>`
    : '';
  const title = isNonEmptyString(block.title)
    ? `<h1 style="margin:0 0 14px;font-size:40px;line-height:1.2;color:#0f172a;font-weight:700;">${escapeHtml(
        block.title,
      )}</h1>`
    : '';
  const subtitle = isNonEmptyString(block.subtitle)
    ? `<p style="margin:0 auto 20px;font-size:18px;line-height:1.6;color:#334155;max-width:760px;">${formatMultilineText(
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
    ? `<h2 style="margin:0 0 14px;font-size:30px;line-height:1.3;color:#0f172a;">${escapeHtml(block.heading)}</h2>`
    : '';
  const body = isNonEmptyString(block.body)
    ? `<p style="margin:0;font-size:17px;line-height:1.8;color:#334155;">${formatMultilineText(block.body)}</p>`
    : '';

  return `<section style="padding:28px 8px;margin:0 0 22px;">${heading}${body}</section>`;
};

const renderFeaturesBlock = (block: CmsFeaturesBlock) => {
  if (!isNonEmptyString(block.heading) && block.items.length === 0) {
    return '';
  }

  const heading = isNonEmptyString(block.heading)
    ? `<h3 style="margin:0 0 16px;font-size:26px;line-height:1.35;color:#0f172a;">${escapeHtml(block.heading)}</h3>`
    : '';

  const listItems = block.items
    .map(
      item =>
        `<li style="margin:0;padding:14px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;color:#334155;line-height:1.6;">${escapeHtml(
          item,
        )}</li>`,
    )
    .join('');

  const list = listItems
    ? `<ul style="margin:0;padding:0;list-style:none;display:grid;gap:12px;">${listItems}</ul>`
    : '';

  return `<section style="padding:28px 8px;margin:0 0 22px;">${heading}${list}</section>`;
};

const renderCtaBlock = (block: CmsCtaBlock) => {
  if (!isNonEmptyString(block.title) && !isNonEmptyString(block.description)) {
    return '';
  }

  const title = isNonEmptyString(block.title)
    ? `<h3 style="margin:0 0 12px;font-size:28px;line-height:1.3;color:#ffffff;">${escapeHtml(block.title)}</h3>`
    : '';
  const description = isNonEmptyString(block.description)
    ? `<p style="margin:0 0 18px;font-size:17px;line-height:1.7;color:#e2e8f0;">${formatMultilineText(
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
    ? `<figcaption style="margin-top:12px;color:#64748b;font-size:14px;line-height:1.6;">${escapeHtml(
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

export const createVisualBlock = (type: CmsVisualBlockType): CmsVisualBlock => {
  const id = generateId();
  switch (type) {
    case 'hero':
      return {
        id,
        type: 'hero',
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
        heading: '',
        body: '',
      };
    case 'features':
      return {
        id,
        type: 'features',
        heading: '',
        items: [],
      };
    case 'cta':
      return {
        id,
        type: 'cta',
        title: '',
        description: '',
        buttonLabel: '',
        buttonUrl: '',
      };
    case 'image':
      return {
        id,
        type: 'image',
        imageUrl: '',
        altText: '',
        caption: '',
      };
    case 'html':
      return {
        id,
        type: 'html',
        html: '',
      };
    default:
      return {
        id,
        type: 'text',
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
