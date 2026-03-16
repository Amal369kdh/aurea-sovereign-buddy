/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Confirme ton adresse email pour rejoindre {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <div style={logoRow}>
          <div style={logoBox}>♛</div>
          <span style={logoText}>
            <span style={logoGold}>Aurea</span>
            <span style={logoWhite}> Student</span>
          </span>
        </div>
        <div style={divider} />
        <Heading style={h1}>Confirme ton adresse email 🎓</Heading>
        <Text style={text}>
          Bienvenue dans le cercle{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>{' '}
          ! Pour activer ton compte et accéder à toutes les fonctionnalités, confirme ton adresse email{' '}
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>{' '}
          en cliquant sur le bouton ci-dessous.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Confirmer mon email →
        </Button>
        <Text style={footer}>
          Si tu n'as pas créé de compte sur Aurea Student, ignore simplement cet email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#0d1117', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
const container = { maxWidth: '480px', margin: '40px auto', backgroundColor: '#0d1117', border: '1px solid #1e2530', borderRadius: '16px', padding: '32px' }
const logoRow = { display: 'flex' as const, alignItems: 'center' as const, gap: '10px', marginBottom: '24px' }
const logoBox = { width: '36px', height: '36px', background: 'linear-gradient(135deg,#D4A853,#C49B4A)', borderRadius: '10px', display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const, fontSize: '18px', lineHeight: '36px', textAlign: 'center' as const }
const logoText = { fontSize: '22px', fontWeight: '800' }
const logoGold = { color: '#D4A853' }
const logoWhite = { color: '#f1f5f9' }
const divider = { height: '1px', background: 'linear-gradient(90deg,transparent,#D4A85340,transparent)', marginBottom: '28px' }
const h1 = {
  fontSize: '18px',
  fontWeight: 'bold' as const,
  color: '#f1f5f9',
  margin: '0 0 16px',
  lineHeight: '1.4',
}
const text = {
  fontSize: '14px',
  color: '#94a3b8',
  lineHeight: '1.7',
  margin: '0 0 28px',
}
const link = { color: '#D4A853', textDecoration: 'underline' }
const button = {
  backgroundColor: '#D4A853',
  color: '#0d1117',
  fontSize: '14px',
  fontWeight: '700',
  borderRadius: '12px',
  padding: '14px 28px',
  textDecoration: 'none',
  display: 'inline-block' as const,
}
const footer = { fontSize: '11px', color: '#334155', margin: '30px 0 0', lineHeight: '1.6' }
