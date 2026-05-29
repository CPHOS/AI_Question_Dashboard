import { Navigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';

interface Props {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin }: Props) {
  const { status, isAdmin } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();

  if (status === 'verifying') {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
        <Spin tip={t('auth.detectingRole')} size="large" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/tasks" replace />;
  }

  return <>{children}</>;
}
