/****************************************************************************
 * Copyright 2021 EPAM Systems
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 ***************************************************************************/

import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { ketcherProvider } from 'ketcher-core';

import { MultiToolCallProps, MultiToolProps } from '../variants.types';
import { ActionButton, ActionButtonProps } from '../../../ActionButton';
import action from '../../../../../../action';
import { getIconName } from 'components';
import { useAppContext } from 'src/hooks';
import Editor from 'src/script/editor';

import classes from './ReactionMappingMultiTool.module.less';

type Props = MultiToolProps & MultiToolCallProps;

function formatValue(value: number | null): string {
  return value === null || value === undefined ? '' : String(value);
}

const ReactionMappingMultiTool = (props: Props) => {
  const { options, status, disableableButtons, indigoVerification, onAction } =
    props;

  const { ketcherId } = useAppContext();
  const editor = useMemo(() => {
    return ketcherProvider.getKetcher(ketcherId)?.editor as Editor | undefined;
  }, [ketcherId]);

  const [inputValue, setInputValue] = useState<string>(() =>
    formatValue(editor?.reactionMapNextNumber ?? null),
  );

  useEffect(() => {
    if (!editor) return;
    setInputValue(formatValue(editor.reactionMapNextNumber));
    const handler = (next: number | null) => {
      setInputValue(formatValue(next));
    };
    editor.reactionMapNextNumberChanged.add(handler);
    return () => {
      editor.reactionMapNextNumberChanged.remove(handler);
    };
  }, [editor]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    setInputValue(raw);
    if (raw === '') {
      editor?.setReactionMapNextNumber(null);
      return;
    }
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed >= 1) {
      editor?.setReactionMapNextNumber(Math.floor(parsed));
    }
  };

  const handleBlur = () => {
    if (inputValue === '') return;
    const parsed = Number(inputValue);
    if (!Number.isFinite(parsed) || parsed < 1) {
      setInputValue('');
      editor?.setReactionMapNextNumber(null);
    } else {
      const normalized = Math.floor(parsed);
      setInputValue(String(normalized));
      editor?.setReactionMapNextNumber(normalized);
    }
  };

  return (
    <div className={classes.root}>
      <div className={classes.buttons}>
        {options.map((toolbarItem) => {
          const currentStatus = status[toolbarItem.id];
          const iconName = getIconName(toolbarItem.id);
          return (
            iconName && (
              <ActionButton
                key={toolbarItem.id}
                name={iconName}
                action={action[toolbarItem.id]}
                status={currentStatus as ActionButtonProps['status']}
                selected={!!currentStatus?.selected}
                disableableButtons={disableableButtons}
                indigoVerification={indigoVerification}
                onAction={onAction}
              />
            )
          );
        })}
      </div>
      <label className={classes.field}>
        <span className={classes.label}>Next #</span>
        <input
          className={classes.input}
          type="number"
          min={1}
          step={1}
          placeholder="auto"
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          data-testid="reaction-map-next-number-input"
          aria-label="Next reaction mapping number"
        />
      </label>
    </div>
  );
};

export { ReactionMappingMultiTool };
