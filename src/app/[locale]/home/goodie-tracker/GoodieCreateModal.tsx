"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface DraftBase {
  name: string;
  location: string;
  instructions: string;
  type: "GIFT" | "FOOD" | "DRINK";
  date?: string;
  registrationUrl?: string;
  image?: ArrayBuffer | null;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (
    draft: DraftBase,
    opts: { mode: "create" | "edit"; id?: string },
  ) => Promise<void> | void;
  pending?: boolean;
  initialGoodie?: { id: string } & DraftBase;
}

export function GoodieCreateModal({
  open,
  onOpenChange,
  onSubmit,
  pending,
  initialGoodie,
}: Props) {
  const t = useTranslations("goodies");
  const [form, setForm] = useState<{
    name: string;
    location: string;
    instructions: string;
    type: "GIFT" | "FOOD" | "DRINK";
    date: string;
    registrationUrl: string;
  }>({
    name: "",
    location: "",
    instructions: "",
    type: "GIFT",
    date: "",
    registrationUrl: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [touched, setTouched] = useState<{ [k: string]: boolean }>({});
  const nameRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      if (initialGoodie) {
        setForm({
          name: initialGoodie.name,
          location: initialGoodie.location,
          instructions: initialGoodie.instructions,
          type: initialGoodie.type,
          date: initialGoodie.date || "",
          registrationUrl: initialGoodie.registrationUrl || "",
        });
      }
      if (nameRef.current) setTimeout(() => nameRef.current?.focus(), 10);
    } else {
      // reset when closing in create mode only
      if (!initialGoodie) {
        setForm({
          name: "",
          location: "",
          instructions: "",
          type: "GIFT",
          date: "",
          registrationUrl: "",
        });
        setImageFile(null);
        setImageError(null);
        setTouched({});
      }
    }
  }, [open, initialGoodie]);

  const MAX_IMAGE_KB = 400; // ~400KB inline
  const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/gif"]; // gif maybe small

  function validateUrl(url: string) {
    if (!url) return true;
    try {
      const u = new URL(url);
      return u.protocol === "https:";
    } catch {
      return false;
    }
  }

  const errors: Record<string, string> = {};
  if (!form.name.trim()) errors.name = t("validation.name_required");
  if (!form.location.trim())
    errors.location = t("validation.location_required");
  if (!form.instructions.trim())
    errors.instructions = t("validation.instructions_required");
  if (form.registrationUrl && !validateUrl(form.registrationUrl))
    errors.registrationUrl = t("validation.url_invalid");
  if (imageError) errors.image = imageError;

  const canSubmit = Object.keys(errors).length === 0;

  const onFileChange = (file: File | null) => {
    setImageFile(file);
    setImageError(null);
    if (!file) return;
    if (!ALLOWED.includes(file.type)) {
      setImageError(t("validation.image_type"));
      return;
    }
    const kb = file.size / 1024;
    if (kb > MAX_IMAGE_KB) {
      setImageError(t("validation.image_too_large", { size: MAX_IMAGE_KB }));
      return;
    }
  };

  const submit = async () => {
    if (!canSubmit) {
      setTouched({
        name: true,
        location: true,
        instructions: true,
        registrationUrl: true,
        image: true,
      });
      return;
    }
    let imageBuf: ArrayBuffer | undefined;
    if (imageFile) imageBuf = await imageFile.arrayBuffer();
    await onSubmit(
      {
        ...form,
        date: form.date || undefined,
        registrationUrl: form.registrationUrl || undefined,
        image: imageBuf || null,
      },
      { mode: initialGoodie ? "edit" : "create", id: initialGoodie?.id },
    );
    if (!initialGoodie) {
      setForm({
        name: "",
        location: "",
        instructions: "",
        type: "GIFT",
        date: "",
        registrationUrl: "",
      });
      setImageFile(null);
      setImageError(null);
      setTouched({});
    }
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md w-full space-y-4 px-4">
        <SheetHeader>
          <SheetTitle>
            {initialGoodie
              ? t("modal.edit_title", { name: initialGoodie.name })
              : t("modal.title")}
          </SheetTitle>
        </SheetHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>{t("fields.name")}</Label>
            <Input
              ref={nameRef}
              placeholder={t("placeholders.name")!}
              value={form.name}
              onBlur={() => setTouched((t) => ({ ...t, name: true }))}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              aria-invalid={!!errors.name && touched.name}
              aria-describedby={
                errors.name && touched.name ? "err-name" : undefined
              }
            />
            {touched.name && errors.name && (
              <p id="err-name" className="text-xs text-red-600">
                {errors.name}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label>{t("fields.location")}</Label>
            <Input
              placeholder={t("placeholders.location")!}
              value={form.location}
              onBlur={() => setTouched((t) => ({ ...t, location: true }))}
              onChange={(e) =>
                setForm((f) => ({ ...f, location: e.target.value }))
              }
              aria-invalid={!!errors.location && touched.location}
              aria-describedby={
                errors.location && touched.location ? "err-location" : undefined
              }
            />
            {touched.location && errors.location && (
              <p id="err-location" className="text-xs text-red-600">
                {errors.location}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label>{t("fields.instructions")}</Label>
            <Textarea
              rows={4}
              placeholder={t("placeholders.instructions")!}
              value={form.instructions}
              onBlur={() => setTouched((t) => ({ ...t, instructions: true }))}
              onChange={(e) =>
                setForm((f) => ({ ...f, instructions: e.target.value }))
              }
              aria-invalid={!!errors.instructions && touched.instructions}
              aria-describedby={
                errors.instructions && touched.instructions
                  ? "err-instructions"
                  : undefined
              }
            />
            {touched.instructions && errors.instructions && (
              <p id="err-instructions" className="text-xs text-red-600">
                {errors.instructions}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label>{t("fields.registrationUrl")}</Label>
            <Input
              placeholder={t("placeholders.registrationUrl")!}
              value={form.registrationUrl}
              onBlur={() =>
                setTouched((t) => ({ ...t, registrationUrl: true }))
              }
              onChange={(e) =>
                setForm((f) => ({ ...f, registrationUrl: e.target.value }))
              }
              aria-invalid={!!errors.registrationUrl && touched.registrationUrl}
              aria-describedby={
                errors.registrationUrl && touched.registrationUrl
                  ? "err-url"
                  : undefined
              }
            />
            {touched.registrationUrl && errors.registrationUrl && (
              <p id="err-url" className="text-xs text-red-600">
                {errors.registrationUrl}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label>{t("fields.image")}</Label>
            <Input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onBlur={() => setTouched((t) => ({ ...t, image: true }))}
              onChange={(e) => onFileChange(e.target.files?.[0] || null)}
              aria-invalid={!!errors.image && touched.image}
              aria-describedby={
                errors.image && touched.image ? "err-image" : undefined
              }
            />
            {imageFile && !errors.image && (
              <p className="text-[10px] text-muted-foreground">
                {(imageFile.size / 1024).toFixed(1)} KB
              </p>
            )}
            {touched.image && errors.image && (
              <p id="err-image" className="text-xs text-red-600">
                {errors.image}
              </p>
            )}
          </div>
          <div className="flex gap-2 flex-wrap pt-1">
            {(["GIFT", "FOOD", "DRINK"] as const).map((tp) => (
              <Button
                key={tp}
                type="button"
                size="sm"
                variant={form.type === tp ? "default" : "outline"}
                onClick={() =>
                  setForm((f) => ({ ...f, type: tp as typeof f.type }))
                }
              >
                {t(`types.${tp.toLowerCase()}`)}
              </Button>
            ))}
          </div>
          <div className="space-y-1">
            <Label>Date/Time</Label>
            <Input
              type="datetime-local"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
          </div>
        </div>
        <SheetFooter className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("modal.cancel")}
          </Button>
          <Button disabled={!canSubmit || pending} onClick={submit}>
            {pending
              ? initialGoodie
                ? t("updating")
                : t("creating")
              : initialGoodie
                ? t("modal.save_changes")
                : t("modal.create")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
