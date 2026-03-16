import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

vi.mock('@/api/system/oss', () => ({
  listByIds: vi.fn().mockResolvedValue({
    data: [
      {
        ossId: '1',
        originalName: 'demo.txt',
        url: 'https://cdn.example.com/demo.txt'
      }
    ]
  }),
  delOss: vi.fn().mockResolvedValue(undefined)
}));

const { default: FileUpload } = await import('@/components/FileUpload');
const { default: ImageUpload } = await import('@/components/ImageUpload');
const { default: Editor } = await import('@/components/Editor');
const { listByIds } = await import('@/api/system/oss');

describe('components/upload-editor', () => {
  it('renders FileUpload and hydrates files', async () => {
    render(<FileUpload value="1" />);

    expect(screen.getByText('选取文件')).toBeInTheDocument();
    expect(screen.getByText(/请上传大小不超过/)).toBeInTheDocument();
    await waitFor(() => {
      expect(listByIds).toHaveBeenCalledWith('1');
    });
  });

  it('renders ImageUpload tips', () => {
    render(<ImageUpload fileSize={2} fileType={['png']} />);
    expect(screen.getByText(/请上传大小不超过/)).toBeInTheDocument();
    expect(screen.getByText('2MB')).toBeInTheDocument();
    expect(screen.getByText('png')).toBeInTheDocument();
  });

  it('updates editor content', () => {
    const onChange = vi.fn();
    render(<Editor value="" onChange={onChange} />);

    fireEvent.change(screen.getByRole('textbox'), {
      target: {
        value: '<p>hello</p>'
      }
    });

    expect(onChange).toHaveBeenCalledWith('<p>hello</p>');
  });
});
