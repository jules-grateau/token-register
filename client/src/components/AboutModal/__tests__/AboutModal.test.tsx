import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import AboutModal from '../index';
import { render } from '../../../utils/testUtils';
import { getAppVersionInfo } from '../../../config/version';
import type { AppVersionInfo } from '../../../config/version';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { version?: string }) =>
      opts && opts.version ? `${key} ${opts.version}` : key,
  }),
}));

jest.mock('../../../config/version', () => ({
  ...jest.requireActual<object>('../../../config/version'),
  getAppVersionInfo: jest.fn(),
}));

const mockInfo = (info: AppVersionInfo) => (getAppVersionInfo as jest.Mock).mockReturnValue(info);

describe('AboutModal', () => {
  it('shows the version only in production', () => {
    mockInfo({ version: '1.2.0', channel: 'production' });
    render(<AboutModal isOpen={true} onClose={jest.fn()} />);

    expect(screen.getByText('Token Register')).toBeInTheDocument();
    expect(screen.getByText('about.version 1.2.0')).toBeInTheDocument();
    expect(screen.queryByText('about.env.demo')).not.toBeInTheDocument();
    expect(screen.queryByText('about.env.dev')).not.toBeInTheDocument();
    expect(screen.queryByText('about.commit')).not.toBeInTheDocument();
  });

  it('shows the demo badge and the commit in demo', () => {
    mockInfo({ version: '1.2.0', commit: 'abc1234', channel: 'demo' });
    render(<AboutModal isOpen={true} onClose={jest.fn()} />);

    expect(screen.getByText('about.env.demo')).toBeInTheDocument();
    expect(screen.getByText('about.commit')).toBeInTheDocument();
    expect(screen.getByText('abc1234')).toBeInTheDocument();
  });

  it('shows the development badge and hides a missing commit', () => {
    mockInfo({ version: '1.2.0', channel: 'development' });
    render(<AboutModal isOpen={true} onClose={jest.fn()} />);

    expect(screen.getByText('about.env.dev')).toBeInTheDocument();
    expect(screen.queryByText('about.commit')).not.toBeInTheDocument();
    expect(screen.queryByText(/undefined/)).not.toBeInTheDocument();
  });

  it('only offers the close button as action', () => {
    mockInfo({ version: '1.0.0', commit: 'abc1234', channel: 'demo' });
    render(<AboutModal isOpen={true} onClose={jest.fn()} />);

    expect(screen.queryByText('about.copy')).not.toBeInTheDocument();
    expect(screen.queryByText('about.copied')).not.toBeInTheDocument();
    expect(screen.getByText('close')).toBeInTheDocument();
  });

  it('calls onClose from the close button', () => {
    mockInfo({ version: '1.0.0', channel: 'production' });
    const onClose = jest.fn();
    render(<AboutModal isOpen={true} onClose={onClose} />);

    fireEvent.click(screen.getByText('close'));

    expect(onClose).toHaveBeenCalled();
  });
});
