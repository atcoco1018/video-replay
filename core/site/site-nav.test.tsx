import { cleanup, render, screen } from '@testing-library/react';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { SiteNav } from './site-nav';

const mocks = vi.hoisted(() => ({ pathname: '/' }));
vi.mock('next/navigation', () => ({ usePathname: () => mocks.pathname }));

afterEach(cleanup);

const current = () =>
  screen
    .getAllByRole('link')
    .filter(link => link.getAttribute('aria-current') === 'page')
    .map(link => link.textContent);

describe('SiteNav', () => {
  it.each([
    ['/', ['Debates']],
    ['/debate/abc', ['Debates']],
    ['/explore', ['Explore']],
    ['/explore/topic/work', ['Explore']],
    ['/elsewhere', []],
  ])('marks the current section on %s', (pathname, expected) => {
    mocks.pathname = pathname;
    render(<SiteNav />);
    expect(current()).toEqual(expected);
  });
});
