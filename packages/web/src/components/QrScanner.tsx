import { BarcodeDetector, prepareZXingModule } from 'barcode-detector/ponyfill';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import wasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url';
import { QrOutline, type QrOutlineHandle } from './QrOutline.js';
import styles from './QrScanner.module.scss';
import { toDisplayCorners, type CornerPoint } from './toDisplayCorners.js';

// Распознаватель для iOS берётся из сборки, а не с CDN: в аудиториях связи может не быть
prepareZXingModule({ overrides: { locateFile: () => wasmUrl } });

interface QrScannerProps {
  /** Что видно в кадре прямо сейчас: код или null, если его не распознать. Зовётся на каждом кадре */
  onCode: (value: string | null) => void;
  /** Пауза: камера гаснет */
  paused?: boolean;
  /** Углы найденного кода в координатах показанного кадра; пусто — кода в кадре нет */
  onCorners?: ((corners: CornerPoint[]) => void) | undefined;
  /** Свой слой поверх кадра: рисует по углам из `onCorners` */
  overlay?: ReactNode;
}

/**
 * Причину не угадываем: запрет, занятая камера и http выглядят в браузерах по-разному, и
 * неверная догадка хуже общей фразы. Пробуем всегда, а не решив заранее, что не выйдет.
 */
const CAMERA_ERROR = 'Не удалось включить камеру. Проверьте доступ к ней и обновите страницу.';
const FALLBACK_FRAME_MS = 250;

/** Камера и распознавание: BarcodeDetector свой на Android, wasm на iOS. Контур рисует QrOutline. */
export function QrScanner({
  onCode,
  paused = false,
  onCorners,
  overlay,
}: QrScannerProps): ReactNode {
  const videoRef = useRef<HTMLVideoElement>(null);
  const outlineRef = useRef<QrOutlineHandle>(null);
  const onCodeRef = useRef(onCode);
  const onCornersRef = useRef(onCorners);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onCodeRef.current = onCode;
    onCornersRef.current = onCorners;
  });

  useEffect(() => {
    const video = videoRef.current;
    if (paused || video === null) {
      return undefined;
    }

    const detector = new BarcodeDetector({ formats: ['qr_code'] });
    let stream: MediaStream | null = null;
    let stopped = false;
    let frameId: number | null = null;
    let timerId: number | null = null;

    /** requestVideoFrameCallback есть не везде, поэтому запасной путь по таймеру */
    const scheduleNextFrame = (): void => {
      if (stopped) {
        return;
      }
      if ('requestVideoFrameCallback' in video) {
        frameId = video.requestVideoFrameCallback(() => scan());
        return;
      }
      timerId = window.setTimeout(() => scan(), FALLBACK_FRAME_MS);
    };

    const scan = (): void => {
      if (stopped) {
        return;
      }
      void detector
        .detect(video)
        .then((codes) => {
          const found = codes[0];
          outlineRef.current?.draw(found?.cornerPoints);
          // Код сначала: слой поверх кадра рисуется уже зная, что за клетка под прицелом
          onCodeRef.current(found?.rawValue ?? null);
          onCornersRef.current?.(toDisplayCorners(video, found?.cornerPoints));
        })
        .catch(() => {
          // кадр мог прийти пустым при переключении камеры — просто ждём следующий
        })
        .finally(scheduleNextFrame);
    };

    const start = async (): Promise<void> => {
      // На http `mediaDevices` может и не быть: тогда это обычная ошибка, а не падение
      const opened = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (stopped) {
        opened.getTracks().forEach((track) => track.stop());
        return;
      }
      stream = opened;
      video.srcObject = opened;
      // Показ может не начаться сам: кадры всё равно идут, ловим их дальше
      await video.play().catch(() => undefined);
      setError(null);
      scheduleNextFrame();
    };

    void start().catch(() => setError(CAMERA_ERROR));

    return () => {
      stopped = true;
      if (frameId !== null && 'cancelVideoFrameCallback' in video) {
        video.cancelVideoFrameCallback(frameId);
      }
      if (timerId !== null) {
        window.clearTimeout(timerId);
      }
      stream?.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    };
  }, [paused]);

  return (
    <div className={styles.scanner}>
      <video ref={videoRef} className={styles.video} muted playsInline />
      {!paused && error === null && (
        <>
          <div className={styles.frame} aria-hidden="true" />
          {overlay}
          <QrOutline ref={outlineRef} videoRef={videoRef} />
        </>
      )}
      {error !== null && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
