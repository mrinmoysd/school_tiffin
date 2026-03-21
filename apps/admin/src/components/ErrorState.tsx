import { Alert, Button } from 'antd';

type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
};

const ErrorState = ({ title = 'Something went wrong', description, onRetry }: ErrorStateProps) => (
  <Alert
    type="error"
    showIcon
    message={title}
    description={description}
    action={
      onRetry ? (
        <Button size="small" onClick={onRetry}>
          Retry
        </Button>
      ) : undefined
    }
  />
);

export default ErrorState;
