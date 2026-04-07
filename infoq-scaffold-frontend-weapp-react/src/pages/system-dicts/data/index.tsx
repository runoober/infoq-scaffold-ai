import { View, Text } from '@tarojs/components';
import Taro, { useDidShow, useRouter } from '@tarojs/taro';
import {
  listData,
  type DictDataQuery,
  type DictDataVO
} from 'infoq-mobile-core';
import { useState } from 'react';
import { AtInput, AtButton } from 'taro-ui';
import BottomNav from '../../../components/bottom-nav';
import { EmptyNotice, KeyValueList, PaginationBar, RecordCard } from '../../../components/taro-ui-kit';
import { routes } from '../../../utils/navigation';
import { handlePageError } from '../../../utils/ui';
import { useSessionStore } from '../../../store/session';
import './index.scss';

const createQuery = (dictType = '', pageNum = 1): DictDataQuery => ({
  pageNum,
  pageSize: 10,
  dictType,
  dictLabel: ''
});

export default function SystemDictDataPage() {
  const router = useRouter();
  const dictTypeFromUrl = router.params.dictType || '';
  const permissions = useSessionStore((state) => state.permissions);
  const loadSession = useSessionStore((state) => state.loadSession);
  const [query, setQuery] = useState<DictDataQuery>(createQuery(dictTypeFromUrl));
  const [list, setList] = useState<DictDataVO[]>([]);
  const [total, setTotal] = useState(0);

  const canList = permissions.includes('system:dict:list');

  const loadPage = async (nextQuery = query) => {
    try {
      const session = await loadSession();
      if (!session) {
        Taro.reLaunch({ url: routes.login });
        return;
      }
      const listResponse = await (canList ? listData(nextQuery) : Promise.resolve({ rows: [] as DictDataVO[], total: 0 }));
      setList(listResponse.rows || []);
      setTotal(listResponse.total || 0);
    } catch (error) {
      await handlePageError(error, '字典数据加载失败');
    }
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
            name="dictLabel"
            placeholder="按数据标签过滤"
            title="数据标签"
            value={query.dictLabel || ''}
            onChange={(value) => {
              setQuery((prev) => ({ ...prev, dictLabel: String(value) }));
              return value;
            }}
          />
          <View className="search-actions">
            <AtButton
              className="search-action-btn"
              type="secondary"
              onClick={() => {
                const nextQuery = createQuery(dictTypeFromUrl);
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
        <View className="info-bar">
          <Text className="info-text">当前字典类型: {dictTypeFromUrl}</Text>
        </View>

        {!canList && <EmptyNotice message="当前账号没有访问权限" />}
        {canList && list.length === 0 && <EmptyNotice message="未查询到相关数据项" />}
        {canList && list.map((item) => (
          <RecordCard
            key={String(item.dictCode)}
            icon="tag"
            title={item.dictLabel}
          >
            <KeyValueList
              items={[
                { label: '字典键值', value: item.dictValue || '-' },
                { label: '字典排序', value: String(item.dictSort ?? 0) },
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
