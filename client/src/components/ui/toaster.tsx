"use client";

import {
  Toaster as ChakraToaster,
  Portal,
  Spinner,
  Stack,
  Toast,
  createToaster,
} from "@chakra-ui/react";

type Placement =
  | "top"
  | "top-start"
  | "top-end"
  | "bottom"
  | "bottom-start"
  | "bottom-end";

// create a map of toasters by placement
const placements: Placement[] = [
  "top",
  "top-start",
  "top-end",
  "bottom",
  "bottom-start",
  "bottom-end",
];

const toasterMap = Object.fromEntries(
  placements.map((p) => [
    p,
    createToaster({ placement: p, pauseOnPageIdle: true }),
  ])
) as Record<Placement, ReturnType<typeof createToaster>>;

// unified toaster.create API with position support
export const toaster = {
  create: ({
    position = "bottom-end",
    ...options
  }: Parameters<(typeof toasterMap)["bottom-end"]["create"]>[0] & {
    position?: Placement;
  }) => {
    toasterMap[position].create(options);
  },
};

export const Toaster = () => {
  return (
    <Portal>
      {placements.map((placement) => (
        <ChakraToaster
          key={placement}
          toaster={toasterMap[placement]}
          insetInline={{ mdDown: "4" }}
        >
          {(toast) => (
            <Toast.Root width={{ md: "sm" }}>
              {toast.type === "loading" ? (
                <Spinner size="sm" color="blue.solid" />
              ) : (
                <Toast.Indicator />
              )}
              <Stack gap="1" flex="1" maxWidth="100%">
                {toast.title && <Toast.Title>{toast.title}</Toast.Title>}
                {toast.description && (
                  <Toast.Description>{toast.description}</Toast.Description>
                )}
              </Stack>
              {toast.action && (
                <Toast.ActionTrigger>{toast.action.label}</Toast.ActionTrigger>
              )}
              {toast.meta?.closable && <Toast.CloseTrigger />}
            </Toast.Root>
          )}
        </ChakraToaster>
      ))}
    </Portal>
  );
};
