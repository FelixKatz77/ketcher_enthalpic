import { useCallback } from 'react';
import { useAppContext } from 'src/hooks';
import Editor from 'src/script/editor';
import {
  Action,
  Bond,
  BOND_BROKEN_COLOR,
  BOND_MADE_COLOR,
  fromBondsAttrs,
  fromHighlightDelete,
  KetcherLogger,
  ketcherProvider,
} from 'ketcher-core';
import { BondsContextMenuProps, ItemEventParams } from '../contextMenu.types';

type Params = ItemEventParams<BondsContextMenuProps>;

export { BOND_MADE_COLOR, BOND_BROKEN_COLOR };

const TOGGLEABLE_COLORS = new Set([BOND_MADE_COLOR, BOND_BROKEN_COLOR]);

const useBondMarkReaction = (color: string) => {
  const { ketcherId } = useAppContext();

  return useCallback(
    ({ props }: Params) => {
      const editor = ketcherProvider.getKetcher(ketcherId).editor as Editor;
      const bondIds = props?.bondIds ?? [];
      const restruct = editor.render.ctab;
      const { molecule } = restruct;

      try {
        const action = new Action();
        const bondsToApply: number[] = [];

        bondIds.forEach((bondId) => {
          const bond = molecule.bonds.get(bondId);
          if (!bond) return;

          const existingHighlights: Array<{ id: number; color: string }> = [];
          molecule.highlights.forEach((highlight, id) => {
            if (highlight.bonds?.includes(bondId)) {
              existingHighlights.push({ id, color: highlight.color });
            }
          });

          const hasTargetColor = existingHighlights.some(
            (h) => h.color === color,
          );
          const isCurrentlyMarked =
            bond.reactingCenterStatus ===
              Bond.PATTERN.REACTING_CENTER.MADE_OR_BROKEN && hasTargetColor;

          if (isCurrentlyMarked) {
            action.mergeWith(
              fromBondsAttrs(
                restruct,
                bondId,
                {
                  ...bond,
                  reactingCenterStatus: Bond.PATTERN.REACTING_CENTER.UNMARKED,
                } as Bond,
                false,
              ),
            );
            existingHighlights
              .filter((h) => h.color === color)
              .forEach(({ id }) => {
                action.mergeWith(fromHighlightDelete(restruct, id));
              });
          } else {
            action.mergeWith(
              fromBondsAttrs(
                restruct,
                bondId,
                {
                  ...bond,
                  reactingCenterStatus:
                    Bond.PATTERN.REACTING_CENTER.MADE_OR_BROKEN,
                } as Bond,
                false,
              ),
            );
            existingHighlights
              .filter((h) => TOGGLEABLE_COLORS.has(h.color))
              .forEach(({ id }) => {
                action.mergeWith(fromHighlightDelete(restruct, id));
              });
            bondsToApply.push(bondId);
          }
        });

        editor.update(action);

        if (bondsToApply.length > 0) {
          editor.highlights.create({
            atoms: [],
            bonds: bondsToApply,
            rgroupAttachmentPoints: [],
            color,
          });
        }
      } catch (e) {
        KetcherLogger.error('useBondMarkReaction.ts::handler', e);
      }
    },
    [ketcherId, color],
  );
};

export default useBondMarkReaction;
