import { AtTabBar } from 'taro-ui';
import { useThemeMode } from '../hooks/use-theme-mode';
import { relaunch, routes } from '../utils/navigation';

type BottomNavProps = {
  active: 'home' | 'admin' | 'profile';
};

const items = [
  { key: 'home', label: '首页', icon: 'home', url: routes.home },
  { key: 'admin', label: '管理台', icon: 'bullet-list', url: routes.admin },
  { key: 'profile', label: '我的', icon: 'user', url: routes.profile }
] as const;

export default function BottomNav({ active }: BottomNavProps) {
  const themeMode = useThemeMode();
  const current = items.findIndex((item) => item.key === active);
  const isDark = themeMode === 'dark';

  return (
    <AtTabBar
      fixed
      current={current}
      color={isDark ? '#9fb0c8' : '#6b7280'}
      selectedColor={isDark ? '#6cb6ff' : '#1677ff'}
      backgroundColor={isDark ? '#101826' : '#ffffff'}
      tabList={items.map((item) => ({
        title: item.label,
        iconType: item.icon
      }))}
      onClick={(index) => {
        const next = items[index];
        if (next && next.key !== active) {
          relaunch(next.url);
        }
      }}
    />
  );
}
