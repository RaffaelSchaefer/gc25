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
