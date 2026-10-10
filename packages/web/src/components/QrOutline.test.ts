import { describe, expect, it } from 'vitest';
import { toOutlinePoints } from './QrOutline.js';

/** Кадр 640×480 в рамке 300×400: `cover` увеличивает его и срезает бока */
const video = { videoWidth: 640, videoHeight: 480, clientWidth: 300, clientHeight: 400 };

describe('toOutlinePoints', () => {
  it('переводит углы кода из кадра в координаты рамки', () => {
    // scale = max(300/640, 400/480) = 0.8333…, сдвиг по X = (300 - 533.3)/2 = -116.6…
    const points = toOutlinePoints(video, [
      { x: 140, y: 0 },
      { x: 200, y: 0 },
      { x: 200, y: 60 },
      { x: 140, y: 60 },
    ]);

    expect(points).toBe('0,0 50,0 50,50 0,50');
  });

  it('без кода контур пустой', () => {
    expect(toOutlinePoints(video, undefined)).toBe('');
    expect(toOutlinePoints(video, [])).toBe('');
  });

  it('молчит, пока кадр не приехал', () => {
    const empty = { videoWidth: 0, videoHeight: 0, clientWidth: 300, clientHeight: 400 };

    expect(toOutlinePoints(empty, [{ x: 1, y: 1 }])).toBe('');
  });
});
