<template>
  <view class="page-wrap">
    <view class="form-section">
      <view class="card-container">
        <view class="card-header">
          <text class="card-title">基本信息</text>
        </view>
        <view class="card-content" style="padding: 0">
          <view class="form-item-modern">
            <text class="form-label">岗位名称</text>
            <input class="form-input-plain" v-model="form.postName" placeholder="请输入岗位名称" placeholder-style="color: #94a3b8" />
          </view>
          <view class="form-item-modern">
            <text class="form-label">岗位编码</text>
            <input class="form-input-plain" v-model="form.postCode" placeholder="请输入岗位编码" placeholder-style="color: #94a3b8" />
          </view>
          <view class="form-item-modern">
            <text class="form-label">显示排序</text>
            <input class="form-input-plain" v-model.number="form.postSort" type="number" placeholder="请输入排序" placeholder-style="color: #94a3b8" />
          </view>
        </view>
      </view>

      <view class="card-container">
        <view class="card-header">
          <text class="card-title">状态与备注</text>
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

          <view class="form-item-vertical" style="margin-top: 32rpx">
            <text class="item-label">备注说明</text>
            <textarea class="form-textarea" v-model="form.remark" placeholder="请输入备注" placeholder-style="color: #94a3b8" />
          </view>
        </view>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="action-section">
      <button class="primary-btn save-btn" :loading="submitting" @click="save">保 存</button>
      <button class="secondary-btn cancel-btn" @click="backOr(routes.posts)">取 消</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { addPost, getPost, updatePost, getDicts, toDictOptions, type PostForm, type DictOption } from '@/api';
import { ensureAuthenticated } from '@/composables/use-auth-guard';
import { backOr, routes } from '@/utils/navigation';
import { handlePageError, showSuccess } from '@/utils/ui';
import { useSessionStore } from '@/store/session';

const sessionStore = useSessionStore();
const postId = ref('');
const submitting = ref(false);
const statusOptions = ref<DictOption[]>([]);

const form = reactive<PostForm>({
  postName: '',
  postCode: '',
  postSort: 0,
  status: '0',
  remark: ''
});

const isEdit = computed(() => Boolean(postId.value));

const loadData = async () => {
  try {
    const statusRes = await getDicts('sys_normal_disable');
    statusOptions.value = toDictOptions(statusRes.data);

    if (postId.value) {
      const response = await getPost(postId.value);
      Object.assign(form, response.data || {});
    }
  } catch (error) {
    await handlePageError(error, '岗位信息加载失败');
  }
};

const save = async () => {
  if (!form.postName?.trim() || !form.postCode?.trim()) {
    await uni.showToast({ title: '岗位名称和编码不能为空', icon: 'none' });
    return;
  }
  submitting.value = true;
  try {
    if (!ensureAuthenticated()) return;
    await sessionStore.loadSession();
    if (isEdit.value) {
      form.postId = Number(postId.value);
      await updatePost(form);
    } else {
      await addPost(form);
    }
    await showSuccess('保存成功');
    backOr(routes.posts);
  } catch (error) {
    await handlePageError(error, '岗位保存失败');
  } finally {
    submitting.value = false;
  }
};

onLoad((query) => {
  if (!ensureAuthenticated()) return;
  postId.value = String(query?.userId || query?.postId || '').trim();
  loadData();
});
</script>

<style lang="scss">
@import '@/styles/common.scss';
</style>
