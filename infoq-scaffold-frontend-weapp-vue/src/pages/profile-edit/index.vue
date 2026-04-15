<template>
  <view class="profile-edit-container">
    <view class="edit-header-banner">
      <view class="banner-title">完善个人资料</view>
      <view class="avatar-edit-box" @click="handleUpdateAvatar">
        <view class="avatar-frame">
          <image v-if="form.avatar" :src="form.avatar" class="avatar-img" mode="aspectFill" />
          <text v-else class="avatar-txt">{{ form.nickName.slice(0, 1).toUpperCase() || 'U' }}</text>
        </view>
        <view class="edit-badge">
          <AppIcon name="camera" size="32" color="#1677ff" />
        </view>
      </view>
    </view>

    <view class="form-wrapper">
      <view class="form-card-modern">
        <view class="modern-form-item">
          <view class="label-row">
            <view class="dot"></view>
            <text class="text">用户昵称</text>
          </view>
          <input class="modern-input" v-model="form.nickName" placeholder="起一个好听的名字" />
        </view>

        <view class="modern-form-item">
          <view class="label-row">
            <view class="dot"></view>
            <text class="text">性别设置</text>
          </view>
          <view class="sex-selector">
            <view 
              class="sex-btn" 
              :class="{ active: form.sex === '0' }"
              @click="form.sex = '0'"
            >男</view>
            <view 
              class="sex-btn" 
              :class="{ active: form.sex === '1' }"
              @click="form.sex = '1'"
            >女</view>
            <view 
              class="sex-btn" 
              :class="{ active: form.sex === '2' }"
              @click="form.sex = '2'"
            >保密</view>
          </view>
        </view>

        <view class="modern-form-item">
          <view class="label-row">
            <view class="dot"></view>
            <text class="text">联系电话</text>
          </view>
          <input class="modern-input" v-model="form.phonenumber" placeholder="方便大家联系你" type="number" />
        </view>

        <view class="modern-form-item">
          <view class="label-row">
            <view class="dot"></view>
            <text class="text">电子邮箱</text>
          </view>
          <input class="modern-input" v-model="form.email" placeholder="接收系统通知" />
        </view>

        <view class="btn-group-modern">
          <view class="modern-btn primary" @click="handleSave">确认保存</view>
          <view class="modern-btn secondary" @click="backOr(routes.profile)">放弃修改</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getUserProfile, updateUserProfile } from '@/api';
import { ensureAuthenticated } from '@/composables/use-auth-guard';
import { backOr, routes } from '@/utils/navigation';
import { handlePageError, showSuccess } from '@/utils/ui';
import { useSessionStore } from '@/store/session';

const sessionStore = useSessionStore();
const form = reactive({
  nickName: '',
  email: '',
  phonenumber: '',
  sex: '0',
  avatar: ''
});

const loadProfile = async () => {
  if (!ensureAuthenticated()) {
    return;
  }
  try {
    await sessionStore.loadSession();
    const response = await getUserProfile();
    const user = response.data.user || {};
    form.nickName = user.nickName || '';
    form.email = user.email || '';
    form.phonenumber = user.phonenumber || '';
    form.sex = user.sex || '0';
    form.avatar = user.avatar || '';
  } catch (error) {
    await handlePageError(error, '资料加载失败');
  }
};

const handleUpdateAvatar = () => {
  uni.showToast({ title: '移动端头像上传暂未开放', icon: 'none' });
};

const handleSave = async () => {
  if (!form.nickName.trim()) {
    await uni.showToast({ title: '请输入昵称', icon: 'none' });
    return;
  }
  try {
    await updateUserProfile(form);
    await showSuccess('更新成功');
    backOr(routes.profile);
  } catch (error) {
    await handlePageError(error, '更新失败');
  }
};

onShow(() => {
  void loadProfile();
});
</script>

<style lang="scss">
@import './index.scss';
</style>
