// Tests the domain resource definitions and pure entity-selection rules.

import { describe, expect, it } from 'vitest';
import {
  assertSupportedResource,
  getEntityName,
  getResourceDefinition,
  isSupportedResource,
  sortEntitiesByName,
} from '../src/js/domain/resources.js';

describe('resources', () => {
  it('supports the four application resources', () => {
    expect(['people', 'films', 'planets', 'starships'].every(isSupportedResource)).toBe(true);
  });

  it('uses title for films and name for other resources', () => {
    expect(getEntityName({ title: 'A New Hope' }, 'films')).toBe('A New Hope');
    expect(getEntityName({ name: 'Luke Skywalker' }, 'people')).toBe('Luke Skywalker');
  });

  it('sorts a copy without mutating the source', () => {
    const source = [{ name: 'Yoda' }, { name: 'Luke Skywalker' }];
    expect(sortEntitiesByName(source, 'people').map(item => item.name)).toEqual(['Luke Skywalker', 'Yoda']);
    expect(source[0].name).toBe('Yoda');
  });

  it('rejects an unsupported resource', () => {
    expect(() => getResourceDefinition('droids')).toThrow('Unsupported resource: droids');
  });

  it('describes each card/detail field with a label, property and suffix', () => {
    const { cardFields } = getResourceDefinition('people');
    expect(cardFields[0]).toEqual({ label: 'Height', property: 'height', suffix: ' cm' });
  });

  describe('assertSupportedResource', () => {
    it('does nothing for a supported resource', () => {
      expect(() => assertSupportedResource('people')).not.toThrow();
    });

    it('throws for an unsupported resource', () => {
      expect(() => assertSupportedResource('droids')).toThrow('Unsupported resource: droids');
    });
  });
});
