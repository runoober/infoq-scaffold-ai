import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithRouter } from '../helpers/renderWithRouter';

const dictOptions = vi.hoisted(() => ({
  sys_yes_no: [
    { label: '是', value: 'Y' },
    { label: '否', value: 'N' }
  ],
  sys_notice_status: [
    { label: '正常', value: '0' },
    { label: '关闭', value: '1' }
  ],
  sys_notice_type: [
    { label: '通知', value: '1' },
    { label: '公告', value: '2' }
  ],
  sys_normal_disable: [
    { label: '正常', value: '0' },
    { label: '停用', value: '1' }
  ],
  sys_grant_type: [
    { label: '密码模式', value: 'password' },
    { label: '短信模式', value: 'sms' }
  ],
  sys_device_type: [{ label: 'PC', value: 'pc' }]
}));

vi.mock('@/hooks/useDictOptions', () => ({
  default: (...types: string[]) => Object.fromEntries(types.map((type) => [type, dictOptions[type as keyof typeof dictOptions] || []]))
}));

vi.mock('@/components/Pagination', () => ({
  default: () => <div data-testid="pagination" />
}));

vi.mock('@/components/RightToolbar', () => ({
  default: () => <div data-testid="right-toolbar" />
}));

vi.mock('@/components/DictTag', () => ({
  default: ({
    options = [],
    value
  }: {
    options?: Array<{ label: string; value: string | number }>;
    value?: string | number | Array<string | number>;
  }) => {
    const values = Array.isArray(value) ? value.map(String) : value !== undefined ? [String(value)] : [];
    const text = values.map((item) => options.find((option) => String(option.value) === item)?.label || item).join(',');
    return <span>{text}</span>;
  }
}));

vi.mock('@/components/FileUpload', () => ({
  default: () => <div>文件上传控件</div>
}));

vi.mock('@/components/ImageUpload', () => ({
  default: () => <div>图片上传控件</div>
}));

vi.mock('@/utils/modal', () => ({
  default: {
    confirm: vi.fn().mockResolvedValue(true),
    msgSuccess: vi.fn(),
    msgWarning: vi.fn(),
    msgError: vi.fn(),
    loading: vi.fn(),
    closeLoading: vi.fn()
  }
}));

vi.mock('@/api/system/config', () => ({
  listConfig: vi.fn().mockResolvedValue({
    rows: [{ configId: 1, configName: '系统皮肤', configKey: 'sys.index.skinName', configValue: 'blue', configType: 'Y' }],
    total: 1
  }),
  addConfig: vi.fn(),
  delConfig: vi.fn(),
  getConfig: vi.fn(),
  refreshCache: vi.fn(),
  updateConfig: vi.fn()
}));

vi.mock('@/api/system/notice', () => ({
  listNotice: vi.fn().mockResolvedValue({
    rows: [{ noticeId: 1, noticeTitle: '系统公告', noticeType: '2', status: '0', createByName: 'admin' }],
    total: 1
  }),
  addNotice: vi.fn(),
  delNotice: vi.fn(),
  getNotice: vi.fn(),
  updateNotice: vi.fn()
}));

vi.mock('@/api/system/client', () => ({
  listClient: vi.fn().mockResolvedValue({
    rows: [{ id: 1, clientId: 'pc-web', clientKey: 'pc-web', clientSecret: 'secret', grantTypeList: ['password'], deviceType: 'pc', status: '0' }],
    total: 1
  }),
  addClient: vi.fn(),
  changeStatus: vi.fn(),
  delClient: vi.fn(),
  getClient: vi.fn(),
  updateClient: vi.fn()
}));

vi.mock('@/api/system/dict/type', () => ({
  listType: vi.fn().mockResolvedValue({
    rows: [{ dictId: 1, dictName: '用户状态', dictType: 'sys_user_status', remark: '用户状态字典' }],
    total: 1
  }),
  optionselect: vi.fn().mockResolvedValue({
    data: [{ dictId: 1, dictName: '用户状态', dictType: 'sys_user_status' }]
  }),
  getType: vi.fn().mockResolvedValue({
    data: { dictId: 1, dictName: '用户状态', dictType: 'sys_user_status' }
  }),
  addType: vi.fn(),
  delType: vi.fn(),
  refreshCache: vi.fn(),
  updateType: vi.fn()
}));

vi.mock('@/api/system/dict/data', () => ({
  listData: vi.fn().mockResolvedValue({
    rows: [{ dictCode: 1, dictType: 'sys_user_status', dictLabel: '正常', dictValue: '0', listClass: 'success', cssClass: '' }],
    total: 1
  }),
  getDicts: vi.fn().mockResolvedValue({ data: [] }),
  addData: vi.fn(),
  delData: vi.fn(),
  getData: vi.fn(),
  updateData: vi.fn()
}));

vi.mock('@/api/system/oss', () => ({
  listOss: vi.fn().mockResolvedValue({
    rows: [{ ossId: 1, fileName: 'avatar.png', originalName: 'avatar.png', fileSuffix: '.png', service: 'minio', url: 'https://cdn.example.com/avatar.png' }],
    total: 1
  }),
  delOss: vi.fn()
}));

vi.mock('@/api/system/ossConfig', () => ({
  listOssConfig: vi.fn().mockResolvedValue({
    rows: [{ ossConfigId: 1, configKey: 'minio', endpoint: '127.0.0.1', domain: 'cdn.example.com', bucketName: 'avatar', status: '0' }],
    total: 1
  }),
  addOssConfig: vi.fn(),
  changeOssConfigStatus: vi.fn(),
  delOssConfig: vi.fn(),
  getOssConfig: vi.fn(),
  updateOssConfig: vi.fn()
}));

