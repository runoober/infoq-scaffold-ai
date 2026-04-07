import { View } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import {
  listType,
  type DictTypeQuery,
  type DictTypeVO
} from 'infoq-mobile-core';
import { useState } from 'react';
import { AtInput, AtButton } from 'taro-ui';
import BottomNav from '../../components/bottom-nav';
import { EmptyNotice, KeyValueList, PaginationBar, RecordCard } from '../../components/taro-ui-kit';
import { routes } from '../../utils/navigation';
import { handlePageError } from '../../utils/ui';
import { useSessionStore } from '../../store/session';
import './index.scss';

const createQuery = (pageNum = 1): DictTypeQuery => ({
  pageNum,
  pageSize: 10,
  dictName: '',
  dictType: ''
});

export default function SystemDictsPage() {
  const permissions = useSessionStore((state) => state.permissions);
  const loadSession = useSessionStore((state) => state.loadSession);
  const [query, setQuery] = useState<DictTypeQuery>(createQuery());
  const [list, setList] = useState<DictTypeVO[]>([]);
  const [total, setTotal] = useState(0);

  const canList = permissions.includes('system:dict:list');

  const loadPage = async (nextQuery = query) => {
    try {
      const session = await loadSession();
      if (!session) {
        Taro.reLaunch({ url: routes.login });
        return;
      }
      const listResponse = await (canList ? listType(nextQuery) : Promise.resolve({ rows: [] as DictTypeVO[], total: 0 }));
      setList(listResponse.rows || []);
      setTotal(listResponse.total || 0);
    } catch (error) {
      await handlePageError(error, '字典列表加载失败');
    }
  };

  const handleViewData = (dictType: string) => {
    Taro.navigateTo({ url: `${routes.dictData}?dictType=${dictType}` });
  };

  useDidShow(() => {
    void loadPage();
  });

  return (
    <View className="list-container">
      <View className="search-section">
        <View className="search-card">
          <AtInput
            clear
            name="dictName"
            placeholder="按字典名称过滤"
            title="字典名称"
            value={query.dictName || ''}
            onChange={(value) => {
              setQuery((prev) => ({ ...prev, dictName: String(value) }));
              return value;
            }}
          />
          <AtInput
            clear
            name="dictType"
            placeholder="按字典类型过滤"
            title="字典类型"
            value={query.dictType || ''}
            onChange={(value) => {
              setQuery((prev) => ({ ...prev, dictType: String(value) }));
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
        {canList && list.length === 0 && <EmptyNotice message="未查询到相关字典" />}
        {canList && list.map((item) => (
          <RecordCard
            key={String(item.dictId)}
            icon="bookmark"
            title={item.dictName}
            actions={[
              { onClick: () => handleViewData(item.dictType), title: '数据项' }
            ]}
          >
            <KeyValueList
              items={[
                { label: '字典类型', value: item.dictType || '-' },
                { label: '备注', value: item.remark || '-' },
                { label: '创建时间', value: item.createTime ? String(item.createTime).split(' ')[0] : '-' }
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
      
      <BottomNav active="admin" />
    </View>
  );
}
