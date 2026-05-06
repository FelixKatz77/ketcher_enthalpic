/****************************************************************************
 * Copyright 2021 EPAM Systems
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ***************************************************************************/

import { Atom } from 'domain/entities/atom';
import { AtomList } from 'domain/entities/atomList';
import { Bond } from 'domain/entities/bond';
import { Fragment } from 'domain/entities/fragment';
import { RGroup } from 'domain/entities/rgroup';
import { SGroup } from 'domain/entities/sgroup';
import { Struct } from 'domain/entities/struct';
import { Vec2 } from 'domain/entities/vec2';

import { Elements } from 'domain/constants';
import sGroup from './parseSGroup';
import utils from './utils';

function parseAtomLineV3000(line: string): Atom {
  /* reader */
  let subsplit, key, value, i;
  const split = spacebarsplit(line);
  const params: Record<string, unknown> = {
    pp: new Vec2(
      parseFloat(split[2]),
      -parseFloat(split[3]),
      parseFloat(split[4]),
    ),
    aam: split[5].trim(),
  };
  let label = split[1].trim();
  if (label.startsWith('"') && label.endsWith('"')) {
    label = label.slice(1, -1);
  } // strip qutation marks
  if (label.endsWith(']')) {
    // assume atom list
    label = label.slice(0, -1); // remove ']'
    const atomListParams: Record<string, unknown> = {};
    atomListParams.notList = false;
    const matchNotListInfo = label.match(/NOT ?\[/);
    if (matchNotListInfo) {
      atomListParams.notList = true;
      const [matchedSubstr] = matchNotListInfo;
      label = label.slice(matchedSubstr.length); // remove 'NOT [' or 'NOT['
    } else if (!label.startsWith('[')) {
      throw new Error("Error: atom list expected, found '" + label + "'");
    } else {
      label = label.slice(1); // remove '['
    }
    atomListParams.ids = labelsListToIds(label.split(','));
    params.atomList = new AtomList(
      atomListParams as { notList: boolean; ids: number[] },
    );
    params.label = 'L#';
  } else {
    params.label = label;
  }
  split.splice(0, 6);
  for (i = 0; i < split.length; ++i) {
    subsplit = splitonce(split[i], '=');
    key = subsplit[0];
    value = subsplit[1];
    if (key in utils.fmtInfo.v30atomPropMap) {
      let ival = utils.parseDecimalInt(value);
      if (key === 'VAL') {
        if (ival === 0) continue; // eslint-disable-line no-continue
        if (ival === -1) ival = 0;
      }
      params[utils.fmtInfo.v30atomPropMap[key]] = ival;
    } else if (key === 'RGROUPS') {
      value = value.trim().slice(1, -1);
      const rgrsplit = value.split(' ').slice(1);
      params.rglabel = 0;
      for (const rgrValue of rgrsplit) {
        params.rglabel =
          (params.rglabel as number) | (1 << (Number(rgrValue) - 1));
      }
    } else if (key === 'ATTCHPT') {
      params.attpnt = value.trim() - 0;
    }
  }

  return new Atom(params as unknown as ConstructorParameters<typeof Atom>[0]);
}

function parseBondLineV3000(line: string): Bond {
  /* reader */
  let subsplit, key, value, i;
  const split = spacebarsplit(line);
  const params: Record<string, unknown> = {
    begin: utils.parseDecimalInt(split[2]) - 1,
    end: utils.parseDecimalInt(split[3]) - 1,
    type: utils.fmtInfo.bondTypeMap[utils.parseDecimalInt(split[1])],
  };
  split.splice(0, 4);
  for (i = 0; i < split.length; ++i) {
    subsplit = splitonce(split[i], '=');
    key = subsplit[0];
    value = subsplit[1];
    if (key === 'CFG') {
      params.stereo =
        utils.fmtInfo.v30bondStereoMap[utils.parseDecimalInt(value)];
      if (
        params.type === Bond.PATTERN.TYPE.DOUBLE &&
        params.stereo === Bond.PATTERN.STEREO.EITHER
      ) {
        params.stereo = Bond.PATTERN.STEREO.CIS_TRANS;
      }
    } else if (key === 'TOPO') {
      params.topology =
        utils.fmtInfo.bondTopologyMap[utils.parseDecimalInt(value)];
    } else if (key === 'RXCTR') {
      params.reactingCenterStatus = utils.parseDecimalInt(value);
    } else if (key === 'ENTHALPIC_RC') {
      // Custom V3000 bond attribute carrying the explicit reaction role beyond
      // the spec-defined RXCTR=4 ambiguity (made vs broken vs combined).
      // Other tools harmlessly ignore the unknown attribute.
      const role = value?.trim().toUpperCase();
      if (role === 'MADE') params.reactionRole = 'made';
      else if (role === 'BROKEN') params.reactionRole = 'broken';
      else if (role === 'MADE_BROKEN') params.reactionRole = 'made_or_broken';
    } else if (key === 'STBOX') {
      params.stereoCare = utils.parseDecimalInt(value);
    }
  }
  return new Bond(params as unknown as ConstructorParameters<typeof Bond>[0]);
}

function v3000parseCollection(
  _ctab: Struct,
  ctabLines: string[],
  shift: number,
): number {
  /* reader */
  shift++;
  while (ctabLines[shift].trim() !== 'M  V30 END COLLECTION') shift++;
  shift++;
  return shift;
}

function v3000parseSGroup(
  ctab: Struct,
  ctabLines: string[],
  sgroups: Record<number, SGroup>,
  atomMap: Record<number, number>,
  shift: number,
): number {
  // eslint-disable-line max-params, max-statements
  /* reader */
  let line = '';
  shift++;
  while (shift < ctabLines.length) {
    line = stripV30(ctabLines[shift++]).trim();
    if (line.trim() === 'END SGROUP') return shift;
    while (line.endsWith('-')) {
      line = (line.slice(0, -1) + stripV30(ctabLines[shift++])).trim();
    }
    const split = splitSGroupDef(line);
    const type = split[1];
    const sg = new SGroup(type) as SGroup & Record<string, unknown>;
    sg.number = Number(split[0]);
    sg.type = type;
    sg.label = Number(split[2]);
    sgroups[sg.number as number] = sg;
    const props: Record<string, string[]> = {};
    for (const splitItem of split.slice(3)) {
      const subsplit = splitonce(splitItem, '=');
      if (subsplit.length !== 2) {
        throw new Error(
          "A record of form AAA=BBB or AAA=(...) expected, got '" +
            splitItem +
            "'",
        );
      }
      const name = subsplit[0];
      if (!(name in props)) props[name] = [];
      props[name].push(subsplit[1]);
    }
    sg.atoms = parseBracedNumberList(props.ATOMS[0], -1);
    if (props.PATOMS) {
      sg.patoms = parseBracedNumberList(props.PATOMS[0], -1);
    }
    sg.bonds = props.BONDS ? parseBracedNumberList(props.BONDS[0], -1) : [];
    const brkxyzStrs = props.BRKXYZ;
    sg.brkxyz = [];
    if (brkxyzStrs) {
      for (const brkxyzStr of brkxyzStrs) {
        (sg.brkxyz as unknown[]).push(parseBracedNumberList(brkxyzStr));
      }
    }
    if (props.MULT) {
      sg.data.subscript = Number(props.MULT[0]);
    }
    if (props.LABEL) sg.data.subscript = props.LABEL[0].trim();
    if (props.CONNECT) {
      sg.data.connectivity = props.CONNECT[0].toLowerCase();
    }
    if (props.FIELDDISP) {
      sGroup.applyDataSGroupInfo(sg, stripQuotes(props.FIELDDISP[0]));
    }
    if (props.FIELDDATA) {
      sGroup.applyDataSGroupData(sg, props.FIELDDATA[0], true);
    }
    if (props.FIELDNAME) {
      sGroup.applyDataSGroupName(sg, props.FIELDNAME[0]);
    }
    if (props.QUERYTYPE) {
      sGroup.applyDataSGroupQuery(sg, props.QUERYTYPE[0]);
    }
    if (props.QUERYOP) sGroup.applyDataSGroupQueryOp(sg, props.QUERYOP[0]);
    sGroup.loadSGroup(ctab, sg, atomMap);
    if (props.ESTATE) {
      sGroup.applyDataSGroupExpand(sg, props.ESTATE[0] === 'E');
    }
  }
  throw new Error('S-group declaration incomplete.');
}

function parseCTabV3000(
  ctabLines: string[],
  norgroups?: boolean | string[],
): Struct {
  // eslint-disable-line max-statements
  /* reader */
  const ctab = new Struct();

  let shift = 0;
  if (ctabLines[shift++].trim() !== 'M  V30 BEGIN CTAB') {
    throw Error('CTAB V3000 invalid');
  }
  if (!ctabLines[shift].startsWith('M  V30 COUNTS')) {
    throw Error('CTAB V3000 invalid');
  }
  const vals = ctabLines[shift].slice(14).split(' ');
  const isAbs = utils.parseDecimalInt(vals[4]) === 1;
  shift++;

  if (ctabLines[shift].trim() === 'M  V30 BEGIN ATOM') {
    shift++;
    let line;
    while (shift < ctabLines.length) {
      line = stripV30(ctabLines[shift++]).trim();
      if (line === 'END ATOM') break;
      while (line.charAt(line.length - 1) === '-') {
        line = (
          line.substring(0, line.length - 1) + stripV30(ctabLines[shift++])
        ).trim();
      }
      ctab.atoms.add(parseAtomLineV3000(line));
    }

    if (ctabLines[shift].trim() === 'M  V30 BEGIN BOND') {
      shift++;
      while (shift < ctabLines.length) {
        line = stripV30(ctabLines[shift++]).trim();
        if (line === 'END BOND') break;
        while (line.charAt(line.length - 1) === '-') {
          line = (
            line.substring(0, line.length - 1) + stripV30(ctabLines[shift++])
          ).trim();
        }
        const bond = parseBondLineV3000(line);
        if (bond.stereo && isAbs) {
          const beginAtom = ctab.atoms.get(bond.begin);
          if (beginAtom) {
            beginAtom.stereoLabel = 'abs';
          }
        }
        ctab.bonds.add(bond);
      }
    }

    // TODO: let sections follow in arbitrary order
    const sgroups = {};
    const atomMap = {};

    while (ctabLines[shift].trim() !== 'M  V30 END CTAB') {
      if (ctabLines[shift].trim() === 'M  V30 BEGIN COLLECTION') {
        // TODO: read collection information
        shift = v3000parseCollection(ctab, ctabLines, shift);
      } else if (ctabLines[shift].trim() === 'M  V30 BEGIN SGROUP') {
        shift = v3000parseSGroup(ctab, ctabLines, sgroups, atomMap, shift);
      } else throw Error('CTAB V3000 invalid');
    }
  }
  if (ctabLines[shift++].trim() !== 'M  V30 END CTAB') {
    throw Error('CTAB V3000 invalid');
  }

  if (!norgroups) readRGroups3000(ctab, ctabLines.slice(shift));

  return ctab;
}

function readRGroups3000(ctab: Struct, ctabLines: string[]): void {
  // eslint-disable-line max-statements
  /* reader */
  const rfrags: Record<string, Struct[]> = {};
  const rLogic: Record<string, Record<string, unknown>> = {};
  let shift = 0;
  while (
    shift < ctabLines.length &&
    ctabLines[shift].search('M  V30 BEGIN RGROUP') === 0
  ) {
    const id = ctabLines[shift++].split(' ').pop() as string;
    rfrags[id] = [];
    rLogic[id] = {};
    while (true) {
      // eslint-disable-line no-constant-condition
      let line = ctabLines[shift].trim();
      if (line.search('M  V30 RLOGIC') === 0) {
        line = line.slice(13);
        const rlsplit = line.trim().split(/\s+/g);
        const iii = utils.parseDecimalInt(rlsplit[0]);
        const hhh = utils.parseDecimalInt(rlsplit[1]);
        const ooo = rlsplit.slice(2).join(' ');
        const logic: Record<string, unknown> = {};
        if (iii > 0) {
          logic.ifthen = iii;
        }
        logic.resth = hhh === 1;
        logic.range = ooo;
        rLogic[id] = logic;
        shift++;
        continue; // eslint-disable-line no-continue
      }
      if (line !== 'M  V30 BEGIN CTAB') throw Error('CTAB V3000 invalid');
      let i;
      for (i = 0; i < ctabLines.length; ++i) {
        if (ctabLines[shift + i].trim() === 'M  V30 END CTAB') break;
      }
      const lines = ctabLines.slice(shift, shift + i + 1);
      const rfrag = parseCTabV3000(lines, true);
      rfrags[id].push(rfrag);
      shift = shift + i + 1;
      if (ctabLines[shift].trim() === 'M  V30 END RGROUP') {
        shift++;
        break;
      }
    }
  }

  Object.keys(rfrags).forEach((rgid) => {
    rfrags[rgid].forEach((rg) => {
      const rgidNum = Number(rgid);
      rg.rgroups.set(rgidNum, new RGroup(rLogic[rgid]));
      const frid = rg.frags.add(new Fragment());
      rg.rgroups.get(rgidNum)?.frags.add(frid);
      rg.atoms.forEach((atom) => {
        atom.fragment = frid;
      });
      rg.mergeInto(ctab);
    });
  });
}

function parseRxn3000(
  ctabLines: string[],
  shouldReactionRelayout?: boolean,
): Struct {
  // eslint-disable-line max-statements
  /* reader */
  ctabLines = ctabLines.slice(4);
  const countsSplit = ctabLines[0].split(/\s+/g).slice(3);
  const nReactants = Number(countsSplit[0]);
  const nProducts = Number(countsSplit[1]);
  const nAgents = countsSplit.length > 2 ? Number(countsSplit[2]) : 0;

  function findCtabEnd(i: number): number {
    for (let j = i; j < ctabLines.length; ++j) {
      if (ctabLines[j].trim() === 'M  V30 END CTAB') {
        return j;
      }
    }
    console.error('CTab format invalid');
    return i;
  }

  function findRGroupEnd(i: number): number {
    for (let j = i; j < ctabLines.length; ++j) {
      if (ctabLines[j].trim() === 'M  V30 END RGROUP') {
        return j;
      }
    }
    console.error('CTab format invalid');
    return i;
  }

  const molLinesReactants: string[][] = [];
  const molLinesProducts: string[][] = [];
  const molLinesAgents: string[][] = [];
  let current: string[][] | null = null;
  const rGroups: string[][] = [];
  let i = 0;
  while (i < ctabLines.length) {
    const line = ctabLines[i].trim();

    if (line.startsWith('M  V30 COUNTS')) {
      // do nothing
    } else if (line === 'M  END') {
      break; // stop reading
    } else if (line === 'M  V30 BEGIN PRODUCT') {
      current = molLinesProducts;
    } else if (line === 'M  V30 END PRODUCT') {
      current = null;
    } else if (line === 'M  V30 BEGIN REACTANT') {
      current = molLinesReactants;
    } else if (line === 'M  V30 END REACTANT') {
      current = null;
    } else if (line === 'M  V30 BEGIN AGENT') {
      current = molLinesAgents;
    } else if (line === 'M  V30 END AGENT') {
      current = null;
    } else if (line.startsWith('M  V30 BEGIN RGROUP')) {
      const j = findRGroupEnd(i);
      rGroups.push(ctabLines.slice(i, j + 1));
      i = j + 1;
      continue;
    } else if (line === 'M  V30 BEGIN CTAB') {
      const j = findCtabEnd(i);
      current?.push(ctabLines.slice(i, j + 1));
      i = j + 1;
      continue;
    } else {
      throw new Error('line unrecognized: ' + line);
    }
    i++;
  }
  const mols: Struct[] = [];
  const molLines = molLinesReactants
    .concat(molLinesProducts)
    .concat(molLinesAgents);
  for (const molLine of molLines) {
    const mol = parseCTabV3000(molLine, countsSplit);
    mols.push(mol);
  }
  const ctab = utils.rxnMerge(
    mols,
    nReactants,
    nProducts,
    nAgents,
    shouldReactionRelayout,
  );

  readRGroups3000(
    ctab,
    (function (array: string[][]) {
      let res: string[] = [];
      for (const item of array) {
        res = res.concat(item);
      }
      return res;
    })(rGroups),
  );

  return ctab;
}

// split a line by spaces outside parentheses
function spacebarsplit(line: string): string[] {
  // eslint-disable-line max-statements
  /* reader */
  const split: string[] = [];
  let bracketEquality = 0;
  let currentIndex = 0;
  let firstSliceIndex = -1;
  let quoted = false;

  while (currentIndex < line.length) {
    const currentSymbol = line[currentIndex];
    if (line.slice(currentIndex, currentIndex + 3) === 'NOT') {
      const closingBracketIndex = line.indexOf(']');
      split.push(line.slice(currentIndex, closingBracketIndex + 1));
      currentIndex = closingBracketIndex + 1;
      firstSliceIndex = currentIndex;
    } else if (currentSymbol === '(') bracketEquality += 1;
    else if (currentSymbol === ')') bracketEquality -= 1;
    else if (currentSymbol === '"') quoted = !quoted;
    else if (!quoted && line[currentIndex] === ' ' && bracketEquality === 0) {
      if (currentIndex > firstSliceIndex + 1) {
        split.push(line.slice(firstSliceIndex + 1, currentIndex));
      }
      firstSliceIndex = currentIndex;
    }
    currentIndex += 1;
  }
  if (currentIndex > firstSliceIndex + 1) {
    split.push(line.slice(firstSliceIndex + 1, currentIndex));
  }
  return split;
}

// utils
function stripQuotes(str: string): string {
  if (str.startsWith('"') && str.endsWith('"')) {
    return str.slice(1, -1);
  }
  return str;
}

function splitonce(line: string, delim: string): [string, string] {
  /* reader */
  const p = line.indexOf(delim);
  return [line.slice(0, p), line.slice(p + 1)];
}

function splitSGroupDef(line: string): string[] {
  // eslint-disable-line max-statements
  /* reader */
  const split: string[] = [];
  let braceBalance = 0;
  let quoted = false;
  let i = 0;
  while (i < line.length) {
    const c = line.charAt(i);
    if (c === '"') {
      quoted = !quoted;
    } else if (!quoted) {
      if (c === '(') {
        braceBalance++;
      } else if (c === ')') {
        braceBalance--;
      } else if (c === ' ' && braceBalance === 0) {
        split.push(line.slice(0, i));
        line = line.slice(i + 1).trim();
        i = 0;
        continue;
      }
    }
    i++;
  }
  if (braceBalance !== 0) {
    throw new Error('Brace balance broken. S-group properies invalid!');
  }
  if (line.length > 0) split.push(line.trim());
  return split;
}

function parseBracedNumberList(line: string, shift?: number): number[] | null {
  /* reader */
  if (!line) return null;
  const list: number[] = [];
  line = line.trim();
  line = line.slice(1, -1);
  const split = line.split(' ');
  shift = shift || 0;

  for (const splitItem of split.slice(1)) {
    const value = parseInt(splitItem);
    if (!isNaN(value)) {
      // eslint-disable-line
      list.push(value + shift);
    }
  }

  return list;
}

function stripV30(line: string): string {
  /* reader */
  if (!line.startsWith('M  V30 ')) throw new Error('Prefix invalid');
  return line.slice(7);
}

function labelsListToIds(labels: string[]): number[] {
  /* reader */
  const ids: number[] = [];
  for (const label of labels) {
    const element = Elements.get(label.trim());
    if (element) {
      ids.push(element.number);
    }
  }

  return ids;
}

// ===========================================================================
// V3000 writers — inverses of the parsers above. Kept in this file (not split
// into a separate v3000-writer.ts) to mirror the convention in molfile.ts and
// keep parser/writer drift visible in the same diff.
// ===========================================================================

const V3000_PREFIX = 'M  V30 ';
const V3000_END_LINE = '  0  0  0  0  0  0  0  0  0  0999 V3000';

const stereoMapToV30: Record<number, number> = {
  [Bond.PATTERN.STEREO.NONE]: 0,
  [Bond.PATTERN.STEREO.UP]: 1,
  [Bond.PATTERN.STEREO.EITHER]: 2,
  [Bond.PATTERN.STEREO.DOWN]: 3,
};

const reactionRoleToEnthalpicRc: Record<string, string> = {
  made: 'MADE',
  broken: 'BROKEN',
  made_or_broken: 'MADE_BROKEN',
};

function v3000Float(n: number): string {
  return Number.isFinite(n) ? n.toFixed(4) : '0.0000';
}

function v3000Header(name: string): string[] {
  /* saver */
  const date = new Date();
  const dateStr =
    String(date.getMonth() + 1).padStart(2, ' ') +
    String(date.getDate()).padStart(2, ' ') +
    String(date.getFullYear() % 100).padStart(2, ' ') +
    String(date.getHours()).padStart(2, ' ') +
    String(date.getMinutes()).padStart(2, ' ');
  return [
    name,
    '  Ketcher ' + dateStr + '2D 1   1.00000     0.00000     0',
    '',
    V3000_END_LINE,
  ];
}

function writeAtomLineV3000(atom: Atom, idx: number): string {
  /* saver */
  // V3000 atom block: M  V30 <idx> <label> <x> <y> <z> <aam> [KEY=VALUE]...
  // Symmetric inverse of parseAtomLineV3000: parser negates y on read
  // (line 37), so we emit -y here to keep a clean round-trip.
  let label = atom.label || '';
  if (atom.atomList) {
    // Atom-list format: "[E1,E2,...]" or "NOT [E1,E2,...]". We don't yet
    // support reverse-mapping atomList ids back to element symbols; emit a
    // placeholder so save doesn't crash. Round-trip of atom lists is not in
    // the Phase D scope.
    label = '*';
  } else if (label === 'L#') {
    // legacy R-group placeholder; treat as plain '*'
    label = '*';
  }
  const aam = (atom as Atom & { aam?: number }).aam ?? 0;
  const parts: (string | number)[] = [
    `${V3000_PREFIX}${idx}`,
    label,
    v3000Float(atom.pp.x),
    v3000Float(-atom.pp.y),
    v3000Float(atom.pp.z),
    aam,
  ];
  if (atom.charge != null && atom.charge !== 0)
    parts.push(`CHG=${atom.charge}`);
  if (atom.radical) parts.push(`RAD=${atom.radical}`);
  if (atom.isotope) parts.push(`MASS=${atom.isotope}`);
  if (atom.explicitValence === 0) parts.push('VAL=-1');
  else if (atom.explicitValence != null && atom.explicitValence > 0) {
    parts.push(`VAL=${atom.explicitValence}`);
  }
  const hCount = (atom as Atom & { hCount?: number }).hCount ?? 0;
  if (hCount > 0) parts.push(`HCOUNT=${hCount}`);
  return parts.join(' ');
}

function writeBondLineV3000(
  bond: Bond,
  idx: number,
  atomMap: Map<number, number>,
): string {
  /* saver */
  // V3000 bond block: M  V30 <idx> <type> <a1> <a2> [KEY=VALUE]...
  // bond.type already uses the V3000 numeric values (1=SINGLE, 2=DOUBLE, ...);
  // bondTypeMap in utils is the identity for the lower numbers. Emit it
  // directly.
  const a1 = atomMap.get(bond.begin);
  const a2 = atomMap.get(bond.end);
  const parts: (string | number)[] = [
    `${V3000_PREFIX}${idx}`,
    bond.type,
    a1 ?? 0,
    a2 ?? 0,
  ];
  // Stereo: parseBondLineV3000 maps DOUBLE+EITHER→CIS_TRANS on read; mirror
  // by emitting CFG=2 (EITHER) for DOUBLE+CIS_TRANS so the round-trip lands
  // back on CIS_TRANS.
  let stereoForWrite = bond.stereo;
  if (
    bond.type === Bond.PATTERN.TYPE.DOUBLE &&
    stereoForWrite === Bond.PATTERN.STEREO.CIS_TRANS
  ) {
    stereoForWrite = Bond.PATTERN.STEREO.EITHER;
  }
  const cfg = stereoForWrite != null ? stereoMapToV30[stereoForWrite] : 0;
  if (cfg) parts.push(`CFG=${cfg}`);
  if (bond.topology && bond.topology > 0) parts.push(`TOPO=${bond.topology}`);
  if (bond.reactingCenterStatus && bond.reactingCenterStatus !== 0) {
    parts.push(`RXCTR=${bond.reactingCenterStatus}`);
  }
  // Custom V3000 attribute persisting the explicit reaction role beyond
  // RXCTR=4's ambiguity. Read by parseBondLineV3000's ENTHALPIC_RC branch.
  const role = bond.reactionRole;
  if (role && reactionRoleToEnthalpicRc[role]) {
    parts.push(`ENTHALPIC_RC=${reactionRoleToEnthalpicRc[role]}`);
  }
  return parts.join(' ');
}

function writeCTabV3000(struct: Struct): string[] {
  /* saver */
  const lines: string[] = [];
  lines.push(`${V3000_PREFIX}BEGIN CTAB`);
  lines.push(
    `${V3000_PREFIX}COUNTS ${struct.atoms.size} ${struct.bonds.size} 0 0 0`,
  );

  const atomMap = new Map<number, number>();
  if (struct.atoms.size > 0) {
    lines.push(`${V3000_PREFIX}BEGIN ATOM`);
    let i = 1;
    struct.atoms.forEach((atom, id) => {
      atomMap.set(id, i);
      lines.push(writeAtomLineV3000(atom, i));
      i++;
    });
    lines.push(`${V3000_PREFIX}END ATOM`);
  }

  if (struct.bonds.size > 0) {
    lines.push(`${V3000_PREFIX}BEGIN BOND`);
    let i = 1;
    struct.bonds.forEach((bond) => {
      lines.push(writeBondLineV3000(bond, i, atomMap));
      i++;
    });
    lines.push(`${V3000_PREFIX}END BOND`);
  }

  lines.push(`${V3000_PREFIX}END CTAB`);
  return lines;
}

function saveMolV3000(struct: Struct): string {
  /* saver */
  // Single-molecule V3000 MOL block. Mirror the V2000 saveMolecule shape:
  // 4-line header (title / software / comment / counts-with-V3000-marker),
  // then the CTAB block, then `M  END`.
  const lines: string[] = [];
  lines.push(...v3000Header(struct.name ?? ''));
  lines.push(...writeCTabV3000(struct));
  lines.push('M  END');
  return lines.join('\n');
}

function saveRxnV3000(struct: Struct): string {
  /* saver */
  // RXN V3000 wrapper: $RXN V3000 + 3 metadata lines + COUNTS + REACTANT
  // and PRODUCT blocks. Inside REACTANT/PRODUCT each component is a bare
  // CTAB block (no per-component header lines), matching parseRxn3000 which
  // collects molLines as CTABs from BEGIN CTAB → END CTAB.
  const components = struct.getComponents();
  const reactantSubs: Struct[] = components.reactants.map((c) =>
    struct.clone(c, null, true),
  );
  const productSubs: Struct[] = components.products.map((c) =>
    struct.clone(c, null, true),
  );

  const lines: string[] = [];
  lines.push('$RXN V3000');
  lines.push(struct.name ?? '');
  lines.push('      Ketcher');
  lines.push('');
  lines.push(
    `${V3000_PREFIX}COUNTS ${reactantSubs.length} ${productSubs.length} 0`,
  );

  if (reactantSubs.length > 0) {
    lines.push(`${V3000_PREFIX}BEGIN REACTANT`);
    reactantSubs.forEach((sub) => {
      lines.push(...writeCTabV3000(sub));
    });
    lines.push(`${V3000_PREFIX}END REACTANT`);
  }
  if (productSubs.length > 0) {
    lines.push(`${V3000_PREFIX}BEGIN PRODUCT`);
    productSubs.forEach((sub) => {
      lines.push(...writeCTabV3000(sub));
    });
    lines.push(`${V3000_PREFIX}END PRODUCT`);
  }

  lines.push('M  END');
  return lines.join('\n');
}

function saveStructV3000(struct: Struct): string {
  /* saver */
  if (struct.rgroups.size > 0) {
    throw new Error('R-Groups are not yet supported by the local V3000 writer');
  }
  return struct.hasRxnArrow() ? saveRxnV3000(struct) : saveMolV3000(struct);
}

export default {
  parseCTabV3000,
  readRGroups3000,
  parseRxn3000,
  saveStructV3000,
  saveMolV3000,
  saveRxnV3000,
};
