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

import { RefObject, useRef } from 'react';
// Enthalpic: CREATE_MONOMER_TOOL_NAME and IMAGE_KEY imports removed — the
// "Create a monomer" and "Add image" tools are not used in our app (see below).
// import { CREATE_MONOMER_TOOL_NAME, IMAGE_KEY } from 'ketcher-core';
import {
  ToolbarGroupItem,
  ToolbarGroupItemCallProps,
  ToolbarGroupItemProps,
} from '../ToolbarGroupItem';
import { ToolbarItem, ToolbarItemVariant } from '../toolbar.types';
import {
  arrowsOptions,
  bondCommon,
  bondQuery,
  bondSpecial,
  bondStereo,
  mappingOptions,
  // Enthalpic: rGroupOptions and shapeOptions no longer used here — the R-Group and
  // Shapes buttons are removed below (all their tools were removed).
  // rGroupOptions,
  selectOptions,
  // shapeOptions,
} from './leftToolbarOptions';

import { ArrowScroll } from '../ArrowScroll';
import { Bond } from './Bond';
import { ReactionMapping } from './ReactionMapping';
import { RGroup } from './RGroup';
import { Shape } from './Shape';
import classes from './LeftToolbar.module.less';
import clsx from 'clsx';
import { useInView } from 'react-intersection-observer';
import { useResizeObserver } from '../../../../../hooks';

interface LeftToolbarProps
  extends Omit<ToolbarGroupItemProps, 'id' | 'options'> {
  className?: string;
}

type LeftToolbarCallProps = ToolbarGroupItemCallProps;

type Props = LeftToolbarProps & LeftToolbarCallProps;

type ItemProps = {
  id: ToolbarItemVariant;
  options?: ToolbarItem[];
  dataTestId?: string;
};

interface GroupProps {
  items?: ItemProps[];
  className?: string;
  height?: number;
  rest: Omit<Props, 'className'>;
}

const Group = ({ items, className, height, rest }: GroupProps) => {
  const { status } = rest;
  const visibleItems =
    items?.reduce<ItemProps[]>(
      (acc, item) =>
        status[item.id]?.hidden ||
        item.options?.every((option) => status[option.id]?.hidden)
          ? acc
          : acc.concat(item),
      [],
    ) ?? [];

  return visibleItems.length ? (
    <div className={clsx(classes.group, className)}>
      {visibleItems.map((item) => {
        switch (item.id) {
          case 'bond-common':
            return <Bond {...rest} height={height} key={item.id} />;
          case 'reaction-mapping-tools':
            return <ReactionMapping {...rest} key={item.id} />;
          case 'rgroup':
            return <RGroup {...rest} key={item.id} />;
          case 'shapes':
            return <Shape {...rest} key={item.id} />;
          case 'bonds':
            return (
              <ToolbarGroupItem
                id={item.id}
                options={item.options}
                key={item.id}
                dataTestId="bonds"
                {...rest}
              />
            );
          default:
            return (
              <ToolbarGroupItem
                id={item.id}
                options={item.options}
                key={item.id}
                {...rest}
              />
            );
        }
      })}
    </div>
  ) : null;
};

const LeftToolbar = (props: Props) => {
  const { className, ...rest } = props;
  const { ref, height } = useResizeObserver<HTMLDivElement>();
  const scrollRef = useRef(null) as RefObject<HTMLDivElement | null>;
  const [startRef, startInView] = useInView({ threshold: 1 });
  const [endRef, endInView] = useInView({ threshold: 1 });
  const sizeRef = useRef(null) as RefObject<HTMLDivElement | null>;

  const scrollUp = () => {
    if (!scrollRef.current || !sizeRef.current) {
      return;
    }

    scrollRef.current.scrollTop -= sizeRef.current.offsetHeight;
  };

  const scrollDown = () => {
    if (!scrollRef.current || !sizeRef.current) {
      return;
    }

    scrollRef.current.scrollTop += sizeRef.current.offsetHeight;
  };

  return (
    <div
      data-testid="left-toolbar"
      className={clsx(classes.root, className)}
      ref={ref}
    >
      <div
        className={classes.buttons}
        ref={scrollRef}
        data-testid="left-toolbar-buttons"
      >
        <div className={classes.listener} ref={startRef}>
          <Group
            className={classes.groupItem}
            items={[
              { id: 'hand' },
              { id: 'select', options: selectOptions },
              { id: 'erase' },
            ]}
            height={height}
            rest={rest}
          />
        </div>

        {/*
          Enthalpic: sizeRef relocated here (was on the now-removed S-Group/R-Group
          group). It measures a representative group height to drive the scroll-page
          step (scrollUp/scrollDown), so it must wrap an always-present group.
        */}
        <div className={classes.listener} ref={sizeRef}>
          <Group
            className={classes.groupItem}
            items={[
              {
                id: 'bonds',
                options: [
                  ...bondCommon,
                  ...bondQuery,
                  ...bondSpecial,
                  ...bondStereo,
                ],
              },
              { id: 'chain' },
              { id: 'enhanced-stereo' },
              { id: 'charge-plus' },
              { id: 'charge-minus' },
            ]}
            height={height}
            rest={rest}
          />
        </div>
        {/*
          Enthalpic: entire S-Group/R-Group/Create-monomer group removed — none of these
          tools are used in our app (S-Group, R-Group Label/Fragment/Attachment point,
          and Create a monomer were all removed).
          <div className={classes.listener} ref={sizeRef}>
            <Group
              className={classes.groupItem}
              items={[
                { id: 'sgroup' },
                { id: 'rgroup', options: rGroupOptions },
                { id: CREATE_MONOMER_TOOL_NAME },
              ]}
              height={height}
              rest={rest}
            />
          </div>
        */}

        <Group
          className={classes.groupItem}
          items={[
            { id: 'reaction-plus' },
            { id: 'arrows', options: arrowsOptions },
            {
              id: 'reaction-mapping-tools',
              options: mappingOptions,
            },
          ]}
          height={height}
          rest={rest}
        />

        <div ref={endRef}>
          <Group
            className={classes.groupItem}
            items={
              [
                // Enthalpic: Shapes tool removed — not used in our app (all shape
                // variants were removed). The Group renders nothing when empty.
                // { id: 'shapes', options: shapeOptions },
                // Enthalpic: "Add text" tool removed — not used in our app.
                // { id: 'text' },
                // Enthalpic: "Add image" tool removed — not used in our app.
                // { id: IMAGE_KEY },
              ]
            }
            height={height}
            rest={rest}
          />
        </div>
      </div>
      {height && (scrollRef?.current?.scrollHeight || 0) > height && (
        <ArrowScroll
          startInView={startInView}
          endInView={endInView}
          scrollForward={scrollDown}
          scrollBack={scrollUp}
        />
      )}
    </div>
  );
};

export type { LeftToolbarProps, LeftToolbarCallProps };
export { LeftToolbar };
