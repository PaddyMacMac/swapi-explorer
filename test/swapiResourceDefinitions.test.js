// Tests the domain resource definitions and pure entity utility functions.

import { describe, expect, it } from 'vitest';
import {
  assertSupportedResource,
  getEntityName,
  getResourceDefinition,
  isSupportedResource,
  sortEntitiesByName,
  UNKNOWN_VALUE,
} from '../src/js/domain/swapiResourceDefinitions.js';

const supportedResources = ['people', 'films', 'planets', 'starships'];

describe('swapiResourceDefinitions', () => {
  it('supports the four application resources', () => {
    expect(supportedResources.every(isSupportedResource)).toBe(true);
  });

  it('rejects an unsupported resource', () => {
    expect(isSupportedResource('droids')).toBe(false);
  });

  it('uses title for films and name for other resources', () => {
    expect(getEntityName({ title: 'A New Hope' }, 'films')).toBe('A New Hope');
    expect(getEntityName({ name: 'Luke Skywalker' }, 'people')).toBe('Luke Skywalker');
  });

  it('falls back to the unknown-value marker when the name field is missing', () => {
    expect(getEntityName({}, 'people')).toBe(UNKNOWN_VALUE);
  });

  it('sorts a copy without mutating the source', () => {
    const source = [{ name: 'Yoda' }, { name: 'Luke Skywalker' }];
    expect(sortEntitiesByName(source, 'people').map(entity => entity.name)).toEqual(['Luke Skywalker', 'Yoda']);
    expect(source[0].name).toBe('Yoda');
  });

  it('rejects an unsupported resource when reading its definition', () => {
    expect(() => getResourceDefinition('droids')).toThrow('Unsupported resource: droids');
  });

  it('describes each card/detail field with a label, property and suffix', () => {
    const { cardFields, detailFields, label, nameField } = getResourceDefinition('people');
    expect(label).toBe('Characters');
    expect(nameField).toBe('name');
    expect(cardFields[0]).toEqual({ label: 'Height', property: 'height', suffix: ' cm' });
    expect(detailFields[0]).toEqual({ label: 'Height', property: 'height', suffix: ' cm' });
  });

  it('exposes an opening-crawl description field for films only', () => {
    expect(getResourceDefinition('films').descriptionField).toBe('opening_crawl');
    expect(getResourceDefinition('people').descriptionField).toBeUndefined();
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
