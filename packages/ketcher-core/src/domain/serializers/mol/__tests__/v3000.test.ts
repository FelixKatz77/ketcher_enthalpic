import molParsers from '../v3000';

const buildCtab = (
  atoms: Array<{ label: string; x: number; y: number }>,
  bonds: Array<{ type: number; begin: number; end: number; cfg?: number }>,
  collectionLines: string[] = [],
): string[] => {
  const lines: string[] = [];
  lines.push('M  V30 BEGIN CTAB');
  lines.push(`M  V30 COUNTS ${atoms.length} ${bonds.length} 0 0 0`);
  lines.push('M  V30 BEGIN ATOM');
  atoms.forEach((a, i) => {
    lines.push(
      `M  V30 ${i + 1} ${a.label} ${a.x.toFixed(4)} ${a.y.toFixed(4)} 0.0000 0`,
    );
  });
  lines.push('M  V30 END ATOM');
  lines.push('M  V30 BEGIN BOND');
  bonds.forEach((b, i) => {
    const cfg = b.cfg !== undefined ? ` CFG=${b.cfg}` : '';
    lines.push(`M  V30 ${i + 1} ${b.type} ${b.begin} ${b.end}${cfg}`);
  });
  lines.push('M  V30 END BOND');
  if (collectionLines.length > 0) {
    lines.push('M  V30 BEGIN COLLECTION');
    collectionLines.forEach((l) => lines.push(`M  V30 ${l}`));
    lines.push('M  V30 END COLLECTION');
  }
  lines.push('M  V30 END CTAB');
  return lines;
};

const sampleAtoms = [
  { label: 'C', x: 0, y: 0 },
  { label: 'C', x: 1, y: 0 },
  { label: 'C', x: 2, y: 0 },
  { label: 'C', x: 3, y: 0 },
];
const sampleBonds = [
  { type: 1, begin: 1, end: 2 },
  { type: 1, begin: 2, end: 3, cfg: 1 },
  { type: 1, begin: 3, end: 4, cfg: 3 },
];

describe('v3000 COLLECTION block — reader', () => {
  it('parses STEABS into stereoLabel="abs"', () => {
    const ctab = molParsers.parseCTabV3000(
      buildCtab(sampleAtoms, sampleBonds, ['MDLV30/STEABS ATOMS=(2 2 3)']),
    );
    expect(ctab.atoms.get(1)!.stereoLabel).toBe('abs');
    expect(ctab.atoms.get(2)!.stereoLabel).toBe('abs');
    expect(ctab.atoms.get(0)!.stereoLabel ?? null).toBeNull();
  });

  it('parses STEREL<n> into stereoLabel="or<n>"', () => {
    const ctab = molParsers.parseCTabV3000(
      buildCtab(sampleAtoms, sampleBonds, ['MDLV30/STEREL1 ATOMS=(2 2 3)']),
    );
    expect(ctab.atoms.get(1)!.stereoLabel).toBe('or1');
    expect(ctab.atoms.get(2)!.stereoLabel).toBe('or1');
  });

  it('parses STERAC<n> into stereoLabel="&<n>"', () => {
    const ctab = molParsers.parseCTabV3000(
      buildCtab(sampleAtoms, sampleBonds, ['MDLV30/STERAC2 ATOMS=(2 2 3)']),
    );
    expect(ctab.atoms.get(1)!.stereoLabel).toBe('&2');
    expect(ctab.atoms.get(2)!.stereoLabel).toBe('&2');
  });

  it('parses multiple collection lines in one block', () => {
    const ctab = molParsers.parseCTabV3000(
      buildCtab(sampleAtoms, sampleBonds, [
        'MDLV30/STEABS ATOMS=(1 1)',
        'MDLV30/STEREL1 ATOMS=(1 2)',
        'MDLV30/STERAC1 ATOMS=(1 3)',
      ]),
    );
    expect(ctab.atoms.get(0)!.stereoLabel).toBe('abs');
    expect(ctab.atoms.get(1)!.stereoLabel).toBe('or1');
    expect(ctab.atoms.get(2)!.stereoLabel).toBe('&1');
  });

  it('still tolerates blocks with no MDLV30/ lines (back-compat)', () => {
    const ctab = molParsers.parseCTabV3000(
      buildCtab(sampleAtoms, sampleBonds, ['MDLV30/SOMETHINGELSE FOO=BAR']),
    );
    // Should not throw and should not crash on unknown keywords.
    expect(ctab.atoms.size).toBe(4);
  });
});

