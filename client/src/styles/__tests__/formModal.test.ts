import { formModalClassNames } from '../formModal';

describe('formModalClassNames', () => {
  it('fills the screen on phone, with the bar at the bottom (#46)', () => {
    expect(formModalClassNames(true)).toEqual({
      modal: { content: 'phoneContent', body: 'phoneBody' },
      form: 'phoneForm',
      fields: 'phoneFields',
      actions: 'actions phoneActions',
    });
  });

  it('keeps only the sticky bar on desktop', () => {
    expect(formModalClassNames(false)).toEqual({
      modal: undefined,
      form: undefined,
      fields: undefined,
      actions: 'actions',
    });
  });
});
