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
import * as React from "react";

export interface GC25GoodieReminderProps {
  userName: string;
  goodieName: string;
  goodieDate: string | Date; // erlaubt ISO-String oder Date
  goodieUrl: string;
  reminderType?: "hour" | "15min";
}

// robustes Base-URL-Handling + kein doppeltes Slash
const rawBaseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.BETTER_AUTH_URL ||
  "http://localhost:3000";
const baseUrl = (rawBaseUrl.startsWith("http") ? rawBaseUrl : `https://${rawBaseUrl}`).replace(/\/+$/, "");

// Styles sauber typisiert
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

const logo: React.CSSProperties = {
  margin: "0 auto 24px",
  display: "block",
};

const paragraph: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#e5e7eb",
};

const btnContainer: React.CSSProperties = {
  textAlign: "center",
  margin: "24px 0",
};

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

const hr: React.CSSProperties = {
  borderColor: "#4b5563",
  margin: "32px 0",
};

const footer: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: "12px",
  textAlign: "center",
};

const heading: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: 700,
  color: "#f3f4f6",
  textAlign: "center",
  margin: "0 0 24px",
};

export default function GC25GoodieReminderEmail(props: GC25GoodieReminderProps) {
  const {
    userName,
    goodieName,
    goodieDate,
    goodieUrl,
    reminderType = "hour",
  } = props;

  const is15min = reminderType === "15min";
  const dt = new Date(goodieDate);
  const when = new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Berlin",
  }).format(dt);

  const headingText = is15min
    ? `${goodieName} ist in 15 Minuten verfügbar`
    : `${goodieName} ist in einer Stunde verfügbar`;

  const previewText = is15min
    ? `Reminder: ${goodieName} ist in 15 Minuten verfügbar`
    : `Reminder: ${goodieName} ist in einer Stunde verfügbar`;

  const bodyLine = is15min
    ? `Dies ist eine Erinnerung: ${goodieName} ist in 15 Minuten (ab ${when}) verfügbar.`
    : `Dies ist eine Erinnerung: ${goodieName} ist in einer Stunde (ab ${when}) verfügbar.`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
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
          <Text style={paragraph}>{bodyLine}</Text>
          <Section style={btnContainer}>
            <Button style={button} href={goodieUrl}>
              Goodie-Details ansehen
            </Button>
          </Section>
          <Text style={paragraph}>Bis gleich!</Text>
          <Hr style={hr} />
          <Text style={footer}>
            Beinde 9, 55583 Bad Münster am Stein-Ebernburg
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Preview in Storybook/Dev
GC25GoodieReminderEmail.PreviewProps = {
  userName: "Alan",
  goodieName: "Sticker Pack",
  goodieDate: new Date().toISOString(),
  goodieUrl: "https://example.com",
  reminderType: "hour",
} satisfies GC25GoodieReminderProps;
