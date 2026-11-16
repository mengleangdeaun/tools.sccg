"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useAssets } from "@/context/assets-context";
import { MAX_NAME_LENGTH } from "@/lib/auth/permissions";
import { errorText } from "@/lib/request";
import { Input } from "@/components/ui/input";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { CONTROL_HEIGHT, Field, FormFooter } from "@/components/ui/form-layout";
import { PersonAvatar } from "@/components/shared/person-avatar";

export function ProfileDialog({ onClose }: { onClose: () => void }) {
  const { currentUser, updateProfile } = useAuth();
  const { refreshData, showToast } = useAssets();
  const [name, setName] = useState(currentUser?.name ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!currentUser) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setIsSaving(true);
      await updateProfile(name.trim());
      showToast("Your name was updated");
      refreshData(); // So the Team page and pickers show the new name.
      onClose();
    } catch (err: unknown) {
      setError(errorText(err, "Could not update your name."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ResponsiveModal
      open
      onClose={onClose}
      title="Your profile"
      description="How you appear to your team."
      footer={
        <FormFooter formId="profile-form" error={error} submitting={isSaving} disabled={!name.trim()} submitLabel="Save" onCancel={onClose} />
      }
    >
      <form id="profile-form" onSubmit={submit} className="space-y-5">
        <div className="flex items-center gap-4">
          <PersonAvatar name={name || currentUser.email} avatarUrl={currentUser.avatar_url} size="lg" />
          <div className="min-w-0 space-y-0.5 text-sm">
            <p className="truncate font-medium text-foreground">{currentUser.email}</p>
            <p className="text-muted-foreground">{currentUser.role_name}</p>
            <p className="text-xs text-muted-foreground">Your photo comes from your Google account.</p>
          </div>
        </div>
        <Field label="Name" htmlFor="profile-name" required>
          <Input
            id="profile-name"
            className={CONTROL_HEIGHT}
            value={name}
            maxLength={MAX_NAME_LENGTH}
            autoComplete="name"
            autoCapitalize="words"
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Field>
      </form>
    </ResponsiveModal>
  );
}
