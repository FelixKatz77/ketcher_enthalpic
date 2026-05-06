/****************************************************************************
 * Copyright 2021 EPAM Systems
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 ***************************************************************************/

import {
  ToolbarGroupItemCallProps,
  ToolbarGroupItemProps,
} from '../../ToolbarGroupItem';
import { ToolbarMultiToolItem } from '../../ToolbarGroupItem/ToolbarMultiToolItem';
import { mappingOptions } from '../leftToolbarOptions';

interface ReactionMappingProps
  extends Omit<ToolbarGroupItemProps, 'id' | 'options'> {}
type ReactionMappingCallProps = ToolbarGroupItemCallProps;

type Props = ReactionMappingProps & ReactionMappingCallProps;

const ReactionMapping = (props: Props) => {
  return (
    <ToolbarMultiToolItem
      id="reaction-mapping-tools"
      options={mappingOptions}
      variant="reaction-mapping"
      {...props}
    />
  );
};

export type { ReactionMappingProps, ReactionMappingCallProps };
export { ReactionMapping };
