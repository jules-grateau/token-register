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
      <Button ref={ref} onClick={onClick} variant="outline" fullWidth h={{ base: 100, md: 200 }}>
        <Stack gap="sm">
          <Text fw={600} size="md">
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
