import { Skeleton } from 'antd';

type TableSkeletonProps = {
  rows?: number;
};

const TableSkeleton = ({ rows = 6 }: TableSkeletonProps) => (
  <Skeleton active title={false} paragraph={{ rows }} />
);

export default TableSkeleton;
