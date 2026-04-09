import { Swiper, SwiperItem, View, Text } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { AtAvatar, AtGrid, AtIcon, AtNoticebar } from 'taro-ui';
import {
  formatDateTime,
  listNotice,
  loadWorkbenchSummary,
  type AdminModuleKey,
  type NoticeVO
} from '@/api';
import { useState } from 'react';
import BottomNav from '../../components/bottom-nav';
import { adminModules } from '../../utils/admin';
import { navigate, routes } from '../../utils/navigation';
import { handlePageError } from '../../utils/ui';
import { useSessionStore } from '../../store/session';
import './index.scss';

const gridModuleKeys: AdminModuleKey[] = ['users', 'roles', 'depts', 'notices', 'online', 'loginInfo'];

const gridIconMap: Record<AdminModuleKey, string> = {
  users: 'user',
  roles: 'bookmark',
  depts: 'folder',
  dicts: 'equalizer',
  posts: 'calendar',
  menus: 'menu',
  notices: 'message',
  online: 'eye',
  loginInfo: 'file-generic',
  operLog: 'list',
  cache: 'settings'
};

type HomeGridItem = {
  disabled: boolean;
  key: AdminModuleKey;
  permission: string;
  url: string;
  value: string;
  iconInfo: {
    color: string;
    size: number;
    value: string;
  };
};

const noticeQuery = {
  pageNum: 1,
  pageSize: 3,
  noticeTitle: '',
  createByName: '',
  status: '',
  noticeType: ''
};

export default function HomePage() {
  const user = useSessionStore((state) => state.user);
  const permissions = useSessionStore((state) => state.permissions);
  const loadSession = useSessionStore((state) => state.loadSession);
  const [recentNotices, setRecentNotices] = useState<NoticeVO[]>([]);
  const [summary, setSummary] = useState({
    userTotal: 0,
    roleTotal: 0,
    onlineTotal: 0,
    loginTotal: 0
  });

  useDidShow(() => {
    const run = async () => {
      try {
        const session = await loadSession();
        if (!session) {
          Taro.reLaunch({ url: routes.login });
          return;
        }
        const currentPermissions = useSessionStore.getState().permissions;
        const nextSummary = await loadWorkbenchSummary(currentPermissions);
        setSummary(nextSummary);
        if (currentPermissions.includes('system:notice:list')) {
          const response = await listNotice(noticeQuery);
          setRecentNotices(response.rows || []);
        } else {
          setRecentNotices([]);
        }
      } catch (error) {
        await handlePageError(error, '首页加载失败');
      }
    };
    void run();
  });

  const canOpenNotice = permissions.includes('system:notice:list');
  const primaryNotice = recentNotices[0];
  const gridItems: HomeGridItem[] = gridModuleKeys.map((key) => {
    const module = adminModules.find((item) => item.key === key);
    if (!module) {
      throw new Error(`Missing admin module metadata for ${key}.`);
    }
    const enabled = permissions.includes(module.permission);
    return {
      key,
      permission: module.permission,
      url: module.url,
      value: module.title,
      disabled: !enabled,
      iconInfo: {
        value: gridIconMap[key],
        size: 28,
        color: enabled ? '#1677ff' : '#c0c4cc'
      }
    };
  });

  const handleGridClick = async (item: HomeGridItem) => {
    if (item.disabled) {
      await Taro.showToast({
        title: '当前账号没有访问该模块的权限',
        icon: 'none'
      });
      return;
    }
    navigate(item.url);
  };

  const displayName = (user?.nickName || user?.userName || '用户').slice(0, 1).toUpperCase();

  return (
    <View className="home-container">
      <View className="welcome-section">
        <AtAvatar circle size="large" text={displayName} />
        <View className="welcome-text">
          <View className="greet">您好，{user?.nickName || user?.userName || '用户'}</View>
          <View className="dept">{user?.deptName || 'AI-first 全栈脚手架'}</View>
        </View>
      </View>

      <Swiper
        circular
        className="stats-swiper"
        duration={360}
        indicatorActiveColor="#1677ff"
        indicatorColor="rgba(22, 119, 255, 0.2)"
        indicatorDots
        interval={4000}
        autoplay
      >
        <SwiperItem className="stats-item">
          <View className="stats-card">
            <View className="stats-label">
              <AtIcon value="user" size="20" className="stats-icon" />
              用户总数
            </View>
            <View className="stats-value">{summary.userTotal}</View>
          </View>
        </SwiperItem>
        <SwiperItem className="stats-item">
          <View className="stats-card">
            <View className="stats-label">
              <AtIcon value="bookmark" size="20" className="stats-icon" />
              角色总数
            </View>
            <View className="stats-value">{summary.roleTotal}</View>
          </View>
        </SwiperItem>
        <SwiperItem className="stats-item">
          <View className="stats-card">
            <View className="stats-label">
              <AtIcon value="eye" size="20" className="stats-icon" />
              在线设备
            </View>
            <View className="stats-value">{summary.onlineTotal}</View>
          </View>
        </SwiperItem>
      </Swiper>

      <View className="notice-section">
        <AtNoticebar
          icon="volume-plus"
          marquee
          moreText={primaryNotice ? '详情' : '全部'}
          showMore={canOpenNotice}
          single
          onGotoMore={() => {
            if (!canOpenNotice) return;
            if (primaryNotice) {
              navigate(`${routes.noticeDetail}?noticeId=${primaryNotice.noticeId}`);
            } else {
              navigate(routes.notices);
            }
          }}
        >
          {!canOpenNotice
            ? '当前账号没有公告查看权限'
            : primaryNotice
              ? `${primaryNotice.noticeTitle} · ${formatDateTime(primaryNotice.createTime)}`
              : '暂无公告数据'}
        </AtNoticebar>
      </View>

      <View className="card-container grid-section">
        <View className="card-header">
          <Text className="card-title">快捷入口</Text>
          <Text className="card-extra">管理台核心模块</Text>
        </View>
        <View className="card-content">
          <AtGrid
            data={gridItems}
            columnNum={3}
            hasBorder={false}
            onClick={(item) => void handleGridClick(item as HomeGridItem)}
          />
        </View>
      </View>

      <BottomNav active="home" />
    </View>
  );
}
