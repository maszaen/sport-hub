import { useState } from 'react';
import { supabase } from '../lib/supabase';
import '../auth.css';

interface AuthPageProps {
  onAuth: () => void;
}

export default function AuthPage({ onAuth }: AuthPageProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName || 'User' } },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      onAuth();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan';
      if (msg === 'Invalid login credentials') {
        setError('Email atau password salah');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-container font-helvetica">
        <div className="card-container">
          <div className="left-cont">
            <img className="symbol" src="/assets/symbol.svg" alt="SportHub Symbol" />
            <h1 className="login-title font-google">
              {mode === 'signin' ? 'Sign in' : 'Register'}
            </h1>
            <p>
              {mode === 'signin'
                ? 'Please enter your account credentials to continue the login process.'
                : 'Please provide your details to create a new account.'}
            </p>
          </div>

          <div className="right-cont">
            <form onSubmit={handleSubmit}>
              {error && <div className="auth-error">{error}</div>}

              <div className="form-group">
                {mode === 'signup' && (
                  <div className="input-group">
                    <input
                      type="text"
                      id="auth-name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="input-field"
                      placeholder=" "
                      required
                    />
                    <label htmlFor="auth-name" className="input-label">Enter your name</label>
                  </div>
                )}

                <div className="input-group">
                  <input
                    type="email"
                    id="auth-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    placeholder=" "
                    required
                  />
                  <label htmlFor="auth-email" className="input-label">Enter your email</label>
                </div>

                <div className="input-group">
                  <input
                    type="password"
                    id="auth-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field"
                    placeholder=" "
                    required
                  />
                  <label htmlFor="auth-password" className="input-label">
                    {mode === 'signin' ? 'Enter your password' : 'Create a password'}
                  </label>
                </div>

                {mode === 'signin' && (
                  <a href="#" className="forgot-password ml-7">Forgot password?</a>
                )}
              </div>

              <p className="help-text ml-7">
                {mode === 'signin'
                  ? <>If you're unable to access your account or facing login issues, please don't hesitate to <a href="#">contact us</a> for assistance.</>
                  : <>By registering, you agree to our <a href="#">terms of service</a> and <a href="#">privacy policy</a>.</>
                }
              </p>

              <div className="button-group">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
                >
                  {mode === 'signin' ? 'Register' : 'Sign in'}
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Loading...' : mode === 'signin' ? 'Sign in' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
