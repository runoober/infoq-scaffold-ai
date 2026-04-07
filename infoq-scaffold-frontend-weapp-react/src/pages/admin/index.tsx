import { View, Text } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { AtGrid, AtNoticebar } from 'taro-ui';
import BottomNav from '../../components/bottom-nav';
import { monitorAdminModules, systemAdminModules } from '../../utils/admin';
import { navigate, routes } from '../../utils/navigation';
import { handlePageError } from '../../utils/ui';
import { useSessionStore } from '../../store/session';
import './index.scss';

export default function AdminPage() {
  const permissions = useSessionStore((state) => state.permissions);
  const loadSession = useSessionStore((state) => state.loadSession);

  useDidShow(() => {
    const run = async () => {
      try {
        const session = await loadSession();
        if (!session) {
          Taro.reLaunch({ url: routes.login });
        }
      } catch (error) {
        await handlePageError(error, '管理台加载失败');
      }
    };
    void run();
  });

  const systemModules = systemAdminModules.filter((item) => permissions.includes(item.permission));
  const monitorModules = monitorAdminModules.filter((item) => permissions.includes(item.permission));

  const iconMap: Record<string, string> = {
    users: 'user',
    roles: 'bookmark',
    depts: 'folder',
    posts: 'calendar',
    menus: 'menu',
    notices: 'message',
    online: 'eye',
    loginInfo: 'file-generic',
    operLog: 'list',
    cache: 'settings'
  };

  return (
    <View className="admin-container">
      <View className="admin-header">
        <Text className="title">移动管理台</Text>
        <Text className="desc">AI-first 数字化管控中心</Text>
      </View>

      <View className="card-container module-group">
        <View className="card-header">
          <Text className="card-title">系统管理</Text>
          <Text className="card-extra">{systemModules.length} 个活跃模块</Text>
        </View>
        <View className="card-content">
          {systemModules.length ? (
            <AtGrid
              columnNum={3}
              data={systemModules.map((item) => ({
                key: item.key,
                value: item.title,
                iconInfo: {
                  value: iconMap[item.key] || 'folder',
                  size: 28,
                  color: '#1677ff'
                }
              }))}
              hasBorder={false}
              onClick={(item) => {
                const target = systemModules.find((module) => module.key === item.key);
                if (target) {
                  navigate(target.url);
                }
              }}
            />
          ) : (
            <AtNoticebar single>当前账号没有系统管理权限</AtNoticebar>
          )}
        </View>
      </View>

      <View className="card-container module-group">
        <View className="card-header">
          <Text className="card-title">系统监控</Text>
          <Text className="card-extra">{monitorModules.length} 个监控指标</Text>
        </View>
        <View className="card-content">
          {monitorModules.length ? (
            <AtGrid
              columnNum={3}
              data={monitorModules.map((item) => ({
                key: item.key,
                value: item.title,
                iconInfo: {
                  value: iconMap[item.key] || 'eye',
                  size: 28,
                  color: '#1677ff'
                }
              }))}
              hasBorder={false}
              onClick={(item) => {
                const target = monitorModules.find((module) => module.key === item.key);
                if (target) {
                  navigate(target.url);
                }
              }}
            />
          ) : (
            <AtNoticebar single>当前账号没有系统监控权限</AtNoticebar>
          )}
        </View>
      </View>

      <BottomNav active="admin" />
    </View>
  );
}
