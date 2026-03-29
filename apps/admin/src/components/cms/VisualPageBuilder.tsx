/* global Event, HTMLDivElement, HTMLElement, HTMLOListElement, Node, Range, requestAnimationFrame */
import { DragEvent, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Collapse,
  Drawer,
  Empty,
  Input,
  message,
  Select,
  Space,
  Tooltip,
  Typography,
  Upload,
} from 'antd';
import {
  AppstoreOutlined,
  CodeOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  HolderOutlined,
  NotificationOutlined,
  PictureOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  RocketOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { uploadService } from '@/services';
import {
  CmsVisualBlock,
  CmsVisualBlockType,
  createVisualBlock,
  deserializeVisualBuilderContent,
  renderVisualBlocksToHtml,
  serializeVisualBuilderContent,
} from './visualBuilder';

const { Text } = Typography;

interface VisualPageBuilderProps {
  value?: string;
  onChange?: (value: string) => void;
}

interface MarkupSelectionEditorProps {
  editorId: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
  onEditorActivate?: (editorId: string, editorElement: HTMLDivElement | null) => void;
  onEditorSelectionChange?: (editorId: string, range: Range | null) => void;
}

type HeadingFormat = 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'h7' | 'h8';
type TextAlignFormat = 'left' | 'center' | 'right' | 'justify';
type ListFormat = 'none' | 'decimal' | 'upper-roman' | 'upper-alpha';

interface FormattingState {
  heading: HeadingFormat;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikeThrough: boolean;
  code: boolean;
  textAlign: TextAlignFormat;
  listType: ListFormat;
  color: string;
  fontFamily: string;
  fontSize: string;
}

const HEADING_OPTIONS: Array<{ label: string; value: HeadingFormat }> = [
  { label: 'Paragraph', value: 'p' },
  { label: 'H1', value: 'h1' },
  { label: 'H2', value: 'h2' },
  { label: 'H3', value: 'h3' },
  { label: 'H4', value: 'h4' },
  { label: 'H5', value: 'h5' },
  { label: 'H6', value: 'h6' },
  { label: 'H7', value: 'h7' },
  { label: 'H8', value: 'h8' },
];

const FONT_FAMILY_OPTIONS = [
  'Arial',
  'Georgia',
  'Times New Roman',
  'Verdana',
  'Tahoma',
  'Trebuchet MS',
  'Courier New',
];

const FONT_SIZE_OPTIONS = ['12', '14', '16', '18', '20', '24', '28', '32', '36', '40'];
const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_SIZE = MAX_IMAGE_SIZE_MB * 1024 * 1024;

const TEXT_ALIGN_OPTIONS: Array<{ label: string; value: TextAlignFormat }> = [
  { label: 'L', value: 'left' },
  { label: 'C', value: 'center' },
  { label: 'R', value: 'right' },
  { label: 'J', value: 'justify' },
];

const LIST_TYPE_OPTIONS: Array<{ label: string; value: ListFormat }> = [
  { label: 'None', value: 'none' },
  { label: 'Number', value: 'decimal' },
  { label: 'Roman', value: 'upper-roman' },
  { label: 'Alphabet', value: 'upper-alpha' },
];

const DEFAULT_FORMATTING_STATE: FormattingState = {
  heading: 'p',
  bold: false,
  italic: false,
  underline: false,
  strikeThrough: false,
  code: false,
  textAlign: 'left',
  listType: 'none',
  color: '#1f2937',
  fontFamily: 'Arial',
  fontSize: '16',
};

const FONT_SIZE_TO_EXEC_VALUE: Record<string, string> = {
  '12': '1',
  '14': '2',
  '16': '3',
  '18': '4',
  '20': '5',
  '24': '6',
  '28': '7',
  '32': '7',
  '36': '7',
  '40': '7',
};

const HEX_COLOR_PATTERN = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const normalizeHexColor = (value: string): string | null => {
  const trimmed = value.trim();
  if (!HEX_COLOR_PATTERN.test(trimmed)) {
    return null;
  }

  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  if (withHash.length === 4) {
    return `#${withHash[1]}${withHash[1]}${withHash[2]}${withHash[2]}${withHash[3]}${withHash[3]}`.toLowerCase();
  }

  return withHash.toLowerCase();
};

const SECTION_DEFINITIONS = [
  { id: 'hero', label: 'hero', description: 'Top hero banner widgets' },
  { id: 'content', label: 'content', description: 'Main body widgets' },
  { id: 'features', label: 'features', description: 'Feature, FAQ and CTA widgets' },
] as const;

type SectionId = (typeof SECTION_DEFINITIONS)[number]['id'];
type DropPosition = 'before' | 'after' | 'inside';
type WidgetId = 'hero' | 'wysiwyg' | 'code' | 'image_text' | 'card' | 'faq' | 'cta';

type SectionGroups = Record<SectionId, CmsVisualBlock[]>;

interface WidgetDefinition {
  id: WidgetId;
  blockType: CmsVisualBlockType;
  title: string;
  shortDescription: string;
  description: string;
  icon: ReactNode;
}

const WIDGET_LIBRARY: WidgetDefinition[] = [
  {
    id: 'hero',
    blockType: 'hero',
    title: 'Hero',
    shortDescription: 'Banner',
    description: 'Large banner with headline, subtext and optional CTA.',
    icon: <RocketOutlined />,
  },
  {
    id: 'wysiwyg',
    blockType: 'text',
    title: 'WYSIWYG',
    shortDescription: 'Rich text',
    description: 'Rich text content block for formatted body content.',
    icon: <FileTextOutlined />,
  },
  {
    id: 'code',
    blockType: 'html',
    title: 'Code',
    shortDescription: 'Custom embed',
    description: 'Custom HTML/CSS/JS embed block.',
    icon: <CodeOutlined />,
  },
  {
    id: 'image_text',
    blockType: 'image',
    title: 'Image + Text',
    shortDescription: 'Image block',
    description: 'Image block with caption and supporting text content.',
    icon: <PictureOutlined />,
  },
  {
    id: 'card',
    blockType: 'features',
    title: 'Card',
    shortDescription: 'Highlight',
    description: 'Compact highlight card using title and bullet points.',
    icon: <AppstoreOutlined />,
  },
  {
    id: 'faq',
    blockType: 'features',
    title: 'FAQ',
    shortDescription: 'Q&A',
    description: 'List of common questions and concise answers.',
    icon: <QuestionCircleOutlined />,
  },
  {
    id: 'cta',
    blockType: 'cta',
    title: 'Call to Action',
    shortDescription: 'Action block',
    description: 'Action-focused section with headline, copy and button.',
    icon: <NotificationOutlined />,
  },
];

const BLOCK_LABELS: Record<CmsVisualBlockType, string> = {
  hero: 'Hero',
  text: 'WYSIWYG',
  features: 'Features / FAQ',
  cta: 'Call To Action',
  image: 'Image + Text',
  html: 'Code Block',
};

const createEmptyGroups = (): SectionGroups => ({
  hero: [],
  content: [],
  features: [],
});

const normalizeSectionId = (sectionId?: string): SectionId => {
  if (!sectionId) return 'content';
  if (SECTION_DEFINITIONS.some(section => section.id === sectionId)) {
    return sectionId as SectionId;
  }
  return 'content';
};

const getFallbackSectionForType = (type: CmsVisualBlockType): SectionId => {
  switch (type) {
    case 'hero':
      return 'hero';
    case 'features':
      return 'features';
    default:
      return 'content';
  }
};

const ensureBlockSection = (block: CmsVisualBlock): CmsVisualBlock => ({
  ...block,
  sectionId: normalizeSectionId(block.sectionId || getFallbackSectionForType(block.type)),
});

const groupBlocks = (items: CmsVisualBlock[]): SectionGroups => {
  const grouped = createEmptyGroups();
  items.forEach(item => {
    const normalized = ensureBlockSection(item);
    grouped[normalizeSectionId(normalized.sectionId)].push(normalized);
  });
  return grouped;
};

const flattenGroups = (groups: SectionGroups): CmsVisualBlock[] =>
  SECTION_DEFINITIONS.flatMap(section => groups[section.id]);

const clampIndex = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const getDropPosition = (event: DragEvent<HTMLElement>): Exclude<DropPosition, 'inside'> => {
  const rect = event.currentTarget.getBoundingClientRect();
  const offset = event.clientY - rect.top;
  return offset < rect.height / 2 ? 'before' : 'after';
};

const createBlockFromWidget = (widgetId: WidgetId, sectionId: SectionId): CmsVisualBlock => {
  switch (widgetId) {
    case 'hero':
      return createVisualBlock('hero', sectionId);
    case 'wysiwyg':
      return createVisualBlock('text', sectionId);
    case 'code':
      return createVisualBlock('html', sectionId);
    case 'image_text':
      return createVisualBlock('image', sectionId);
    case 'card': {
      const block = createVisualBlock('features', sectionId);
      if (block.type === 'features') {
        return {
          ...block,
          heading: 'Card Title',
          items: ['Point one', 'Point two'],
        };
      }
      return block;
    }
    case 'faq': {
      const block = createVisualBlock('features', sectionId);
      if (block.type === 'features') {
        return {
          ...block,
          heading: 'Frequently Asked Questions',
          items: ['Question 1 - answer', 'Question 2 - answer'],
        };
      }
      return block;
    }
    case 'cta':
      return createVisualBlock('cta', sectionId);
    default:
      return createVisualBlock('text', sectionId);
  }
};

const getBlockSummary = (block: CmsVisualBlock): string => {
  const toPlainText = (value: string) =>
    value
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  switch (block.type) {
    case 'hero':
      return toPlainText(block.title || block.subtitle) || 'Click Edit to configure';
    case 'text':
      return toPlainText(block.heading || block.body) || 'Click Edit to configure';
    case 'features':
      return (
        toPlainText(block.heading || block.faqItems?.[0]?.question || block.items[0] || '') ||
        'Click Edit to configure'
      );
    case 'cta':
      return toPlainText(block.title || block.description) || 'Click Edit to configure';
    case 'image':
      return toPlainText(block.imageUrl || block.caption) || 'Click Edit to configure';
    case 'html':
      return toPlainText(block.html).slice(0, 90) || 'Click Edit to configure';
    default:
      return 'Click Edit to configure';
  }
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

const createFaqItem = (question = '', answer = '') => ({
  id: `faq_${Math.random().toString(36).slice(2, 10)}`,
  question,
  answer,
});

const MarkupSelectionEditor = ({
  editorId,
  value,
  onChange,
  placeholder,
  minHeight = 140,
  onEditorActivate,
  onEditorSelectionChange,
}: MarkupSelectionEditorProps) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (editor.innerHTML !== value) {
      editor.innerHTML = value || '';
    }
  }, [value]);

  const emitChange = () => {
    onChange(editorRef.current?.innerHTML || '');
  };

  const captureSelection = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();

    if (!editor || !selection || selection.rangeCount === 0) {
      onEditorSelectionChange?.(editorId, null);
      return;
    }

    const range = selection.getRangeAt(0);
    const anchorNode = selection.anchorNode;
    const focusNode = selection.focusNode;

    if (!anchorNode || !focusNode || !editor.contains(anchorNode) || !editor.contains(focusNode)) {
      onEditorSelectionChange?.(editorId, null);
      return;
    }

    onEditorSelectionChange?.(editorId, range.cloneRange());
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <div
        ref={editorRef}
        data-markup-editor-id={editorId}
        contentEditable
        suppressContentEditableWarning
        onInput={() => {
          emitChange();
          captureSelection();
        }}
        onFocus={() => {
          onEditorActivate?.(editorId, editorRef.current);
          captureSelection();
        }}
        onMouseUp={captureSelection}
        onKeyUp={captureSelection}
        onBlur={() => setTimeout(() => captureSelection(), 0)}
        style={{
          minHeight,
          border: '1px solid #d9d9d9',
          borderRadius: 8,
          padding: 12,
          background: '#fff',
          lineHeight: 1.7,
          outline: 'none',
          whiteSpace: 'pre-wrap',
        }}
      />

      {!value?.trim() && (
        <Text
          type="secondary"
          style={{
            position: 'absolute',
            left: 14,
            top: 12,
            pointerEvents: 'none',
          }}
        >
          {placeholder || 'Write content and select text for markup...'}
        </Text>
      )}
    </div>
  );
};

