import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from '@/pages/index';

describe('pages/home', () => {
  it('should render dashboard cards', () => {
    render(<HomePage />);
    expect(screen.getByText('首页')).toBeInTheDocument();
    expect(screen.getByText('用户数')).toBeInTheDocument();
  });
});
