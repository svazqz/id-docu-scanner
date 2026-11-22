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
