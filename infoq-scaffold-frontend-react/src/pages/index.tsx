import { Divider, theme } from 'antd';
import { useSettingsStore } from '@/store/modules/settings';

export default function HomePage() {
  const dark = useSettingsStore((state) => state.dark);
  const {
    token: { colorText }
  } = theme.useToken();

  return (
    <div
      style={{
        padding: '0 0 24px',
        fontFamily: '"Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif',
        fontSize: 13,
        color: dark ? colorText : '#676a6c',
        overflowX: 'hidden'
      }}
    >
      <div style={{ display: 'flex' }}>
        <div style={{ paddingLeft: 20 }}>
          <h2
            style={{
              marginTop: 10,
              marginBottom: 0,
              fontSize: 26,
              fontWeight: 700,
              color: dark ? colorText : '#303133',
              letterSpacing: '0.2px'
            }}
          >
            infoq-scaffold-backend后台管理系统
          </h2>
        </div>
      </div>
      <div style={{ height: 960 }} />
      <Divider />
    </div>
  );
}
