/****************************************************************************
 * Copyright 2023 EPAM Systems
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

import { GenGroup } from './GenGroup';
import { Generics } from 'ketcher-core';
import classes from './GenericGroups.module.less';

type GenericGroupsProps = {
  selected: (label: string) => boolean;
  onAtomSelect: (label: string) => void;
  onAtomActivate: (label: string) => void;
  disabledQueryElements: Array<string> | null;
};

function GenericGroups({
  selected,
  onAtomSelect,
  onAtomActivate,
  disabledQueryElements,
}: Readonly<GenericGroupsProps>) {
  return (
    <div className={classes.genericGroups}>
      <div className={classes.groupGrid}>
        {Object.entries(Generics).map(([key, group]) => (
          <GenGroup
            key={key}
            group={group}
            selected={selected}
            onAtomSelect={onAtomSelect}
            onAtomActivate={onAtomActivate}
            disabledQueryElements={disabledQueryElements}
          />
        ))}
      </div>
    </div>
  );
}

export default GenericGroups;
