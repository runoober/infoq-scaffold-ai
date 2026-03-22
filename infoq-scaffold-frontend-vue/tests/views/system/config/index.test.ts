import { flushPromises, mount } from '@vue/test-utils';
import { computed, defineComponent, h, inject, provide, reactive } from 'vue';
import ConfigView from '@/views/system/config/index.vue';

const configMocks = vi.hoisted(() => ({
  listConfig: vi.fn(),
  getConfig: vi.fn(),
  addConfig: vi.fn(),
  updateConfig: vi.fn(),
  delConfig: vi.fn(),
  refreshCache: vi.fn(),
  modalConfirm: vi.fn(() => Promise.resolve()),
  msgSuccess: vi.fn(),
  download: vi.fn(),
  rows: [
    {
      configId: 1,
      configName: '系统主题',
      configKey: 'sys.theme',
      configValue: 'light',
      configType: 'N',
      remark: '主题配置',
      createTime: '2026-03-07 10:00:00'
    }
  ] as Array<Record<string, any>>
}));

vi.mock('@/api/system/config', () => ({
  listConfig: configMocks.listConfig,
  getConfig: configMocks.getConfig,
  addConfig: configMocks.addConfig,
  updateConfig: configMocks.updateConfig,
  delConfig: configMocks.delConfig,
  refreshCache: configMocks.refreshCache
}));

const TABLE_DATA_SYMBOL = Symbol('config-table-data');

const ElCardStub = defineComponent({
  name: 'ElCard',
  setup(_, { slots }) {
    return () => h('div', { class: 'el-card-stub' }, [slots.header?.(), slots.default?.()]);
  }
});

const ElDialogStub = defineComponent({
  name: 'ElDialog',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: ''
    }
  },
  emits: ['update:modelValue'],
  setup(props, { slots }) {
    return () =>
      props.modelValue ? h('div', { class: 'el-dialog-stub', 'data-title': props.title }, [slots.default?.(), slots.footer?.()]) : h('div');
  }
});

const ElFormStub = defineComponent({
  name: 'ElForm',
  setup(_, { slots, expose }) {
    expose({
      resetFields: vi.fn(),
      validate: (cb: (valid: boolean) => void) => cb(true)
    });
    return () => h('form', { class: 'el-form-stub' }, slots.default?.());
  }
});

const ElTableStub = defineComponent({
  name: 'ElTable',
  props: {
    data: {
      type: Array,
      default: () => []
    }
  },
  emits: ['selection-change'],
  setup(props, { slots, emit }) {
    provide(
      TABLE_DATA_SYMBOL,
      computed(() => props.data as any[])
    );
    return () =>
      h('div', { class: 'el-table-stub' }, [
        h(
          'button',
          {
            class: 'selection-first',
            onClick: () => emit('selection-change', [(props.data as any[])[0]])
          },
          'selection-first'
        ),
        slots.default?.()
      ]);
  }
});

const ElTableColumnStub = defineComponent({
  name: 'ElTableColumn',
  setup(_, { slots }) {
    const rows = inject(
      TABLE_DATA_SYMBOL,
      computed(() => [] as any[])
    );
    return () =>
      h('div', { class: 'el-table-column-stub' }, (slots.default && slots.default({ row: rows.value[0] || { createTime: '' }, $index: 0 })) || []);
  }
});

const ElButtonStub = defineComponent({
  name: 'ElButton',
  props: {
    icon: {
      type: String,
      default: ''
    }
  },
  emits: ['click'],
  setup(props, { slots, emit }) {
    return () =>
      h(
        'button',
        {
          class: 'el-button-stub',
          'data-icon': props.icon,
          onClick: (e: MouseEvent) => emit('click', e)
        },
        slots.default?.()
      );
  }
});

const passthroughStub = (name: string) =>
  defineComponent({
    name,
    setup(_, { slots }) {
      return () => h('div', slots.default?.());
    }
  });

