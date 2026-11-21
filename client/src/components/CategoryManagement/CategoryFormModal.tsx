import { useState, useEffect } from 'react';
import { Modal, TextInput, Button, Group, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import type { CatalogIconKey, CategoryType } from 'shared-ts';
import { useCreateCategoryMutation, useUpdateCategoryMutation } from '../../services/categories';
import { setSelectedCategory } from '../../redux/selectedCategorySlice';
import { extractApiError } from '../../utils/extractApiError';
import UnsavedChangesModal, { useUnsavedChangesGuard } from '../UnsavedChangesModal';
import CatalogIconPicker from '../CatalogIcon/CatalogIconPicker';
import { isCatalogIconKey } from '../../config/catalogIcons';
import { isPhoneMode, useLayoutMode } from '../../hooks/useLayoutMode';
import { FORM_ACTION_BUTTON_HEIGHT, formModalClassNames } from '../../styles/formModal';

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: CategoryType | null;
}

interface CategoryFormValues {
  name: string;
  /** D-047: optional, "Aucune" (null) by default. */
  icon: CatalogIconKey | null;
}

const iconOf = (category?: CategoryType | null): CatalogIconKey | null =>
  isCatalogIconKey(category?.icon) ? category.icon : null;

/** Values shown when the form opens: the category, or an empty form in creation. */
const valuesOf = (category?: CategoryType | null): CategoryFormValues => ({
  name: category?.name || '',
  icon: iconOf(category),
});

const isSameValues = (a: CategoryFormValues, b: CategoryFormValues): boolean =>
  a.name === b.name && a.icon === b.icon;

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isOpen,
  onClose,
  category,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const isPhone = isPhoneMode(useLayoutMode());
  const formClasses = formModalClassNames(isPhone);
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
  // TL-1 of PR #45: one request at a time, a double click must not create a duplicate.
  const isSaving = isCreating || isUpdating;
  const [openedValues, setOpenedValues] = useState<CategoryFormValues>(() => valuesOf(category));

  const isEditMode = !!category;

  const form = useForm<CategoryFormValues>({
    initialValues: valuesOf(category),
    validate: {
      name: (value) => (value.trim() ? null : t('errors.required')),
    },
  });

  useEffect(() => {
    if (isOpen) {
      const values = valuesOf(category);
      form.setValues(values);
      form.clearErrors();
      setOpenedValues(values);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, category]);

  const hasChanges = () => !isSameValues(form.getValues(), openedValues);
  const guard = useUnsavedChangesGuard(hasChanges, onClose);

  // D-052: saved at once, without confirmation; nothing changed in edit mode = just close.
  const handleSubmit = (values: CategoryFormValues) => {
    if (isSaving) return;
    if (isEditMode) {
      if (isSameValues(values, openedValues)) {
        onClose();
        return;
      }
      void handleUpdate(values);
    } else {
      void handleCreate(values);
    }
  };

  const handleCreate = async (values: CategoryFormValues) => {
    try {
      const newCategory = await createCategory({ name: values.name, icon: values.icon }).unwrap();
      toast.success(t('category_management.created'));
      dispatch(setSelectedCategory(newCategory.id));
      form.reset();
      onClose();
    } catch (err) {
      toast.error(extractApiError(err, t('errors.unknown')), { autoClose: 5000 });
    }
  };

  const handleUpdate = async (values: CategoryFormValues) => {
    if (!category) return;

    try {
      await updateCategory({
        id: category.id,
        name: values.name,
        icon: values.icon,
      }).unwrap();
      toast.success(t('category_management.updated'));
      form.reset();
      onClose();
    } catch (err) {
      toast.error(extractApiError(err, t('errors.unknown')), { autoClose: 5000 });
    }
  };

  const submit = form.onSubmit(handleSubmit);

  return (
    <>
      <Modal
        opened={isOpen && !guard.isPromptOpen}
        onClose={guard.requestClose}
        title={isEditMode ? t('category_management.edit') : t('category_management.new')}
        centered
        fullScreen={isPhone}
        closeButtonProps={{ size: 44, 'aria-label': t('close') }}
        classNames={formClasses.modal}
      >
        <form onSubmit={submit} className={formClasses.form}>
          <Stack className={formClasses.fields}>
            <TextInput
              label={t('category_management.form.name')}
              placeholder={t('category_management.form.name')}
              required
              {...form.getInputProps('name')}
            />
            <CatalogIconPicker
              value={form.values.icon}
              onChange={(icon) => form.setFieldValue('icon', icon)}
            />
            {/* docs/design/components.md, "Modales": "Annuler" left, main action right, >= 44 px.
                D-052: the bar sticks to the bottom so "Enregistrer" stays visible on short screens. */}
            <Group justify="flex-end" gap={8} grow={isPhone} className={formClasses.actions}>
              <Button
                variant="default"
                h={FORM_ACTION_BUTTON_HEIGHT}
                fw={600}
                onClick={guard.requestClose}
              >
                {t('cancel')}
              </Button>
              <Button type="submit" h={FORM_ACTION_BUTTON_HEIGHT} fw={600} loading={isSaving}>
                {isEditMode ? t('actions.save') : t('actions.create')}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <UnsavedChangesModal
        isOpen={isOpen && guard.isPromptOpen}
        onKeepEditing={guard.keepEditing}
        onDiscard={guard.discard}
        isSaving={isSaving}
        onSave={() => {
          guard.keepEditing();
          submit();
        }}
      />
    </>
  );
};

export default CategoryFormModal;
