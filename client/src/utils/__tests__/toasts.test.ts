import { toast } from 'react-toastify';

type ChangeCallback = (item: { id: string; type?: string; status: string }) => void;
let onChangeCallback: ChangeCallback = () => {};

jest.mock('react-toastify', () => ({
  toast: {
    dismiss: jest.fn(),
    onChange: jest.fn((cb: ChangeCallback) => {
      onChangeCallback = cb;
    }),
  },
}));

// Imported after the mock: the module subscribes to toast.onChange when loaded.
import { dismissSuccessToasts } from '../toasts';

describe('dismissSuccessToasts (DS-2)', () => {
  it('closes the success toasts on screen only', () => {
    onChangeCallback({ id: 'ok-1', type: 'success', status: 'added' });
    onChangeCallback({ id: 'ok-2', type: 'success', status: 'added' });
    onChangeCallback({ id: 'ko', type: 'error', status: 'added' });
    onChangeCallback({ id: 'undo', type: 'info', status: 'added' });
    onChangeCallback({ id: 'ok-2', type: 'success', status: 'removed' });

    dismissSuccessToasts();

    expect(toast.dismiss).toHaveBeenCalledTimes(1);
    expect(toast.dismiss).toHaveBeenCalledWith('ok-1');
  });
});
