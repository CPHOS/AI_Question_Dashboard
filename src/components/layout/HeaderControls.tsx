import { Button, Dropdown, Tooltip } from 'antd';
import { BulbOutlined, BulbFilled, GlobalOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useThemeMode } from '@/theme/ThemeContext';

export default function HeaderControls() {
  const { mode, toggle } = useThemeMode();
  const { t, i18n } = useTranslation();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Dropdown
        menu={{
          selectable: true,
          selectedKeys: [i18n.language.startsWith('en') ? 'en' : 'zh'],
          items: [
            { key: 'zh', label: t('language.zh') },
            { key: 'en', label: t('language.en') },
          ],
          onClick: ({ key }) => void i18n.changeLanguage(key),
        }}
      >
        <Button type="text" icon={<GlobalOutlined />}>
          {i18n.language.startsWith('en') ? 'EN' : '中'}
        </Button>
      </Dropdown>
      <Tooltip title={t('theme.toggle')}>
        <Button
          type="text"
          icon={mode === 'dark' ? <BulbFilled /> : <BulbOutlined />}
          onClick={toggle}
        />
      </Tooltip>
    </div>
  );
}
