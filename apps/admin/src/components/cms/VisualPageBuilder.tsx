import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Card, Input, Space, Typography } from 'antd';
import {
  DeleteOutlined,
  DownOutlined,
  PlusOutlined,
  RocketOutlined,
  UpOutlined,
} from '@ant-design/icons';
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

const BLOCK_OPTIONS: Array<{ type: CmsVisualBlockType; label: string }> = [
  { type: 'hero', label: 'Hero Section' },
  { type: 'text', label: 'Text Section' },
  { type: 'features', label: 'Feature List' },
  { type: 'cta', label: 'Call To Action' },
  { type: 'image', label: 'Image' },
];

const BLOCK_LABELS: Record<CmsVisualBlockType, string> = {
  hero: 'Hero Section',
  text: 'Text Section',
  features: 'Feature List',
  cta: 'Call To Action',
  image: 'Image',
  html: 'Legacy HTML',
};

const move = <T,>(items: T[], from: number, to: number) => {
  const copied = [...items];
  const [item] = copied.splice(from, 1);
  copied.splice(to, 0, item);
  return copied;
};

const VisualPageBuilder = ({ value, onChange }: VisualPageBuilderProps) => {
  const parsedInitial = useMemo(() => deserializeVisualBuilderContent(value), [value]);
  const [blocks, setBlocks] = useState<CmsVisualBlock[]>(parsedInitial.blocks);
  const [isLegacyHtml, setIsLegacyHtml] = useState(parsedInitial.isLegacyHtml);
  const lastSerializedRef = useRef(value ?? '');

  useEffect(() => {
    const incoming = value ?? '';
    if (incoming === lastSerializedRef.current) {
      return;
    }

    const parsed = deserializeVisualBuilderContent(incoming);
    setBlocks(parsed.blocks);
    setIsLegacyHtml(parsed.isLegacyHtml);
    lastSerializedRef.current = incoming;
  }, [value]);

  useEffect(() => {
    const nextValue = serializeVisualBuilderContent(blocks);
    lastSerializedRef.current = nextValue;
    onChange?.(nextValue);
  }, [blocks, onChange]);

  const previewHtml = useMemo(() => renderVisualBlocksToHtml(blocks), [blocks]);

  const updateBlock = (id: string, updater: (block: CmsVisualBlock) => CmsVisualBlock) => {
    setBlocks(prev => prev.map(block => (block.id === id ? updater(block) : block)));
  };

  const addBlock = (type: CmsVisualBlockType) => {
    setBlocks(prev => [...prev, createVisualBlock(type)]);
  };

  const removeBlock = (id: string) => {
    setBlocks(prev => {
      const next = prev.filter(block => block.id !== id);
      return next.length ? next : [createVisualBlock('hero')];
    });
  };

  const moveUp = (index: number) => {
    if (index === 0) {
      return;
    }
    setBlocks(prev => move(prev, index, index - 1));
  };

  const moveDown = (index: number) => {
    if (index >= blocks.length - 1) {
      return;
    }
    setBlocks(prev => move(prev, index, index + 1));
  };

  const renderBlockEditor = (block: CmsVisualBlock) => {
    switch (block.type) {
      case 'hero':
        return (
          <Space direction="vertical" className="w-full" size={10}>
            <Input
              placeholder="Eyebrow (optional): Trusted by 2,000+ parents"
              value={block.eyebrow}
              onChange={event =>
                updateBlock(block.id, current =>
                  current.type === 'hero' ? { ...current, eyebrow: event.target.value } : current,
                )
              }
            />
            <Input
              placeholder="Main heading"
              value={block.title}
              onChange={event =>
                updateBlock(block.id, current =>
                  current.type === 'hero' ? { ...current, title: event.target.value } : current,
                )
              }
            />
            <Input.TextArea
              placeholder="Subtitle or short paragraph"
              autoSize={{ minRows: 2, maxRows: 5 }}
              value={block.subtitle}
              onChange={event =>
                updateBlock(block.id, current =>
                  current.type === 'hero' ? { ...current, subtitle: event.target.value } : current,
                )
              }
            />
            <Space className="w-full" wrap>
              <Input
                placeholder="Button text (optional)"
                value={block.buttonLabel}
                onChange={event =>
                  updateBlock(block.id, current =>
                    current.type === 'hero'
                      ? { ...current, buttonLabel: event.target.value }
                      : current,
                  )
                }
                style={{ width: 240 }}
              />
              <Input
                placeholder="Button link (https://...)"
                value={block.buttonUrl}
                onChange={event =>
                  updateBlock(block.id, current =>
                    current.type === 'hero'
                      ? { ...current, buttonUrl: event.target.value }
                      : current,
                  )
                }
                style={{ width: 320 }}
              />
            </Space>
          </Space>
        );

      case 'text':
        return (
          <Space direction="vertical" className="w-full" size={10}>
            <Input
              placeholder="Section heading"
              value={block.heading}
              onChange={event =>
                updateBlock(block.id, current =>
                  current.type === 'text' ? { ...current, heading: event.target.value } : current,
                )
              }
            />
            <Input.TextArea
              placeholder="Write your section content..."
              autoSize={{ minRows: 4, maxRows: 10 }}
              value={block.body}
              onChange={event =>
                updateBlock(block.id, current =>
                  current.type === 'text' ? { ...current, body: event.target.value } : current,
                )
              }
            />
          </Space>
        );

      case 'features':
        return (
          <Space direction="vertical" className="w-full" size={10}>
            <Input
              placeholder="Feature section heading"
              value={block.heading}
              onChange={event =>
                updateBlock(block.id, current =>
                  current.type === 'features'
                    ? { ...current, heading: event.target.value }
                    : current,
                )
              }
            />
            <Input.TextArea
              placeholder="One feature per line"
              autoSize={{ minRows: 4, maxRows: 8 }}
              value={block.items.join('\n')}
              onChange={event =>
                updateBlock(block.id, current =>
                  current.type === 'features'
                    ? {
                        ...current,
                        items: event.target.value
                          .split('\n')
                          .map(item => item.trim())
                          .filter(Boolean),
                      }
                    : current,
                )
              }
            />
          </Space>
        );

      case 'cta':
        return (
          <Space direction="vertical" className="w-full" size={10}>
            <Input
              placeholder="CTA heading"
              value={block.title}
              onChange={event =>
                updateBlock(block.id, current =>
                  current.type === 'cta' ? { ...current, title: event.target.value } : current,
                )
              }
            />
            <Input.TextArea
              placeholder="CTA description"
              autoSize={{ minRows: 2, maxRows: 6 }}
              value={block.description}
              onChange={event =>
                updateBlock(block.id, current =>
                  current.type === 'cta'
                    ? { ...current, description: event.target.value }
                    : current,
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
                style={{ width: 240 }}
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
                style={{ width: 320 }}
              />
            </Space>
          </Space>
        );

      case 'image':
        return (
          <Space direction="vertical" className="w-full" size={10}>
            <Input
              placeholder="Image URL"
              value={block.imageUrl}
              onChange={event =>
                updateBlock(block.id, current =>
                  current.type === 'image' ? { ...current, imageUrl: event.target.value } : current,
                )
              }
            />
            <Input
              placeholder="Alt text (recommended)"
              value={block.altText}
              onChange={event =>
                updateBlock(block.id, current =>
                  current.type === 'image' ? { ...current, altText: event.target.value } : current,
                )
              }
            />
            <Input
              placeholder="Caption (optional)"
              value={block.caption}
              onChange={event =>
                updateBlock(block.id, current =>
                  current.type === 'image' ? { ...current, caption: event.target.value } : current,
                )
              }
            />
          </Space>
        );

      case 'html':
        return (
          <Input.TextArea
            placeholder="Legacy HTML content"
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
          message="This page uses older HTML content. You can keep it, or add visual blocks below."
        />
      )}

      <Space wrap>
        {BLOCK_OPTIONS.map(option => (
          <Button key={option.type} icon={<PlusOutlined />} onClick={() => addBlock(option.type)}>
            {option.label}
          </Button>
        ))}
      </Space>

      {blocks.map((block, index) => (
        <Card
          key={block.id}
          size="small"
          title={`${index + 1}. ${BLOCK_LABELS[block.type]}`}
          extra={
            <Space size={4}>
              <Button size="small" icon={<UpOutlined />} onClick={() => moveUp(index)} />
              <Button size="small" icon={<DownOutlined />} onClick={() => moveDown(index)} />
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => removeBlock(block.id)}
              />
            </Space>
          }
        >
          {renderBlockEditor(block)}
        </Card>
      ))}

      <Card
        size="small"
        title={
          <Space size={8}>
            <RocketOutlined />
            <span>Live Preview</span>
          </Space>
        }
      >
        {previewHtml ? (
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: previewHtml }} />
        ) : (
          <Text type="secondary">Add some block content to preview your page.</Text>
        )}
      </Card>
    </Space>
  );
};

export default VisualPageBuilder;
