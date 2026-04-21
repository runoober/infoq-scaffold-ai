<template>
  <view class="page-wrap">
    <view class="form-section">
      <view class="card-container">
        <view class="card-header">
          <text class="card-title">基本信息</text>
        </view>
        <view class="card-content" style="padding: 0">
          <picker
            mode="selector"
            :range="deptTreeOptions.map(d => `${'· '.repeat(d._depth)}${d.label}`)"
            @change="handleParentDeptChange"
          >
            <view class="picker-input-aligned">
              <text class="picker-label">上级部门</text>
              <view class="picker-value-container">
                <text :class="['picker-value', !selectedParentDept ? 'placeholder' : '']">
                  {{ selectedParentDeptLabel }}
                </text>
                <AppIcon name="chevron-right" size="32" class="picker-arrow" />
              </view>
            </view>
          </picker>

          <view class="form-item-modern">
            <text class="form-label">部门名称</text>
            <input class="form-input-plain" v-model="form.deptName" placeholder="请输入部门名称" placeholder-style="color: #94a3b8" />
          </view>
          <view class="form-item-modern">
            <text class="form-label">负责人</text>
            <input class="form-input-plain" v-model="form.leader" placeholder="请输入负责人姓名" placeholder-style="color: #94a3b8" />
          </view>
          <view class="form-item-modern">
            <text class="form-label">联系电话</text>
            <input class="form-input-plain" v-model="form.phone" placeholder="请输入联系电话" placeholder-style="color: #94a3b8" />
          </view>
          <view class="form-item-modern">
            <text class="form-label">显示排序</text>
            <input class="form-input-plain" v-model.number="form.orderNum" type="number" placeholder="请输入排序" placeholder-style="color: #94a3b8" />
          </view>
        </view>
      </view>

      <view class="card-container">
        <view class="card-header">
          <text class="card-title">部门状态</text>
        </view>
        <view class="card-content">
          <view class="form-item-vertical">
            <text class="item-label">状态</text>
            <view class="radio-options-horizontal">
              <view
                v-for="item in statusOptions"
                :key="item.value"
                :class="['radio-option-item', form.status === item.value ? 'active' : '']"
                @click="form.status = item.value"
              >
                <view class="radio-circle">
                  <view v-if="form.status === item.value" class="radio-inner" />
                </view>
                <text class="radio-label">{{ item.label }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="action-section">
      <button class="primary-btn save-btn" :loading="submitting" @click="save">保 存</button>
      <button class="secondary-btn cancel-btn" @click="backOr(routes.depts)">取 消</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import AppIcon from '@/components/AppIcon.vue';
import {
  addDept,
  getDept,
  updateDept,
  listDept,
  getDicts,
  toDictOptions,
  flattenTree,
  type DeptForm,
  type DictOption,
  type DeptVO,
  type FlatTreeItem
} from '@/api';
import { handleDeptTree } from '@/utils/helpers';
import { ensureAuthenticated } from '@/composables/use-auth-guard';
import { backOr, routes } from '@/utils/navigation';
import { handlePageError, showSuccess } from '@/utils/ui';
import { useSessionStore } from '@/store/session';

type PickerChangeEvent = { detail?: { value?: string | number } };
type RawDeptNode = {
  id?: string | number;
  deptId?: string | number;
  label?: string;
  deptName?: string;
  parentId?: string | number;
  children?: RawDeptNode[];
};
type DeptTreeOption = {
  id: string | number;
  label: string;
  children?: DeptTreeOption[];
};

const normalizeDeptNode = (node: RawDeptNode): DeptTreeOption => ({
  id: node.id ?? node.deptId ?? '',
  label: node.label ?? node.deptName ?? String(node.id ?? node.deptId ?? ''),
  children: Array.isArray(node.children) ? node.children.map((child) => normalizeDeptNode(child)) : []
});

const sessionStore = useSessionStore();
const deptId = ref('');
const submitting = ref(false);
const statusOptions = ref<DictOption[]>([]);
const deptTreeOptions = ref<Array<FlatTreeItem<DeptTreeOption>>>([]);

const form = reactive<DeptForm>({
  parentId: 0,
  deptName: '',
  orderNum: 0,
  leader: '',
  phone: '',
  email: '',
  status: '0'
});

const isEdit = computed(() => Boolean(deptId.value));

const selectedParentDept = computed(() => deptTreeOptions.value.find(d => Number(d.id) === form.parentId));
const selectedParentDeptLabel = computed(() => selectedParentDept.value ? `${'· '.repeat(selectedParentDept.value._depth)}${selectedParentDept.value.label}` : '选择上级部门');

const handleParentDeptChange = (event: PickerChangeEvent) => {
  const index = Number(event.detail?.value);
  const target = Number.isInteger(index) ? deptTreeOptions.value[index] : undefined;
  if (!target) {
    return;
  }
  form.parentId = Number(target.id);
};

const loadData = async () => {
  try {
    const [statusRes, deptRes] = await Promise.all([
      getDicts('sys_normal_disable'),
      listDept()
    ]);

    statusOptions.value = toDictOptions(statusRes.data);
    
    // Add a virtual root node for "None" or "Root"
    const depts = (deptRes.data || []) as DeptVO[];
    const tree = handleDeptTree(depts as Array<Record<string, unknown>>)
      .map((node) => normalizeDeptNode(node as unknown as RawDeptNode));
    deptTreeOptions.value = [
      { id: 0, label: '主类目', _depth: 0, children: [] },
      ...flattenTree(tree)
    ];

    if (deptId.value) {
      const response = await getDept(deptId.value);
      Object.assign(form, response.data || {});
    }
  } catch (error) {
    await handlePageError(error, '部门数据加载失败');
  }
};

const save = async () => {
  if (!form.deptName?.trim()) {
    await uni.showToast({ title: '部门名称不能为空', icon: 'none' });
    return;
  }
  submitting.value = true;
  try {
    if (!ensureAuthenticated()) return;
    await sessionStore.loadSession();
    if (isEdit.value) {
      form.deptId = Number(deptId.value);
      await updateDept(form);
    } else {
      await addDept(form);
    }
    await showSuccess('保存成功');
    backOr(routes.depts);
  } catch (error) {
    await handlePageError(error, '部门保存失败');
  } finally {
    submitting.value = false;
  }
};

onLoad((query) => {
  if (!ensureAuthenticated()) return;
  deptId.value = String(query?.deptId || '').trim();
  loadData();
});
</script>

<style lang="scss">
@import '@/styles/common.scss';
</style>
