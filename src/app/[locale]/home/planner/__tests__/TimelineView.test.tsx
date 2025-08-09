/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TimelineView } from "../TimelineView";
import { NextIntlClientProvider } from "next-intl";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - json import typing
import en from "../../../../../../messages/en.json";
import { EventCategory } from "@prisma/client";

// Mock auth client to control current user id
vi.mock("@/lib/auth-client", () => ({
  authClient: { useSession: () => ({ data: { user: { id: "user-1" } } }) },
}));

// Mock server actions to avoid real calls
const updateEventMock = vi.fn().mockResolvedValue({});
const deleteEventMock = vi.fn().mockResolvedValue({ ok: true });
vi.mock("@/app/(server)/events.actions", () => ({
  updateEvent: (...args: any[]) => updateEventMock(...args),
  deleteEvent: (...args: any[]) => deleteEventMock(...args),
}));

function wrap(ui: React.ReactNode) {
  return (
    <NextIntlClientProvider
      locale="en"
      messages={en as unknown as Record<string, unknown>}
    >
      {ui}
    </NextIntlClientProvider>
  );
}

const sample = [
  {
    dateISO: "2025-08-21",
    dayLabel: "Aug 21",
    events: [
      {
        id: "e1",
        title: "My Event",
        time: "10:00",
        dateISO: "2025-08-21",
        location: "Hall A",
        description: "desc",
        attendees: 1,
        userJoined: false,
        startDate: new Date("2025-08-21T10:00:00.000Z").toISOString(),
        endDate: new Date("2025-08-21T11:00:00.000Z").toISOString(),
        createdById: "user-1",
        createdBy: { name: "Alice" },
        category: EventCategory.MEETUP,
      },
      {
        id: "e2",
        title: "Other Event",
        time: "12:00",
        dateISO: "2025-08-21",
        location: "Hall B",
        description: "desc2",
        attendees: 2,
        userJoined: false,
        startDate: new Date("2025-08-21T12:00:00.000Z").toISOString(),
        endDate: new Date("2025-08-21T13:00:00.000Z").toISOString(),
        createdById: "user-2",
        createdBy: { name: "Bob" },
        category: EventCategory.EXPO,
      },
    ],
  },
];

describe.skip("TimelineView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows edit/delete buttons only for creator events", () => {
    render(
      wrap(<TimelineView events={sample as unknown as any} viewMode="grid" />),
    );
    // expand day
    fireEvent.click(screen.getByText("Aug 21"));

    // For My Event (createdBy current user), edit/delete tooltips or labels should exist
    expect(screen.getAllByLabelText(/Edit event/i).length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText(/Delete event/i).length).toBeGreaterThan(0);

    // For Other Event, there should be only join button; ensure at least one edit for creator and not more than events
    const editButtons = screen.getAllByLabelText(/Edit event/i);
    expect(editButtons.length).toBe(1);
  });

  it("edits an event and updates UI optimistically", async () => {
    render(
      wrap(<TimelineView events={sample as unknown as any} viewMode="grid" />),
    );
    fireEvent.click(screen.getByText("Aug 21"));

    // open edit sheet
    const editBtn = screen.getByLabelText(/Edit event/i);
    fireEvent.click(editBtn);

    const titleInput = await screen.findByLabelText(/Title/i);
    fireEvent.change(titleInput, { target: { value: "Updated Title" } });

    const saveBtn = screen.getByRole("button", { name: /Save changes/i });
    fireEvent.click(saveBtn);

    // optimistic title visible
    expect(await screen.findAllByText(/Updated Title/)).toBeTruthy();
  });

  it("confirms delete and removes from timeline", async () => {
    render(
      wrap(<TimelineView events={sample as unknown as any} viewMode="grid" />),
    );
    fireEvent.click(screen.getByText("Aug 21"));

    const delBtn = screen.getByLabelText(/Delete event/i);
    fireEvent.click(delBtn);

    const confirm = await screen.findByRole("button", { name: /Delete/i });
    fireEvent.click(confirm);

    // Event card for My Event should be gone
    expect(screen.queryByText("My Event")).toBeNull();
  });

  it("shows error when edit fails", async () => {
    updateEventMock.mockRejectedValueOnce(new Error("Update failed"));
    render(
      wrap(<TimelineView events={sample as unknown as any} viewMode="grid" />),
    );
    fireEvent.click(screen.getByText("Aug 21"));

    fireEvent.click(screen.getByLabelText(/Edit event/i));
    const saveBtn = await screen.findByRole("button", {
      name: /Save changes/i,
    });
    fireEvent.click(saveBtn);

    expect(await screen.findByText(/Update failed/i)).toBeTruthy();
  });

  it("rolls back when delete fails", async () => {
    deleteEventMock.mockRejectedValueOnce(new Error("Delete failed"));
    render(
      wrap(<TimelineView events={sample as unknown as any} viewMode="grid" />),
    );
    fireEvent.click(screen.getByText("Aug 21"));

    fireEvent.click(screen.getByLabelText(/Delete event/i));
    const confirm = await screen.findByRole("button", { name: /Delete/i });
    fireEvent.click(confirm);

    // Still in DOM after failure
    expect(await screen.findByText("My Event")).toBeTruthy();
  });
});
