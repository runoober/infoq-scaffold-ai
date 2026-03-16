import { useEffect, useMemo, useState } from 'react';
import { Image, Upload } from 'antd';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { PlusOutlined } from '@ant-design/icons';
import { delOss, listByIds } from '@/api/system/oss';
import { globalHeaders } from '@/utils/request';
import modal from '@/utils/modal';

type ImageUploadValue = string | UploadFile[];

type ImageUploadProps = {
  value?: ImageUploadValue;
  limit?: number;
  fileSize?: number;
  fileType?: string[];
  showTip?: boolean;
  onChange?: (value: string) => void;
};

type UploadImageWithOss = UploadFile & {
  ossId?: string | number;
};

const toValueString = (list: UploadImageWithOss[]) =>
  list
    .filter((item) => item.ossId)
    .map((item) => item.ossId)
    .join(',');

export default function ImageUpload({
  value,
  limit = 5,
  fileSize = 5,
  fileType = ['png', 'jpg', 'jpeg'],
  showTip = true,
  onChange
}: ImageUploadProps) {
  const [fileList, setFileList] = useState<UploadImageWithOss[]>([]);
  const [preview, setPreview] = useState('');

  const accept = useMemo(() => fileType.map((type) => `.${type}`).join(','), [fileType]);

  useEffect(() => {
    if (!value) {
      setFileList([]);
      return;
    }

    const hydrate = async () => {
      if (Array.isArray(value)) {
        setFileList(value as UploadImageWithOss[]);
        return;
      }
      let res:
        | {
            data?: Array<{ ossId: string | number; url: string }>;
          }
        | undefined;
      try {
        res = (await listByIds(value)) as unknown as {
          data?: Array<{ ossId: string | number; url: string }>;
        };
      } catch {
        res = undefined;
      }
      const next = (res?.data || []).map((item) => ({
        uid: String(item.ossId),
        name: String(item.ossId),
        status: 'done' as const,
        url: item.url,
        ossId: item.ossId
      }));
      setFileList(next);
    };

    hydrate();
  }, [value]);

  const uploadProps: UploadProps = {
    name: 'file',
    listType: 'picture-card',
    multiple: true,
    action: `${import.meta.env.VITE_APP_BASE_API}/resource/oss/upload`,
    headers: globalHeaders(),
    accept,
    fileList,
    beforeUpload(file) {
      const fileExt = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.') + 1).toLowerCase() : '';
      const isImg = fileType.includes(fileExt) || file.type.startsWith('image/');
      if (!isImg) {
        modal.msgError(`文件格式不正确，请上传 ${fileType.join('/')} 图片格式文件`);
        return Upload.LIST_IGNORE;
      }
      if (file.name.includes(',')) {
        modal.msgError('文件名不能包含英文逗号');
        return Upload.LIST_IGNORE;
      }
      const sizeOk = file.size / 1024 / 1024 < fileSize;
      if (!sizeOk) {
        modal.msgError(`上传图片大小不能超过 ${fileSize}MB`);
        return Upload.LIST_IGNORE;
      }
      modal.loading('正在上传图片，请稍候...');
      return true;
    },
    onChange(info) {
      let next = info.fileList as UploadImageWithOss[];

      if (info.file.status === 'done') {
        const resp = info.file.response as { code?: number; data?: { ossId?: string | number; fileName?: string; url?: string }; msg?: string };
        if (resp?.code === 200 && resp.data) {
          next = next.map((item) => {
            if (item.uid !== info.file.uid) {
              return item;
            }
            return {
              ...item,
              name: resp.data.fileName || item.name,
              url: resp.data.url || item.url,
              ossId: resp.data.ossId
            };
          });
          modal.closeLoading();
        } else {
          modal.closeLoading();
          modal.msgError(resp?.msg || '上传图片失败');
          next = next.filter((item) => item.uid !== info.file.uid);
        }
      }

      if (info.file.status === 'error') {
        modal.closeLoading();
        modal.msgError('上传图片失败');
      }

      setFileList(next);
      onChange?.(toValueString(next));
    },
    async onRemove(file) {
      const ossId = (file as UploadImageWithOss).ossId;
      if (ossId) {
        await delOss(ossId);
      }
      const next = fileList.filter((item) => item.uid !== file.uid);
      setFileList(next);
      onChange?.(toValueString(next));
      return true;
    },
    onPreview(file) {
      if (file.url) {
        setPreview(file.url);
      }
    }
  };

  return (
    <div>
      <Upload {...uploadProps}>{fileList.length >= limit ? null : <PlusOutlined />}</Upload>
      {preview && <Image src={preview} style={{ display: 'none' }} preview={{ visible: true, src: preview, onVisibleChange: (v) => !v && setPreview('') }} />}
      {showTip && (
        <div style={{ color: 'rgba(0, 0, 0, 0.45)', marginTop: 6 }}>
          请上传大小不超过 <b style={{ color: '#ff4d4f' }}>{fileSize}MB</b>，格式为 <b style={{ color: '#ff4d4f' }}>{fileType.join('/')}</b> 的图片
        </div>
      )}
    </div>
  );
}
