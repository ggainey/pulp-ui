import { t } from '@lingui/core/macro';
import { useEffect, useRef } from 'react';
import {
  type CollectionVersionSearch,
  type ImportDetailType,
  type ImportListType,
  PulpStatus,
} from 'src/api';
import { Spinner, StatusIndicator, Tooltip } from 'src/components';
import './my-imports.scss';

interface IProps {
  apiError?: string;
  collection?: CollectionVersionSearch;
  empty?: boolean;
  followMessages?: boolean;
  loading?: boolean;
  selectedImport?: ImportListType;
  setFollowMessages?: (follow: boolean) => void;
  task?: ImportDetailType;
}

export function ImportConsole({
  apiError,
  collection,
  empty,
  followMessages,
  loading,
  selectedImport,
  setFollowMessages,
  task,
}: IProps) {
  const lastImport = useRef<HTMLDivElement>(null);

  const state = selectedImport?.state || task?.state || null;

  const inProgress = [PulpStatus.running, PulpStatus.waiting].includes(state);

  const scrollToBottom = () =>
    window.requestAnimationFrame(() =>
      lastImport.current?.scrollIntoView({ behavior: 'smooth' }),
    );

  // causes scrollToBottom via useEffect on followLogs change
  const startToFollow = () => setFollowMessages?.(!followMessages);

  useEffect(() => {
    if (!followMessages) {
      return;
    }

    if (!inProgress) {
      setFollowMessages?.(false);
    }

    scrollToBottom();
  }, [followMessages, inProgress]);

  const collectionPipeline = collection?.repository?.pulp_labels?.pipeline;
  const error = task?.error;

  const title =
    empty || !selectedImport ? null : (
      <div>
        <div className='title-bar'>
          <div>
            <span className='data-title'>{t`Status:`}</span>{' '}
            <StatusIndicator type='secondary' status={state} />
          </div>
          {selectedImport ? (
            <>
              <div>
                <span className='data-title'>{t`Approval status:`}</span>{' '}
                {!collection
                  ? t`waiting for import to finish`
                  : {
                      rejected: t`rejected`,
                      staging: t`waiting for approval`,
                      approved: t`approved`,
                    }[collectionPipeline] || t`could not be determined yet`}
              </div>
              <div>
                <span className='data-title'>{t`Version:`}</span>{' '}
                {selectedImport.version}
              </div>
            </>
          ) : null}

          {error?.code || error?.description || error?.traceback ? (
            <div>
              <span className='data-title'>{t`Error message:`}</span>{' '}
              {error.code}
              <pre>
                <code>{error.description}</code>
              </pre>
              <pre>
                <code>{error.traceback}</code>
              </pre>
            </div>
          ) : null}
        </div>
      </div>
    );

  if (loading || apiError) {
    return (
      <div className='pulp-import-console'>
        {title}
        <div className='pulp-import-loading message-list'>
          {apiError ? <div className='message'>{apiError}</div> : <Spinner />}
        </div>
      </div>
    );
  }

  const renderMessage = ({ level, message }, i) => (
    <div className='message' key={i}>
      <span className={level.toLowerCase()}>{message}&nbsp;</span>
    </div>
  );

  const messages = task ? task.messages : [];

  return (
    <div className='pulp-import-console' data-cy={'ImportConsole'}>
      {title}
      <div className='message-list'>
        <div
          className='log-follow-button'
          style={followMessages ? { color: '#5bb75b' } : {}}
        >
          <Tooltip
            position='left'
            content={inProgress ? t`Follow logs` : t`Scroll to end`}
          >
            <span
              onClick={inProgress ? startToFollow : scrollToBottom}
              className='fa fa-arrow-circle-down pulp-clickable'
            />
          </Tooltip>
        </div>

        {messages.map(renderMessage)}

        {messages.length === 0 ? (
          <div className='message'>
            <span className='error'>{t`No task messages available`}</span>
          </div>
        ) : null}

        {state === PulpStatus.completed && (
          <div className='message'>
            <br />
            <span className='success'>{t`Done`}</span>
          </div>
        )}

        {state === PulpStatus.failed && (
          <div className='message'>
            <br />
            <span className='failed'>{t`Failed`}</span>
          </div>
        )}
      </div>

      <div
        ref={lastImport}
        style={
          // Give the last element some extra height so that it doesn't cut off messages when scroling down to it.
          followMessages
            ? {
                height: '100px',
                width: '5px',
                position: 'relative',
                top: '-150px',
              }
            : null
        }
      />
    </div>
  );
}
