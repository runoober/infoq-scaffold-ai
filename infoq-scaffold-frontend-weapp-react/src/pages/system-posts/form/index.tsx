import { View, Text, Picker } from '@tarojs/components';
import Taro, { useDidShow, useRouter } from '@tarojs/taro';
import {
  addPost,
  getDicts,
  getPost,
  deptTreeSelectForPost,
  flattenTree,
  toDictOptions,
  updatePost,
  type DictOption,
  type PostForm,
  type DeptTreeVO,
  type FlatTreeItem
} from '@/api';
import { useState } from 'react';
import { AtButton, AtInput, AtTextarea } from 'taro-ui';
import { handlePageError, showSuccess } from '../../../utils/ui';
import { useSessionStore } from '../../../store/session';
import { routes } from '../../../utils/navigation';
import './index.scss';

const createForm = (): PostForm => ({
  postId: undefined,
  deptId: undefined,
  postCode: '',
  postName: '',
  postCategory: '',
  postSort: 1,
  status: '0',
  remark: ''
});

export default function PostFormPage() {
  const router = useRouter();
  const postId = router.params.postId;
  const loadSession = useSessionStore((state) => state.loadSession);
  const [form, setForm] = useState<PostForm>(createForm());
  const [statusOptions, setStatusOptions] = useState<DictOption[]>([]);
  const [deptOptions, setDeptOptions] = useState<Array<FlatTreeItem<DeptTreeVO>>>([]);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const session = await loadSession();
      if (!session) {
        Taro.reLaunch({ url: routes.login });
        return;
      }

      const [statusRes, deptRes] = await Promise.all([
        getDicts('sys_normal_disable'),
        deptTreeSelectForPost()
      ]);
      setStatusOptions(toDictOptions(statusRes.data));
      setDeptOptions(flattenTree(deptRes.data));

      if (postId) {
        const response = await getPost(postId);
        const data = response.data;
        setForm({
          postId: data.postId,
          deptId: data.deptId,
          postCode: data.postCode,
          postName: data.postName,
          postCategory: data.postCategory || '',
          postSort: data.postSort,
          status: data.status || '0',
          remark: data.remark || ''
        });
      }
    } catch (error) {
      await handlePageError(error, '加载失败');
    }
  };

  useDidShow(() => {
    void loadData();
  });

  const handleSave = async () => {
    if (!form.deptId) {
      await Taro.showToast({ title: '请选择归属部门', icon: 'none' });
      return;
    }
    if (!form.postName.trim()) {
      await Taro.showToast({ title: '请输入岗位名称', icon: 'none' });
      return;
    }
    if (!form.postCode.trim()) {
      await Taro.showToast({ title: '请输入岗位编码', icon: 'none' });
      return;
    }

    setSubmitting(true);
    try {
      if (postId) {
        await updatePost(form);
      } else {
        await addPost(form);
      }
      await showSuccess(postId ? '岗位已更新' : '岗位已创建');
      Taro.navigateBack();
    } catch (error) {
      await handlePageError(error, '保存失败');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedDept = deptOptions.find(d => String(d.id) === String(form.deptId));
  const selectedDeptLabel = selectedDept ? `${'· '.repeat(selectedDept._depth)}${selectedDept.label}` : '请选择归属部门';

  return (
    <View className="post-form-container">
      <View className="form-section">
        <View className="card-container">
          <View className="card-header">
            <Text className="card-title">基本信息</Text>
          </View>
          <View className="card-content" style={{ padding: 0 }}>
            <Picker
              mode="selector"
              range={deptOptions.map(d => `${'· '.repeat(d._depth)}${d.label}`)}
              onChange={(e) => {
                const index = Number(e.detail.value);
                setForm(prev => ({ ...prev, deptId: Number(deptOptions[index].id) }));
              }}
            >
              <View className="at-input picker-input-aligned">
                <View className="at-input__container">
                  <View className="at-input__title">归属部门</View>
                  <View className="at-input__input picker-value-container">
                    <Text className={`picker-value ${!selectedDept ? 'placeholder' : ''}`}>
                      {selectedDeptLabel}
                    </Text>
                    <View className="at-icon at-icon-chevron-right picker-arrow"></View>
                  </View>
                </View>
              </View>
            </Picker>

            <AtInput
              name="postName"
              title="岗位名称"
              placeholder="请输入岗位名称"
              value={form.postName}
              onChange={(v) => { setForm(p => ({ ...p, postName: String(v) })); return v; }}
            />
            <AtInput
              name="postCode"
              title="岗位编码"
              placeholder="请输入岗位编码"
              value={form.postCode}
              onChange={(v) => { setForm(p => ({ ...p, postCode: String(v) })); return v; }}
            />
            <AtInput
              name="postCategory"
              title="岗位类别"
              placeholder="请输入岗位类别"
              value={form.postCategory || ''}
              onChange={(v) => { setForm(p => ({ ...p, postCategory: String(v) })); return v; }}
            />
            <AtInput
              name="postSort"
              title="显示顺序"
              type="number"
              placeholder="请输入显示顺序"
              value={String(form.postSort)}
              onChange={(v) => { setForm(p => ({ ...p, postSort: Number(v) })); return v; }}
            />
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
            <Text className="card-title">备注</Text>
          </View>
          <View className="card-content">
            <AtTextarea
              height={200}
              count={false}
              placeholder="请输入备注说明"
              value={form.remark || ''}
              onChange={(value) => setForm((prev) => ({ ...prev, remark: value }))}
            />
          </View>
        </View>
      </View>

      <View className="action-section">
        <AtButton className="save-btn" type="primary" loading={submitting} onClick={() => void handleSave()}>
          保存岗位
        </AtButton>
        <AtButton className="cancel-btn" onClick={() => Taro.navigateBack()}>
          返回
        </AtButton>
      </View>
    </View>
  );
}
