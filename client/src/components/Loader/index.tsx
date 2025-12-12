import { Loader as MantineLoader, Overlay, Stack, Text, Center } from '@mantine/core';

interface LoaderProps {
  isLoading: boolean;
  text?: string;
}

const Loader: React.FC<LoaderProps> = ({ isLoading, text }) => {
  if (!isLoading) {
    return null;
  }

  return (
    <Overlay blur={3} zIndex={1000}>
      <Center h="100%">
        <Stack align="center" gap="md">
          <MantineLoader size="lg" data-testid="loading" />
          {text && <Text size="sm">{text}</Text>}
        </Stack>
      </Center>
    </Overlay>
  );
};

export default Loader;
