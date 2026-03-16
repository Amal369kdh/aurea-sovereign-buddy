/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Ton code de vérification – Aurea Student</Preview>
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
        <Heading style={h1}>Confirme ton identité 🔐</Heading>
        <Text style={text}>Utilise le code ci-dessous pour confirmer ton identité :</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          Ce code expire sous peu. Si tu n'es pas à l'origine de cette demande, ignore simplement cet email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#0d1117', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
const container = { maxWidth: '480px', margin: '40px auto', backgroundColor: '#0d1117', border: '1px solid #1e2530', borderRadius: '16px', padding: '32px' }
const logoRow = { display: 'flex' as const, alignItems: 'center' as const, gap: '10px', marginBottom: '24px' }
const logoBox = { width: '36px', height: '36px', background: 'linear-gradient(135deg,#D4A853,#C49B4A)', borderRadius: '10px', display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const, fontSize: '18px', lineHeight: '36px', textAlign: 'center' as const }
const logoText = { fontSize: '22px', fontWeight: '800' }
const logoGold = { color: '#D4A853' }
const logoWhite = { color: '#f1f5f9' }
const divider = { height: '1px', background: 'linear-gradient(90deg,transparent,#D4A85340,transparent)', marginBottom: '28px' }
const h1 = { fontSize: '18px', fontWeight: 'bold' as const, color: '#f1f5f9', margin: '0 0 16px', lineHeight: '1.4' }
const text = { fontSize: '14px', color: '#94a3b8', lineHeight: '1.7', margin: '0 0 25px' }
const codeStyle = { fontFamily: 'Courier, monospace', fontSize: '28px', fontWeight: 'bold' as const, color: '#D4A853', margin: '0 0 30px', letterSpacing: '4px' }
const footer = { fontSize: '11px', color: '#334155', margin: '30px 0 0', lineHeight: '1.6' }
