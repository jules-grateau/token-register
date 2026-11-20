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
import ConfirmationModal from '../ConfirmationModal';
import CatalogIconPicker from '../CatalogIcon/CatalogIconPicker';
import { isCatalogIconKey } from '../../config/catalogIcons';

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

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isOpen,
  onClose,
  category,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [createCategory] = useCreateCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [formValuesForConfirmation, setFormValuesForConfirmation] =
    useState<CategoryFormValues | null>(null);

  const isEditMode = !!category;

  const form = useForm<CategoryFormValues>({
    initialValues: {
      name: category?.name || '',
      icon: iconOf(category),
    },
    validate: {
      name: (value) => (value.trim() ? null : t('errors.required')),
    },
  });

  useEffect(() => {
    if (isOpen && category) {
      form.setValues({ name: category.name, icon: iconOf(category) });
    } else if (isOpen && !category) {
      form.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, category]);

  const handleSubmit = (values: CategoryFormValues) => {
    if (isEditMode) {
      setFormValuesForConfirmation(values);
      setShowConfirmation(true);
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

  const handleUpdate = async () => {
    if (!category || !formValuesForConfirmation) return;

    try {
      await updateCategory({
        id: category.id,
        name: formValuesForConfirmation.name,
        icon: formValuesForConfirmation.icon,
      }).unwrap();
      toast.success(t('category_management.updated'));
      setShowConfirmation(false);
      setFormValuesForConfirmation(null);
      form.reset();
      onClose();
    } catch (err) {
      toast.error(extractApiError(err, t('errors.unknown')), { autoClose: 5000 });
      setShowConfirmation(false);
    }
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setFormValuesForConfirmation(null);
  };

  return (
    <>
      <Modal
        opened={isOpen && !showConfirmation}
        onClose={onClose}
        title={isEditMode ? t('category_management.edit') : t('category_management.new')}
        centered
        closeButtonProps={{ 'aria-label': t('close') }}
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
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
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={onClose}>
                {t('cancel')}
              </Button>
              <Button type="submit">{isEditMode ? t('actions.save') : t('actions.create')}</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {isEditMode && (
        <ConfirmationModal
          isOpen={showConfirmation}
          onClose={handleCancel}
          onConfirm={() => void handleUpdate()}
          title={t('confirmation')}
        >
          {t('category_management.edit')} &quot;{category?.name}&quot;?
        </ConfirmationModal>
      )}
    </>
  );
};

export default CategoryFormModal;
