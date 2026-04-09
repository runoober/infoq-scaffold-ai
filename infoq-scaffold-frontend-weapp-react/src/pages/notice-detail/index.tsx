import { RichText, View, Text } from '@tarojs/components';
import Taro, { useDidShow, useRouter } from '@tarojs/taro';
import { delNotice, formatDateTime, getDictLabel, getDicts, getNotice, toDictOptions, type DictOption, type NoticeVO } from '@/api';
import { useState } from 'react';
import { AtButton } from 'taro-ui';
import { EmptyNotice, StatusTag, KeyValueList } from '../../components/taro-ui-kit';
import { backOr, navigate, routes } from '../../utils/navigation';
import { handlePageError, showSuccess } from '../../utils/ui';
import { useSessionStore } from '../../store/session';
import './index.scss';

export default function NoticeDetailPage() {
  const router = useRouter();
  const noticeId = router.params.noticeId;
  const permissions = useSessionStore((state) => state.permissions);
  const loadSession = useSessionStore((state) => state.loadSession);
  const [notice, setNotice] = useState<NoticeVO | null>(null);
  const [statusOptions, setStatusOptions] = useState<DictOption[]>([]);
  const [typeOptions, setTypeOptions] = useState<DictOption[]>([]);

  const canEdit = permissions.includes('system:notice:edit');
  const canRemove = permissions.includes('system:notice:remove');

  useDidShow(() => {
    const run = async () => {
      if (!noticeId) {
        await Taro.showToast({ title: '缺少公告编号。', icon: 'none' });
        backOr(routes.notices);
        return;
      }
      try {
        const session = await loadSession();
        if (!session) {
          Taro.reLaunch({ url: routes.login });
          return;
        }
        const currentPermissions = useSessionStore.getState().permissions;
        if (!currentPermissions.includes('system:notice:query')) {
          await Taro.showToast({ title: '当前账号没有公告详情权限。', icon: 'none' });
          backOr(routes.notices);
          return;
        }
        const [statusResponse, typeResponse, noticeResponse] = await Promise.all([
          getDicts('sys_notice_status'),
          getDicts('sys_notice_type'),
          getNotice(noticeId)
        ]);
        setStatusOptions(toDictOptions(statusResponse.data));
        setTypeOptions(toDictOptions(typeResponse.data));
        setNotice(noticeResponse.data);
      } catch (error) {
        await handlePageError(error, '公告详情加载失败。');
      }
    };
    void run();
  });

  const handleDelete = async () => {
    if (!noticeId) {
      return;
    }
    const modal = await Taro.showModal({
      title: '确认删除',
      content: `确定删除公告 #${noticeId} 吗？`
    });
    if (!modal.confirm) {
      return;
    }
    try {
      await delNotice(noticeId);
      await showSuccess('删除成功');
      Taro.reLaunch({ url: routes.notices });
    } catch (error) {
      await handlePageError(error, '公告删除失败。');
    }
  };

  if (!notice) {
    return <EmptyNotice message="正在加载公告详情..." />;
  }

  return (
    <View className="notice-detail-container">
      <View className="detail-header">
        <Text className="notice-title">{notice.noticeTitle}</Text>
        <View className="notice-meta">
          <Text className="meta-item">{notice.createByName || '系统'}</Text>
          <Text className="meta-divider">|</Text>
          <Text className="meta-item">{formatDateTime(notice.createTime)}</Text>
        </View>
      </View>

      <View className="card-container">
        <View className="card-header">
          <Text className="card-title">公告内容</Text>
          <StatusTag 
            label={getDictLabel(typeOptions, notice.noticeType) || '公告'} 
            type="info"
          />
        </View>
        <View className="card-content rich-text-wrapper">
          <RichText nodes={notice.noticeContent || '<p>暂无内容</p>'} />
        </View>
      </View>

      <View className="card-container">
        <View className="card-header">
          <Text className="card-title">基本信息</Text>
        </View>
        <View className="card-content" style={{ padding: 0 }}>
          <KeyValueList
            items={[
              { label: '公告状态', value: <StatusTag label={getDictLabel(statusOptions, notice.status) || '未知'} type={notice.status === '0' ? 'success' : 'error'} /> },
              { label: '备注说明', value: notice.remark || '无' }
            ]}
          />
        </View>
      </View>

      <View className="action-section">
        <AtButton className="cancel-btn" onClick={() => backOr(routes.notices)}>
          返回列表
        </AtButton>
        {canEdit && (
          <AtButton 
            className="save-btn" 
            type="primary" 
            onClick={() => navigate(`${routes.noticeForm}?noticeId=${notice.noticeId}`)}
          >
            编辑公告
          </AtButton>
        )}
        {canRemove && (
          <AtButton 
            className="delete-btn" 
            onClick={() => void handleDelete()}
          >
            删除公告
          </AtButton>
        )}
      </View>
    </View>
  );
}
