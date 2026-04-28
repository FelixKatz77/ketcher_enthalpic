import {
  Action,
  Atom,
  AtomPropertiesInContextMenu,
  AtomQueryProperties,
  fromAtomsAttrs,
  KetcherLogger,
} from 'ketcher-core';
import { updateOnlyChangedProperties } from './utils';

export function isAtomsArray(selectedElements: Atom | Atom[]): boolean {
  return (
    Array.isArray(selectedElements) &&
    selectedElements?.every((element) => element instanceof Atom)
  );
}

export function updateSelectedAtoms({
  atoms,
  changeAtomPromise,
  editor,
}: {
  atoms: number[];
  editor;
  changeAtomPromise:
    | Promise<Atom>
    | PromiseLike<AtomPropertiesInContextMenu | AtomQueryProperties>;
}) {
  const action = new Action();
  const struct = editor.render.ctab;
  const { molecule } = struct;
  if (atoms) {
    Promise.resolve(changeAtomPromise)
      .then((userChangedAtom) => {
        // Pair-renumber for AAM: only meaningful for single-atom edits.
        const isSingleAtomEdit = atoms.length === 1;
        const editedAtomId = isSingleAtomEdit ? atoms[0] : null;
        const editedAtom =
          editedAtomId !== null ? molecule.atoms.get(editedAtomId) : null;
        const oldAam = editedAtom?.aam ?? 0;
        const newAam =
          userChangedAtom && 'aam' in userChangedAtom
            ? Number((userChangedAtom as { aam?: unknown }).aam) || 0
            : oldAam;

        // TODO: deep compare to not produce dummy, e.g.
        // atom.label != attrs.label || !atom.atomList.equals(attrs.atomList)
        atoms.forEach((atomId) => {
          const unchangedAtom = molecule.atoms.get(atomId);
          const atomWithChangedProperties = updateOnlyChangedProperties(
            unchangedAtom,
            userChangedAtom,
          );
          action.mergeWith(
            fromAtomsAttrs(struct, atomId, atomWithChangedProperties, false),
          );
        });

        if (
          isSingleAtomEdit &&
          oldAam > 0 &&
          newAam !== oldAam &&
          editedAtomId !== null
        ) {
          molecule.atoms.forEach((otherAtom, otherId) => {
            if (otherId !== editedAtomId && otherAtom.aam === oldAam) {
              action.mergeWith(
                fromAtomsAttrs(struct, otherId, { aam: newAam }, false),
              );
            }
          });
        }

        editor.update(action);
      })
      .catch((e) => {
        KetcherLogger.error('atoms.ts::updateSelectedAtoms', e);
      });
  }
}
