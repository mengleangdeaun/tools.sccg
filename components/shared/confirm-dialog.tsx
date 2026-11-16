"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { FormActions } from "@/components/ui/form-layout";
import { ResponsiveModal } from "@/components/ui/responsive-modal";

export interface ConfirmOptions {
  title: string;
  /** What happens, and what is kept. Shown as the body. */
  description: React.ReactNode;
  /** The confirm button's text, e.g. "Archive". */
  confirmLabel?: string;
  /** Red confirm button, for actions that remove or archive something. Default true. */
  destructive?: boolean;
}

type Confirm = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = React.createContext<Confirm | null>(null);

/**
 * In-app replacement for window.confirm: a dialog on desktop and a bottom drawer on phones.
 * `if (!(await confirm({ title: "Archive this?" }))) return;`
 */
export function useConfirm(): Confirm {
  const confirm = React.useContext(ConfirmContext);
  if (!confirm) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return confirm;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = React.useState<{ options: ConfirmOptions; resolve: (ok: boolean) => void } | null>(null);

  const confirm = React.useCallback<Confirm>(
    (options) =>
      new Promise((resolve) => {
        // A second request answers the first with "no", so no caller is left waiting.
        setRequest((previous) => {
          previous?.resolve(false);
          return { options, resolve };
        });
      }),
    []
  );

  const answer = (ok: boolean) => {
    request?.resolve(ok);
    setRequest(null);
  };

  const { title, description, confirmLabel = "Confirm", destructive = true } = request?.options ?? { title: "", description: "" };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {request && (
        <ResponsiveModal
          open
          onClose={() => answer(false)}
          title={title}
          footer={
            <FormActions>
              <Button type="button" variant="outline" onClick={() => answer(false)}>
                Cancel
              </Button>
              <Button type="button" variant={destructive ? "destructive" : "default"} onClick={() => answer(true)}>
                {confirmLabel}
              </Button>
            </FormActions>
          }
        >
          <p className="text-sm text-muted-foreground">{description}</p>
        </ResponsiveModal>
      )}
    </ConfirmContext.Provider>
  );
}
