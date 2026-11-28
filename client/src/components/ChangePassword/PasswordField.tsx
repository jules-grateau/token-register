import React, { forwardRef, useState } from 'react';
import { PasswordInput } from '@mantine/core';
import { IconAlertTriangle, IconEye, IconEyeOff, IconInfoCircle } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import classes from './Password.module.css';

// docs/design/components.md: fields 48 px high, text 16 px (no iOS zoom). Inline on the input:
// Mantine's size variables (inline too) win over the theme class.
const FIELD = { height: 48, minHeight: 48, fontSize: 16 };
const FIELD_STYLES = { input: FIELD, innerInput: FIELD };
const EYE_STYLES = { width: 44, height: 44, minWidth: 44, minHeight: 44 };

interface PasswordFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: 'current-password' | 'new-password';
  /** Help under the field (rule), always visible. */
  description?: string;
  /** Error under the field: text + icon, never the color alone. */
  error?: string | null;
  disabled?: boolean;
}

/**
 * Password field of the account forms (D-064), like the login one: masked by default, its own
 * eye (44 x 44, labelled), label above.
 */
export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ label, name, value, onChange, autoComplete, description, error, disabled }, ref) => {
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);
    return (
      <PasswordInput
        ref={ref}
        label={label}
        name={name}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        autoComplete={autoComplete}
        autoCapitalize="none"
        autoCorrect="off"
        disabled={disabled}
        description={description}
        inputWrapperOrder={['label', 'input', 'description', 'error']}
        error={
          error ? (
            <span className={classes.fieldError}>
              <IconAlertTriangle size={16} aria-hidden style={{ flex: 'none', marginTop: 2 }} />
              <span>{error}</span>
            </span>
          ) : undefined
        }
        visible={visible}
        onVisibilityChange={setVisible}
        rightSectionWidth={48}
        styles={{ ...FIELD_STYLES, visibilityToggle: EYE_STYLES }}
        classNames={{ visibilityToggle: classes.eye, description: classes.help }}
        visibilityToggleIcon={({ reveal }) =>
          reveal ? <IconEyeOff size={20} aria-hidden /> : <IconEye size={20} aria-hidden />
        }
        visibilityToggleButtonProps={{
          'aria-label': visible ? t('auth.hide_password') : t('auth.show_password'),
          tabIndex: 0,
        }}
      />
    );
  }
);
PasswordField.displayName = 'PasswordField';

/** Message block of a form (role="alert" for an error, "status" for information). */
export const FormMessage: React.FC<{ tone: 'error' | 'info'; children: React.ReactNode }> = ({
  tone,
  children,
}) => (
  <div className={classes.message} data-tone={tone} role={tone === 'error' ? 'alert' : 'status'}>
    {tone === 'error' ? (
      <IconAlertTriangle size={20} aria-hidden className={classes.messageIcon} />
    ) : (
      <IconInfoCircle size={20} aria-hidden className={classes.messageIcon} />
    )}
    <span>{children}</span>
  </div>
);

/** Same field sizes for the text inputs of these forms (username). */
export const FIELD_INPUT_STYLES = FIELD_STYLES;
