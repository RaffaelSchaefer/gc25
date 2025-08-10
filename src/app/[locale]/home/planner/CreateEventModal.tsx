"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { de as dfnsDe, enUS as dfnsEnUS } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  MapPin,
  X,
  Plus,
  Star,
  Check,
  ChevronRight,
  Users,
  Joystick,
  Utensils,
  PartyPopper,
  Plane,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { EventCategory } from "@prisma/client";

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (eventData: CreateEventData) => void;
  initialData?: Partial<CreateEventData>;
  titleOverride?: string;
  submitTextOverride?: string;
}

export interface CreateEventData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  location?: string;
  url?: string;
  category: EventCategory;
  isPublic: boolean;
  isFixed: boolean;
}

type Step = 0 | 1 | 2;

// replaced by lucide categoryIconsMap

const categoryColors = {
  MEETUP: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  EXPO: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  FOOD: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  PARTY: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  TRAVEL: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  TOURNAMENT: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export function CreateEventModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  titleOverride,
  submitTextOverride,
}: CreateEventModalProps) {
  const t = useTranslations("planner");
  const locale = useLocale();
  const dayPickerLocale = useMemo(() => {
    const code = (locale || "en").toLowerCase();
    if (code.startsWith("de")) return dfnsDe;
    return dfnsEnUS;
  }, [locale]);
  const [step, setStep] = useState<Step>(0);

  // Tone for preview card etc. Include dark variants for consistent contrast
  const categoryText: Record<EventCategory, string> = {
    MEETUP: "text-indigo-600 dark:text-indigo-300",
    EXPO: "text-violet-600 dark:text-violet-300",
    FOOD: "text-amber-700 dark:text-amber-300",
    PARTY: "text-pink-600 dark:text-pink-300",
    TRAVEL: "text-emerald-600 dark:text-emerald-300",
    TOURNAMENT: "text-rose-600 dark:text-rose-300",
  };

  const categoryTokens: Record<
    EventCategory,
    {
      text: string;
      ring: string;
      gradFrom: string;
      gradTo: string;
      fieldBg: string;
      stepFrom: string;
      stepTo: string;
      titleTo: string;
      btnFrom: string;
      btnTo: string;
      btnRing: string;
      btnHover: string;
      glowBg: string;
      focusRing: string;
      switchChecked: string;
      solidBg: string;
      solidBorder: string;
    }
  > = {
    MEETUP: {
      text: "text-indigo-600 dark:text-indigo-300",
      ring: "ring-indigo-500/30 dark:ring-indigo-400/30",
      gradFrom: "from-indigo-200 dark:from-indigo-900/40",
      gradTo: "to-indigo-500/0 dark:to-indigo-950/0",
      fieldBg: "bg-indigo-50 dark:bg-indigo-900/40",
      stepFrom: "from-indigo-500 dark:from-indigo-600",
      stepTo: "to-indigo-400 dark:to-indigo-500",
      titleTo: "to-indigo-500/70 dark:to-indigo-400/70",
      btnFrom: "from-indigo-600 dark:from-indigo-500",
      btnTo: "to-indigo-500 dark:to-indigo-400",
      btnRing: "ring-indigo-400/40 dark:ring-indigo-500/30",
      btnHover:
        "hover:from-indigo-500 hover:to-indigo-600 dark:hover:from-indigo-400 dark:hover:to-indigo-500",
      glowBg: "bg-indigo-500/10 dark:bg-indigo-400/10",
      focusRing:
        "focus-visible:ring-indigo-500 dark:focus-visible:ring-indigo-400",
      switchChecked:
        "data-[state=checked]:bg-indigo-600 dark:data-[state=checked]:bg-indigo-500",
      solidBg: "bg-indigo-600 dark:bg-indigo-500",
      solidBorder: "border-indigo-600 dark:border-indigo-500",
    },
    EXPO: {
      text: "text-violet-600 dark:text-violet-300",
      ring: "ring-violet-500/30 dark:ring-violet-400/30",
      gradFrom: "from-violet-200 dark:from-violet-900/40",
      gradTo: "to-violet-500/0 dark:to-violet-950/0",
      fieldBg: "bg-violet-50 dark:bg-violet-900/40",
      stepFrom: "from-violet-500 dark:from-violet-600",
      stepTo: "to-violet-400 dark:to-violet-500",
      titleTo: "to-violet-500/70 dark:to-violet-400/70",
      btnFrom: "from-violet-600 dark:from-violet-500",
      btnTo: "to-violet-500 dark:to-violet-400",
      btnRing: "ring-violet-400/40 dark:ring-violet-500/30",
      btnHover:
        "hover:from-violet-500 hover:to-violet-600 dark:hover:from-violet-400 dark:hover:to-violet-500",
      glowBg: "bg-violet-500/10 dark:bg-violet-400/10",
      focusRing:
        "focus-visible:ring-violet-500 dark:focus-visible:ring-violet-400",
      switchChecked:
        "data-[state=checked]:bg-violet-600 dark:data-[state=checked]:bg-violet-500",
      solidBg: "bg-violet-600 dark:bg-violet-500",
      solidBorder: "border-violet-600 dark:border-violet-500",
    },
    FOOD: {
      text: "text-amber-700 dark:text-amber-300",
      ring: "ring-amber-500/30 dark:ring-amber-400/30",
      gradFrom: "from-amber-200 dark:from-amber-900/30",
      gradTo: "to-amber-500/0 dark:to-amber-950/0",
      fieldBg: "bg-amber-50 dark:bg-amber-900/40",
      stepFrom: "from-amber-500 dark:from-amber-600",
      stepTo: "to-amber-400 dark:to-amber-500",
      titleTo: "to-amber-600/70 dark:to-amber-400/70",
      btnFrom: "from-amber-600 dark:from-amber-500",
      btnTo: "to-amber-500 dark:to-amber-400",
      btnRing: "ring-amber-400/40 dark:ring-amber-500/30",
      btnHover:
        "hover:from-amber-500 hover:to-amber-600 dark:hover:from-amber-400 dark:hover:to-amber-500",
      glowBg: "bg-amber-500/10 dark:bg-amber-400/10",
      focusRing:
        "focus-visible:ring-amber-500 dark:focus-visible:ring-amber-400",
      switchChecked:
        "data-[state=checked]:bg-amber-600 dark:data-[state=checked]:bg-amber-500",
      solidBg: "bg-amber-600 dark:bg-amber-500",
      solidBorder: "border-amber-600 dark:border-amber-500",
    },
    PARTY: {
      text: "text-pink-600 dark:text-pink-300",
      ring: "ring-pink-500/30 dark:ring-pink-400/30",
      gradFrom: "from-pink-200 dark:from-pink-900/40",
      gradTo: "to-pink-500/0 dark:to-pink-950/0",
      fieldBg: "bg-pink-50 dark:bg-pink-900/40",
      stepFrom: "from-pink-500 dark:from-pink-600",
      stepTo: "to-pink-400 dark:to-pink-500",
      titleTo: "to-pink-500/70 dark:to-pink-400/70",
      btnFrom: "from-pink-600 dark:from-pink-500",
      btnTo: "to-pink-500 dark:to-pink-400",
      btnRing: "ring-pink-400/40 dark:ring-pink-500/30",
      btnHover:
        "hover:from-pink-500 hover:to-pink-600 dark:hover:from-pink-400 dark:hover:to-pink-500",
      glowBg: "bg-pink-500/10 dark:bg-pink-400/10",
      focusRing: "focus-visible:ring-pink-500 dark:focus-visible:ring-pink-400",
      switchChecked:
        "data-[state=checked]:bg-pink-600 dark:data-[state=checked]:bg-pink-500",
      solidBg: "bg-pink-600 dark:bg-pink-500",
      solidBorder: "border-pink-600 dark:border-pink-500",
    },
    TRAVEL: {
      text: "text-emerald-600 dark:text-emerald-300",
      ring: "ring-emerald-500/30 dark:ring-emerald-400/30",
      gradFrom: "from-emerald-200 dark:from-emerald-900/40",
      gradTo: "to-emerald-500/0 dark:to-emerald-950/0",
      fieldBg: "bg-emerald-50 dark:bg-emerald-900/40",
      stepFrom: "from-emerald-500 dark:from-emerald-600",
      stepTo: "to-emerald-400 dark:to-emerald-500",
      titleTo: "to-emerald-500/70 dark:to-emerald-400/70",
      btnFrom: "from-emerald-600 dark:from-emerald-500",
      btnTo: "to-emerald-500 dark:to-emerald-400",
      btnRing: "ring-emerald-400/40 dark:ring-emerald-500/30",
      btnHover:
        "hover:from-emerald-500 hover:to-emerald-600 dark:hover:from-emerald-400 dark:hover:to-emerald-500",
      glowBg: "bg-emerald-500/10 dark:bg-emerald-400/10",
      focusRing:
        "focus-visible:ring-emerald-500 dark:focus-visible:ring-emerald-400",
      switchChecked:
        "data-[state=checked]:bg-emerald-600 dark:data-[state=checked]:bg-emerald-500",
      solidBg: "bg-emerald-600 dark:bg-emerald-500",
      solidBorder: "border-emerald-600 dark:border-emerald-500",
    },
    TOURNAMENT: {
      text: "text-rose-600 dark:text-rose-300",
      ring: "ring-rose-500/30 dark:ring-rose-400/30",
      gradFrom: "from-rose-200 dark:from-rose-900/40",
      gradTo: "to-rose-500/0 dark:to-rose-950/0",
      fieldBg: "bg-rose-50 dark:bg-rose-900/40",
      stepFrom: "from-rose-500 dark:from-rose-600",
      stepTo: "to-rose-400 dark:to-rose-500",
      titleTo: "to-rose-500/70 dark:to-rose-400/70",
      btnFrom: "from-rose-600 dark:from-rose-500",
      btnTo: "to-rose-500 dark:to-rose-400",
      btnRing: "ring-rose-400/40 dark:ring-rose-500/30",
      btnHover:
        "hover:from-rose-500 hover:to-rose-600 dark:hover:from-rose-400 dark:hover:to-rose-500",
      glowBg: "bg-rose-500/10 dark:bg-rose-400/10",
      focusRing: "focus-visible:ring-rose-500 dark:focus-visible:ring-rose-400",
      switchChecked:
        "data-[state=checked]:bg-rose-600 dark:data-[state=checked]:bg-rose-500",
      solidBg: "bg-rose-600 dark:bg-rose-500",
      solidBorder: "border-rose-600 dark:border-rose-500",
    },
  };

  const categoryIconsMap = {
    MEETUP: Users,
    EXPO: Joystick,
    FOOD: Utensils,
    PARTY: PartyPopper,
    TRAVEL: Plane,
    TOURNAMENT: Trophy,
  } as const;

  // Refs for focus management per step (erste Pflichtfelder)
  const nameRef = useRef<HTMLInputElement | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
  const startDateRef = useRef<HTMLInputElement | null>(null);
  const endDateRef = useRef<HTMLInputElement | null>(null);

  // Single-day selection and times
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");

  const [formData, setFormData] = useState<CreateEventData>({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    location: "",
    url: "",
    category: EventCategory.MEETUP,
    isPublic: false,
    isFixed: false,
  });

  const [errors, setErrors] = useState<Partial<CreateEventData>>({});

  // helper to build ISO string for the selected single day with HH:mm
  const toISOAt = useCallback((day: Date, hhmm: string) => {
    const [hhStr = "0", mmStr = "0"] = (hhmm || "").split(":");
    const hours = Math.min(23, Math.max(0, Number(hhStr)));
    const minutes = Math.min(59, Math.max(0, Number(mmStr)));
    const d = new Date(day);
    d.setHours(hours, minutes, 0, 0);
    return d.toISOString();
  }, []);

  const handleInputChange = (
    field: keyof CreateEventData,
    value: string | boolean,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Step validations
  const validateStep = useCallback(
    (s: Step) => {
      const newErrors: Partial<CreateEventData> = {};
      if (s === 0) {
        if (!formData.name.trim())
          newErrors.name = t("modal.validation.titleRequired");
        if (!formData.description.trim())
          newErrors.description = t("modal.validation.descriptionRequired");
      }
      if (s === 1) {
        if (!formData.startDate) {
          newErrors.startDate = t("modal.validation.startRequired");
        }
        // Optional end time: validate ordering only when provided
        if (formData.startDate && formData.endDate && endTime) {
          const start = new Date(formData.startDate);
          const end = new Date(formData.endDate);
          if (!(start < end)) {
            newErrors.endDate = t("modal.validation.endAfterStart");
          }
        }
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [t, formData, endTime],
  );

  // Seed form with initial data when opening in edit mode
  useEffect(() => {
    if (isOpen && initialData) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
        name: initialData.name ?? prev.name,
        description: initialData.description ?? prev.description,
        startDate: initialData.startDate ?? prev.startDate,
        endDate: initialData.endDate ?? prev.endDate,
        location: initialData.location ?? prev.location,
        url: initialData.url ?? prev.url,
        category: initialData.category ?? prev.category,
        isPublic: initialData.isPublic ?? prev.isPublic,
        isFixed: initialData.isFixed ?? prev.isFixed,
      }));
      try {
        if (initialData.startDate) {
          const d = new Date(initialData.startDate);
          setSelectedDay(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
          setStartTime(
            d.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }),
          );
        }
        if (initialData.endDate) {
          const e = new Date(initialData.endDate);
          const start = initialData.startDate
            ? new Date(initialData.startDate)
            : null;
          const endStr = e.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
          // Only set endTime if it differs from start time
          if (!start || start.getTime() !== e.getTime()) {
            setEndTime(endStr);
          } else {
            setEndTime("");
          }
        }
      } catch {}
      setStep(0);
      setErrors({});
    }
  }, [isOpen, initialData]);

  const canContinue = useMemo(() => {
    if (step === 0) {
      return (
        formData.name.trim().length > 0 &&
        formData.description.trim().length > 0
      );
    }
    if (step === 1) {
      if (!formData.startDate) return false;
      if (endTime && formData.endDate) {
        return new Date(formData.startDate) < new Date(formData.endDate);
      }
      return true;
    }
    return true;
  }, [step, formData, endTime]);

  const goNext = () => {
    if (validateStep(step)) {
      setStep((s) => {
        const next = (s + 1) as number;
        return (next > 2 ? 2 : next) as Step;
      });
    }
  };
  const goBack = () =>
    setStep((s) => {
      const prev = (s - 1) as number;
      return (prev < 0 ? 0 : prev) as Step;
    });

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!validateStep(0) || !validateStep(1)) {
        setStep(0);
        return;
      }
      onSubmit(formData);
      onClose();
      // reset
      setFormData({
        name: "",
        description: "",
        startDate: "",
        endDate: "",
        location: "",
        url: "",
        category: EventCategory.MEETUP,
        isPublic: false,
        isFixed: false,
      });
      setErrors({});
      setStep(0);
    },
    [formData, onClose, onSubmit, validateStep],
  );

  // Stepper header
  const steps = [
    { id: 0, label: t("modal.steps.basic") },
    { id: 1, label: t("modal.steps.details") },
    { id: 2, label: t("modal.steps.review") },
  ] as const;

  // Fokus-Management: beim Schrittwechsel fokussiere erstes Pflichtfeld
  useEffect(() => {
    if (step === 0) {
      // zuerst Titel, sonst Beschreibung
      if (nameRef.current) {
        nameRef.current.focus();
      } else if (descriptionRef.current) {
        descriptionRef.current.focus();
      }
    } else if (step === 1) {
      if (startDateRef.current) {
        startDateRef.current.focus();
      }
    }
  }, [step]);

  // Tasten-Handling: Esc schließt immer, Enter triggert Next/Submit
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      } else if (e.key === "Enter") {
        // Nur auslösen, wenn Ziel kein Textarea ist, damit Zeilenumbruch möglich bleibt
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName?.toLowerCase();
        const isTextarea = tag === "textarea";
        if (!isTextarea) {
          e.preventDefault();
          if (step < 2) {
            if (canContinue) {
              // Validierung pro aktuellem Schritt bevor weiter
              if (validateStep(step)) {
                setStep((s) => {
                  const next = (s + 1) as number;
                  return (next > 2 ? 2 : next) as Step;
                });
              }
            }
          } else {
            // Im Review Schritt submitten
            handleSubmit();
          }
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, step, canContinue, onClose, validateStep, handleSubmit]); // handleSubmit und validateStep sind stabil genug im Scope

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: "",
        description: "",
        startDate: "",
        endDate: "",
        location: "",
        url: "",
        category: EventCategory.MEETUP,
        isPublic: false,
        isFixed: false,
      });
      setErrors({});
      setStep(0);
      setSelectedDay(undefined);
      setStartTime("");
      setEndTime("");
    }
  }, [isOpen]);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className={`w-full sm:max-w-2xl h-[100dvh] overflow-y-auto overflow-x-hidden border-0 ring-1 ${categoryTokens[formData.category].ring} bg-gradient-to-br ${categoryTokens[formData.category].gradFrom} to-background backdrop-blur-md`}
        aria-labelledby="create-event-title"
        role="dialog"
        aria-modal="true"
        aria-describedby="create-event-subtitle step-announcer error-announcer"
      >
        <SheetHeader className="relative space-y-4 pl-4 pr-4 sm:pl-6 sm:pr-6">
          {/* Radix Dialog requires a title element inside the content for a11y.
             SheetHeader + SheetTitle satisfy this requirement. Ensure always rendered. */}
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg bg-gradient-to-br ${categoryTokens[formData.category].stepFrom} ${categoryTokens[formData.category].stepTo} text-white ring-1 ${categoryTokens[formData.category].ring}`}
              aria-hidden="true"
            >
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <SheetTitle
                id="create-event-title"
                className={`text-2xl font-bold bg-gradient-to-r from-foreground ${categoryTokens[formData.category].titleTo} bg-clip-text text-transparent`}
              >
                {titleOverride ?? t("modal.wizard.title")}
              </SheetTitle>
              <SheetDescription
                id="create-event-subtitle"
                className="text-base"
              >
                {t("modal.wizard.subtitle")}
              </SheetDescription>
            </div>
          </div>
          <div
            aria-hidden
            className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full ${categoryTokens[formData.category].glowBg} blur-2xl`}
          />

          {/* Live regions for SR announcements */}
          <p id="step-announcer" className="sr-only" aria-live="polite">
            {t("modal.wizard.title")}: {steps.find((s) => s.id === step)?.label}
          </p>
          <div id="error-announcer" className="sr-only" aria-live="polite">
            {Object.values(errors).filter(Boolean).join(". ")}
          </div>

          {/* Stepper */}
          <div
            className="flex items-center gap-2 mt-2"
            role="tablist"
            aria-label={t("modal.wizard.ariaSteps") ?? t("modal.wizard.title")}
          >
            {steps.map((s, idx) => {
              const isActive = step === s.id;
              const isDone = step > s.id;
              return (
                <div key={s.id} className="flex items-center gap-2">
                  <div
                    role="tab"
                    aria-selected={isActive}
                    aria-current={isActive ? "step" : undefined}
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full border text-sm ${
                      isActive
                        ? `bg-gradient-to-br ${categoryTokens[formData.category].stepFrom} ${categoryTokens[formData.category].stepTo} text-white ${categoryTokens[formData.category].solidBorder}`
                        : isDone
                          ? `${categoryTokens[formData.category].solidBg} text-white ${categoryTokens[formData.category].solidBorder}`
                          : "bg-muted text-muted-foreground border-border"
                    } ring-1 ${isActive || isDone ? categoryTokens[formData.category].ring : "ring-border"}`}
                    aria-label={s.label}
                  >
                    {isDone ? <Check className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span
                    className={`text-sm ${isActive ? "font-medium text-foreground" : "text-muted-foreground"}`}
                  >
                    {s.label}
                  </span>
                  {idx < steps.length - 1 && (
                    <ChevronRight
                      className={`w-4 h-4 ${isDone ? categoryTokens[formData.category].text : "text-muted-foreground"}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          aria-labelledby="create-event-title"
          aria-describedby="create-event-subtitle"
        >
          <div className="mt-6 space-y-6 pl-4 pr-4 sm:pl-6 sm:pr-6">
            {step === 0 && (
              <section
                className="space-y-6"
                role="region"
                aria-labelledby="basic-section-title"
              >
                <h3 id="basic-section-title" className="sr-only">
                  {t("modal.steps.basic")}
                </h3>
                {/* Title */}
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className={`text-sm font-medium ${categoryTokens[formData.category].text}`}
                  >
                    {t("modal.fields.title")} *
                  </Label>
                  <Input
                    id="name"
                    ref={nameRef}
                    placeholder={t("modal.placeholders.title")}
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    aria-invalid={!!errors.name}
                    className={`border-2 rounded-lg border-border/60 hover:border-border focus-visible:ring-2 focus-visible:ring-offset-0 ${categoryTokens[formData.category].focusRing} ${categoryTokens[formData.category].fieldBg}`}
                    aria-describedby={errors.name ? "name-error" : undefined}
                  />
                  {errors.name && (
                    <p
                      id="name-error"
                      className="text-sm text-destructive flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Category */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    {t("stats.categories")}
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(EventCategory).map(([key, value]) => (
                      <button
                        type="button"
                        key={value}
                        className={`relative p-4 rounded-lg cursor-pointer transition-all text-left border-0 ring-1 ${
                          categoryTokens[value as EventCategory].ring
                        } bg-background bg-gradient-to-br ${
                          categoryTokens[value as EventCategory].gradFrom
                        } ${categoryTokens[value as EventCategory].gradTo} ${
                          formData.category === value
                            ? "ring-2"
                            : "hover:ring-2"
                        }`}
                        onClick={() => handleInputChange("category", value)}
                        aria-pressed={formData.category === value}
                      >
                        <div className="relative z-10 flex items-center justify-between">
                          <span
                            className={`font-semibold ${categoryTokens[value as EventCategory].text}`}
                          >
                            {key}
                          </span>
                        </div>
                        {(() => {
                          const IconComp =
                            categoryIconsMap[
                              value as keyof typeof categoryIconsMap
                            ];
                          const tone =
                            categoryTokens[value as EventCategory].text;
                          return (
                            <IconComp
                              aria-hidden
                              className={`pointer-events-none absolute -right-0 -bottom-0 w-12 h-12 rotate-12 opacity-15 blur-[1px] ${tone}`}
                            />
                          );
                        })()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label
                    htmlFor="description"
                    className={`text-sm font-medium ${categoryTokens[formData.category].text}`}
                  >
                    {t("modal.fields.description")} *
                  </Label>
                  <Textarea
                    id="description"
                    ref={descriptionRef}
                    placeholder={t("modal.placeholders.description")}
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    rows={4}
                    aria-invalid={!!errors.description}
                    className={`border-2 rounded-lg border-border/60 hover:border-border focus-visible:ring-2 focus-visible:ring-offset-0 ${categoryTokens[formData.category].focusRing} ${categoryTokens[formData.category].fieldBg}`}
                    aria-describedby={
                      errors.description ? "description-error" : undefined
                    }
                  />
                  {errors.description && (
                    <p
                      id="description-error"
                      className="text-sm text-destructive flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      {errors.description}
                    </p>
                  )}
                </div>
              </section>
            )}

            {step === 1 && (
              <section
                className="space-y-6"
                role="region"
                aria-labelledby="details-section-title"
              >
                <h3 id="details-section-title" className="sr-only">
                  {t("modal.steps.details")}
                </h3>
                {/* Date & Time */}
                <div className="space-y-4">
                  <h3
                    id="datetime-section-title"
                    className={`font-semibold text-lg flex items-center gap-2 ${categoryTokens[formData.category].text}`}
                  >
                    <CalendarIcon
                      className={`w-5 h-5 ${categoryTokens[formData.category].text}`}
                    />
                    {t("modal.sections.datetime")}
                  </h3>

                  {/* Single date selection using Shadcn Calendar */}
                  <div className="space-y-2">
                    <Label
                      className={`text-sm font-medium ${categoryTokens[formData.category].text}`}
                    >
                      {t("modal.fields.date")} *
                    </Label>

                    <ShadcnCalendar
                      mode="single"
                      locale={dayPickerLocale}
                      selected={selectedDay}
                      onSelect={(d) => {
                        setSelectedDay(d ?? undefined);
                        if (!d) return;
                        if (startTime) {
                          const sISO = toISOAt(d, startTime);
                          handleInputChange("startDate", sISO);
                          const eISO = endTime ? toISOAt(d, endTime) : sISO;
                          handleInputChange("endDate", eISO);
                        } else {
                          const midnight = toISOAt(d, "00:00");
                          handleInputChange("startDate", midnight);
                          handleInputChange("endDate", midnight);
                        }
                      }}
                      className="mx-auto border rounded-md shadow-none"
                      captionLayout="dropdown"
                    />
                  </div>
                  {errors.startDate && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <X className="w-3 h-3" />
                      {errors.startDate}
                    </p>
                  )}

                  {/* Time inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {/* Start time */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="startTime"
                        className={`text-sm font-medium ${categoryTokens[formData.category].text}`}
                      >
                        {t("modal.fields.time")} ({t("modal.fields.start")})
                      </Label>
                      <Input
                        id="startTime"
                        type="time"
                        ref={startDateRef}
                        placeholder={t("modal.placeholders.time")}
                        value={startTime}
                        className={`border-2 rounded-lg border-border/60 hover:border-border focus-visible:ring-2 focus-visible:ring-offset-0 ${categoryTokens[formData.category].focusRing} bg-background`}
                        onChange={(e) => {
                          const v = e.target.value;
                          setStartTime(v);
                          if (!selectedDay) return;
                          const sISO = toISOAt(selectedDay, v);
                          handleInputChange("startDate", sISO);
                          const eISO = endTime
                            ? toISOAt(selectedDay, endTime)
                            : sISO;
                          handleInputChange("endDate", eISO);
                        }}
                      />
                    </div>

                    {/* End time */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="endTime"
                        className={`text-sm font-medium ${categoryTokens[formData.category].text}`}
                      >
                        {t("modal.fields.time")} ({t("modal.fields.end")})
                      </Label>
                      <Input
                        id="endTime"
                        type="time"
                        ref={endDateRef}
                        placeholder={t("modal.placeholders.time")}
                        value={endTime}
                        className={`border-2 rounded-lg border-border/60 hover:border-border focus-visible:ring-2 focus-visible:ring-offset-0 ${categoryTokens[formData.category].focusRing} bg-background`}
                        onChange={(e) => {
                          const v = e.target.value; // optional
                          setEndTime(v);
                          if (!selectedDay) return;
                          if (v) {
                            handleInputChange(
                              "endDate",
                              toISOAt(selectedDay, v),
                            );
                          } else {
                            if (formData.startDate)
                              handleInputChange("endDate", formData.startDate);
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Combined range violation hint */}
                  {endTime &&
                    formData.startDate &&
                    formData.endDate &&
                    new Date(formData.startDate) >=
                      new Date(formData.endDate) && (
                      <p className="text-sm text-destructive flex items-center gap-1 mt-2">
                        <X className="w-3 h-3" />
                        {t("modal.validation.endAfterStart")}
                      </p>
                    )}
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label
                    htmlFor="location"
                    className={`text-sm font-medium flex items-center gap-2 ${categoryTokens[formData.category].text}`}
                  >
                    <MapPin
                      className={`w-4 h-4 ${categoryTokens[formData.category].text}`}
                    />
                    {t("modal.fields.location")}
                  </Label>
                  <Input
                    id="location"
                    placeholder={t("modal.placeholders.location")}
                    value={formData.location}
                    className={`border-2 rounded-lg border-border/60 hover:border-border focus-visible:ring-2 focus-visible:ring-offset-0 ${categoryTokens[formData.category].focusRing} ${categoryTokens[formData.category].fieldBg}`}
                    onChange={(e) =>
                      handleInputChange("location", e.target.value)
                    }
                  />
                </div>

                {/* URL */}
                <div className="space-y-2">
                  <Label
                    htmlFor="url"
                    className={`text-sm font-medium ${categoryTokens[formData.category].text}`}
                  >
                    {t("modal.fields.url")}
                  </Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder={t("modal.placeholders.url")}
                    value={formData.url ?? ""}
                    className={`border-2 rounded-lg border-border/60 hover:border-border focus-visible:ring-2 focus-visible:ring-offset-0 ${categoryTokens[formData.category].focusRing} ${categoryTokens[formData.category].fieldBg}`}
                    onChange={(e) => handleInputChange("url", e.target.value)}
                  />
                </div>

                {/* Settings */}
                <div className="space-y-4">
                  <h3
                    id="settings-section-title"
                    className={`font-semibold text-lg flex items-center gap-2 ${categoryTokens[formData.category].text}`}
                  >
                    <Star
                      className={`w-5 h-5 ${categoryTokens[formData.category].text}`}
                    />
                    {t("modal.sections.settings")}
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="space-y-1">
                        <Label className="font-medium">
                          {t("modal.fields.public")}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {t("modal.help.public")}
                        </p>
                      </div>
                      <Switch
                        checked={formData.isPublic}
                        onCheckedChange={(checked) =>
                          handleInputChange("isPublic", checked)
                        }
                        aria-label={t("modal.fields.public")}
                        className={`${categoryTokens[formData.category].switchChecked}`}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="space-y-1">
                        <Label className="font-medium">
                          {t("modal.fields.fixed")}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {t("modal.help.fixed")}
                        </p>
                      </div>
                      <Switch
                        checked={formData.isFixed}
                        onCheckedChange={(checked) =>
                          handleInputChange("isFixed", checked)
                        }
                        aria-label={t("modal.fields.fixed")}
                        className={`${categoryTokens[formData.category].switchChecked}`}
                      />
                    </div>
                  </div>
                </div>
              </section>
            )}

            {step === 2 && (
              <section
                className="space-y-6"
                role="region"
                aria-labelledby="review-section-title"
              >
                <h3 id="review-section-title" className="sr-only">
                  {t("modal.steps.review")}
                </h3>
                {/* Preview Card */}
                <Card className="relative overflow-hidden bg-gradient-to-br from-muted/60 to-transparent border-0 ring-1 ring-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      {(() => {
                        const IconComp = categoryIconsMap[formData.category];
                        return (
                          <IconComp
                            className={`w-6 h-6 ${categoryText[formData.category]}`}
                          />
                        );
                      })()}
                      <Badge className={categoryColors[formData.category]}>
                        {formData.category}
                      </Badge>
                      {formData.isPublic && (
                        <Badge
                          variant="outline"
                          className="text-green-600 border-green-600"
                        >
                          {t("modal.badges.public")}
                        </Badge>
                      )}
                    </div>
                    <h3
                      className={`font-bold text-xl md:text-2xl mb-3 ${categoryText[formData.category]}`}
                    >
                      {formData.name || t("modal.preview.titleFallback")}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {formData.description ||
                        t("modal.preview.descriptionFallback")}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      {formData.startDate && (
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4" />
                          <span>
                            {new Date(formData.startDate).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {formData.endDate &&
                        formData.endDate !== formData.startDate && (
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" />
                            <span>
                              {new Date(formData.endDate).toLocaleString()}
                            </span>
                          </div>
                        )}
                      {formData.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{formData.location}</span>
                        </div>
                      )}
                    </div>
                    {(() => {
                      const BgIcon = categoryIconsMap[formData.category];
                      return (
                        <BgIcon
                          aria-hidden
                          className={`pointer-events-none absolute -right-6 -bottom-6 w-40 h-40 sm:w-48 sm:h-48 rotate-12 opacity-10 blur-xs ${categoryText[formData.category]}`}
                        />
                      );
                    })()}
                  </CardContent>
                </Card>
              </section>
            )}
          </div>

          <SheetFooter className="mt-8 pt-6 border-t pl-4 sm:pl-6">
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <div className="flex gap-3 flex-1">
                {step > 0 && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={goBack}
                    className="flex-1"
                    aria-label={t("modal.wizard.back")}
                  >
                    {t("modal.wizard.back")}
                  </Button>
                )}
                {step < 2 ? (
                  <Button
                    type="button"
                    onClick={goNext}
                    disabled={!canContinue}
                    aria-disabled={!canContinue}
                    className={`flex-1 bg-gradient-to-r ${categoryTokens[formData.category].btnFrom} ${categoryTokens[formData.category].btnTo} text-white ring-1 ${categoryTokens[formData.category].btnRing} ${categoryTokens[formData.category].btnHover}`}
                    aria-label={`${t("modal.wizard.next")} – ${steps[step + 1]?.label ?? ""}`}
                  >
                    {t("modal.wizard.next")}
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    onClick={() => handleSubmit()}
                    className={`flex-1 bg-gradient-to-r ${categoryTokens[formData.category].btnFrom} ${categoryTokens[formData.category].btnTo} text-white ring-1 ${categoryTokens[formData.category].btnRing} ${categoryTokens[formData.category].btnHover}`}
                    aria-label={submitTextOverride ?? t("modal.actions.create")}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {submitTextOverride ?? t("modal.actions.create")}
                  </Button>
                )}
              </div>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
