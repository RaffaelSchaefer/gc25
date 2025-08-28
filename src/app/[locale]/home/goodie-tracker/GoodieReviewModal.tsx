"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending?: boolean;
  goodieName: string;
  onSubmit: (data: { rating: number; image?: File | null }) => void;
}

export function GoodieReviewModal({
  open,
  onOpenChange,
  pending,
  goodieName,
  onSubmit,
}: Props) {
  const t = useTranslations("goodies");
  const [rating, setRating] = useState(5);
  const [file, setFile] = useState<File | null>(null);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-lg bg-background p-4 shadow-lg border">
          <Dialog.Title className="text-lg font-bold mb-4">
            {t("modal.review_title", { name: goodieName })}
          </Dialog.Title>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rating">{t("modal.rating")}</Label>
              <select
                id="rating"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-full mt-1 border rounded p-2 bg-background"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="photo">{t("modal.photo")}</Label>
              <Input
                id="photo"
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <Button
              onClick={() => onSubmit({ rating, image: file })}
              disabled={pending}
              className="w-full"
            >
              {pending ? t("creating") : t("modal.submit_review")}
            </Button>
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
}
