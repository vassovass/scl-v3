/**
 * ProfileSwitcher Component Tests
 *
 * Verifies proxy list rendering and profile switching callbacks.
 * Based on testing-patterns skill and PRD 42.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfileSwitcher } from '../ProfileSwitcher';

let authState: {
  user: { id: string; email: string | null } | null;
  activeProfile: { id: string; display_name: string } | null;
  isActingAsProxy: boolean;
  managedProxies: Array<{ id: string; display_name: string }>;
  switchProfile: (id: string | null) => void;
  proxiesLoading: boolean;
} = {
  user: null,
  activeProfile: null,
  isActingAsProxy: false,
  managedProxies: [],
  switchProfile: () => undefined,
  proxiesLoading: false,
};

vi.mock('@/components/providers/AuthProvider', () => ({
  useAuth: () => authState,
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children, ...props }: { children: React.ReactNode }) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
}));

describe('ProfileSwitcher', () => {
  it('returns null when no managed proxies exist', () => {
    authState = {
      user: { id: 'user-1', email: null },
      activeProfile: null,
      isActingAsProxy: false,
      managedProxies: [],
      switchProfile: vi.fn(),
      proxiesLoading: false,
    };

    const { container } = render(<ProfileSwitcher />);
    expect(container).toBeEmptyDOMElement();
  });

  it('invokes switchProfile for selected profiles', () => {
    const switchProfile = vi.fn();
    authState = {
      user: { id: 'user-1', email: null },
      activeProfile: null,
      isActingAsProxy: false,
      managedProxies: [
        { id: 'proxy-1', display_name: 'Proxy One' },
      ],
      switchProfile,
      proxiesLoading: false,
    };

    render(<ProfileSwitcher />);

    fireEvent.click(screen.getByText('My Account'));
    fireEvent.click(screen.getByText('Proxy One'));

    expect(switchProfile).toHaveBeenCalledWith(null);
    expect(switchProfile).toHaveBeenCalledWith('proxy-1');
  });
});

