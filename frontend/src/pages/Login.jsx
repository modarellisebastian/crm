import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (signInError) { setError('Email o contrasena incorrectos.'); return }
    navigate('/', { replace: true })
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* Panel izquierdo — decorativo */}
      <div style={{
        flex: '0 0 58%',
        background: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Círculos decorativos */}
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.07)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
        <div style={{ position: 'absolute', width: 750, height: 750, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.04)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
        <div style={{ position: 'absolute', width: 220, height: 220, borderRadius: '50%', background: 'rgba(10,10,10,0.25)', top: '12%', right: '18%', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', width: 160, height: 160, borderRadius: '50%', background: 'rgba(10,10,10,0.2)', bottom: '10%', left: '12%', filter: 'blur(30px)' }} />
        <div style={{ position: 'absolute', width: 100, height: 100, borderRadius: '50%', background: 'rgba(22,163,74,0.15)', top: '65%', right: '10%', filter: 'blur(20px)' }} />

        <img src="/Logo_Axano_Blanco.svg" alt="Axano" style={{ height: 44, width: 'auto', marginBottom: 32, position: 'relative', zIndex: 1 }} />

        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, margin: 0, textAlign: 'center', maxWidth: 300, lineHeight: 1.6, position: 'relative', zIndex: 1 }}>
          Gestioná tus leads y clientes en un solo lugar
        </p>
      </div>

      {/* Panel derecho — formulario */}
      <div style={{
        flex: '0 0 42%',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem',
      }}>
        <div style={{ width: '100%', maxWidth: 360 }}>

          {/* Logo mark */}
          <img src="/Iso_Axano_Negro.svg" alt="Axano" style={{ height: 44, width: 'auto', marginBottom: 28 }} />

          <h4 style={{ fontWeight: 700, color: '#0a0a0a', marginBottom: 4, fontSize: 22 }}>Bienvenido</h4>
          <p style={{ color: '#9fa3a8', marginBottom: 32, fontSize: 14 }}>Iniciá sesión para continuar en Axano</p>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-medium" style={{ fontSize: 13, color: '#0a0a0a' }}>Email</label>
              <input
                type="email"
                className="form-control"
                placeholder="tu@email.com"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <label className="form-label fw-medium" style={{ fontSize: 13, color: '#0a0a0a' }}>Contrasena</label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="alert alert-danger py-2 small mb-3">{error}</div>
            )}

            <button
              type="submit"
              className="btn btn-primary w-100 fw-semibold"
              style={{ padding: '11px', letterSpacing: '0.06em', fontSize: 13 }}
              disabled={loading}
            >
              {loading ? 'Ingresando...' : 'INGRESAR'}
            </button>
          </form>
        </div>
      </div>

    </div>
  )
}

export default Login
