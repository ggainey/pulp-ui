import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useState } from 'react';
import { UserAPI, type UserType } from 'src/api';
import { DeleteModal } from 'src/components';
import { useUserContext } from 'src/user-context';
import { jsxErrorMessage, mapErrorMessages } from 'src/utilities';

interface IProps {
  addAlert: (message, variant, description?) => void;
  closeModal: (didDelete: boolean) => void;
  isOpen: boolean;
  user?: UserType;
}

export const DeleteUserModal = ({
  addAlert,
  closeModal,
  isOpen,
  user,
}: IProps) => {
  const [waiting, setWaiting] = useState(false);
  const { credentials } = useUserContext();

  if (!user || !isOpen) {
    return null;
  }

  return (
    <DeleteModal
      cancelAction={() => closeModal(false)}
      deleteAction={() => deleteUser()}
      isDisabled={waiting || user.username === credentials.username}
      spinner={waiting}
      title={t`Delete user?`}
    >
      {user.username === credentials.username ? (
        t`Deleting yourself is not allowed.`
      ) : (
        <Trans>
          <b>{user.username}</b> will be permanently deleted.
        </Trans>
      )}
    </DeleteModal>
  );

  function deleteUser() {
    setWaiting(true);
    UserAPI.delete(user.id)
      .then(() => waitForDeleteConfirm())
      .catch((err) => {
        addAlert(
          t`User "${user.username}" could not be deleted.`,
          'danger',
          mapErrorMessages(err)['__nofield'],
        );
        closeModal(false);
      })
      .finally(() => setWaiting(false));
  }

  // Wait for the user to actually get removed from the database before closing
  function waitForDeleteConfirm() {
    UserAPI.get(user.id as unknown as string)
      .then(async () => {
        // wait half a second
        await new Promise((r) => setTimeout(r, 500));
        waitForDeleteConfirm();
      })
      .catch((err) => {
        const { status, statusText } = err.response;
        if (err.response.status === 404) {
          addAlert(
            t`User "${user.username}" has been successfully deleted.`,
            'success',
          );
          closeModal(true);
        } else {
          addAlert(
            t`User "${user.username}" could not be deleted.`,
            'danger',
            jsxErrorMessage(status, statusText),
          );
        }

        setWaiting(false);
      });
  }
};
