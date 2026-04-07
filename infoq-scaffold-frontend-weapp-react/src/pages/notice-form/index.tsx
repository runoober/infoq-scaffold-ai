import { View, Text } from '@tarojs/components';
import Taro, { useDidShow, useRouter } from '@tarojs/taro';
import {
  addNotice,
  getDicts,
  getNotice,
  toDictOptions,
  type DictOption,
  type NoticeForm,
  updateNotice
} from 'infoq-mobile-core';
import { useState } from 'react';
import { AtButton, AtInput, AtTextarea } from 'taro-ui';
import { backOr, routes } from '../../utils/navigation';
import { handlePageError, showSuccess } from '../../utils/ui';
import { useSessionStore } from '../../store/session';
import './index.scss';

const initialForm: NoticeForm = {
  noticeTitle: '',
  noticeType: '',
  noticeContent: '',
  status: '0',
  remark: ''
};

export default function NoticeFormPage() {
  const router = useRouter();
  const noticeId = router.params.noticeId;
  const loadSession = useSessionStore((state) => state.loadSession);
  const [form, setForm] = useState<NoticeForm>(initialForm);
  const [statusOptions, setStatusOptions] = useState<DictOption[]>([]);
  const [typeOptions, setTypeOptions] = useState<DictOption[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useDidShow(() => {
    const run = async () => {
      try {
        const session = await loadSession();
        if (!session) {
          Taro.reLaunch({ url: routes.login });
          return;
        }
        const currentPermissions = useSessionStore.getState().permissions;
        const requiredPermission = noticeId ? 'system:notice:edit' : 'system:notice:add';
        if (!currentPermissions.includes(requiredPermission)) {
          await Taro.showToast({ title: '当前账号没有表单操作权限。', icon: 'none' });
          backOr(routes.notices);
          return;
        }
        const [statusResponse, typeResponse] = await Promise.all([getDicts('sys_notice_status'), getDicts('sys_notice_type')]);
        setStatusOptions(toDictOptions(statusResponse.data));
        setTypeOptions(toDictOptions(typeResponse.data));

        if (noticeId) {
          const response = await getNotice(noticeId);
          setForm({
            ...initialForm,
            ...response.data
          });
        } else {
          setForm(initialForm);
        }
      } catch (error) {
        await handlePageError(error, '公告表单初始化失败。');
      }
    };
    void run();
  });

  const handleSubmit = async () => {
    if (!form.noticeTitle?.trim()) {
      await Taro.showToast({ title: '请输入公告标题。', icon: 'none' });
      return;
    }
    if (!form.noticeType) {
      await Taro.showToast({ title: '请选择公告类型。', icon: 'none' });
      return;
    }
    if (!form.noticeContent?.trim()) {
      await Taro.showToast({ title: '请输入公告内容。', icon: 'none' });
      return;
    }
    setSubmitting(true);
    try {
      if (noticeId) {
        await updateNotice({ ...form, noticeId });
      } else {
        await addNotice(form);
      }
      await showSuccess('保存成功');
      Taro.reLaunch({ url: routes.notices });
    } catch (error) {
      await handlePageError(error, '公告保存失败。');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="notice-form-container">
      <View className="form-section">
        <View className="card-container">
          <View className="card-header">
            <Text className="card-title">基本信息</Text>
          </View>
          <View className="card-content" style={{ padding: 0 }}>
            <AtInput
              clear
              name="noticeTitle"
              placeholder="请输入公告标题"
              title="公告标题"
              value={form.noticeTitle}
              onChange={(value) => {
                setForm((prev) => ({ ...prev, noticeTitle: String(value) }));
                return value;
              }}
            />
          </View>
        </View>

        <View className="card-container">
          <View className="card-header">
            <Text className="card-title">公告类型</Text>
          </View>
          <View className="card-content">
            <View className="radio-options-horizontal">
              {typeOptions.map((item) => (
                <View
                  key={item.value}
                  className={`radio-option-item ${form.noticeType === item.value ? 'active' : ''}`}
                  onClick={() => setForm((prev) => ({ ...prev, noticeType: item.value }))}
                >
                  <View className="radio-circle">
                    {form.noticeType === item.value && <View className="radio-inner" />}
                  </View>
                  <Text className="radio-label">{item.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View className="card-container">
          <View className="card-header">
            <Text className="card-title">状态</Text>
          </View>
          <View className="card-content">
            <View className="radio-options-horizontal">
              {statusOptions.map((item) => (
                <View
                  key={item.value}
                  className={`radio-option-item ${form.status === item.value ? 'active' : ''}`}
                  onClick={() => setForm((prev) => ({ ...prev, status: item.value }))}
                >
                  <View className="radio-circle">
                    {form.status === item.value && <View className="radio-inner" />}
                  </View>
                  <Text className="radio-label">{item.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View className="card-container">
          <View className="card-header">
            <Text className="card-title">公告内容</Text>
          </View>
          <View className="card-content">
            <AtTextarea
              height={300}
              count={false}
              placeholder="请输入公告内容"
              value={form.noticeContent}
              onChange={(value) => setForm((prev) => ({ ...prev, noticeContent: value }))}
            />
          </View>
        </View>

        <View className="card-container">
          <View className="card-header">
            <Text className="card-title">备注</Text>
          </View>
          <View className="card-content">
            <AtTextarea
              height={150}
              count={false}
              placeholder="请输入备注说明"
              value={form.remark || ''}
              onChange={(value) => setForm((prev) => ({ ...prev, remark: value }))}
            />
          </View>
        </View>
      </View>

      <View className="action-section">
        <AtButton className="save-btn" type="primary" loading={submitting} onClick={() => void handleSubmit()}>
          保存公告
        </AtButton>
        <AtButton className="cancel-btn" onClick={() => backOr(routes.notices)}>
          返回
        </AtButton>
      </View>
    </View>
  );
}
