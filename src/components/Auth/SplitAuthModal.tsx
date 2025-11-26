import { useState } from 'react';
import { X, Mail, Lock, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface SplitAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
}

export default function SplitAuthModal({ isOpen, onClose, defaultMode = 'login' }: SplitAuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (!data.session) {
        throw new Error('Unable to sign in. If you just registered, email confirmation may be pending.');
      }

      console.log('[Auth] Login successful:', data.user?.email);
      toast.success('Successfully logged in!', {
        duration: 3000,
        position: 'top-center',
      });

      setTimeout(() => {
        onClose();
        setEmail('');
        setPassword('');
      }, 500);
    } catch (err: any) {
      console.error('[Auth] Login error:', err);
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Please provide a username');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!acceptedTerms) {
      setError('Please accept the Terms & Conditions');
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpError} = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            username: username.trim(),
          },
          // Disable email confirmation - users can login immediately
          emailRedirectTo: undefined,
        },
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        console.log('[Auth] Registration successful:', data.user.email);

        // Create user profile in database
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: email,
            username: username.trim(),
            wallet_address: '',
          });

        if (profileError) {
          console.error('[Auth] Profile creation error:', profileError);
        }

        // User is logged in immediately - no email confirmation required
        toast.success('Welcome! Your account has been created. You can now connect your wallet.', {
          duration: 3000,
          position: 'top-center',
        });

        setUsername('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        onClose();
      }
    } catch (err: any) {
      console.error('[Auth] Registration error:', err);
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError('');

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (oauthError) throw oauthError;

      console.log('[Auth] Google OAuth initiated');
    } catch (err: any) {
      console.error('[Auth] Google auth error:', err);
      setError(err.message || 'Failed to authenticate with Google.');
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setAcceptedTerms(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal - Split Screen on Desktop, Stacked on Mobile */}
      <div className="relative bg-white rounded-2xl max-w-5xl w-full max-h-[95vh] md:h-[600px] border border-gray-200 shadow-2xl overflow-hidden animate-fade-in flex flex-col md:flex-row">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 md:top-4 md:right-4 z-20 p-2 bg-white/90 md:bg-transparent hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* Top on Mobile / Right Side on Desktop - Background */}
        <div className="w-full md:w-1/2 h-48 md:h-auto relative overflow-hidden md:order-2 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100">
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/20 to-gray-800/20" />

          {/* Content Overlay */}
          <div className="relative z-10 h-full flex flex-col items-center justify-center p-6 md:p-12 text-gray-900">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 md:mb-4 text-center">
              Decentralized Escrow
            </h3>
            <p className="text-sm md:text-lg text-gray-700 text-center max-w-md hidden sm:block">
              Create your profile first, then connect your wallet to secure your high-value transactions.
            </p>

            {/* Feature Pills - Hidden on small mobile */}
            <div className="mt-4 md:mt-8 hidden md:flex flex-wrap gap-2 justify-center">
              <div className="px-3 md:px-4 py-1.5 md:py-2 bg-white/60 backdrop-blur-md rounded-full text-xs md:text-sm font-medium">
                Profile Required
              </div>
              <div className="px-3 md:px-4 py-1.5 md:py-2 bg-white/60 backdrop-blur-md rounded-full text-xs md:text-sm font-medium">
                Smart Contract Security
              </div>
              <div className="px-3 md:px-4 py-1.5 md:py-2 bg-white/60 backdrop-blur-md rounded-full text-xs md:text-sm font-medium">
                Multi-Signature
              </div>
              <div className="px-3 md:px-4 py-1.5 md:py-2 bg-white/60 backdrop-blur-md rounded-full text-xs md:text-sm font-medium">
                IPFS Storage
              </div>
            </div>
          </div>
        </div>

        {/* Bottom on Mobile / Left Side on Desktop - Auth Form */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 md:p-12 overflow-y-auto md:order-1">
          {/* Logo & Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center space-x-2 mb-4 sm:mb-6">
              <span className="text-base sm:text-lg font-semibold text-gray-900">
                PrivateCharterX <span className="font-bold">Escrow</span>
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-light text-gray-900 mb-2 tracking-tight">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 font-light">
              {mode === 'login'
                ? 'Sign in to your escrow account'
                : 'Register with your details, then connect your wallet'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-3 sm:space-y-4">
            {/* Username Field (Register Only) */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-1.5 sm:mb-2">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username"
                    required
                    minLength={3}
                    maxLength={20}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-md text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all font-normal"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 font-normal">
                  3-20 characters
                </p>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-1.5 sm:mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-md text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all font-normal"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  minLength={mode === 'register' ? 8 : undefined}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-md text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all font-normal"
                />
              </div>
              {mode === 'register' && (
                <p className="mt-1 text-xs text-gray-500 font-normal">
                  Minimum 8 characters
                </p>
              )}
            </div>

            {/* Confirm Password (Register Only) */}
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                    minLength={8}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-md text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all font-normal"
                  />
                </div>
              </div>
            )}

            {/* Terms Checkbox (Register Only) */}
            {mode === 'register' && (
              <div className="flex items-start gap-3 pt-2">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-2 focus:ring-gray-900 cursor-pointer"
                  />
                </div>
                <label className="text-xs text-gray-600 font-normal cursor-pointer">
                  I agree to the{' '}
                  <a href="/terms" className="text-gray-900 font-semibold hover:underline">
                    Terms & Conditions
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="text-gray-900 font-semibold hover:underline">
                    Privacy Policy
                  </a>
                </label>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-all font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm mt-6"
            >
              {loading
                ? (mode === 'login' ? 'Signing in...' : 'Creating account...')
                : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-gray-500 font-medium">or continue with</span>
            </div>
          </div>

          {/* Social & Wallet Auth */}
          <div className="space-y-3">
            {/* Google Auth */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full py-2.5 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-all font-medium text-sm text-gray-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            {/* Info about wallet connection */}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                After signing in, you can connect your wallet in the header
              </p>
            </div>
          </div>

          {/* Switch Mode Link */}
          <p className="mt-6 text-center text-xs text-gray-600 font-normal">
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={switchMode}
                  className="text-gray-900 font-semibold hover:underline"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={switchMode}
                  className="text-gray-900 font-semibold hover:underline"
                >
                  Log in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
