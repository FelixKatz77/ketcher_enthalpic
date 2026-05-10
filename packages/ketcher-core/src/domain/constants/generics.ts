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

export type GenItem = {
  label: string;
  description?: string;
};

export type GenItemSet = {
  items: GenItem[];
  displayName?: string;
};

export type GenGroup = {
  itemSets: GenItemSet[];
  title: string;
};

export type GenericsType = {
  [index: string]: GenGroup & { subGroups?: GenericsType };
};

export const Generics: GenericsType = {
  acyl: {
    title: 'Acyl',
    itemSets: [
      {
        items: [
          { label: 'Bz', description: 'Benzoyl' },
          { label: 'Ac', description: 'Acetyl' },
        ],
      },
    ],
  },
  aliphatic: {
    title: 'Aliphatic',
    itemSets: [
      {
        items: [{ label: 'Cy', description: 'Cyclohexyl' }],
      },
    ],
  },
  alkyl: {
    title: 'Alkyl',
    itemSets: [
      {
        items: [
          { label: 'tBu', description: 'tert-Butyl' },
          { label: 'iPr', description: 'Isopropyl' },
        ],
      },
    ],
  },
  aromatic: {
    title: 'Aromatic',
    itemSets: [
      {
        items: [
          { label: 'Ph', description: 'Phenyl' },
          { label: 'Bn', description: 'Benzyl' },
        ],
      },
    ],
  },
  generics: {
    title: 'Generics',
    itemSets: [
      {
        items: [
          { label: 'Alk', description: 'Alkyl (generic)' },
          { label: 'Ar', description: 'Aryl (generic)' },
          { label: 'R', description: 'Any substituent' },
        ],
      },
    ],
  },
  halogene: {
    title: 'Halogene',
    itemSets: [
      {
        items: [{ label: 'X', description: 'Any halogen' }],
      },
    ],
  },
  'protecting-groups': {
    title: 'Protecting groups',
    itemSets: [
      {
        items: [
          { label: 'Boc', description: 'tert-Butyloxycarbonyl' },
          { label: 'Cbz', description: 'Benzyloxycarbonyl' },
          { label: 'Fmoc', description: '9-Fluorenylmethyloxycarbonyl' },
        ],
      },
    ],
  },
  silyl: {
    title: 'Silyl',
    itemSets: [
      {
        items: [
          { label: 'TMS', description: 'Trimethylsilyl' },
          { label: 'TBS', description: 'tert-Butyldimethylsilyl' },
          { label: 'TIPS', description: 'Triisopropylsilyl' },
        ],
      },
    ],
  },
  sulfonyl: {
    title: 'Sulfonyl',
    itemSets: [
      {
        items: [
          { label: 'Tf', description: 'Triflyl' },
          { label: 'Ts', description: 'Tosyl' },
          { label: 'Ms', description: 'Mesyl' },
        ],
      },
    ],
  },
};

function getGenericsList(generics: GenericsType | GenGroup) {
  if (Array.isArray(generics) && !generics[0]?.items) {
    return generics.map((item) => item.label);
  } else {
    let result: string[] = [];
    for (const subGroup of Object.values(generics)) {
      if (typeof generics === 'string') continue;
      result = [...result, ...getGenericsList(subGroup)];
    }
    return result;
  }
}

export const genericsList = getGenericsList(Generics);
