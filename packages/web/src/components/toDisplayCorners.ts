export interface CornerPoint {
  x: number;
  y: number;
}

interface VideoBox {
  videoWidth: number;
  videoHeight: number;
  clientWidth: number;
  clientHeight: number;
}

/**
 * Углы кода приходят в координатах кадра, а видео показано с `object-fit: cover`:
 * кадр увеличен до размеров рамки и обрезан по краям — тем же образом двигаем и углы.
 */
export function toDisplayCorners(
  video: VideoBox,
  corners: CornerPoint[] | undefined,
): CornerPoint[] {
  if (!corners || corners.length === 0 || video.videoWidth === 0) {
    return [];
  }
  const scale = Math.max(
    video.clientWidth / video.videoWidth,
    video.clientHeight / video.videoHeight,
  );
  const offsetX = (video.clientWidth - video.videoWidth * scale) / 2;
  const offsetY = (video.clientHeight - video.videoHeight * scale) / 2;
  return corners.map((corner) => ({
    x: corner.x * scale + offsetX,
    y: corner.y * scale + offsetY,
  }));
}
