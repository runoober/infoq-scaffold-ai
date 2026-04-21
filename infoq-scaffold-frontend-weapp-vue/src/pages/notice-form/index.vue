<template>
  <view class="page-wrap">
    <view class="form-section">
      <view class="card-container">
        <view class="card-header">
          <text class="card-title">公告基本信息</text>
        </view>
        <view class="card-content" style="padding: 0">
          <view class="form-item-modern">
            <text class="form-label">公告标题</text>
            <input class="form-input-plain" v-model="form.noticeTitle" placeholder="请输入公告标题" placeholder-style="color: #94a3b8" />
          </view>
          
          <picker
            mode="selector"
            :range="typeOptions.map(o => o.label)"
            @change="handleTypeChange"
          >
            <view class="picker-input-aligned">
              <text class="picker-label">公告类型</text>
              <view class="picker-value-container">
                <text :class="['picker-value', !form.noticeType ? 'placeholder' : '']">
                  {{ selectedTypeLabel }}
                </text>
                <view class="at-icon at-icon-chevron-right picker-arrow"></view>
              </view>
            </view>
          </picker>
        </view>
      </view>

      <view class="card-container">
        <view class="card-header">
          <text class="card-title">公告内容</text>
        </view>
        <view class="card-content">
          <view class="form-item-vertical">
            <text class="item-label">详细内容</text>
            <textarea class="form-textarea" v-model="form.noticeContent" placeholder="请输入公告详细内容" placeholder-style="color: #94a3b8" />
          </view>
          
          <view class="form-item-vertical" style="margin-top: 32rpx">
            <text class="item-label">备注说明</text>
            <input class="form-input" v-model="form.remark" placeholder="请输入备注" placeholder-style="color: #94a3b8" />
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
    </view>

    <!-- 操作按钮 -->
    <view class="action-section">
      <button class="primary-btn save-btn" :loading="submitting" @click="save">发 布</button>
      <button class="secondary-btn cancel-btn" @click="backOr(routes.notices)">取 消</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { addNotice, getNotice, updateNotice, getDicts, toDictOptions, type NoticeForm, type DictOption } from '@/api';
import { ensureAuthenticated } from '@/composables/use-auth-guard';
import { backOr, routes } from '@/utils/navigation';
import { handlePageError, showSuccess } from '@/utils/ui';
import { useSessionStore } from '@/store/session';

const sessionStore = useSessionStore();
const noticeId = ref('');
const submitting = ref(false);
const statusOptions = ref<DictOption[]>([]);
const typeOptions = ref<DictOption[]>([]);

const form = reactive<NoticeForm>({
  noticeTitle: '',
  noticeType: '1',
  noticeContent: '',
  status: '0',
  remark: ''
});

const isEdit = computed(() => Boolean(noticeId.value));
type PickerChangeEvent = { detail?: { value?: string | number } };

const selectedTypeLabel = computed(() => {
  const option = typeOptions.value.find((item) => item.value === form.noticeType);
  return option ? option.label : '请选择类型';
});

const handleTypeChange = (event: PickerChangeEvent) => {
  const index = Number(event.detail?.value);
  const option = Number.isInteger(index) ? typeOptions.value[index] : undefined;
  if (!option) {
    return;
  }
  form.noticeType = option.value;
};

const loadData = async () => {
  try {
    const [statusRes, typeRes] = await Promise.all([
      getDicts('sys_normal_disable'),
      getDicts('sys_notice_type')
    ]);

    statusOptions.value = toDictOptions(statusRes.data);
    typeOptions.value = toDictOptions(typeRes.data);

    if (noticeId.value) {
      const response = await getNotice(noticeId.value);
      Object.assign(form, response.data || {});
    }
  } catch (error) {
    await handlePageError(error, '公告加载失败');
  }
};

const save = async () => {
  if (!form.noticeTitle?.trim() || !form.noticeContent?.trim()) {
    await uni.showToast({ title: '标题和内容不能为空', icon: 'none' });
    return;
  }
  submitting.value = true;
  try {
    if (!ensureAuthenticated()) return;
    await sessionStore.loadSession();
    if (isEdit.value) {
      form.noticeId = Number(noticeId.value);
      await updateNotice(form);
    } else {
      await addNotice(form);
    }
    await showSuccess('保存成功');
    backOr(routes.notices);
  } catch (error) {
    await handlePageError(error, '公告保存失败');
  } finally {
    submitting.value = false;
  }
};

onLoad((query) => {
  if (!ensureAuthenticated()) return;
  noticeId.value = String(query?.noticeId || '').trim();
  loadData();
});
</script>

<style lang="scss">
@import '@/styles/common.scss';

.form-item-modern {
  display: flex;
  align-items: center;
  padding: 24rpx 32rpx;
  border-bottom: 1rpx solid #f2f2f2;
  
  &:last-child {
    border-bottom: none;
  }
  
  .form-label {
    width: 156rpx;
    font-size: 28rpx;
    color: #475569;
    font-weight: 600;
  }
  
  .form-input-plain {
    flex: 1;
    font-size: 28rpx;
    color: #1f2937;
    font-weight: 500;
  }
}

.picker-arrow {
  font-size: 32rpx;
  color: #cbd5e1;
}
</style>