const { default: ConfigPage } = await import('@/pages/system/config/index');
const { default: NoticePage } = await import('@/pages/system/notice/index');
const { default: ClientPage } = await import('@/pages/system/client/index');
const { default: DictTypePage } = await import('@/pages/system/dict/index');
const { default: DictDataPage } = await import('@/pages/system/dict/data');
const { default: OssPage } = await import('@/pages/system/oss/index');
const { default: OssConfigPage } = await import('@/pages/system/oss/config');
const configApi = await import('@/api/system/config');
const noticeApi = await import('@/api/system/notice');
const clientApi = await import('@/api/system/client');
const dictTypeApi = await import('@/api/system/dict/type');
const dictDataApi = await import('@/api/system/dict/data');
const ossApi = await import('@/api/system/oss');
const ossConfigApi = await import('@/api/system/ossConfig');

beforeEach(() => {
  vi.mocked(configApi.listConfig).mockResolvedValue({
    rows: [{ configId: 1, configName: '系统皮肤', configKey: 'sys.index.skinName', configValue: 'blue', configType: 'Y' }],
    total: 1
  });
  vi.mocked(noticeApi.listNotice).mockResolvedValue({
    rows: [{ noticeId: 1, noticeTitle: '系统公告', noticeType: '2', status: '0', createByName: 'admin' }],
    total: 1
  });
  vi.mocked(clientApi.listClient).mockResolvedValue({
    rows: [{ id: 1, clientId: 'pc-web', clientKey: 'pc-web', clientSecret: 'secret', grantTypeList: ['password'], deviceType: 'pc', status: '0' }],
    total: 1
  });
  vi.mocked(dictTypeApi.listType).mockResolvedValue({
    rows: [{ dictId: 1, dictName: '用户状态', dictType: 'sys_user_status', remark: '用户状态字典' }],
    total: 1
  });
  vi.mocked(dictTypeApi.optionselect).mockResolvedValue({
    data: [{ dictId: 1, dictName: '用户状态', dictType: 'sys_user_status' }]
  });
  vi.mocked(dictTypeApi.getType).mockResolvedValue({
    data: { dictId: 1, dictName: '用户状态', dictType: 'sys_user_status' }
  });
  vi.mocked(dictDataApi.listData).mockResolvedValue({
    rows: [{ dictCode: 1, dictType: 'sys_user_status', dictLabel: '正常', dictValue: '0', listClass: 'success', cssClass: '' }],
    total: 1
  });
  vi.mocked(ossApi.listOss).mockResolvedValue({
    rows: [{ ossId: 1, fileName: 'avatar.png', originalName: 'avatar.png', fileSuffix: '.png', service: 'minio', url: 'https://cdn.example.com/avatar.png' }],
    total: 1
  });
  vi.mocked(ossConfigApi.listOssConfig).mockResolvedValue({
    rows: [{ ossConfigId: 1, configKey: 'minio', endpoint: '127.0.0.1', domain: 'cdn.example.com', bucketName: 'avatar', status: '0' }],
    total: 1
  });
});

describe('pages/ops', () => {
  it('renders the config page with list data', async () => {
    renderWithRouter(<ConfigPage />, '/system/config');

    expect(await screen.findByText('参数配置')).toBeInTheDocument();
    await waitFor(() => {
      expect(configApi.listConfig).toHaveBeenCalled();
    });
  });

  it('renders the notice page with list data', async () => {
    renderWithRouter(<NoticePage />, '/system/notice');

    expect(await screen.findByText('公告管理')).toBeInTheDocument();
    await waitFor(() => {
      expect(noticeApi.listNotice).toHaveBeenCalled();
    });
  });

  it('renders the client page with list data', async () => {
    renderWithRouter(<ClientPage />, '/system/client');

    expect(await screen.findByText('客户端管理')).toBeInTheDocument();
    await waitFor(() => {
      expect(clientApi.listClient).toHaveBeenCalled();
    });
  });

  it('renders the dict type page with list data', async () => {
    renderWithRouter(<DictTypePage />, '/system/dict');

    expect(screen.getByText('字典名称')).toBeInTheDocument();
    await waitFor(() => {
      expect(dictTypeApi.listType).toHaveBeenCalled();
    });
  });

  it('renders the dict data page with the selected dict type', async () => {
    renderWithRouter(<DictDataPage />, '/system/dict-data/index/1');

    expect(screen.getByText('字典数据')).toBeInTheDocument();
    await waitFor(() => {
      expect(dictTypeApi.getType).toHaveBeenCalledWith('1');
      expect(dictDataApi.listData).toHaveBeenCalled();
    });
  });

  it('renders the oss page with list data', async () => {
    renderWithRouter(<OssPage />, '/system/oss');

    expect(await screen.findByText('对象存储')).toBeInTheDocument();
    await waitFor(() => {
      expect(ossApi.listOss).toHaveBeenCalled();
    });
  });

  it('renders the oss config page with list data', async () => {
    renderWithRouter(<OssConfigPage />, '/system/oss-config/index');

    expect(await screen.findByText('OSS配置')).toBeInTheDocument();
    await waitFor(() => {
      expect(ossConfigApi.listOssConfig).toHaveBeenCalled();
    });
  });
});
