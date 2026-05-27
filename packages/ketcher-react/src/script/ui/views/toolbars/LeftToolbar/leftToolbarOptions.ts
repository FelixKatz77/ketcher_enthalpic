// Enthalpic: MULTITAIL_ARROW_TOOL_NAME import removed — the multi-tail arrow tool
// is no longer offered in our app (see arrowsOptions below).
// import { MULTITAIL_ARROW_TOOL_NAME } from 'ketcher-core';
import { bondCommon, bondQuery, bondSpecial, bondStereo } from './Bond/options';
import { makeItems } from '../ToolbarGroupItem/utils';
import { ToolbarItem } from '../toolbar.types';

// Enthalpic: all R-Group tools removed — not used in our app. The array is left empty
// (and the rgroup parent button is removed in LeftToolbar.tsx) so RGroup.tsx/Shape.tsx
// imports stay valid.
const rGroupOptions: ToolbarItem[] = makeItems([
  // 'rgroup-label',
  // 'rgroup-fragment',
  // 'rgroup-attpoints',
]);

// Enthalpic: all Shape tools removed — not used in our app. Array left empty; the shapes
// parent button is removed in LeftToolbar.tsx.
const shapeOptions: ToolbarItem[] = makeItems([
  // 'shape-ellipse',
  // 'shape-rectangle',
  // 'shape-line',
]);

const selectOptions: ToolbarItem[] = makeItems([
  'select-rectangle',
  'select-lasso',
  'select-structure',
  'select-fragment',
]);

// Enthalpic: Only the three filled-triangle arrow variants are offered in our app.
// All other arrow types are removed (commented out below) to simplify the UI.
const arrowsOptions: ToolbarItem[] = makeItems([
  // 'reaction-arrow-open-angle',
  'reaction-arrow-filled-triangle',
  // 'reaction-arrow-filled-bow',
  // 'reaction-arrow-dashed-open-angle',
  // 'reaction-arrow-failed',
  // 'reaction-arrow-retrosynthetic',
  'reaction-arrow-both-ends-filled-triangle',
  // 'reaction-arrow-equilibrium-filled-half-bow',
  'reaction-arrow-equilibrium-filled-triangle',
  // 'reaction-arrow-equilibrium-open-angle',
  // 'reaction-arrow-unbalanced-equilibrium-filled-half-bow',
  // 'reaction-arrow-unbalanced-equilibrium-open-half-angle',
  // 'reaction-arrow-unbalanced-equilibrium-large-filled-half-bow',
  // 'reaction-arrow-unbalanced-equilibrium-filled-half-triangle',

  // 'reaction-arrow-elliptical-arc-arrow-filled-bow',
  // 'reaction-arrow-elliptical-arc-arrow-filled-triangle',
  // 'reaction-arrow-elliptical-arc-arrow-open-angle',
  // 'reaction-arrow-elliptical-arc-arrow-open-half-angle',

  // MULTITAIL_ARROW_TOOL_NAME,
]);

const mappingOptions: ToolbarItem[] = makeItems([
  'reaction-map',
  'reaction-unmap',
  'reaction-automap',
]);

export {
  rGroupOptions,
  bondCommon,
  bondQuery,
  bondSpecial,
  bondStereo,
  shapeOptions,
  selectOptions,
  arrowsOptions,
  mappingOptions,
};
