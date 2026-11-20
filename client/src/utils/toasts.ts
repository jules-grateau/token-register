import { toast, type Id } from 'react-toastify';

// Success toasts currently on screen, to close them without touching errors or "Annuler" (DS-2).
const activeSuccessToasts = new Set<Id>();

// `typeof` guard: tests mock react-toastify without onChange.
if (typeof toast.onChange === 'function') {
  toast.onChange((item) => {
    if (item.type !== 'success') return;
    if (item.status === 'removed') activeSuccessToasts.delete(item.id);
    else activeSuccessToasts.add(item.id);
  });
}

/** Closes the success toasts on screen; error and info toasts stay. */
export function dismissSuccessToasts(): void {
  activeSuccessToasts.forEach((id) => toast.dismiss(id));
}
