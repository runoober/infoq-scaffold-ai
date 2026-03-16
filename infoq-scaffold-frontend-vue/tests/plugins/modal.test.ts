import modal from '@/plugins/modal';
import { ElLoading, ElMessage, ElMessageBox, ElNotification } from 'element-plus/es';

describe('plugins/modal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('dispatches message methods', () => {
    modal.msg('info');
    modal.msgError('error');
    modal.msgSuccess('success');
    modal.msgWarning('warning');

    expect((ElMessage as any).info).toHaveBeenCalledWith('info');
    expect((ElMessage as any).error).toHaveBeenCalledWith('error');
    expect((ElMessage as any).success).toHaveBeenCalledWith('success');
    expect((ElMessage as any).warning).toHaveBeenCalledWith('warning');
  });

  it('dispatches alert, notification, confirm and prompt', async () => {
    modal.alert('alert');
    modal.alertError('alert-error');
    modal.alertSuccess('alert-success');
    modal.alertWarning('alert-warning');

    modal.notify('notify');
    modal.notifyError('notify-error');
    modal.notifySuccess('notify-success');
    modal.notifyWarning('notify-warning');

    await modal.confirm('confirm');
    await modal.prompt('prompt');

    expect((ElMessageBox as any).alert).toHaveBeenCalledTimes(4);
    expect((ElNotification as any).info).toHaveBeenCalledWith('notify');
    expect((ElNotification as any).error).toHaveBeenCalledWith('notify-error');
    expect((ElNotification as any).success).toHaveBeenCalledWith('notify-success');
    expect((ElNotification as any).warning).toHaveBeenCalledWith('notify-warning');
    expect((ElMessageBox as any).confirm).toHaveBeenCalledWith('confirm', '系统提示', expect.objectContaining({ type: 'warning' }));
    expect((ElMessageBox as any).prompt).toHaveBeenCalledWith('prompt', '系统提示', expect.objectContaining({ type: 'warning' }));
  });

  it('opens and closes loading overlay', () => {
    const close = vi.fn();
    vi.mocked(ElLoading.service as any).mockReturnValueOnce({ close });

    modal.loading('处理中');
    modal.closeLoading();

    expect((ElLoading as any).service).toHaveBeenCalledWith(
      expect.objectContaining({
        lock: true,
        text: '处理中'
      })
    );
    expect(close).toHaveBeenCalled();
  });
});
