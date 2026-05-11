import { test } from '@fixtures';
import {
  takeEditorScreenshot,
  openFileAndAddToCanvas,
  waitForPageInit,
} from '@utils';
import { selectExtendedTableElement } from '@tests/pages/molecules/canvas/ExtendedTableDialog';
import { ExtendedTableButton } from '@tests/pages/constants/extendedTableWindow/Constants';
import { getAtomLocator } from '@utils/canvas/atoms/getAtomLocator/getAtomLocator';

test.describe('Generic nodes', () => {
  test.beforeEach(async ({ page }) => {
    await waitForPageInit(page);
    await openFileAndAddToCanvas(
      page,
      'Molfiles-V2000/heteroatoms-structure.mol',
    );
  });

  test('Acyl groups adding to atoms of structure', async ({ page }) => {
    await selectExtendedTableElement(page, ExtendedTableButton.Bz);
    await getAtomLocator(page, { atomLabel: 'O' }).first().click({
      force: true,
    });
    await selectExtendedTableElement(page, ExtendedTableButton.Ac);
    await getAtomLocator(page, { atomLabel: 'S' }).first().click({
      force: true,
    });
    await takeEditorScreenshot(page);
  });

  test('Aliphatic group adding to atom of structure', async ({ page }) => {
    await selectExtendedTableElement(page, ExtendedTableButton.Cy);
    await getAtomLocator(page, { atomLabel: 'O' }).first().click({
      force: true,
    });
    await takeEditorScreenshot(page);
  });

  test('Alkyl groups adding to atoms of structure', async ({ page }) => {
    await selectExtendedTableElement(page, ExtendedTableButton.tBu);
    await getAtomLocator(page, { atomLabel: 'O' }).first().click({
      force: true,
    });
    await selectExtendedTableElement(page, ExtendedTableButton.iPr);
    await getAtomLocator(page, { atomLabel: 'S' }).first().click({
      force: true,
    });
    await takeEditorScreenshot(page);
  });

  test('Aromatic groups adding to atoms of structure', async ({ page }) => {
    await selectExtendedTableElement(page, ExtendedTableButton.Ph);
    await getAtomLocator(page, { atomLabel: 'O' }).first().click({
      force: true,
    });
    await selectExtendedTableElement(page, ExtendedTableButton.Bn);
    await getAtomLocator(page, { atomLabel: 'S' }).first().click({
      force: true,
    });
    await takeEditorScreenshot(page);
  });

  test('Generic Alk, Ar and R adding to atoms of structure', async ({
    page,
  }) => {
    await selectExtendedTableElement(page, ExtendedTableButton.Alk);
    await getAtomLocator(page, { atomLabel: 'O' }).first().click({
      force: true,
    });
    await selectExtendedTableElement(page, ExtendedTableButton.Ar);
    await getAtomLocator(page, { atomLabel: 'S' }).first().click({
      force: true,
    });
    await selectExtendedTableElement(page, ExtendedTableButton.R);
    await getAtomLocator(page, { atomLabel: 'F' }).first().click({
      force: true,
    });
    await takeEditorScreenshot(page);
  });

  test('Halogene X adding to atom of structure', async ({ page }) => {
    await selectExtendedTableElement(page, ExtendedTableButton.X);
    await getAtomLocator(page, { atomLabel: 'O' }).first().click({
      force: true,
    });
    await takeEditorScreenshot(page);
  });

  test('Protecting groups adding to atoms of structure', async ({ page }) => {
    await selectExtendedTableElement(page, ExtendedTableButton.Boc);
    await getAtomLocator(page, { atomLabel: 'O' }).first().click({
      force: true,
    });
    await selectExtendedTableElement(page, ExtendedTableButton.Cbz);
    await getAtomLocator(page, { atomLabel: 'S' }).first().click({
      force: true,
    });
    await selectExtendedTableElement(page, ExtendedTableButton.Fmoc);
    await getAtomLocator(page, { atomLabel: 'F' }).first().click({
      force: true,
    });
    await takeEditorScreenshot(page);
  });

  test('Silyl groups adding to atoms of structure', async ({ page }) => {
    await selectExtendedTableElement(page, ExtendedTableButton.TMS);
    await getAtomLocator(page, { atomLabel: 'O' }).first().click({
      force: true,
    });
    await selectExtendedTableElement(page, ExtendedTableButton.TBS);
    await getAtomLocator(page, { atomLabel: 'S' }).first().click({
      force: true,
    });
    await selectExtendedTableElement(page, ExtendedTableButton.TIPS);
    await getAtomLocator(page, { atomLabel: 'F' }).first().click({
      force: true,
    });
    await takeEditorScreenshot(page);
  });

  test('Sulfonyl groups adding to atoms of structure', async ({ page }) => {
    await selectExtendedTableElement(page, ExtendedTableButton.Tf);
    await getAtomLocator(page, { atomLabel: 'O' }).first().click({
      force: true,
    });
    await selectExtendedTableElement(page, ExtendedTableButton.Ts);
    await getAtomLocator(page, { atomLabel: 'S' }).first().click({
      force: true,
    });
    await selectExtendedTableElement(page, ExtendedTableButton.Ms);
    await getAtomLocator(page, { atomLabel: 'F' }).first().click({
      force: true,
    });
    await takeEditorScreenshot(page);
  });
});