describe('views/system/config/index', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    configMocks.rows = [
      {
        configId: 1,
        configName: '系统主题',
        configKey: 'sys.theme',
        configValue: 'light',
        configType: 'N',
        remark: '主题配置',
        createTime: '2026-03-07 10:00:00'
      }
    ];
    configMocks.listConfig.mockImplementation(() =>
      Promise.resolve({
        rows: configMocks.rows,
        total: configMocks.rows.length
      })
    );
    configMocks.getConfig.mockResolvedValue({
      data: {
        configId: 1,
        configName: '系统主题',
        configKey: 'sys.theme',
        configValue: 'light',
        configType: 'N',
        remark: '主题配置'
      }
    });
    configMocks.addConfig.mockResolvedValue(undefined);
    configMocks.updateConfig.mockResolvedValue(undefined);
    configMocks.delConfig.mockResolvedValue(undefined);
    configMocks.refreshCache.mockResolvedValue(undefined);
  });

  const mountView = () =>
    mount(ConfigView, {
      global: {
        config: {
          globalProperties: {
            useDict: () =>
              reactive({
                sys_yes_no: [
                  { label: '是', value: 'Y' },
                  { label: '否', value: 'N' }
                ]
              }),
            animate: {
              searchAnimate: {
                enter: '',
                leave: ''
              }
            },
            addDateRange: (query: Record<string, any>, range: unknown[]) => ({ ...query, range }),
            parseTime: (value: string) => value,
            $modal: {
              confirm: configMocks.modalConfirm,
              msgSuccess: configMocks.msgSuccess
            },
            download: configMocks.download
          } as any
        },
        directives: {
          loading: {},
          hasPermi: {}
        },
        stubs: {
          transition: passthroughStub('Transition'),
          'el-row': passthroughStub('ElRow'),
          'el-col': passthroughStub('ElCol'),
          'el-card': ElCardStub,
          'el-form': ElFormStub,
          'el-form-item': passthroughStub('ElFormItem'),
          'el-input': true,
          'el-select': passthroughStub('ElSelect'),
          'el-option': passthroughStub('ElOption'),
          'el-date-picker': true,
          'right-toolbar': true,
          'el-table': ElTableStub,
          'el-table-column': ElTableColumnStub,
          'dict-tag': true,
          pagination: true,
          'el-tooltip': passthroughStub('ElTooltip'),
          'el-dialog': ElDialogStub,
          'el-radio-group': passthroughStub('ElRadioGroup'),
          'el-radio': passthroughStub('ElRadio'),
          'el-button': ElButtonStub
        }
      }
    });

  it('loads config list on mounted', async () => {
    mountView();
    await flushPromises();

    expect(configMocks.listConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        pageNum: 1,
        pageSize: 10
      })
    );
  });

  it('adds config successfully', async () => {
    const wrapper = mountView();
    await flushPromises();

    const addButton = wrapper.findAll('button.el-button-stub').find((button) => button.text().trim() === '新增');
    expect(addButton).toBeDefined();
    await addButton!.trigger('click');
    await flushPromises();

    const submitButton = wrapper.findAll('button.el-button-stub').find((button) => button.text().replace(/\s/g, '') === '确定');
    expect(submitButton).toBeDefined();
    await submitButton!.trigger('click');
    await flushPromises();

    expect(configMocks.addConfig).toHaveBeenCalledTimes(1);
    expect(configMocks.msgSuccess).toHaveBeenCalledWith('操作成功');
  });

  it('updates config successfully', async () => {
    const wrapper = mountView();
    await flushPromises();

    const editButton = wrapper
      .findAll('button.el-button-stub')
      .find((button) => button.attributes('data-icon') === 'Edit' && button.text().trim() === '');
    expect(editButton).toBeDefined();
    await editButton!.trigger('click');
    await flushPromises();

    expect(configMocks.getConfig).toHaveBeenCalledWith(1);

    const submitButton = wrapper.findAll('button.el-button-stub').find((button) => button.text().replace(/\s/g, '') === '确定');
    expect(submitButton).toBeDefined();
    await submitButton!.trigger('click');
    await flushPromises();

    expect(configMocks.updateConfig).toHaveBeenCalledTimes(1);
    expect(configMocks.msgSuccess).toHaveBeenCalledWith('操作成功');
  });

  it('deletes config by selected rows', async () => {
    const wrapper = mountView();
    await flushPromises();

    await wrapper.find('button.selection-first').trigger('click');

    const deleteButton = wrapper
      .findAll('button.el-button-stub')
      .find((button) => button.attributes('data-icon') === 'Delete' && button.text().replace(/\s/g, '') === '删除');
    expect(deleteButton).toBeDefined();
    await deleteButton!.trigger('click');
    await flushPromises();

    expect(configMocks.delConfig).toHaveBeenCalledWith([1]);
    expect(configMocks.msgSuccess).toHaveBeenCalledWith('删除成功');
  });

  it('exports and refreshes cache', async () => {
    const wrapper = mountView();
    await flushPromises();

    const exportButton = wrapper.findAll('button.el-button-stub').find((button) => button.text().trim() === '导出');
    expect(exportButton).toBeDefined();
    await exportButton!.trigger('click');
    expect(configMocks.download).toHaveBeenCalledWith(
      'system/config/export',
      expect.objectContaining({
        pageNum: 1,
        pageSize: 10
      }),
      expect.stringMatching(/^config_\d+\.xlsx$/)
    );

    const refreshButton = wrapper.findAll('button.el-button-stub').find((button) => button.text().trim() === '刷新缓存');
    expect(refreshButton).toBeDefined();
    await refreshButton!.trigger('click');
    await flushPromises();

    expect(configMocks.refreshCache).toHaveBeenCalledTimes(1);
    expect(configMocks.msgSuccess).toHaveBeenCalledWith('刷新缓存成功');
  });

  it('covers query/reset and cancel dialog branches', async () => {
    const wrapper = mountView();
    await flushPromises();

    const searchButton = wrapper.findAll('button.el-button-stub').find((button) => button.text().trim() === '搜索');
    const resetButton = wrapper.findAll('button.el-button-stub').find((button) => button.text().trim() === '重置');
    expect(searchButton).toBeDefined();
    expect(resetButton).toBeDefined();

    await searchButton!.trigger('click');
    await flushPromises();
    await resetButton!.trigger('click');
    await flushPromises();
    expect(configMocks.listConfig).toHaveBeenCalledTimes(3);

    const addButton = wrapper.findAll('button.el-button-stub').find((button) => button.text().trim() === '新增');
    expect(addButton).toBeDefined();
    await addButton!.trigger('click');
    await flushPromises();

    const cancelButton = wrapper
      .find('.el-dialog-stub[data-title="添加参数"]')
      .findAll('button.el-button-stub')
      .find((button) => button.text().replace(/\s/g, '') === '取消');
    expect(cancelButton).toBeDefined();
    await cancelButton!.trigger('click');
    await flushPromises();
  });
});
