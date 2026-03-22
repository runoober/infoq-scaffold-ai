import { useCallback, useEffect, useState } from 'react';
import { DeleteOutlined, DownloadOutlined, EditOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Col, DatePicker, Form, Input, Modal, Radio, Row, Select, Space, Table, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import useDictOptions from '@/hooks/useDictOptions';
import { addConfig, delConfig, getConfig, listConfig, refreshCache, updateConfig } from '@/api/system/config';
import type { ConfigForm, ConfigQuery, ConfigVO } from '@/api/system/config/types';
import Pagination from '@/components/Pagination';
import RightToolbar from '@/components/RightToolbar';
import DictTag from '@/components/DictTag';
import modal from '@/utils/modal';
import { addDateRange } from '@/utils/scaffold';
import { download } from '@/utils/request';

const initialQuery: ConfigQuery = {
  pageNum: 1,
  pageSize: 10,
  configName: '',
  configKey: '',
  configType: ''
};

const initialForm: ConfigForm = {
  configId: undefined,
  configName: '',
  configKey: '',
  configValue: '',
  configType: 'Y',
  remark: ''
};

const formatRange = (range: [Dayjs, Dayjs] | null) =>
  range ? [range[0].format('YYYY-MM-DD HH:mm:ss'), range[1].format('YYYY-MM-DD HH:mm:ss')] : [];

export default function ConfigPage() {
  const [query, setQuery] = useState<ConfigQuery>(initialQuery);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(true);
  const [list, setList] = useState<ConfigVO[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Array<string | number>>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<ConfigForm>();
  const configId = Form.useWatch('configId', form);
  const dict = useDictOptions('sys_yes_no');

  const loadList = useCallback(async (nextQuery: ConfigQuery, nextRange: [Dayjs, Dayjs] | null) => {
    setLoading(true);
    try {
      const response = await listConfig(addDateRange({ ...nextQuery }, formatRange(nextRange)));
      setList(response.rows);
      setTotal(response.total ?? response.rows.length);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadList(initialQuery, null);
  }, [loadList]);

  const columns: ColumnsType<ConfigVO> = [
    {
      title: '参数名称',
      dataIndex: 'configName',
      align: 'center',
      ellipsis: true
    },
    {
      title: '参数键名',
      dataIndex: 'configKey',
      align: 'center',
      ellipsis: true
    },
    {
      title: '参数键值',
      dataIndex: 'configValue',
      align: 'center',
      ellipsis: true
    },
    {
      title: '系统内置',
      dataIndex: 'configType',
      width: 120,
      align: 'center',
      render: (value: string) => <DictTag options={dict.sys_yes_no || []} value={value} />
    },
    {
      title: '备注',
      dataIndex: 'remark',
      align: 'center',
      ellipsis: true
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      width: 180,
      align: 'center'
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      align: 'center',
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="修改">
            <Button className="table-action-link" type="link" icon={<EditOutlined />} onClick={() => handleEdit(record.configId)} />
          </Tooltip>
          <Tooltip title="删除">
            <Button className="table-action-link" type="link" icon={<DeleteOutlined />} onClick={() => handleDelete(record.configId)} />
          </Tooltip>
        </Space>
      )
    }
  ];

  const handleSearch = () => {
    const next = { ...query, pageNum: 1 };
    setQuery(next);
    loadList(next, dateRange);
  };

  const handleReset = () => {
    setQuery(initialQuery);
    setDateRange(null);
    loadList(initialQuery, null);
  };

  const handleAdd = () => {
    form.setFieldsValue(initialForm);
    setDialogOpen(true);
  };

  const handleEdit = async (configId: string | number) => {
    const response = await getConfig(configId);
    form.setFieldsValue({ ...initialForm, ...response.data });
    setDialogOpen(true);
  };

  const handleDelete = async (configId?: string | number | Array<string | number>) => {
    const target = configId || selectedIds;
    if (!target || (Array.isArray(target) && target.length === 0)) {
      modal.msgWarning('请选择要删除的参数');
      return;
    }
    const confirmed = await modal.confirm(`是否确认删除参数编号为 "${Array.isArray(target) ? target.join(',') : target}" 的数据项？`);
    if (!confirmed) {
      return;
    }
    await delConfig(target);
    modal.msgSuccess('删除成功');
    setSelectedIds([]);
    loadList(query, dateRange);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      if (values.configId) {
        await updateConfig(values);
      } else {
        await addConfig(values);
      }
      modal.msgSuccess('操作成功');
      setDialogOpen(false);
      form.resetFields();
      loadList(query, dateRange);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Space orientation="vertical" size={12} style={{ width: '100%' }}>
      {showSearch && (
        <Card>
          <Form layout="inline" className="query-form">
            <Row gutter={16} style={{ width: '100%' }}>
              <Col xs={24} md={12} xl={6}>
                <Form.Item label="参数名称" style={{ width: '100%', marginBottom: 12 }}>
                  <Input
                    allowClear
                    placeholder="请输入参数名称"
                    value={query.configName}
                    onChange={(event) => setQuery((prev) => ({ ...prev, configName: event.target.value }))}
                    onPressEnter={handleSearch}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12} xl={6}>
                <Form.Item label="参数键名" style={{ width: '100%', marginBottom: 12 }}>
                  <Input
                    allowClear
                    placeholder="请输入参数键名"
                    value={query.configKey}
                    onChange={(event) => setQuery((prev) => ({ ...prev, configKey: event.target.value }))}
                    onPressEnter={handleSearch}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12} xl={6}>
                <Form.Item label="系统内置" style={{ width: '100%', marginBottom: 12 }}>
                  <Select
                    allowClear
                    style={{ width: '100%' }}
                    placeholder="系统内置"
                    value={query.configType || undefined}
                    options={(dict.sys_yes_no || []).map((item) => ({ label: item.label, value: item.value }))}
                    onChange={(value) => setQuery((prev) => ({ ...prev, configType: value || '' }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12} xl={6}>
                <Form.Item label="创建时间" style={{ width: '100%', marginBottom: 12 }}>
                  <DatePicker.RangePicker showTime style={{ width: '100%' }} value={dateRange} onChange={(value) => setDateRange((value as [Dayjs, Dayjs]) || null)} />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item style={{ marginBottom: 0 }}>
                  <Space>
                    <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                      搜索
                    </Button>
                    <Button icon={<ReloadOutlined />} onClick={handleReset}>
                      重置
                    </Button>
                  </Space>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>
      )}

      <Card>
        <div className="table-toolbar">
          <Space wrap className="toolbar-buttons">
            <Button className="btn-plain-primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增
            </Button>
            <Button className="btn-plain-success" icon={<EditOutlined />} onClick={() => handleEdit(selectedIds[0])} disabled={selectedIds.length !== 1}>
              修改
            </Button>
            <Button className="btn-plain-danger" icon={<DeleteOutlined />} onClick={() => handleDelete()} disabled={selectedIds.length === 0}>
              删除
            </Button>
            <Button
              className="btn-plain-warning"
              icon={<DownloadOutlined />}
              onClick={() =>
                download(
                  '/system/config/export',
                  addDateRange({ ...query }, formatRange(dateRange)),
                  `config_${Date.now()}.xlsx`
                )
              }
            >
              导出
            </Button>
            <Button
              className="btn-plain-danger"
              icon={<ReloadOutlined />}
              onClick={async () => {
                await refreshCache();
                modal.msgSuccess('刷新缓存成功');
              }}
            >
              刷新缓存
            </Button>
          </Space>
          <div className="right-toolbar-wrap">
            <RightToolbar showSearch={showSearch} onShowSearchChange={setShowSearch} onQueryTable={() => loadList(query, dateRange)} />
          </div>
        </div>

        <Table<ConfigVO>
          rowKey="configId"
          loading={loading}
          bordered
          columns={columns}
          dataSource={list}
          pagination={false}
          rowSelection={{
            selectedRowKeys: selectedIds,
            onChange: (keys) => setSelectedIds(keys as Array<string | number>)
          }}
        />

        <Pagination
          total={total}
          page={query.pageNum}
          limit={query.pageSize}
          onPageChange={({ page, limit }) => {
            const next = { ...query, pageNum: page, pageSize: limit };
            setQuery(next);
            loadList(next, dateRange);
          }}
        />
      </Card>

      <Modal
        open={dialogOpen}
        title={configId ? '修改参数' : '新增参数'}
        confirmLoading={submitting}
        onCancel={() => setDialogOpen(false)}
        onOk={handleSubmit}
      >
        <Form form={form} layout="vertical" initialValues={initialForm}>
          <Form.Item label="参数名称" name="configName" rules={[{ required: true, message: '参数名称不能为空' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="参数键名" name="configKey" rules={[{ required: true, message: '参数键名不能为空' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="参数键值" name="configValue" rules={[{ required: true, message: '参数键值不能为空' }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item label="系统内置" name="configType">
            <Radio.Group options={(dict.sys_yes_no || []).map((item) => ({ label: item.label, value: item.value }))} />
          </Form.Item>
          <Form.Item label="备注" name="remark">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
