import { render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import App from './app';

describe('App', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('requests the rear camera and attaches its stream to the preview', async () => {
    const stream = {};
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    vi.stubGlobal('navigator', {
      userAgent: navigator.userAgent,
      mediaDevices: { getUserMedia },
    });

    const { container } = render(<App />);
    const preview = container.querySelector('video');

    expect(preview).not.toBeNull();
    expect(getUserMedia).toHaveBeenCalledWith({
      video: expect.objectContaining({ facingMode: 'environment' }),
    });
    await waitFor(() => expect(preview?.srcObject).toBe(stream));
  });
});

it('logs a denied camera request without breaking the preview', async () => {
  const error = new DOMException('Fixture camera denied', 'NotAllowedError');
  const report = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.stubGlobal('navigator', {
    userAgent: navigator.userAgent,
    mediaDevices: { getUserMedia: vi.fn().mockRejectedValue(error) },
  });

  try {
    const { container } = render(<App />);
    expect(container.querySelector('video')).not.toBeNull();
    await waitFor(() => expect(report).toHaveBeenCalledWith('Error accessing camera:', error));
  } finally {
    report.mockRestore();
    vi.unstubAllGlobals();
  }
});
