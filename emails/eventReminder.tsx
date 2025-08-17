import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export interface GC25EventReminderProps {
  userName: string;
  eventName: string;
  eventDate: string | Date;
  eventUrl: string;
  reminderType?: "hour" | "15min";
}

// robust baseUrl
const rawBaseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.BETTER_AUTH_URL ||
  "http://localhost:3000";
const baseUrl = (rawBaseUrl.startsWith("http") ? rawBaseUrl : `https://${rawBaseUrl}`).replace(/\/+$/, "");

// styles
const main: React.CSSProperties = {
  backgroundColor: "#111827",
  color: "#e5e7eb",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};
const container: React.CSSProperties = {
  margin: "0 auto",
  padding: "40px 24px",
  backgroundColor: "#1f2937",
  border: "1px solid #7e22ce",
  borderRadius: "8px",
  maxWidth: "520px",
};
const logo: React.CSSProperties = { margin: "0 auto 24px", display: "block" };
const paragraph: React.CSSProperties = { fontSize: "16px", lineHeight: "26px", color: "#e5e7eb" };
const btnContainer: React.CSSProperties = { textAlign: "center", margin: "24px 0" };
const button: React.CSSProperties = {
  backgroundImage: "linear-gradient(to right, #9333ea, #7e22ce)",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: 600,
  textDecoration: "none",
  textAlign: "center",
  display: "block",
  padding: "12px 24px",
};
const hr: React.CSSProperties = { borderColor: "#4b5563", margin: "32px 0" };
const footer: React.CSSProperties = { color: "#9ca3af", fontSize: "12px", textAlign: "center" };
const heading: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: 700,
  color: "#f3f4f6",
  textAlign: "center",
  margin: "0 0 24px",
};

export default function GC25EventReminderEmail({
  userName,
  eventName,
  eventDate,
  eventUrl,
  reminderType = "hour",
}: GC25EventReminderProps) {
  const is15min = reminderType === "15min";
  const dt = new Date(eventDate);
  const when = new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Berlin",
  }).format(dt);

  const headingText = is15min
    ? `${eventName} startet in 15 Minuten`
    : `${eventName} startet in einer Stunde`;

  const previewText = is15min
    ? `Reminder: ${eventName} startet in 15 Minuten`
    : `Reminder: ${eventName} startet in einer Stunde`;

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Preview>{previewText}</Preview>
        <Container style={container}>
          <Img
            src={`${baseUrl}/logo.png`}
            width={170}
            height={170}
            alt="Clicker Spiele Gamescom 25 Logo"
            style={logo}
          />
          <Text style={heading}>{headingText}</Text>
          <Text style={paragraph}>Hi {userName},</Text>
          <Text style={paragraph}>
            Dies ist eine Erinnerung: <strong>{eventName}</strong> beginnt{" "}
            {is15min ? <strong>in 15 Minuten</strong> : <strong>in einer Stunde</strong>} um {when}.
          </Text>
          <Section style={btnContainer}>
            <Button style={button} href={eventUrl}>
              Event-Details ansehen
            </Button>
          </Section>
          <Text style={paragraph}>Wir freuen uns auf dich!</Text>
          <Hr style={hr} />
          <Text style={footer}>Beinde 9, 55583 Bad Münster am Stein-Ebernburg</Text>
        </Container>
      </Body>
    </Html>
  );
}

GC25EventReminderEmail.PreviewProps = {
  userName: "Alan",
  eventName: "Sample Event",
  eventDate: new Date().toISOString(),
  eventUrl: "https://example.com",
  reminderType: "hour",
} satisfies GC25EventReminderProps;
