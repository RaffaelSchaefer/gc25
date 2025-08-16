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

interface GC25GoodbyeProps {
  userName: string;
  url: string;
}

const baseUrl = process.env.BETTER_AUTH_URL
  ? `https://${process.env.BETTER_AUTH_URL}`
  : "http://localhost:3000";

export const GC25GoodbyeEmail = ({ userName, url }: GC25GoodbyeProps) => (
  <Html>
    <Head />
    <Body style={main}>
      <Preview>
        We&apos;re sorry to see you go – confirm your account deletion.
      </Preview>
      <Container style={container}>
        <Img
          src={`${baseUrl}/logo.png`}
          width="170"
          height="170"
          alt="Clicker Spiele GamesCom 25 Logo"
          style={logo}
        />
        <Text style={heading}>Account Deletion Request</Text>
        <Text style={paragraph}>Hi {userName},</Text>
        <Text style={paragraph}>
          We received a request to delete your account from our system. If you
          made this request, please confirm by clicking the button below. This
          will permanently delete your account and all associated data.
        </Text>
        <Section style={btnContainer}>
          <Button style={button} href={url}>
            Confirm Account Deletion
          </Button>
        </Section>
        <Text style={paragraph}>
          If you did not request this, you can safely ignore this email — your
          account will not be affected.
        </Text>
        <Text style={paragraph}>
          Best,
          <br />
          The Clicker Spiele IT Team
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          Beinde 9 55583 Bad Münster am Stein Ebernburg
        </Text>
      </Container>
    </Body>
  </Html>
);

GC25GoodbyeEmail.PreviewProps = {
  userName: "Alan",
  url: "example.com",
} as GC25GoodbyeProps;

export default GC25GoodbyeEmail;

const main = {
  backgroundColor: "#111827",
  color: "#e5e7eb",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "40px 24px",
  backgroundColor: "#1f2937",
  border: "1px solid #7e22ce",
  borderRadius: "8px",
};

const logo = {
  margin: "0 auto 24px",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#e5e7eb",
};

const btnContainer = {
  textAlign: "center" as const,
  margin: "24px 0",
};

const button = {
  backgroundImage: "linear-gradient(to right, #9333ea, #7e22ce)",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: 600,
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 24px",
};

const hr = {
  borderColor: "#4b5563",
  margin: "32px 0",
};

const footer = {
  color: "#9ca3af",
  fontSize: "12px",
  textAlign: "center" as const,
};

const heading = {
  fontSize: "24px",
  fontWeight: 700,
  color: "#f3f4f6",
  textAlign: "center" as const,
  margin: "0 0 24px",
};
