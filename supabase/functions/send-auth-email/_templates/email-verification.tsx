import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Img,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface EmailVerificationProps {
  supabase_url: string
  email_action_type: string
  redirect_to: string
  token_hash: string
  token: string
  user_email: string
}

export const EmailVerificationEmail = ({
  token,
  supabase_url,
  email_action_type,
  redirect_to,
  token_hash,
  user_email,
}: EmailVerificationProps) => (
  <Html>
    <Head />
    <Preview>Verify your email to get started with Mema POS</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={h1}>
            Welcome to Mema POS! 🎉
          </Heading>
        </Section>
        
        <Section style={content}>
          <Text style={text}>
            Hi there! Thanks for signing up for Mema POS. We're excited to have you on board!
          </Text>
          
          <Text style={text}>
            To get started, please verify your email address by clicking the button below:
          </Text>
          
          <Link
            href={`${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`}
            style={button}
          >
            Verify Email & Continue
          </Link>
          
          <Text style={text}>
            Or copy and paste this verification code if the button doesn't work:
          </Text>
          
          <code style={code}>{token}</code>
          
          <Text style={text}>
            Once verified, you'll be taken to set up your business and start using Mema POS.
          </Text>
        </Section>
        
        <Section style={footer}>
          <Text style={footerText}>
            If you didn't create an account with Mema POS, you can safely ignore this email.
          </Text>
          <Text style={footerText}>
            Need help? Contact us at support@memapos.com
          </Text>
          <Text style={footerText}>
            © 2024 Mema POS. All rights reserved.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default EmailVerificationEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
}

const header = {
  padding: '32px 20px',
  textAlign: 'center' as const,
  backgroundColor: '#8B5CF6',
  borderRadius: '8px 8px 0 0',
}

const content = {
  padding: '32px 40px',
}

const footer = {
  padding: '32px 40px',
  borderTop: '1px solid #f0f0f0',
}

const h1 = {
  color: '#ffffff',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0',
  textAlign: 'center' as const,
}

const text = {
  color: '#333333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
}

const button = {
  backgroundColor: '#8B5CF6',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '16px 32px',
  margin: '32px 0',
}

const code = {
  display: 'inline-block',
  padding: '16px 4.5%',
  width: '90.5%',
  backgroundColor: '#f4f4f4',
  borderRadius: '8px',
  border: '1px solid #eee',
  color: '#333',
  fontSize: '14px',
  fontFamily: 'Consolas, monospace',
  textAlign: 'center' as const,
  margin: '16px 0',
}

const footerText = {
  color: '#898989',
  fontSize: '12px',
  lineHeight: '20px',
  margin: '8px 0',
  textAlign: 'center' as const,
}