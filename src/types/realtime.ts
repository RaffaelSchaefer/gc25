import type { EventCategory } from "@prisma/client";

export type BroadcastMessage =
  | {
      type: "event_created" | "event_updated";
      event: {
        id: string;
        title: string;
        description?: string | null;
        location?: string | null;
        url?: string | null;
        startDate: string;
        endDate: string;
        createdById: string;
        category: EventCategory;
      };
    }
  | { type: "event_deleted"; id: string }
  | { type: "participant_changed"; eventId: string; attendees: number }
  | {
      type: "comment_created" | "comment_updated" | "comment_deleted";
      eventId: string;
      comment?: {
        id: string;
        content: string;
        createdAt: string;
        createdById: string;
        createdBy?: { id: string; name: string; image: string | null };
      };
      commentId?: string;
    };
