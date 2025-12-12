import { Stack, Text, Button } from '@mantine/core';
import { forwardRef } from 'react';

interface ClickableCardProps {
  title: string;
  onClick: () => void;
  children?: React.ReactNode;
}

const ClickableCard = forwardRef<HTMLButtonElement, ClickableCardProps>(
  ({ title, onClick, children }, ref) => {
    return (
      <Button
        ref={ref}
        onClick={onClick}
        h={{ base: 100, md: 200 }}
        variant="default"
        radius="sm"
        p="lg"
        styles={{
          label: { whiteSpace: 'normal', height: '100%' },
          inner: { height: '100%' },
        }}
      >
        <Stack gap="sm" align="center" justify="center">
          <Text fw={700} size="lg" ta="center">
            {title}
          </Text>
          {children}
        </Stack>
      </Button>
    );
  }
);

ClickableCard.displayName = 'ClickableCard';

export default ClickableCard;
