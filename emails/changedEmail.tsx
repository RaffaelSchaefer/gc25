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

interface GC25EmailChangeProps {
  userName: string;
  oldEmail: string;
  newEmail: string;
  url: string;
}

const baseUrl = process.env.BETTER_AUTH_URL
  ? `https://${process.env.BETTER_AUTH_URL}`
  : "http://localhost:3000";

export const GC25ConfirmEmailChangeEmail = ({
  userName,
  oldEmail,
  newEmail,
  url,
}: GC25EmailChangeProps) => (
  <Html>
    <Head />
    <Body style={main}>
      <Preview>
        You changed your email address – please confirm this change.
      </Preview>
      <Container style={container}>
        <Img
          src={`${baseUrl}/logo.png`}
          width="170"
          height="170"
          alt="Clicker Spiele GamesCom 25 Logo"
          style={logo}
        />
        <Text style={paragraph}>Hi {userName},</Text>
        <Text style={paragraph}>
          You recently requested to change your email address from{" "}
          <strong>{oldEmail}</strong> to <strong>{newEmail}</strong>. Please
          confirm this change by clicking the button below.
        </Text>
        <Section style={btnContainer}>
          <Button style={button} href={url}>
            Confirm Email Change
          </Button>
        </Section>
        <Text style={paragraph}>
          If you did not make this request, you can safely ignore this email —
          your email address will not be changed.
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

GC25ConfirmEmailChangeEmail.PreviewProps = {
  userName: "Alan",
  url: "example.com",
  oldEmail: "old@example.com",
  newEmail: "new@example.com",
} as GC25EmailChangeProps;

export default GC25ConfirmEmailChangeEmail;

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
};

const logo = {
  margin: "0 auto",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
};

const btnContainer = {
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#691fb8",
  borderRadius: "3px",
  color: "#fff",
  fontSize: "16px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px",
};

const hr = {
  borderColor: "#cccccc",
  margin: "20px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
};
