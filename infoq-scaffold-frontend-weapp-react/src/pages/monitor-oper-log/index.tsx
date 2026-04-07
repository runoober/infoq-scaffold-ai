import { View } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import {
  cleanOperLog,
  delOperLog,
  getDictLabel,
  getDicts,
  listOperLog,
  toDictOptions,
  type DictOption,
  type OperLogQuery,
  type OperLogVO
} from 'infoq-mobile-core';
import { useState } from 'react';
import { AtButton, AtInput, AtModal, AtModalHeader, AtModalContent } from 'taro-ui';
import BottomNav from '../../components/bottom-nav';
import { EmptyNotice, KeyValueList, PaginationBar, RecordCard, StatusTag, FabButton } from '../../components/taro-ui-kit';
import { routes } from '../../utils/navigation';
import { handlePageError, showSuccess } from '../../utils/ui';
import { useSessionStore } from '../../store/session';
import './index.scss';

const createQuery = (pageNum = 1): OperLogQuery => ({
  pageNum,
  pageSize: 10,
  operIp: '',
  title: '',
  operName: '',
  businessType: '',
  status: '',
  orderByColumn: 'operTime',
  isAsc: 'descending'
});

export default function MonitorOperLogPage() {
  const permissions = useSessionStore((state) => state.permissions);
  const loadSession = useSessionStore((state) => state.loadSession);
  const [query, setQuery] = useState<OperLogQuery>(createQuery());
  const [list, setList] = useState<OperLogVO[]>([]);
  const [total, setTotal] = useState(0);
  const [statusOptions, setStatusOptions] = useState<DictOption[]>([]);
  const [typeOptions, setTypeOptions] = useState<DictOption[]>([]);

  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedLog, setSelectedLog] = useState<OperLogVO | null>(null);

  const canList = permissions.includes('monitor:operLog:list');
  const canRemove = permissions.includes('monitor:operLog:remove');
  const canQuery = permissions.includes('monitor:operLog:query');

  const loadPage = async (nextQuery = query) => {
    try {
      const session = await loadSession();
      if (!session) {
        Taro.reLaunch({ url: routes.login });
        return;
      }
      const [statusResponse, typeResponse, listResponse] = await Promise.all([
        getDicts('sys_common_status'),
        getDicts('sys_oper_type'),
        canList ? listOperLog(nextQuery) : Promise.resolve({ rows: [], total: 0 })
      ]);
      setStatusOptions(toDictOptions(statusResponse.data));
      setTypeOptions(toDictOptions(typeResponse.data));
      setList(listResponse.rows || []);
      setTotal(listResponse.total || 0);
    } catch (error) {
      await handlePageError(error, '操作日志加载失败');
    }
  };

  useDidShow(() => {
    void loadPage();
  });

  const handleDelete = async (operId: string | number) => {
    const modal = await Taro.showModal({
      title: '确认删除',
      content: `确定删除日志 #${operId} 吗？`
    });
    if (!modal.confirm) return;
    try {
      await delOperLog(operId);
      await showSuccess('日志已删除');
      await loadPage({ ...query });
    } catch (error) {
      await handlePageError(error, '日志删除失败');
    }
  };

  const handleClean = async () => {
    const modal = await Taro.showModal({
      title: '确认清空',
      content: '确定清空所有操作日志吗？'
    });
    if (!modal.confirm) return;
    try {
      await cleanOperLog();
      await showSuccess('操作日志已清空');
      await loadPage({ ...query, pageNum: 1 });
    } catch (error) {
      await handlePageError(error, '操作日志清空失败');
    }
  };

  return (
    <View className="list-container">
      <View className="search-section">
        <View className="search-card">
          <AtInput
            clear
            name="title"
            placeholder="按系统模块过滤"
            title="系统模块"
            value={query.title || ''}
            onChange={(value) => {
              setQuery((prev) => ({ ...prev, title: String(value) }));
              return value;
            }}
          />
          <AtInput
            clear
            name="operName"
            placeholder="按操作人员过滤"
            title="操作人员"
            value={query.operName || ''}
            onChange={(value) => {
              setQuery((prev) => ({ ...prev, operName: String(value) }));
              return value;
            }}
          />
          <View className="search-actions">
            <AtButton
              className="search-action-btn"
              type="secondary"
              onClick={() => {
                const nextQuery = createQuery();
                setQuery(nextQuery);
                void loadPage(nextQuery);
              }}
            >
              重置
            </AtButton>
            <AtButton
              className="search-action-btn"
              type="primary"
              onClick={() => void loadPage({ ...query, pageNum: 1 })}
            >
              查询
            </AtButton>
          </View>
        </View>
      </View>

      <View className="list-content">
        {!canList && <EmptyNotice message="当前账号没有访问权限" />}
        {canList && list.length === 0 && <EmptyNotice message="未查询到相关日志" />}
        {canList && list.map((item) => (
          <RecordCard
            key={String(item.operId)}
            icon="list"
            title={item.title || '操作日志'}
            statusColor={item.status === 0 ? '#52c41a' : '#ff4d4f'}
            extra={
              <StatusTag 
                label={getDictLabel(statusOptions, String(item.status)) || '未知'} 
                type={item.status === 0 ? 'success' : 'error'} 
              />
            }
            actions={[
              ...(canQuery ? [{ onClick: () => {
                setSelectedLog(item);
                setDetailVisible(true);
              }, title: '详情' }] : []),
              ...(canRemove ? [{ onClick: () => void handleDelete(item.operId), title: '删除', danger: true }] : [])
            ]}
          >
            <KeyValueList
              items={[
                { label: '操作人员', value: `${item.operName || '-'} (${item.deptName || '-'})` },
                { label: '业务类型', value: getDictLabel(typeOptions, String(item.businessType)) || '-' },
                { label: '请求路径', value: item.operUrl || '-' },
                { label: '操作地址', value: item.operIp || '-' },
                { label: '操作时间', value: item.operTime ? String(item.operTime) : '-' }
              ]}
            />
          </RecordCard>
        ))}

        {canList && (
          <PaginationBar
            current={query.pageNum}
            pageSize={query.pageSize}
            total={total}
            onChange={(page) => {
              const nextQuery = { ...query, pageNum: page };
              setQuery(nextQuery);
              void loadPage(nextQuery);
            }}
          />
        )}
      </View>

      <AtModal isOpened={detailVisible} onClose={() => setDetailVisible(false)}>
        <AtModalHeader>操作详情</AtModalHeader>
        <AtModalContent>
          {selectedLog && (
            <View className="log-detail-modal">
              <KeyValueList
                items={[
                  { label: '系统模块', value: selectedLog.title || '-' },
                  { label: '请求方式', value: selectedLog.requestMethod || '-' },
                  { label: '请求路径', value: selectedLog.operUrl || '-' },
                  { label: '操作人员', value: selectedLog.operName || '-' },
                  { label: '操作地址', value: selectedLog.operIp || '-' },
                  { label: '操作时间', value: selectedLog.operTime || '-' }
                ]}
              />
            </View>
          )}
        </AtModalContent>
        <View className="modal-action-section">
          <AtButton className="cancel-btn" onClick={() => setDetailVisible(false)}>关闭</AtButton>
        </View>
      </AtModal>

      {canRemove && <FabButton icon="trash" onClick={() => void handleClean()} />}
      
      <BottomNav active="admin" />
    </View>
  );
}
