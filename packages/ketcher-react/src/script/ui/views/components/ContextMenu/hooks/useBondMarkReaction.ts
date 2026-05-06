import { useCallback } from 'react';
import { useAppContext } from 'src/hooks';
import Editor from 'src/script/editor';
import {
  Action,
  Bond,
  BondReactionRole,
  BOND_BROKEN_COLOR,
  BOND_MADE_COLOR,
  fromBondsAttrs,
  KetcherLogger,
  ketcherProvider,
} from 'ketcher-core';
import { BondsContextMenuProps, ItemEventParams } from '../contextMenu.types';

type Params = ItemEventParams<BondsContextMenuProps>;

export { BOND_MADE_COLOR, BOND_BROKEN_COLOR };

const ROLE_BY_COLOR: Record<string, Exclude<BondReactionRole, null>> = {
  [BOND_MADE_COLOR]: 'made',
  [BOND_BROKEN_COLOR]: 'broken',
};

const useBondMarkReaction = (color: string) => {
  const { ketcherId } = useAppContext();

  return useCallback(
    ({ props }: Params) => {
      const editor = ketcherProvider.getKetcher(ketcherId).editor as Editor;
      const bondIds = props?.bondIds ?? [];
      const restruct = editor.render.ctab;
      const { molecule } = restruct;
      const targetRole = ROLE_BY_COLOR[color];
      if (!targetRole) return;

      try {
        const action = new Action();

        bondIds.forEach((bondId) => {
          const bond = molecule.bonds.get(bondId);
          if (!bond) return;

          const isCurrentlyMarked = bond.reactionRole === targetRole;

          const nextAttrs = isCurrentlyMarked
            ? {
                reactingCenterStatus: Bond.PATTERN.REACTING_CENTER.UNMARKED,
                reactionRole: null,
              }
            : {
                reactingCenterStatus:
                  Bond.PATTERN.REACTING_CENTER.MADE_OR_BROKEN,
                reactionRole: targetRole,
              };

          action.mergeWith(
            fromBondsAttrs(
              restruct,
              bondId,
              { ...bond, ...nextAttrs } as Bond,
              false,
            ),
          );
        });

        editor.update(action);
      } catch (e) {
        KetcherLogger.error('useBondMarkReaction.ts::handler', e);
      }
    },
    [ketcherId, color],
  );
};

export default useBondMarkReaction;
