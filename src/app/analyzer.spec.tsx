import { fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DocumentAnalyzer } from './app';
import Script from './components/script';
import { VideoAnalyzerEngine } from './components/video-analyzer';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('DocumentAnalyzer', () => {
  it.each([
    ['centered', [{ x: 40, y: 45, width: 120, height: 110 }, { x: 5, y: 5, width: 160, height: 190 }], true],
    ['off center', [{ x: 15, y: 5, width: 160, height: 60 }], false],
    ['no contours', [], false],
  ])('processes a %s synthetic frame and cleans matrices', async (_label, rectangles, expected) => {
    const deleteMatrix = vi.fn();
    const Mat = class {
      cols = 200;
      rows = 200;
      delete = deleteMatrix;
    };
    const contours = rectangles.map((bounds) => ({ bounds, delete: vi.fn() }));
    const Vector = class {
      get(index: number) { return contours[index]; }
      size() { return contours.length; }
      delete = deleteMatrix;
    };
    const read = vi.fn();
    vi.stubGlobal('cv', {
      Mat,
      MatVector: Vector,
      VideoCapture: class { read = read; },
      cvtColor: vi.fn(),
      Canny: vi.fn(),
      findContours: vi.fn(),
      contourArea: ({ bounds }: typeof contours[number]) => bounds.width * bounds.height,
      boundingRect: ({ bounds }: typeof contours[number]) => bounds,
    });
    const context = { clearRect: vi.fn(), drawImage: vi.fn(), strokeRect: vi.fn() };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
    const overlay = document.createElement('div');
    const video = document.createElement('video');
    video.width = video.height = 200;

    await DocumentAnalyzer(video, overlay)();

    expect(read).toHaveBeenCalledOnce();
    expect(overlay.querySelector('canvas')).not.toBeNull();
    expect(deleteMatrix).toHaveBeenCalledTimes(4);
    expect(context.strokeRect).toHaveBeenCalledTimes(expected ? 1 : 0);
  });
});

it('stops the analysis loop without detaching the video', async () => {
  const video = document.createElement('video');
  const overlay = document.createElement('div');
  const frame = vi.fn();
  vi.stubGlobal('requestAnimationFrame', frame);
  const analyze = vi.fn();
  const engine = new VideoAnalyzerEngine(video, overlay);

  engine.analyzers = [() => analyze];
  await Promise.resolve();
  expect(analyze).toHaveBeenCalledOnce();
  expect(frame).toHaveBeenCalledOnce();

  engine.stop();
  frame.mock.calls[0][0]();
  expect(video.onplay).toBeNull();
  expect(analyze).toHaveBeenCalledOnce();
});

it('reports analysis script errors and can load the script again after unmounting', () => {
  const src = '/fixture-opencv.js';
  const completed = vi.fn();
  const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  const first = render(<Script src={src} onComplete={completed} />);
  const initialScript = document.querySelector(`script[src="${src}"]`);
  expect(initialScript).not.toBeNull();
  fireEvent.error(initialScript!);
  expect(log).toHaveBeenCalledWith(`Failed to load ${src}.`);
  expect(completed).not.toHaveBeenCalled();
  first.unmount();
  expect(document.querySelector(`script[src="${src}"]`)).toBeNull();

  const second = render(<Script src={src} onComplete={completed} />);
  const retriedScript = document.querySelector(`script[src="${src}"]`);
  expect(retriedScript).not.toBeNull();
  fireEvent.load(retriedScript!);
  expect(completed).toHaveBeenCalledOnce();
  second.unmount();
});
