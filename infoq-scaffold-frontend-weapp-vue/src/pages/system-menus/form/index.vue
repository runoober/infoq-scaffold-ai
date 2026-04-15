<template>
  <view class="page-wrap">
    <view class="form-card">
      <view class="card-header">
        <text class="card-title">{{ isEdit ? '编辑菜单' : '新增菜单' }}</text>
      </view>
      <view class="card-content">
        <view class="form-item">
          <text class="form-label">上级菜单</text>
          <input class="form-input" v-model="form.parentId" placeholder="请输入上级菜单ID" placeholder-style="color: #94a3b8" />
        </view>
        <view class="form-item">
          <text class="form-label">菜单名称</text>
          <input class="form-input" v-model="form.menuName" placeholder="请输入菜单名称" placeholder-style="color: #94a3b8" />
        </view>
        <view class="form-item">
          <text class="form-label">权限标识</text>
          <input class="form-input" v-model="form.perms" placeholder="请输入权限标识" placeholder-style="color: #94a3b8" />
        </view>
        <view class="form-item">
          <text class="form-label">显示排序</text>
          <input class="form-input" v-model.number="form.orderNum" type="number" placeholder="请输入排序" placeholder-style="color: #94a3b8" />
        </view>
        <view class="form-item">
          <text class="form-label">备注说明</text>
          <textarea class="form-textarea" v-model="form.remark" placeholder="请输入备注" placeholder-style="color: #94a3b8" />
        </view>

        <view style="margin-top: 60rpx; display: flex; flex-direction: column; gap: 24rpx;">
          <button class="primary-btn" style="width: 100%" @click="save">保 存</button>
          <button class="secondary-btn" style="width: 100%" @click="backOr(routes.menus)">取 消</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { addMenu, getMenu, updateMenu, type MenuForm } from '@/api';
import { ensureAuthenticated } from '@/composables/use-auth-guard';
import { backOr, routes } from '@/utils/navigation';
import { handlePageError, showSuccess } from '@/utils/ui';
import { useSessionStore } from '@/store/session';

const sessionStore = useSessionStore();
const menuId = ref('');
const form = reactive<MenuForm>({
  parentId: 0,
  menuName: '',
  orderNum: 0,
  path: '',
  component: '',
  query: '',
  isFrame: '1',
  isCache: '0',
  menuType: 'M',
  visible: '0',
  status: '0',
  perms: '',
  icon: '',
  remark: ''
});

const isEdit = computed(() => Boolean(menuId.value));

const loadForm = async () => {
  if (!menuId.value) return;
  try {
    const response = await getMenu(menuId.value);
    Object.assign(form, response.data || {});
  } catch (error) {
    await handlePageError(error, '菜单信息加载失败');
  }
};

const save = async () => {
  if (!form.menuName?.trim()) {
    await uni.showToast({ title: '菜单名称不能为空', icon: 'none' });
    return;
  }
  try {
    if (!ensureAuthenticated()) return;
    await sessionStore.loadSession();
    if (isEdit.value) {
      form.menuId = Number(menuId.value);
      await updateMenu(form);
    } else {
      await addMenu(form);
    }
    await showSuccess('保存成功');
    backOr(routes.menus);
  } catch (error) {
    await handlePageError(error, '菜单保存失败');
  }
};

onLoad((query) => {
  if (!ensureAuthenticated()) return;
  void sessionStore.loadSession();
  menuId.value = String(query?.menuId || '').trim();
  void loadForm();
});
</script>

<style lang="scss">
@import '@/styles/common.scss';
</style>
