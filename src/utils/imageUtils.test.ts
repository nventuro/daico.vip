import { describe, it, expect } from 'vitest';
import type { PercentCrop } from 'react-image-crop';
import { WHOLE_IMAGE, isWholeImage, rotateCrop, turn } from './imageUtils';

const crop: PercentCrop = { unit: '%', x: 10, y: 20, width: 30, height: 40 };

describe('rotateCrop', () => {
  it('carries the selection round with a clockwise turn', () => {
    // The top-left corner (10, 20) swings to (80, 10), the bottom-right (40, 60) to (40, 40).
    expect(rotateCrop(crop, 1)).toEqual({ unit: '%', x: 40, y: 10, width: 40, height: 30 });
  });

  it('carries the selection round with a counter-clockwise turn', () => {
    expect(rotateCrop(crop, -1)).toEqual({ unit: '%', x: 20, y: 60, width: 40, height: 30 });
  });

  it('undoes a turn with the opposite one', () => {
    expect(rotateCrop(rotateCrop(crop, 1), -1)).toEqual(crop);
    expect(rotateCrop(rotateCrop(crop, -1), 1)).toEqual(crop);
  });

  it('comes back round after four turns', () => {
    const turned = [1, 1, 1, 1].reduce((c) => rotateCrop(c, 1), crop);
    expect(turned).toEqual(crop);
  });

  it('keeps the whole picture whole', () => {
    expect(rotateCrop(WHOLE_IMAGE, 1)).toEqual(WHOLE_IMAGE);
    expect(rotateCrop(WHOLE_IMAGE, -1)).toEqual(WHOLE_IMAGE);
  });
});

describe('isWholeImage', () => {
  it('is true for the whole picture, give or take a hair', () => {
    expect(isWholeImage(WHOLE_IMAGE)).toBe(true);
    expect(isWholeImage({ unit: '%', x: 0.05, y: 0, width: 99.95, height: 99.92 })).toBe(true);
  });

  it('is false once anything would be cut', () => {
    expect(isWholeImage(crop)).toBe(false);
    expect(isWholeImage({ unit: '%', x: 0, y: 0, width: 100, height: 98 })).toBe(false);
  });
});

describe('turn', () => {
  it('goes round in quarter turns either way', () => {
    expect(turn(0, 1)).toBe(90);
    expect(turn(270, 1)).toBe(0);
    expect(turn(0, -1)).toBe(270);
    expect(turn(90, -1)).toBe(0);
  });
});
