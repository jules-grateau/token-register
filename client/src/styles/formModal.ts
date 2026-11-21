import classes from './formModal.module.css';

/** Height of the action bar buttons, shared with the bar height (variables.css). */
export const FORM_ACTION_BUTTON_HEIGHT = 'var(--form-actions-button-height)';

/**
 * Class names of the product / category form modals (D-052, #46). On phone (full-screen modal)
 * the form fills the screen so that the action bar sits at the bottom; desktop gets only the
 * sticky bar.
 */
export function formModalClassNames(isPhone: boolean) {
  return {
    modal: isPhone ? { content: classes.phoneContent, body: classes.phoneBody } : undefined,
    form: isPhone ? classes.phoneForm : undefined,
    fields: isPhone ? classes.phoneFields : undefined,
    actions: isPhone ? `${classes.actions} ${classes.phoneActions}` : classes.actions,
  };
}
