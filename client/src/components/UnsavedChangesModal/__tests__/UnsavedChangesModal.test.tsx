import { screen, fireEvent } from '@testing-library/react';
import UnsavedChangesModal from '../index';
import { render } from '../../../utils/testUtils';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const handlers = { onKeepEditing: jest.fn(), onDiscard: jest.fn(), onSave: jest.fn() };

const renderPrompt = () => render(<UnsavedChangesModal isOpen={true} {...handlers} />);

// D-052: "Annuler" (back to the form), "Ne pas enregistrer", "Enregistrer".
describe('UnsavedChangesModal', () => {
  afterEach(() => jest.clearAllMocks());

  it('shows the three buttons, "cancel" first and "save" last (D-050)', () => {
    renderPrompt();
    const labels = screen
      .getAllByRole('button')
      .map((b) => b.textContent)
      .filter(Boolean);
    expect(labels).toEqual(['cancel', 'unsaved_changes.discard', 'actions.save']);
  });

  it.each([
    ['cancel', 'onKeepEditing'],
    ['close', 'onKeepEditing'],
    ['unsaved_changes.discard', 'onDiscard'],
    ['actions.save', 'onSave'],
  ] as const)('"%s" calls %s', (name, handler) => {
    renderPrompt();
    fireEvent.click(screen.getByRole('button', { name }));
    expect(handlers[handler]).toHaveBeenCalledTimes(1);
  });

  it('"save" is disabled while the form is being saved', () => {
    render(<UnsavedChangesModal isOpen={true} {...handlers} isSaving />);
    expect(screen.getByRole('button', { name: 'actions.save' })).toBeDisabled();
  });

  it('Escape goes back to the form', () => {
    renderPrompt();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(handlers.onKeepEditing).toHaveBeenCalled();
    expect(handlers.onDiscard).not.toHaveBeenCalled();
  });
});