describe('v3000 COLLECTION block — writer (round-trip)', () => {
  // Verify the writer emits COLLECTION by parsing → serializing and checking
  // the resulting text. This exercises the same code path the bug describes.
  const roundTrip = (collectionLines: string[]): string => {
    const ctab = molParsers.parseCTabV3000(
      buildCtab(sampleAtoms, sampleBonds, collectionLines),
    );
    return molParsers.saveMolV3000(ctab);
  };

  it('emits MDLV30/STEREL1 for or<n>-labelled atoms', () => {
    const out = roundTrip(['MDLV30/STEREL1 ATOMS=(2 2 3)']);
    expect(out).toContain('M  V30 BEGIN COLLECTION');
    expect(out).toContain('M  V30 MDLV30/STEREL1 ATOMS=(2 2 3)');
    expect(out).toContain('M  V30 END COLLECTION');
    // COLLECTION must be inside CTAB, after END BOND, before END CTAB.
    const idxEndBond = out.indexOf('M  V30 END BOND');
    const idxBeginColl = out.indexOf('M  V30 BEGIN COLLECTION');
    const idxEndColl = out.indexOf('M  V30 END COLLECTION');
    const idxEndCtab = out.indexOf('M  V30 END CTAB');
    expect(idxEndBond).toBeGreaterThan(-1);
    expect(idxBeginColl).toBeGreaterThan(idxEndBond);
    expect(idxEndColl).toBeGreaterThan(idxBeginColl);
    expect(idxEndCtab).toBeGreaterThan(idxEndColl);
  });

  it('emits MDLV30/STERAC<n> for &<n>-labelled atoms', () => {
    const out = roundTrip(['MDLV30/STERAC2 ATOMS=(2 2 3)']);
    expect(out).toContain('M  V30 MDLV30/STERAC2 ATOMS=(2 2 3)');
  });

  it('emits MDLV30/STEABS for abs-labelled atoms', () => {
    const out = roundTrip(['MDLV30/STEABS ATOMS=(2 2 3)']);
    expect(out).toContain('M  V30 MDLV30/STEABS ATOMS=(2 2 3)');
  });

  it('emits multiple lines in deterministic order: STEABS → STEREL<n>↑ → STERAC<n>↑', () => {
    const out = roundTrip([
      'MDLV30/STERAC2 ATOMS=(1 4)',
      'MDLV30/STEREL1 ATOMS=(1 2)',
      'MDLV30/STEABS ATOMS=(1 1)',
      'MDLV30/STERAC1 ATOMS=(1 3)',
    ]);
    const idxAbs = out.indexOf('MDLV30/STEABS');
    const idxRel1 = out.indexOf('MDLV30/STEREL1');
    const idxRac1 = out.indexOf('MDLV30/STERAC1');
    const idxRac2 = out.indexOf('MDLV30/STERAC2');
    expect(idxAbs).toBeGreaterThan(-1);
    expect(idxRel1).toBeGreaterThan(idxAbs);
    expect(idxRac1).toBeGreaterThan(idxRel1);
    expect(idxRac2).toBeGreaterThan(idxRac1);
  });

  it('emits no COLLECTION block when no atom has a stereoLabel', () => {
    const ctab = molParsers.parseCTabV3000(buildCtab(sampleAtoms, sampleBonds));
    const out = molParsers.saveMolV3000(ctab);
    expect(out).not.toContain('BEGIN COLLECTION');
    expect(out).not.toContain('MDLV30/STE');
  });

  it('emits the COLLECTION block inside the PRODUCT CTAB of an RXN-V3000', () => {
    // Build a minimal RXN with one reactant and one product. The product is
    // CHFClBr — a real stereocenter on the central carbon — with a wedge from
    // C→F and STEREL1 covering the stereocenter. A simple carbon chain isn't
    // a valid stereocenter (StereoValidator.isCorrectStereoCenter rejects it),
    // and saveRxnV3000's struct.clone() reruns setStereoLabelsToAtoms which
    // would strip the label off of non-stereocenters. With a valid center the
    // label survives the clone and the writer emits the COLLECTION block.
    const reactant = buildCtab([{ label: 'C', x: 0, y: 0 }], []);
    const productAtoms = [
      { label: 'C', x: 0, y: 0 },
      { label: 'F', x: 1, y: 0 },
      { label: 'Cl', x: -1, y: 0 },
      { label: 'Br', x: 0, y: 1 },
    ];
    const productBonds = [
      { type: 1, begin: 1, end: 2, cfg: 1 },
      { type: 1, begin: 1, end: 3 },
      { type: 1, begin: 1, end: 4 },
    ];
    const product = buildCtab(productAtoms, productBonds, [
      'MDLV30/STEREL1 ATOMS=(1 1)',
    ]);
    const rxnLines = [
      '$RXN V3000',
      '',
      '      Ketcher',
      '',
      'M  V30 COUNTS 1 1 0',
      'M  V30 BEGIN REACTANT',
      ...reactant,
      'M  V30 END REACTANT',
      'M  V30 BEGIN PRODUCT',
      ...product,
      'M  V30 END PRODUCT',
      'M  END',
    ];
    const struct = molParsers.parseRxn3000(rxnLines);
    const out = molParsers.saveRxnV3000(struct);
    expect(out).toContain('M  V30 BEGIN PRODUCT');
    expect(out).toContain('MDLV30/STEREL1 ATOMS=');
    const idxProduct = out.indexOf('M  V30 BEGIN PRODUCT');
    const idxColl = out.indexOf('MDLV30/STEREL1');
    const idxEndProduct = out.indexOf('M  V30 END PRODUCT');
    expect(idxColl).toBeGreaterThan(idxProduct);
    expect(idxColl).toBeLessThan(idxEndProduct);
  });
});
