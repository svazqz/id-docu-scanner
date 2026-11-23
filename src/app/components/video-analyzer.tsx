import { useEffect, useRef, useState } from 'react';
import Camera from './camera';

export type VideoAnalyzerBuilder = (
  v: HTMLVideoElement | null,
  o?: HTMLDivElement | null
) => () => Promise<void> | void;

export class VideoAnalyzerEngine {
  private video: HTMLVideoElement | null = null;
  private overlay: HTMLDivElement | null = null;
  private _analyzers: ((v: HTMLVideoElement | null) => Promise<void> | void)[] =
    [];
  private stopped = false;
  private isProcessing = false;

  constructor(v: HTMLVideoElement | null, o: HTMLDivElement | null) {
    if (v !== null && o !== null) {
      this.video = v;
      this.overlay = o;
      this.video.onplay = () => {
        this.runAllAnalyzers();
      };
    }
  }

  set analyzers(analyzers: VideoAnalyzerBuilder[]) {
    if (this.video) {
      this._analyzers = analyzers.map((a) => a(this.video, this.overlay));
      this.runAllAnalyzers();
    }
  }

  async runAllAnalyzers() {
    if (this.stopped || this._analyzers.length === 0 || this.isProcessing) return;

    this.isProcessing = true;
    try {
      for (const analyzer of this._analyzers) {
        await analyzer(this.video);
        if (this.stopped) return;
      }
    } finally {
      this.isProcessing = false;
    }
    requestAnimationFrame(() => {
      void this.runAllAnalyzers();
    });
  }

  stop() {
    this.stopped = true;
    if (this.video) this.video.onplay = null;
  }

}

const isMobile =
  /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

export const VideoAnalyzer = ({
  analyzers,
  width = 1200,
  height = 675,
}: {
  analyzers: VideoAnalyzerBuilder[];
  width?: number;
  height?: number;
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const vWidth = isMobile ? height : width;
  const vHeight = isMobile ? width : height;

  const [videoAnalyzerEngine, setVideoAnalyzerEngine] = useState<
    VideoAnalyzerEngine | undefined
  >();

  useEffect(() => {
    if (videoRef.current && overlayRef.current) {
      const videoAnalyzerEngine = new VideoAnalyzerEngine(
        videoRef.current,
        overlayRef.current
      );
      setVideoAnalyzerEngine(videoAnalyzerEngine);
      return () => {
        videoAnalyzerEngine.stop();
      };
    }
  }, []);

  useEffect(() => {
    if (videoAnalyzerEngine) {
      videoAnalyzerEngine.analyzers = analyzers;
    }
  }, [analyzers, videoAnalyzerEngine]);

  return (
    <div
      ref={overlayRef}
      style={{
        width: `${vWidth}px`,
        height: `${vHeight}px`,
        position: 'absolute',
        top: 0,
        left: 0,
        transformOrigin: 'top left',
        overflow: 'hidden',
        border: '2px solid red',
        transform: 'scale(0.7)',
      }}
    >
      <Camera ref={videoRef} height={vHeight} width={vWidth} />
    </div>
  );
};