const VisualPageBuilder = ({ value, onChange }: VisualPageBuilderProps) => {
  const parsedInitial = useMemo(() => deserializeVisualBuilderContent(value), [value]);
  const [blocks, setBlocks] = useState<CmsVisualBlock[]>(
    parsedInitial.blocks.map(block => ensureBlockSection(block)),
  );
  const [isLegacyHtml, setIsLegacyHtml] = useState(parsedInitial.isLegacyHtml);
  const [activeSectionId, setActiveSectionId] = useState<SectionId>('content');
  const [expandedBlockId, setExpandedBlockId] = useState<string | null>(null);
  const [isLivePreviewOpen, setIsLivePreviewOpen] = useState(false);
  const [dragState, setDragState] = useState<
    { kind: 'block'; blockId: string } | { kind: 'widget'; widgetId: WidgetId } | null
  >(null);
  const [dropHint, setDropHint] = useState<{
    sectionId: SectionId;
    blockId?: string;
    position: DropPosition;
  } | null>(null);
  const [formattingState, setFormattingState] = useState<FormattingState>(DEFAULT_FORMATTING_STATE);
  const [colorHexInput, setColorHexInput] = useState(DEFAULT_FORMATTING_STATE.color);
  const [activeEditorId, setActiveEditorId] = useState<string | null>(null);
  const [imageUploadingByBlockId, setImageUploadingByBlockId] = useState<Record<string, boolean>>(
    {},
  );
  const lastSerializedRef = useRef(value ?? '');
  const editorElementsRef = useRef<Record<string, HTMLDivElement | null>>({});
  const editorRangesRef = useRef<Record<string, Range | null>>({});
  const pendingFormattingRef = useRef<FormattingState>(DEFAULT_FORMATTING_STATE);
  const hasPendingFormattingRef = useRef(false);
  const uploadedImageKeysRef = useRef<Record<string, string | null>>({});

  useEffect(() => {
    setColorHexInput(formattingState.color);
  }, [formattingState.color]);

  const setPendingFormatting = (nextState: FormattingState) => {
    pendingFormattingRef.current = nextState;
    hasPendingFormattingRef.current = true;
  };

  const getSelectionRangeForEditor = (editorId: string, editorElement: HTMLDivElement) => {
    const selection = window.getSelection();
    if (!selection) {
      return null;
    }

    const savedRange = editorRangesRef.current[editorId];
    if (savedRange) {
      return savedRange.cloneRange();
    }

    const fallbackRange = document.createRange();
    fallbackRange.selectNodeContents(editorElement);
    fallbackRange.collapse(false);
    return fallbackRange;
  };

  const runWithEditorSelection = (
    editorId: string,
    callback: (editorElement: HTMLDivElement) => void,
  ) => {
    const editorElement = editorElementsRef.current[editorId];
    const selection = window.getSelection();

    if (!editorElement || !selection) {
      return false;
    }

    const range = getSelectionRangeForEditor(editorId, editorElement);
    if (!range) {
      return false;
    }

    editorElement.focus();
    selection.removeAllRanges();
    selection.addRange(range);
    callback(editorElement);

    const nextSelection = window.getSelection();
    if (nextSelection && nextSelection.rangeCount > 0) {
      const nextRange = nextSelection.getRangeAt(0);
      if (
        editorElement.contains(nextRange.startContainer) &&
        editorElement.contains(nextRange.endContainer)
      ) {
        editorRangesRef.current[editorId] = nextRange.cloneRange();
      }
    }

    editorElement.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  };

  const runWithActiveEditor = (callback: (editorElement: HTMLDivElement) => void) => {
    if (!activeEditorId) {
      return false;
    }
    return runWithEditorSelection(activeEditorId, callback);
  };

  const setCommandState = (
    command: 'bold' | 'italic' | 'underline' | 'strikeThrough',
    enabled: boolean,
  ) => {
    if (document.queryCommandState(command) !== enabled) {
      document.execCommand(command);
    }
  };

  const applyHeadingFormat = (heading: HeadingFormat) => {
    if (heading === 'h7' || heading === 'h8') {
      document.execCommand('formatBlock', false, '<p>');
      document.execCommand('fontSize', false, heading === 'h7' ? '2' : '1');
      return;
    }
    document.execCommand('formatBlock', false, heading === 'p' ? '<p>' : `<${heading}>`);
  };

  const applyFontSizeFormat = (fontSize: string) => {
    document.execCommand('fontSize', false, FONT_SIZE_TO_EXEC_VALUE[fontSize] || '3');
  };

  const applyTextAlignFormat = (textAlign: TextAlignFormat) => {
    const commandMap: Record<TextAlignFormat, string> = {
      left: 'justifyLeft',
      center: 'justifyCenter',
      right: 'justifyRight',
      justify: 'justifyFull',
    };
    document.execCommand(commandMap[textAlign]);
  };

  const getClosestElementByTag = (
    node: Node | null,
    tagName: string,
    editorElement: HTMLDivElement,
  ) => {
    const startElement =
      node && node.nodeType === Node.ELEMENT_NODE
        ? (node as HTMLElement)
        : node?.parentElement || null;

    let current = startElement;
    while (current && current !== editorElement) {
      if (current.tagName.toLowerCase() === tagName) {
        return current;
      }
      current = current.parentElement;
    }
    return null;
  };

  const getClosestOrderedList = (node: Node | null, editorElement: HTMLDivElement) =>
    getClosestElementByTag(node, 'ol', editorElement) as HTMLOListElement | null;

  const getClosestCodeElement = (node: Node | null, editorElement: HTMLDivElement) =>
    getClosestElementByTag(node, 'code', editorElement) as HTMLElement | null;

  const applyListFormat = (listType: ListFormat, editorElement: HTMLDivElement) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const currentRange = selection.getRangeAt(0);
    const currentList =
      getClosestOrderedList(currentRange.startContainer, editorElement) ||
      getClosestOrderedList(currentRange.endContainer, editorElement);

    if (listType === 'none') {
      if (currentList || document.queryCommandState('insertOrderedList')) {
        document.execCommand('insertOrderedList');
      }
      return;
    }

    if (!currentList) {
      document.execCommand('insertOrderedList');
    }

    const refreshedSelection = window.getSelection();
    if (!refreshedSelection || refreshedSelection.rangeCount === 0) {
      return;
    }

    const refreshedRange = refreshedSelection.getRangeAt(0);
    const listAfterCommand =
      getClosestOrderedList(refreshedRange.startContainer, editorElement) ||
      getClosestOrderedList(refreshedRange.endContainer, editorElement);

    if (listAfterCommand) {
      listAfterCommand.style.listStyleType = listType;
      listAfterCommand.style.paddingInlineStart = '24px';
    }
  };

  const unwrapElement = (element: HTMLElement) => {
    const parent = element.parentNode;
    if (!parent) return;
    while (element.firstChild) {
      parent.insertBefore(element.firstChild, element);
    }
    parent.removeChild(element);
  };

  const applyCodeFormat = (enabled: boolean, editorElement: HTMLDivElement) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);
    const existingCode =
      getClosestCodeElement(range.startContainer, editorElement) ||
      getClosestCodeElement(range.endContainer, editorElement);

    if (!enabled) {
      if (existingCode) {
        unwrapElement(existingCode);
      }
      return;
    }

    if (existingCode) {
      return;
    }

    const codeElement = document.createElement('code');
    codeElement.style.fontFamily = '"Courier New", monospace';
    codeElement.style.background = '#f1f5f9';
    codeElement.style.padding = '1px 4px';
    codeElement.style.borderRadius = '4px';

    if (range.collapsed) {
      codeElement.textContent = '\u200B';
      range.insertNode(codeElement);

      const textNode = codeElement.firstChild;
      if (textNode) {
        const nextRange = document.createRange();
        nextRange.setStart(textNode, textNode.textContent?.length || 0);
        nextRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(nextRange);
      }
      return;
    }

    const selectedContent = range.extractContents();
    codeElement.appendChild(selectedContent);
    range.insertNode(codeElement);

    const nextRange = document.createRange();
    nextRange.selectNodeContents(codeElement);
    nextRange.collapse(false);
    selection.removeAllRanges();
    selection.addRange(nextRange);
  };

  const applyFormattingSnapshot = (state: FormattingState, editorElement: HTMLDivElement) => {
    applyHeadingFormat(state.heading);
    setCommandState('bold', state.bold);
    setCommandState('italic', state.italic);
    setCommandState('underline', state.underline);
    setCommandState('strikeThrough', state.strikeThrough);
    applyCodeFormat(state.code, editorElement);
    applyTextAlignFormat(state.textAlign);
    applyListFormat(state.listType, editorElement);
    document.execCommand('foreColor', false, state.color);
    document.execCommand('fontName', false, state.fontFamily);
    applyFontSizeFormat(state.fontSize);
  };

  const applyPendingFormattingIfNeeded = (editorId: string) => {
    if (!hasPendingFormattingRef.current) {
      return;
    }

    const didApply = runWithEditorSelection(editorId, editorElement => {
      applyFormattingSnapshot(pendingFormattingRef.current, editorElement);
    });

    if (didApply) {
      hasPendingFormattingRef.current = false;
    }
  };

  const handleEditorActivate = (editorId: string, editorElement: HTMLDivElement | null) => {
    editorElementsRef.current[editorId] = editorElement;
    setActiveEditorId(current => (current === editorId ? current : editorId));
    requestAnimationFrame(() => applyPendingFormattingIfNeeded(editorId));
  };

  const handleEditorSelectionChange = (editorId: string, range: Range | null) => {
    if (range) {
      editorRangesRef.current[editorId] = range.cloneRange();
      setActiveEditorId(current => (current === editorId ? current : editorId));
    }
  };

  const applyFormatChange = (
    nextState: FormattingState,
    applyCommand: (editorElement: HTMLDivElement) => void,
  ) => {
    setFormattingState(nextState);

    const didApply = runWithActiveEditor(editorElement => {
      applyCommand(editorElement);
    });

    if (!didApply) {
      setPendingFormatting(nextState);
    }
  };

  const blocksBySection = useMemo(() => groupBlocks(blocks), [blocks]);
  const livePreviewHtml = useMemo(() => renderVisualBlocksToHtml(blocks), [blocks]);

  useEffect(() => {
    const incoming = value ?? '';
    if (incoming === lastSerializedRef.current) {
      return;
    }

    const parsed = deserializeVisualBuilderContent(incoming);
    setBlocks(parsed.blocks.map(block => ensureBlockSection(block)));
    setIsLegacyHtml(parsed.isLegacyHtml);
    setImageUploadingByBlockId({});
    uploadedImageKeysRef.current = {};
    lastSerializedRef.current = incoming;
  }, [value]);

  useEffect(() => {
    const nextValue = serializeVisualBuilderContent(blocks);
    if (nextValue === lastSerializedRef.current) {
      return;
    }
    lastSerializedRef.current = nextValue;
    onChange?.(nextValue);
  }, [blocks, onChange]);

  const mutateBlocks = (mutator: (groups: SectionGroups) => void) => {
    setBlocks(prev => {
      const grouped = groupBlocks(prev.map(block => ensureBlockSection(block)));
      mutator(grouped);
      const flattened = flattenGroups(grouped);
      return flattened.length ? flattened : [createVisualBlock('hero', 'hero')];
    });
  };

  const updateBlock = (id: string, updater: (block: CmsVisualBlock) => CmsVisualBlock) => {
    setBlocks(prev =>
      prev.map(block => (block.id === id ? ensureBlockSection(updater(block)) : block)),
    );
  };

  const removeTemporaryUploadedImage = async (blockId: string, showError = false) => {
    const storageKey = uploadedImageKeysRef.current[blockId];
    if (!storageKey) {
      delete uploadedImageKeysRef.current[blockId];
      return true;
    }

    try {
      await uploadService.deleteImage(storageKey);
      delete uploadedImageKeysRef.current[blockId];
      return true;
    } catch {
      if (showError) {
        message.error('Failed to remove image from storage.');
      }
      return false;
    }
  };

  const removeBlock = (id: string) => {
    void removeTemporaryUploadedImage(id);
    setImageUploadingByBlockId(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setExpandedBlockId(prev => (prev === id ? null : prev));
    mutateBlocks(grouped => {
      SECTION_DEFINITIONS.forEach(section => {
        grouped[section.id] = grouped[section.id].filter(block => block.id !== id);
      });
    });
  };

  const addWidget = (widgetId: WidgetId, sectionId: SectionId, insertIndex?: number) => {
    setActiveSectionId(sectionId);
    mutateBlocks(grouped => {
      const sectionItems = grouped[sectionId];
      const block = createBlockFromWidget(widgetId, sectionId);
      const index = clampIndex(insertIndex ?? sectionItems.length, 0, sectionItems.length);
      sectionItems.splice(index, 0, block);
      setExpandedBlockId(block.id);
    });
  };

  const moveBlock = (blockId: string, targetSectionId: SectionId, targetIndex: number) => {
    mutateBlocks(grouped => {
      let sourceSectionId: SectionId | null = null;
      let sourceIndex = -1;
      let dragged: CmsVisualBlock | undefined;

      for (const section of SECTION_DEFINITIONS) {
        const foundIndex = grouped[section.id].findIndex(item => item.id === blockId);
        if (foundIndex >= 0) {
          sourceSectionId = section.id;
          sourceIndex = foundIndex;
          dragged = grouped[section.id][foundIndex];
          grouped[section.id].splice(foundIndex, 1);
          break;
        }
      }

      if (!dragged || !sourceSectionId) {
        return;
      }

      const destination = grouped[targetSectionId];
      let insertAt = clampIndex(targetIndex, 0, destination.length);

      if (sourceSectionId === targetSectionId && sourceIndex < insertAt) {
        insertAt -= 1;
      }

      destination.splice(insertAt, 0, {
        ...dragged,
        sectionId: targetSectionId,
      });
    });
  };

  const clearDragState = () => {
    setDragState(null);
    setDropHint(null);
  };

  const onWidgetDragStart = (event: DragEvent<HTMLDivElement>, widgetId: WidgetId) => {
    event.dataTransfer.effectAllowed = 'copyMove';
    event.dataTransfer.setData('text/plain', widgetId);
    setDragState({ kind: 'widget', widgetId });
  };

  const onBlockDragStart = (event: DragEvent<HTMLElement>, blockId: string) => {
    event.stopPropagation();
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', blockId);
    setDragState({ kind: 'block', blockId });
  };

  const onSectionDragOver = (event: DragEvent<HTMLDivElement>, sectionId: SectionId) => {
    if (!dragState) {
      return;
    }

    event.preventDefault();
    setActiveSectionId(sectionId);
    setDropHint({ sectionId, position: 'inside' });
  };

  const onSectionDrop = (event: DragEvent<HTMLDivElement>, sectionId: SectionId) => {
    if (!dragState) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const targetIndex = blocksBySection[sectionId].length;

    if (dragState.kind === 'widget') {
      addWidget(dragState.widgetId, sectionId, targetIndex);
    } else {
      moveBlock(dragState.blockId, sectionId, targetIndex);
    }

    clearDragState();
  };

  const onBlockDragOver = (
    event: DragEvent<HTMLDivElement>,
    sectionId: SectionId,
    blockId: string,
  ) => {
    if (!dragState) {
      return;
    }

    if (dragState.kind === 'block' && dragState.blockId === blockId) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    setActiveSectionId(sectionId);
    setDropHint({
      sectionId,
      blockId,
      position: getDropPosition(event),
    });
  };

  const onBlockDrop = (event: DragEvent<HTMLDivElement>, sectionId: SectionId, blockId: string) => {
    if (!dragState) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const position = getDropPosition(event);
    const items = blocksBySection[sectionId];
    const baseIndex = items.findIndex(item => item.id === blockId);
    const targetIndex = baseIndex < 0 ? items.length : baseIndex + (position === 'after' ? 1 : 0);

    if (dragState.kind === 'widget') {
      addWidget(dragState.widgetId, sectionId, targetIndex);
    } else {
      moveBlock(dragState.blockId, sectionId, targetIndex);
    }

    clearDragState();
  };

  const onHeadingChange = (heading: HeadingFormat) => {
    const nextState: FormattingState = { ...formattingState, heading };
    applyFormatChange(nextState, () => applyHeadingFormat(heading));
  };

  const onBoldToggle = () => {
    const nextState: FormattingState = { ...formattingState, bold: !formattingState.bold };
    applyFormatChange(nextState, () => setCommandState('bold', nextState.bold));
  };

  const onItalicToggle = () => {
    const nextState: FormattingState = { ...formattingState, italic: !formattingState.italic };
    applyFormatChange(nextState, () => setCommandState('italic', nextState.italic));
  };

  const onUnderlineToggle = () => {
    const nextState: FormattingState = {
      ...formattingState,
      underline: !formattingState.underline,
    };
    applyFormatChange(nextState, () => setCommandState('underline', nextState.underline));
  };

  const onStrikeThroughToggle = () => {
    const nextState: FormattingState = {
      ...formattingState,
      strikeThrough: !formattingState.strikeThrough,
    };
    applyFormatChange(nextState, () => setCommandState('strikeThrough', nextState.strikeThrough));
  };

  const onCodeToggle = () => {
    const nextState: FormattingState = { ...formattingState, code: !formattingState.code };
    applyFormatChange(nextState, editorElement => applyCodeFormat(nextState.code, editorElement));
  };

  const onTextAlignChange = (textAlign: TextAlignFormat) => {
    const nextState: FormattingState = { ...formattingState, textAlign };
    applyFormatChange(nextState, () => applyTextAlignFormat(textAlign));
  };

  const onListTypeChange = (listType: ListFormat) => {
    const nextState: FormattingState = { ...formattingState, listType };
    applyFormatChange(nextState, editorElement => applyListFormat(listType, editorElement));
  };

  const onColorChange = (color: string) => {
    const normalized = normalizeHexColor(color);
    if (!normalized || normalized === formattingState.color) {
      return;
    }

    const nextState: FormattingState = { ...formattingState, color: normalized };
    applyFormatChange(nextState, () => document.execCommand('foreColor', false, normalized));
  };

  const onColorPickerChange = (color: string) => {
    const normalized = normalizeHexColor(color);
    if (!normalized) {
      return;
    }
    setColorHexInput(normalized);
    onColorChange(normalized);
  };

  const onColorHexInputChange = (nextValue: string) => {
    setColorHexInput(nextValue);
    const normalized = normalizeHexColor(nextValue);
    if (normalized) {
      onColorChange(normalized);
    }
  };

  const onColorHexBlur = () => {
    const normalized = normalizeHexColor(colorHexInput);
    if (!normalized) {
      setColorHexInput(formattingState.color);
      return;
    }
    setColorHexInput(normalized);
    onColorChange(normalized);
  };

  const onFontFamilyChange = (fontFamily: string) => {
    const nextState: FormattingState = { ...formattingState, fontFamily };
    applyFormatChange(nextState, () => document.execCommand('fontName', false, fontFamily));
  };

  const onFontSizeChange = (fontSize: string) => {
    const nextState: FormattingState = { ...formattingState, fontSize };
    applyFormatChange(nextState, () => applyFontSizeFormat(fontSize));
  };

  const handleImageUpload = (blockId: string) => async (file: File) => {
    if (!file.type.startsWith('image/')) {
      message.error('Please upload an image file (JPG, PNG, or WEBP).');
      return Upload.LIST_IGNORE;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      message.error(`Image must be smaller than ${MAX_IMAGE_SIZE_MB}MB.`);
      return Upload.LIST_IGNORE;
    }

    try {
      setImageUploadingByBlockId(prev => ({ ...prev, [blockId]: true }));
      const result = await uploadService.uploadImage(file, 'cms-pages');

      const previousKey = uploadedImageKeysRef.current[blockId];
      if (previousKey && previousKey !== result.key) {
        await uploadService.deleteImage(previousKey).catch(() => {
          // Ignore cleanup error and still apply latest uploaded image.
        });
      }

      uploadedImageKeysRef.current[blockId] = result.key;
      updateBlock(blockId, current =>
        current.type === 'image' ? { ...current, imageUrl: result.url } : current,
      );
      message.success('Image uploaded successfully.');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Image upload failed. Please try again.';
      message.error(errorMessage);
    } finally {
      setImageUploadingByBlockId(prev => ({ ...prev, [blockId]: false }));
    }

    return false;
  };

  const handleRemoveUploadedImage = async (blockId: string) => {
    const removed = await removeTemporaryUploadedImage(blockId, true);
    if (!removed) {
      return;
    }
    updateBlock(blockId, current =>
      current.type === 'image' ? { ...current, imageUrl: '' } : current,
    );
  };

  const renderBlockEditor = (block: CmsVisualBlock) => {
    switch (block.type) {
      case 'hero':
        return (
          <Space direction="vertical" className="w-full" size={10}>
            <MarkupSelectionEditor
              editorId={`${block.id}-eyebrow`}
              value={block.eyebrow}
              minHeight={58}
              placeholder="Eyebrow (optional)"
              onEditorActivate={handleEditorActivate}
              onEditorSelectionChange={handleEditorSelectionChange}
              onChange={nextValue =>
                updateBlock(block.id, current =>
                  current.type === 'hero' ? { ...current, eyebrow: nextValue } : current,
                )
              }
            />
            <MarkupSelectionEditor
              editorId={`${block.id}-title`}
              value={block.title}
              minHeight={72}
              placeholder="Main heading"
              onEditorActivate={handleEditorActivate}
              onEditorSelectionChange={handleEditorSelectionChange}
              onChange={nextValue =>
                updateBlock(block.id, current =>
                  current.type === 'hero' ? { ...current, title: nextValue } : current,
                )
              }
            />
            <MarkupSelectionEditor
              editorId={`${block.id}-subtitle`}
              value={block.subtitle}
              minHeight={120}
              placeholder="Subtitle"
              onEditorActivate={handleEditorActivate}
              onEditorSelectionChange={handleEditorSelectionChange}
              onChange={nextValue =>
                updateBlock(block.id, current =>
                  current.type === 'hero' ? { ...current, subtitle: nextValue } : current,
                )
              }
            />
            <Space className="w-full" wrap>
              <Input
                placeholder="Button text"
                value={block.buttonLabel}
                onChange={event =>
                  updateBlock(block.id, current =>
                    current.type === 'hero'
                      ? { ...current, buttonLabel: event.target.value }
                      : current,
                  )
                }
                style={{ width: 220 }}
              />
              <Input
                placeholder="Button link"
                value={block.buttonUrl}
                onChange={event =>
                  updateBlock(block.id, current =>
                    current.type === 'hero'
                      ? { ...current, buttonUrl: event.target.value }
                      : current,
                  )
                }
                style={{ width: 280 }}
              />
            </Space>
          </Space>
        );

      case 'text':
        return (
          <Space direction="vertical" className="w-full" size={10}>
            <MarkupSelectionEditor
              editorId={`${block.id}-heading`}
              value={block.heading}
              minHeight={72}
              placeholder="Section heading"
              onEditorActivate={handleEditorActivate}
              onEditorSelectionChange={handleEditorSelectionChange}
              onChange={nextValue =>
                updateBlock(block.id, current =>
                  current.type === 'text' ? { ...current, heading: nextValue } : current,
                )
              }
            />
            <MarkupSelectionEditor
              editorId={`${block.id}-body`}
              value={block.body}
              placeholder="Write section content, select text, then choose H1/H2/H3..."
              onEditorActivate={handleEditorActivate}
              onEditorSelectionChange={handleEditorSelectionChange}
              onChange={nextValue =>
                updateBlock(block.id, current =>
                  current.type === 'text' ? { ...current, body: nextValue } : current,
                )
              }
            />
          </Space>
        );

      case 'features': {
        const faqItems = (
          block.faqItems?.length
            ? block.faqItems
            : block.items
                .map(parseFaqLine)
                .filter(item => item.question || item.answer)
                .map(item => createFaqItem(item.question, item.answer))
        ).map(item => ({
          ...item,
          id: item.id || createFaqItem().id,
        }));

        const updateFaqItems = (
          nextFaqItems: Array<{ id: string; question: string; answer: string }>,
        ) => {
          updateBlock(block.id, current => {
            if (current.type !== 'features') {
              return current;
            }

            const normalizedFaqItems = nextFaqItems.map(item => ({
              id: item.id || createFaqItem().id,
              question: item.question,
              answer: item.answer,
            }));

            const items = normalizedFaqItems
              .map(item =>
                item.question && item.answer
                  ? `${item.question} - ${item.answer}`
                  : item.question || item.answer,
              )
              .filter(Boolean);

            return {
              ...current,
              faqItems: normalizedFaqItems,
              items,
            };
          });
        };

        return (
          <Space direction="vertical" className="w-full" size={10}>
            <MarkupSelectionEditor
              editorId={`${block.id}-heading`}
              value={block.heading}
              minHeight={72}
              placeholder="Heading"
              onEditorActivate={handleEditorActivate}
              onEditorSelectionChange={handleEditorSelectionChange}
              onChange={nextValue =>
                updateBlock(block.id, current =>
                  current.type === 'features' ? { ...current, heading: nextValue } : current,
                )
              }
            />
            {faqItems.map((item, index) => (
              <Card
                key={item.id}
                size="small"
                title={`FAQ ${index + 1}`}
                extra={
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => updateFaqItems(faqItems.filter(row => row.id !== item.id))}
                  />
                }
              >
                <Space direction="vertical" className="w-full" size={10}>
                  <MarkupSelectionEditor
                    editorId={`${block.id}-${item.id}-question`}
                    value={item.question}
                    minHeight={62}
                    placeholder="Question"
                    onEditorActivate={handleEditorActivate}
                    onEditorSelectionChange={handleEditorSelectionChange}
                    onChange={nextValue =>
                      updateFaqItems(
                        faqItems.map(row =>
                          row.id === item.id ? { ...row, question: nextValue } : row,
                        ),
                      )
                    }
                  />
                  <MarkupSelectionEditor
                    editorId={`${block.id}-${item.id}-answer`}
                    value={item.answer}
                    minHeight={110}
                    placeholder="Answer"
                    onEditorActivate={handleEditorActivate}
                    onEditorSelectionChange={handleEditorSelectionChange}
                    onChange={nextValue =>
                      updateFaqItems(
                        faqItems.map(row =>
                          row.id === item.id ? { ...row, answer: nextValue } : row,
                        ),
                      )
                    }
                  />
                </Space>
              </Card>
            ))}

            <Button
              icon={<PlusOutlined />}
              onClick={() => updateFaqItems([...faqItems, createFaqItem()])}
            >
              Add FAQ Item
            </Button>

            {faqItems.length > 0 && (
              <div>
                <Text strong>Answer Accordion Preview</Text>
                <Collapse
                  accordion
                  style={{ marginTop: 8 }}
                  items={faqItems.map((item, index) => ({
                    key: `${block.id}-${index}`,
                    label: item.question || `Question ${index + 1}`,
                    children: item.answer || (
                      <Text type="secondary">Add an answer in the answer box.</Text>
                    ),
                  }))}
                />
              </div>
            )}
          </Space>
        );
      }

      case 'cta':
        return (
          <Space direction="vertical" className="w-full" size={10}>
            <MarkupSelectionEditor
              editorId={`${block.id}-title`}
              value={block.title}
              minHeight={72}
              placeholder="CTA heading"
              onEditorActivate={handleEditorActivate}
              onEditorSelectionChange={handleEditorSelectionChange}
              onChange={nextValue =>
                updateBlock(block.id, current =>
                  current.type === 'cta' ? { ...current, title: nextValue } : current,
                )
              }
            />
            <MarkupSelectionEditor
              editorId={`${block.id}-description`}
              value={block.description}
              minHeight={120}
              placeholder="CTA description"
              onEditorActivate={handleEditorActivate}
              onEditorSelectionChange={handleEditorSelectionChange}
              onChange={nextValue =>
                updateBlock(block.id, current =>
                  current.type === 'cta' ? { ...current, description: nextValue } : current,
                )
              }
            />
            <Space className="w-full" wrap>
              <Input
                placeholder="Button text"
                value={block.buttonLabel}
                onChange={event =>
                  updateBlock(block.id, current =>
                    current.type === 'cta'
                      ? { ...current, buttonLabel: event.target.value }
                      : current,
                  )
                }
                style={{ width: 220 }}
              />
              <Input
                placeholder="Button link"
                value={block.buttonUrl}
                onChange={event =>
                  updateBlock(block.id, current =>
                    current.type === 'cta'
                      ? { ...current, buttonUrl: event.target.value }
                      : current,
                  )
                }
                style={{ width: 280 }}
              />
            </Space>
          </Space>
        );

      case 'image':
        return (
          <Space direction="vertical" className="w-full" size={10}>
            <Space wrap>
              <Upload
                beforeUpload={handleImageUpload(block.id)}
                showUploadList={false}
                accept="image/*"
              >
                <Button
                  icon={<UploadOutlined />}
                  loading={Boolean(imageUploadingByBlockId[block.id])}
                >
                  Upload Image
                </Button>
              </Upload>
              <Button
                danger
                icon={<DeleteOutlined />}
                disabled={!block.imageUrl || Boolean(imageUploadingByBlockId[block.id])}
                onClick={() => void handleRemoveUploadedImage(block.id)}
              >
                Remove Image
              </Button>
            </Space>

            {block.imageUrl ? (
              <div
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  padding: 10,
                  background: '#fafafa',
                }}
              >
                <img
                  src={block.imageUrl}
                  alt={block.altText || 'Uploaded image preview'}
                  style={{
                    width: '100%',
                    maxHeight: 240,
                    objectFit: 'cover',
                    borderRadius: 6,
                    border: '1px solid #e5e7eb',
                  }}
                />
              </div>
            ) : null}

            <Input
              placeholder="Alt text"
              value={block.altText}
              onChange={event =>
                updateBlock(block.id, current =>
                  current.type === 'image' ? { ...current, altText: event.target.value } : current,
                )
              }
            />
            <MarkupSelectionEditor
              editorId={`${block.id}-caption`}
              value={block.caption}
              minHeight={88}
              placeholder="Caption rich text"
              onEditorActivate={handleEditorActivate}
              onEditorSelectionChange={handleEditorSelectionChange}
              onChange={nextValue =>
                updateBlock(block.id, current =>
                  current.type === 'image' ? { ...current, caption: nextValue } : current,
                )
              }
            />
          </Space>
        );

      case 'html':
        return (
          <Input.TextArea
            placeholder="Paste custom HTML/CSS/JS code"
            autoSize={{ minRows: 6, maxRows: 14 }}
            value={block.html}
            onChange={event =>
              updateBlock(block.id, current =>
                current.type === 'html' ? { ...current, html: event.target.value } : current,
              )
            }
          />
        );

      default:
        return null;
    }
  };

  return (
    <Space direction="vertical" className="w-full" size={16}>
      {isLegacyHtml && (
        <Alert
          type="info"
          showIcon
          message="This page was created with legacy HTML. You can keep it or rebuild with widgets below."
        />
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-4 items-start">
        <Card
          size="small"
          title="Page Builder Canvas"
          extra={
            <Button size="small" icon={<EyeOutlined />} onClick={() => setIsLivePreviewOpen(true)}>
              Live Preview
            </Button>
          }
        >
          <Space direction="vertical" className="w-full" size={18}>
            {SECTION_DEFINITIONS.map(section => {
              const sectionBlocks = blocksBySection[section.id];
              const sectionIsActive = activeSectionId === section.id;
              const showSectionDropHint =
                dropHint?.sectionId === section.id &&
                dropHint.position === 'inside' &&
                !dropHint.blockId;

              return (
                <div key={section.id}>
                  <div className="flex items-center justify-between mb-2">
                    <Text strong>
                      Section: <span style={{ color: '#cf4f84' }}>{section.label}</span>
                    </Text>
                    <Text type="secondary">{section.description}</Text>
                  </div>

                  <div
                    onClick={() => setActiveSectionId(section.id)}
                    onDragOver={event => onSectionDragOver(event, section.id)}
                    onDrop={event => onSectionDrop(event, section.id)}
                    onDragEnd={clearDragState}
                    style={{
                      border: `1px dashed ${sectionIsActive ? '#91caff' : '#d9d9d9'}`,
                      borderRadius: 8,
                      padding: 12,
                      background: showSectionDropHint ? '#f0f5ff' : '#fafafa',
                      minHeight: 110,
                      transition: 'all 120ms ease',
                    }}
                  >
                    <Space direction="vertical" className="w-full" size={10}>
                      {sectionBlocks.length === 0 && (
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description={`No widgets in ${section.label} section`}
                        >
                          <Button
                            icon={<PlusOutlined />}
                            onClick={() => addWidget('wysiwyg', section.id)}
                          >
                            Add First Widget
                          </Button>
                        </Empty>
                      )}

                      {sectionBlocks.map(block => {
                        const isExpanded = expandedBlockId === block.id;
                        const isDragging =
                          dragState?.kind === 'block' && dragState.blockId === block.id;
                        const showBeforeHint =
                          dropHint?.sectionId === section.id &&
                          dropHint.blockId === block.id &&
                          dropHint.position === 'before';
                        const showAfterHint =
                          dropHint?.sectionId === section.id &&
                          dropHint.blockId === block.id &&
                          dropHint.position === 'after';

                        return (
                          <div
                            key={block.id}
                            data-block-card="true"
                            onDragOver={event => onBlockDragOver(event, section.id, block.id)}
                            onDrop={event => onBlockDrop(event, section.id, block.id)}
                            style={{
                              borderTop: showBeforeHint ? '2px solid #1677ff' : undefined,
                              borderBottom: showAfterHint ? '2px solid #1677ff' : undefined,
                              borderRadius: 8,
                              transition: 'border-color 120ms ease',
                            }}
                          >
                            <Card
                              size="small"
                              style={{
                                opacity: isDragging ? 0.45 : 1,
                                borderColor: sectionIsActive ? '#d9e7ff' : undefined,
                              }}
                              title={
                                <Space size={8}>
                                  <Button
                                    size="small"
                                    type="text"
                                    draggable
                                    icon={<HolderOutlined />}
                                    style={{ cursor: 'grab' }}
                                    title="Drag to reorder"
                                    onDragStart={event => onBlockDragStart(event, block.id)}
                                    onDragEnd={clearDragState}
                                  />
                                  <Text strong>{BLOCK_LABELS[block.type]}</Text>
                                </Space>
                              }
                              extra={
                                <Space size={4}>
                                  <Button
                                    size="small"
                                    icon={<EditOutlined />}
                                    onClick={() =>
                                      setExpandedBlockId(current =>
                                        current === block.id ? null : block.id,
                                      )
                                    }
                                  />
                                  <Button
                                    size="small"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => removeBlock(block.id)}
                                  />
                                </Space>
                              }
                            >
                              {isExpanded ? (
                                renderBlockEditor(block)
                              ) : (
                                <Text type="secondary">{getBlockSummary(block)}</Text>
                              )}
                            </Card>
                          </div>
                        );
                      })}
                    </Space>
                  </div>
                </div>
              );
            })}
          </Space>
        </Card>

        <div style={{ position: 'sticky', top: 24 }}>
          <style>
            {`
              .cms-sidebar-collapse .ant-collapse-item {
                border: 1px solid #e5e7eb !important;
                border-radius: 10px !important;
                overflow: hidden;
                margin-bottom: 12px;
                background: #ffffff;
              }

              .cms-sidebar-collapse .ant-collapse-item:last-child {
                margin-bottom: 0;
              }

              .cms-sidebar-collapse .ant-collapse-header {
                background: #e8edf4 !important;
                padding: 10px 14px !important;
              }

              .cms-sidebar-collapse .ant-collapse-content {
                border-top: 1px solid #e5e7eb !important;
              }
            `}
          </style>
          <Collapse
            className="cms-sidebar-collapse"
            defaultActiveKey={['text-markup', 'add-widgets']}
            bordered={false}
            style={{ background: 'transparent' }}
            items={[
              {
                key: 'text-markup',
                label: (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <span>Text Markup</span>
                    <Tooltip title="Select text in any block to apply styles. If you pick styles first, your next typed text will use them.">
                      <QuestionCircleOutlined style={{ color: '#4b5563' }} />
                    </Tooltip>
                  </div>
                ),
                children: (
                  <Space direction="vertical" className="w-full" size={10}>
                    <div>
                      <Text strong style={{ display: 'block', marginBottom: 8 }}>
                        Heading
                      </Text>
                      <Select
                        value={formattingState.heading}
                        options={HEADING_OPTIONS}
                        onChange={value => onHeadingChange(value as HeadingFormat)}
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div>
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}
                      >
                        <Text strong style={{ marginRight: 8 }}>
                          Quick Styles
                        </Text>
                        <Space wrap size={10}>
                          <Button
                            type={formattingState.bold ? 'primary' : 'default'}
                            onClick={onBoldToggle}
                            style={{ fontWeight: 700 }}
                          >
                            B
                          </Button>
                          <Button
                            type={formattingState.italic ? 'primary' : 'default'}
                            onClick={onItalicToggle}
                            style={{ fontStyle: 'italic' }}
                          >
                            I
                          </Button>
                          <Button
                            type={formattingState.underline ? 'primary' : 'default'}
                            onClick={onUnderlineToggle}
                            style={{ textDecoration: 'underline' }}
                          >
                            U
                          </Button>
                          <Button
                            type={formattingState.strikeThrough ? 'primary' : 'default'}
                            onClick={onStrikeThroughToggle}
                            style={{ textDecoration: 'line-through' }}
                          >
                            S
                          </Button>
                          <Button
                            type={formattingState.code ? 'primary' : 'default'}
                            onClick={onCodeToggle}
                            style={{ fontFamily: '"Courier New", monospace' }}
                          >
                            {'</>'}
                          </Button>
                        </Space>
                      </div>
                    </div>

                    <div>
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}
                      >
                        <Text strong style={{ marginRight: 8 }}>
                          Text Align
                        </Text>
                        <Space wrap size={10}>
                          {TEXT_ALIGN_OPTIONS.map(option => (
                            <Button
                              key={option.value}
                              type={
                                formattingState.textAlign === option.value ? 'primary' : 'default'
                              }
                              onClick={() => onTextAlignChange(option.value)}
                            >
                              {option.label}
                            </Button>
                          ))}
                        </Space>
                      </div>
                    </div>

                    <div>
                      <Text strong style={{ display: 'block', marginBottom: 8 }}>
                        Bulletin
                      </Text>
                      <Select
                        value={formattingState.listType}
                        options={LIST_TYPE_OPTIONS}
                        onChange={value => onListTypeChange(value as ListFormat)}
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div>
                      <Text strong style={{ display: 'block', marginBottom: 8 }}>
                        Color
                      </Text>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="color"
                          value={normalizeHexColor(colorHexInput) || formattingState.color}
                          onChange={event => onColorPickerChange(event.target.value)}
                          style={{
                            width: 52,
                            height: 34,
                            border: '1px solid #d9d9d9',
                            borderRadius: 6,
                            background: '#fff',
                            cursor: 'pointer',
                          }}
                        />
                        <Input
                          value={colorHexInput}
                          onChange={event => onColorHexInputChange(event.target.value)}
                          onBlur={onColorHexBlur}
                          placeholder="#1f2937"
                          maxLength={7}
                        />
                      </div>
                    </div>

                    <div>
                      <Text strong style={{ display: 'block', marginBottom: 8 }}>
                        Font Family
                      </Text>
                      <Select
                        value={formattingState.fontFamily}
                        options={FONT_FAMILY_OPTIONS.map(option => ({
                          label: option,
                          value: option,
                        }))}
                        onChange={onFontFamilyChange}
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div>
                      <Text strong style={{ display: 'block', marginBottom: 8 }}>
                        Font Size
                      </Text>
                      <Select
                        value={formattingState.fontSize}
                        options={FONT_SIZE_OPTIONS.map(option => ({
                          label: `${option}px`,
                          value: option,
                        }))}
                        onChange={onFontSizeChange}
                        style={{ width: '100%' }}
                      />
                    </div>

                    <Text type="secondary">
                      Active editor: {activeEditorId ? activeEditorId : 'None selected'}
                    </Text>
                  </Space>
                ),
              },
              {
                key: 'add-widgets',
                label: (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <span>Add Widgets</span>
                    <Tooltip
                      title={`Click or drag a widget into the canvas. Current target section: ${activeSectionId}`}
                    >
                      <QuestionCircleOutlined style={{ color: '#4b5563' }} />
                    </Tooltip>
                  </div>
                ),
                children: (
                  <>
                    <div>
                      <Space direction="vertical" className="w-full" size={8}>
                        {WIDGET_LIBRARY.map(widget => {
                          const isDraggingWidget =
                            dragState?.kind === 'widget' && dragState.widgetId === widget.id;

                          return (
                            <Tooltip key={widget.id} title={widget.description} placement="left">
                              <div
                                draggable
                                onDragStart={event => onWidgetDragStart(event, widget.id)}
                                onDragEnd={clearDragState}
                                onClick={() => addWidget(widget.id, activeSectionId)}
                                style={{
                                  border: '1px solid #e5e7eb',
                                  borderRadius: 8,
                                  padding: 8,
                                  background: isDraggingWidget ? '#eef4ff' : '#fff',
                                  cursor: 'grab',
                                  transition: 'all 120ms ease',
                                }}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <Space align="start" size={10}>
                                    <span style={{ marginTop: 2 }}>{widget.icon}</span>
                                    <div style={{ lineHeight: 1.2 }}>
                                      <div>
                                        <Text strong>{widget.title}</Text>
                                      </div>
                                      <Text type="secondary" style={{ fontSize: 12 }}>
                                        {widget.shortDescription}
                                      </Text>
                                    </div>
                                  </Space>
                                  <Button
                                    type="text"
                                    size="small"
                                    icon={<PlusOutlined />}
                                    onClick={event => {
                                      event.stopPropagation();
                                      addWidget(widget.id, activeSectionId);
                                    }}
                                  />
                                </div>
                              </div>
                            </Tooltip>
                          );
                        })}
                      </Space>
                    </div>
                  </>
                ),
              },
            ]}
          />
        </div>
      </div>

      <Drawer
        title="Live Preview"
        width={560}
        open={isLivePreviewOpen}
        onClose={() => setIsLivePreviewOpen(false)}
      >
        {livePreviewHtml ? (
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: livePreviewHtml }}
            style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: 10,
              padding: 16,
            }}
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Add some content blocks to see the live preview."
          />
        )}
      </Drawer>
    </Space>
  );
};

export default VisualPageBuilder;
