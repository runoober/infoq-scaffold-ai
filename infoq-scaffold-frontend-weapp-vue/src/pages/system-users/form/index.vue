<template>
  <view class="page-wrap">
    <view class="form-section">
      <!-- 基本信息 -->
      <view class="card-container">
        <view class="card-header">
          <text class="card-title">基本信息</text>
        </view>
        <view class="card-content" style="padding: 0">
          <picker
            mode="selector"
            :range="deptOptions.map(d => `${'· '.repeat(d._depth)}${d.label}`)"
            @change="handleDeptChange"
          >
            <view class="picker-input-aligned">
              <text class="picker-label">所属部门</text>
              <view class="picker-value-container">
                <text :class="['picker-value', !selectedDept ? 'placeholder' : '']">
                  {{ selectedDeptLabel }}
                </text>
                <AppIcon name="chevron-right" size="32" class="picker-arrow" />
              </view>
            </view>
          </picker>

          <view class="form-item-modern">
            <text class="form-label">登录账号</text>
            <input class="form-input-plain" v-model="form.userName" placeholder="请输入登录账号" :disabled="isEdit" placeholder-style="color: #94a3b8" />
          </view>
          
          <view class="form-item-modern">
            <text class="form-label">用户昵称</text>
            <input class="form-input-plain" v-model="form.nickName" placeholder="请输入用户昵称" placeholder-style="color: #94a3b8" />
          </view>
          
          <view class="form-item-modern" v-if="!isEdit">
            <text class="form-label">初始密码</text>
            <input class="form-input-plain" type="password" v-model="form.password" placeholder="请输入初始密码" placeholder-style="color: #94a3b8" />
          </view>
          
          <view class="form-item-modern">
            <text class="form-label">手机号码</text>
            <input class="form-input-plain" v-model="form.phonenumber" placeholder="请输入手机号码" placeholder-style="color: #94a3b8" />
          </view>
        </view>
      </view>

      <!-- 用户属性 -->
      <view class="card-container">
        <view class="card-header">
          <text class="card-title">用户属性</text>
        </view>
        <view class="card-content">
          <view class="form-item-vertical">
            <text class="item-label">性别</text>
            <view class="radio-options-horizontal">
              <view
                v-for="item in sexOptions"
                :key="item.value"
                :class="['radio-option-item', form.sex === item.value ? 'active' : '']"
                @click="form.sex = item.value"
              >
                <view class="radio-circle">
                  <view v-if="form.sex === item.value" class="radio-inner" />
                </view>
                <text class="radio-label">{{ item.label }}</text>
              </view>
            </view>
          </view>

          <view class="form-item-vertical" style="margin-top: 32rpx">
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

      <!-- 分配角色 -->
      <view class="card-container">
        <view class="card-header">
          <text class="card-title">分配角色</text>
        </view>
        <view class="card-content">
          <view class="checkbox-group-vertical">
            <view
              v-for="item in roleOptions"
              :key="String(item.roleId)"
              :class="['checkbox-item', isRoleSelected(item.roleId) ? 'active' : '']"
              @click="toggleRole(item.roleId)"
            >
              <view :class="['checkbox-box', isRoleSelected(item.roleId) ? 'checked' : '']">
                <view v-if="isRoleSelected(item.roleId)" class="checkbox-inner" />
              </view>
              <text class="checkbox-label">{{ item.roleName }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="action-section">
      <button class="primary-btn save-btn" :loading="submitting" @click="save">保 存</button>
      <button class="secondary-btn cancel-btn" @click="backOr(routes.users)">取 消</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import AppIcon from '@/components/AppIcon.vue';
import { 
  addUser, 
  getUser, 
  updateUser, 
  getDicts, 
  toDictOptions, 
  deptTreeSelectForUser, 
  flattenTree, 
  optionSelectRoles,
  type UserForm, 
  type DictOption, 
  type FlatTreeItem, 
  type DeptTreeVO, 
  type RoleVO 
} from '@/api';
import { ensureAuthenticated } from '@/composables/use-auth-guard';
import { backOr, routes } from '@/utils/navigation';
import { handlePageError, showSuccess } from '@/utils/ui';
import { useSessionStore } from '@/store/session';

const sessionStore = useSessionStore();
const userId = ref('');
const submitting = ref(false);
const statusOptions = ref<DictOption[]>([]);
const sexOptions = ref<DictOption[]>([]);
const deptOptions = ref<Array<FlatTreeItem<DeptTreeVO>>>([]);
const roleOptions = ref<RoleVO[]>([]);

const form = reactive<UserForm>({
  userName: '',
  password: '',
  nickName: '',
  phonenumber: '',
  email: '',
  sex: '0',
  status: '0',
  remark: '',
  deptId: undefined,
  roleIds: [],
  postIds: []
});

const isEdit = computed(() => Boolean(userId.value));
type PickerChangeEvent = { detail?: { value?: string | number } };

const selectedDept = computed(() => deptOptions.value.find(d => Number(d.id) === form.deptId));
const selectedDeptLabel = computed(() => selectedDept.value ? `${'· '.repeat(selectedDept.value._depth)}${selectedDept.value.label}` : '请选择部门');

const handleDeptChange = (event: PickerChangeEvent) => {
  const index = Number(event.detail?.value);
  const target = Number.isInteger(index) ? deptOptions.value[index] : undefined;
  if (!target) {
    return;
  }
  form.deptId = Number(target.id);
};

const isRoleSelected = (roleId: string | number) => (form.roleIds || []).includes(String(roleId));
const toggleRole = (roleId: string | number) => {
  const idStr = String(roleId);
  const current = form.roleIds || [];
  if (current.includes(idStr)) {
    form.roleIds = current.filter(id => id !== idStr);
  } else {
    form.roleIds = [...current, idStr];
  }
};

const loadData = async () => {
  try {
    const [statusRes, sexRes, deptRes, roleRes] = await Promise.all([
      getDicts('sys_normal_disable'),
      getDicts('sys_user_sex'),
      deptTreeSelectForUser(),
      optionSelectRoles()
    ]);

    statusOptions.value = toDictOptions(statusRes.data);
    sexOptions.value = toDictOptions(sexRes.data);
    deptOptions.value = flattenTree(deptRes.data);
    roleOptions.value = roleRes.data || [];

    if (userId.value) {
      const response = await getUser(userId.value);
      const { user, roleIds, postIds } = response.data;
      Object.assign(form, {
        ...user,
        userId: String(user.userId),
        roleIds: (roleIds || []).map(String),
        postIds: (postIds || []).map(String)
      });
    }
  } catch (error) {
    await handlePageError(error, '数据加载失败');
  }
};

const save = async () => {
  if (!form.deptId) {
    await uni.showToast({ title: '请选择所属部门', icon: 'none' });
    return;
  }
  if (!form.userName?.trim()) {
    await uni.showToast({ title: '请输入登录账号', icon: 'none' });
    return;
  }
  if (!form.nickName?.trim()) {
    await uni.showToast({ title: '请输入用户昵称', icon: 'none' });
    return;
  }
  if (!isEdit.value && !form.password?.trim()) {
    await uni.showToast({ title: '请输入初始密码', icon: 'none' });
    return;
  }

  submitting.value = true;
  try {
    if (!ensureAuthenticated()) return;
    await sessionStore.loadSession();
    if (isEdit.value) {
      await updateUser(form);
    } else {
      await addUser(form);
    }
    await showSuccess('保存成功');
    backOr(routes.users);
  } catch (error) {
    await handlePageError(error, '保存失败');
  } finally {
    submitting.value = false;
  }
};

onLoad((query) => {
  if (!ensureAuthenticated()) return;
  userId.value = String(query?.userId || '').trim();
  loadData();
});
</script>

<style lang="scss">
@import '@/styles/common.scss';
</style>
