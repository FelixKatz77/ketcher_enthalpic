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

import { KetSerializer } from 'domain/serializers/ket/ketSerializer';
import { MolSerializer } from 'domain/serializers/mol/molSerializer';
import { Struct } from 'domain/entities/struct';
import v3000 from 'domain/serializers/mol/v3000';
import { StructFormatter } from './structFormatter.types';

export class MolfileV3000Formatter implements StructFormatter {
  readonly #molSerializer: MolSerializer;

  constructor(molSerializer: MolSerializer) {
    this.#molSerializer = molSerializer;
  }

  async getStringFromStructureAsync(struct: Struct): Promise<string> {
    const prepared =
      KetSerializer.removeLeavingGroupsFromConnectedAtoms(struct);
    return v3000.saveStructV3000(prepared);
  }

  async getStructureFromStringAsync(
    stringifiedStruct: string,
  ): Promise<Struct> {
    return this.#molSerializer.deserialize(stringifiedStruct);
  }
}
