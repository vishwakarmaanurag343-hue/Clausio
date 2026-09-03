import LoginBanner from '@/components/login/LoginBanner'
import LoginForm from '@/components/login/LoginForm'

export default function LoginPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        background: '#f8fafc',
      }}
    >
      <section
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '60px',
          background: '#ffffff',
        }}
      >
        <LoginForm />
      </section>

      <LoginBanner />
    </main>
  )
}