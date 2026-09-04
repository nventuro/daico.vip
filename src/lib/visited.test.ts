import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NavigationType } from 'react-router-dom';

type Visited = typeof import('./visited');

let visited: Visited;

// The record is the module's own state, so every test starts from a page that
// has been nowhere yet.
beforeEach(async () => {
  vi.resetModules();
  visited = await import('./visited');
});

describe('the record of visits', () => {
  it('steps back to a screen that is behind, by the nearest visit to it', () => {
    visited.recordVisit('a', '/', NavigationType.Pop);
    visited.recordVisit('b', '/notas', NavigationType.Push);
    visited.recordVisit('c', '/notas/1', NavigationType.Push);
    expect(visited.stepsBackTo('/notas')).toBe(-1);
    expect(visited.stepsBackTo('/')).toBe(-2);
  });

  it('finds nothing ahead of, or at, the open screen', () => {
    visited.recordVisit('a', '/notas', NavigationType.Pop);
    visited.recordVisit('b', '/notas/1', NavigationType.Push);
    visited.recordVisit('a', '/notas', NavigationType.Pop);
    expect(visited.stepsBackTo('/notas/1')).toBeNull();
    expect(visited.stepsBackTo('/notas')).toBeNull();
  });

  it('takes the nearest of two visits to the same screen', () => {
    visited.recordVisit('a', '/notas', NavigationType.Pop);
    visited.recordVisit('b', '/notas/1', NavigationType.Push);
    visited.recordVisit('c', '/notas', NavigationType.Push);
    visited.recordVisit('d', '/notas/2', NavigationType.Push);
    expect(visited.stepsBackTo('/notas')).toBe(-1);
  });

  it('drops what was ahead when a new screen is pushed from behind', () => {
    visited.recordVisit('a', '/', NavigationType.Pop);
    visited.recordVisit('b', '/notas', NavigationType.Push);
    visited.recordVisit('c', '/notas/1', NavigationType.Push);
    visited.recordVisit('a', '/', NavigationType.Pop);
    visited.recordVisit('d', '/tareas', NavigationType.Push);
    expect(visited.stepsBackTo('/notas')).toBeNull();
    expect(visited.stepsBackTo('/')).toBe(-1);
  });

  it('overwrites the open screen on a replace', () => {
    visited.recordVisit('a', '/', NavigationType.Pop);
    visited.recordVisit('b', '/notas/1/editar', NavigationType.Push);
    visited.recordVisit('c', '/notas/1', NavigationType.Replace);
    expect(visited.stepsBackTo('/notas/1/editar')).toBeNull();
    expect(visited.stepsBackTo('/')).toBe(-1);
  });

  it('is unmoved by the same visit told twice', () => {
    visited.recordVisit('a', '/', NavigationType.Pop);
    visited.recordVisit('b', '/notas', NavigationType.Push);
    visited.recordVisit('b', '/notas', NavigationType.Push);
    expect(visited.stepsBackTo('/')).toBe(-1);
  });

  it('starts over on an entry it never saw', () => {
    visited.recordVisit('a', '/', NavigationType.Pop);
    visited.recordVisit('b', '/notas', NavigationType.Push);
    visited.recordVisit('x', '/tareas/1', NavigationType.Pop);
    expect(visited.stepsBackTo('/')).toBeNull();
    expect(visited.stepsBackTo('/notas')).toBeNull();
    visited.recordVisit('y', '/tareas', NavigationType.Push);
    expect(visited.stepsBackTo('/tareas/1')).toBe(-1);
  });

  it('knows the screen the open one was reached from, and when there is none', () => {
    visited.recordVisit('a', '/proximo', NavigationType.Pop);
    expect(visited.previousPathname()).toBeNull();
    visited.recordVisit('b', '/tareas/1', NavigationType.Push);
    expect(visited.previousPathname()).toBe('/proximo');
    visited.recordVisit('a', '/proximo', NavigationType.Pop);
    expect(visited.previousPathname()).toBeNull();
  });

  it('forgets what was behind an entry it never saw', () => {
    visited.recordVisit('a', '/', NavigationType.Pop);
    visited.recordVisit('x', '/tareas/1', NavigationType.Pop);
    expect(visited.previousPathname()).toBeNull();
  });
});
