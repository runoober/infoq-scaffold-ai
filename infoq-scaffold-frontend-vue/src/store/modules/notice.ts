import { defineStore } from 'pinia';
import { reactive } from 'vue';

export interface NoticeItem {
  title?: string;
  read: boolean;
  message: string;
  time: string;
}

export const useNoticeStore = defineStore('notice', () => {
  const state = reactive({
    notices: [] as NoticeItem[]
  });

  const addNotice = (notice: NoticeItem) => {
    state.notices.push(notice);
  };

  const removeNotice = (notice: NoticeItem) => {
    state.notices.splice(state.notices.indexOf(notice), 1);
  };

  //实现全部已读
  const readAll = () => {
    state.notices.forEach((item: NoticeItem) => {
      item.read = true;
    });
  };

  const clearNotice = () => {
    state.notices = [];
  };
  return {
    state,
    addNotice,
    removeNotice,
    readAll,
    clearNotice
  };
});
