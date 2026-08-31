import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  onSwitchToSignup: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToSignup }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!email.trim()) {
      setError('Please enter your registered email address.');
      return;
    }

    if (!password) {
      setError('Please enter your account password.');
      return;
    }

    setLoading(true);
    try {
      await login({ email: email.trim(), password });
    } catch (err: any) {
      const msg = err.response?.data?.error || "That email and password don't match.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base text-ink flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md space-y-2">
        <div className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">
          Empirical Research Access
        </div>
        <h1 className="text-2xl font-serif font-semibold text-ink tracking-tight">
          Sign In to SearchSea
        </h1>
        <p className="text-xs text-ink-muted max-w-sm">
          Access your research registries, validated datasets, and automated statistical pipelines.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-bg-base border border-hairline p-6 space-y-5">
          {error && (
            <div className="p-3 bg-bg-surface border-l-2 border-accent-flagged text-xs text-ink font-sans">
              <span className="font-semibold text-accent-flagged block text-[11px] uppercase tracking-wider font-mono">Authentication Warning</span>
              <span className="mt-0.5 block">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                Institutional Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="researcher@institution.edu"
                className="w-full px-3 py-2 bg-bg-base border border-hairline focus:border-accent-action text-xs font-sans text-ink outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                Password
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-bg-base border border-hairline focus:border-accent-action text-xs font-sans text-ink outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-accent-action text-white text-xs font-sans font-medium hover:bg-opacity-95 disabled:opacity-50 transition-opacity"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </div>
          </form>

          <div className="pt-4 border-t border-hairline flex items-baseline justify-between text-xs text-ink-muted">
            <span>Don't have an account?</span>
            <button
              type="button"
              onClick={onSwitchToSignup}
              className="text-accent-action hover:underline font-medium"
            >
              Register New Account &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
