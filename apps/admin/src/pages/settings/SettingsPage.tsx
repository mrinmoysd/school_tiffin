import { Card, Typography } from 'antd';

const { Title, Text } = Typography;

const SettingsPage = () => {
  return (
    <div>
      <div className="mb-6">
        <Title level={2} className="!mb-1">
          Settings
        </Title>
        <Text type="secondary">Account and preference settings</Text>
      </div>

      <Card>
        <Title level={4} className="!mb-2">
          Coming soon
        </Title>
        <Text type="secondary">
          Settings are not configured yet. Tell me which preferences you want here and I will wire
          them up.
        </Text>
      </Card>
    </div>
  );
};

export default SettingsPage;
