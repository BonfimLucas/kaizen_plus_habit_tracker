import React, { useState } from 'react';
import { ScreenType } from '../types';
import { supabase, signInWithGoogle, isSupabaseConfigured } from '../lib/supabase';

interface AuthScreenProps {
  onLoginSuccess: (userName: string) => void;
  initialMode?: 'login' | 'register';
  onNavigateHome: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLoginSuccess,
  initialMode = 'login',
  onNavigateHome,
}) => {
  const [isRegister, setIsRegister] = useState(initialMode === 'register');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedbackMessage(null);

    if (!isSupabaseConfigured()) {
      setIsLoading(false);
      setFeedbackMessage(
        'Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env para autenticar usuários reais.'
      );
      return;
    }

    try {
      if (isRegister) {
        if (password !== confirmPassword) {
          setIsLoading(false);
          setFeedbackMessage('As senhas não coincidem.');
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: name.trim() || undefined,
            },
          },
        });

        if (error) throw error;

        setIsLoading(false);
        if (data.session) {
          const resolvedName = name.trim() || email.split('@')[0] || 'Usuário';
          onLoginSuccess(resolvedName);
        } else {
          setFeedbackMessage('Conta criada com sucesso! Verifique seu e-mail para confirmar a conta.');
          setIsRegister(false);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        setIsLoading(false);
        const resolvedName =
          data.user?.user_metadata?.full_name ||
          data.user?.user_metadata?.name ||
          email.split('@')[0] ||
          'Usuário';
        onLoginSuccess(resolvedName);
      }
    } catch (err: unknown) {
      setIsLoading(false);
      const message = err instanceof Error ? err.message : 'Falha na autenticação';
      setFeedbackMessage(message);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setFeedbackMessage(null);

    if (!isSupabaseConfigured()) {
      setIsLoading(false);
      setFeedbackMessage(
        'Supabase não configurado. Adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env para realizar login com o Google.'
      );
      return;
    }

    try {
      await signInWithGoogle();
      // O Supabase redirecionará a página para o consentimento do Google OAuth
    } catch (err: unknown) {
      setIsLoading(false);
      const message = err instanceof Error ? err.message : 'Erro ao iniciar autenticação com o Google.';
      setFeedbackMessage(message);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[820px] flex flex-col justify-between text-white overflow-hidden bg-[#202422] select-none">
      {/* SVG de fundo orgânico com as folhas e curvas sutis */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-85"
        preserveAspectRatio="none"
        viewBox="0 0 412 890"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Top left organic shape */}
        <path d="M-20 -20 Q 80 15 20 120 Q -10 180 -40 180 Z" fill="#4d9b73" opacity="0.45" />
        <path d="M-30 -30 Q 50 10 0 90 Q -25 130 -50 120 Z" fill="#65d697" opacity="0.65" />
        {/* Broad shadow waves in dark backdrop */}
        <path d="M-50 280 C 120 220 280 130 450 140 L 450 -50 L -50 -50 Z" fill="#1b1e1c" opacity="0.5" />
        <path d="M450 680 C 250 720 120 780 -30 890 L 450 890 Z" fill="#181a19" opacity="0.7" />
        <path d="M450 740 C 320 770 260 840 220 890 L 450 890 Z" fill="#151716" opacity="0.8" />
        {/* Bottom right organic shape */}
        <path
          className="transition-opacity duration-500"
          d="M 450 780 C 380 820 340 850 320 920 L 450 920 Z"
          fill="#58be85"
          opacity={isRegister ? 0.5 : 0}
        />
      </svg>

      {/* Top Header / Back button */}
      <header className="relative z-20 pt-3 px-7 flex flex-col shrink-0">
        <div className="h-8 mt-2 flex items-center">
          {isRegister ? (
            <button
              aria-label="Voltar para Login"
              onClick={() => setIsRegister(false)}
              className="text-white/80 hover:text-white transition-opacity duration-200 p-1 -ml-1 focus:outline-none cursor-pointer flex items-center gap-1 text-xs"
              type="button"
            >
              <svg className="w-6 h-6 stroke-current" fill="none" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Voltar</span>
            </button>
          ) : (
            <div className="h-6" />
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-20 flex-1 px-8 flex flex-col justify-start -mt-2 overflow-y-auto no-scrollbar">
        {/* Brand Logo & Motto Header */}
        <div className="text-center pt-2 pb-6">
          <h1 className="text-[44px] font-bold tracking-tight inline-flex items-center text-white">
            Kaizen
            <span className="text-[#65d697] font-semibold text-5xl ml-0.5 leading-none">+</span>
          </h1>
          <p className="text-sm font-normal text-[#9aa29c] mt-2.5 max-w-[240px] mx-auto leading-tight transition-all duration-300">
            {isRegister ? (
              <>Comece agora a construir<br />o seu melhor eu.</>
            ) : (
              <>Pequenos hábitos.<br />Grandes resultados.</>
            )}
          </p>
        </div>

        {!isSupabaseConfigured() && (
          <div className="mb-4 p-3 bg-emerald-950/40 border border-[#65d697]/30 rounded-2xl text-[11px] text-[#b6ecd0] text-center leading-relaxed">
            ℹ️ <span className="font-semibold text-white">Configuração necessária:</span> Defina <code className="text-[#65d697] font-mono">VITE_SUPABASE_URL</code> e <code className="text-[#65d697] font-mono">VITE_SUPABASE_ANON_KEY</code> no arquivo <code className="text-white font-mono">.env</code> para conectar ao seu Supabase.
          </div>
        )}

        {feedbackMessage && (
          <div className="mb-3 p-2.5 bg-[#1b221d] border border-[#65d697]/40 rounded-xl text-xs text-[#a2e8c1] text-center leading-relaxed">
            {feedbackMessage}
          </div>
        )}

        {/* LOGIN VIEW */}
        {!isRegister ? (
          <div className="flex flex-col animate-in fade-in duration-300">
            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Input E-mail */}
              <div className="relative flex items-center">
                <span className="absolute left-4 text-[#8e968f] pointer-events-none">
                  <svg className="w-5 h-5 stroke-current" fill="none" strokeWidth="1.8" viewBox="0 0 24 24">
                    <rect height="14" rx="3" width="18" x="3" y="5" />
                    <path d="M3 7l9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#212522] border border-[#383e3a] focus:border-[#65d697] focus:ring-1 focus:ring-[#65d697] pl-12 pr-4 py-3.5 rounded-2xl text-sm text-gray-200 placeholder-[#79817a] outline-none transition"
                  placeholder="E-mail"
                  required
                  type="email"
                />
              </div>

              {/* Input Senha */}
              <div className="relative flex items-center">
                <span className="absolute left-4 text-[#8e968f] pointer-events-none">
                  <svg className="w-5 h-5 stroke-current" fill="none" strokeWidth="1.8" viewBox="0 0 24 24">
                    <rect height="10" rx="2.5" width="14" x="5" y="11" />
                    <path d="M8 11V7a4 4 0 018 0v4" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#212522] border border-[#383e3a] focus:border-[#65d697] focus:ring-1 focus:ring-[#65d697] pl-12 pr-12 py-3.5 rounded-2xl text-sm text-gray-200 placeholder-[#79817a] outline-none transition"
                  placeholder="Senha"
                  required
                  type={showPassword ? 'text' : 'password'}
                />
                <button
                  aria-label="Alternar exibição da senha"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-[#79817a] hover:text-[#9ea69f] focus:outline-none cursor-pointer"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5 stroke-current text-[#65d697]" fill="none" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 stroke-current" fill="none" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Link Esqueceu sua senha? */}
              <div className="pt-0.5 text-left">
                <button
                  type="button"
                  onClick={() => setFeedbackMessage('Link de recuperação enviado para seu e-mail!')}
                  className="text-xs font-normal text-[#65d697] hover:underline focus:outline-none cursor-pointer"
                >
                  Esqueceu sua senha?
                </button>
              </div>

              {/* CTA Entrar */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#65d697] hover:bg-[#58c588] active:scale-[0.98] text-[#131b15] font-semibold text-sm py-3.5 rounded-3xl mt-4 flex items-center justify-center space-x-2 transition duration-150 shadow-md shadow-[#65d697]/10 cursor-pointer"
              >
                <span>{isLoading ? 'Entrando...' : 'Entrar'}</span>
                <svg className="w-4 h-4 stroke-current stroke-2" fill="none" viewBox="0 0 24 24">
                  <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </form>

            {/* Divider "ou" */}
            <div className="relative my-6 flex items-center justify-center">
              <div className="border-t border-[#363d38] w-full" />
              <span className="bg-[#202422] px-3 text-[11px] font-normal text-[#808781] uppercase tracking-wider absolute">
                ou
              </span>
            </div>

            {/* Google Login Button */}
            <button
              onClick={handleGoogleLogin}
              type="button"
              className="w-full bg-transparent border border-[#3b433e] hover:border-[#4d5650] hover:bg-white/5 active:scale-[0.98] text-white text-sm font-medium py-3 rounded-full flex items-center justify-center space-x-2.5 transition duration-150 cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                <path d="M12.24 10.285V13.8h6.887C18.6 15.618 16.92 18 12.24 18c-3.327 0-6.027-2.7-6.027-6s2.7-6 6.027-6c1.68 0 3.033.642 3.974 1.543l2.82-2.82C17.29 2.977 14.97 2 12.24 2 6.58 2 2 6.58 2 12.24s4.58 10.24 10.24 10.24c5.918 0 9.84-4.16 9.84-10.016 0-.672-.072-1.317-.18-1.92H12.24z" />
              </svg>
              <span className="text-xs text-[#d1d5d2] font-normal">Entrar com o Google</span>
            </button>

            {/* Footer Link (Ir para Cadastro) */}
            <div className="mt-8 text-center text-xs text-[#8f9690]">
              Não tem uma conta?{' '}
              <button
                type="button"
                onClick={() => setIsRegister(true)}
                className="text-[#65d697] font-medium underline hover:text-[#7ce2a7] ml-0.5 focus:outline-none cursor-pointer"
              >
                Cadastre-se
              </button>
            </div>
          </div>
        ) : (
          /* REGISTER VIEW */
          <div className="flex flex-col animate-in fade-in duration-300">
            <form className="space-y-3.5" onSubmit={handleSubmit}>
              {/* Input Nome Completo */}
              <div className="relative flex items-center">
                <span className="absolute left-4 text-[#8e968f] pointer-events-none">
                  <svg className="w-5 h-5 stroke-current" fill="none" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#212522] border border-[#383e3a] focus:border-[#65d697] focus:ring-1 focus:ring-[#65d697] pl-12 pr-4 py-3 rounded-2xl text-sm text-gray-200 placeholder-[#79817a] outline-none transition"
                  placeholder="Nome completo"
                  required
                  type="text"
                />
              </div>

              {/* Input E-mail */}
              <div className="relative flex items-center">
                <span className="absolute left-4 text-[#8e968f] pointer-events-none">
                  <svg className="w-5 h-5 stroke-current" fill="none" strokeWidth="1.8" viewBox="0 0 24 24">
                    <rect height="14" rx="3" width="18" x="3" y="5" />
                    <path d="M3 7l9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#212522] border border-[#383e3a] focus:border-[#65d697] focus:ring-1 focus:ring-[#65d697] pl-12 pr-4 py-3 rounded-2xl text-sm text-gray-200 placeholder-[#79817a] outline-none transition"
                  placeholder="E-mail"
                  required
                  type="email"
                />
              </div>

              {/* Input Senha */}
              <div className="relative flex items-center">
                <span className="absolute left-4 text-[#8e968f] pointer-events-none">
                  <svg className="w-5 h-5 stroke-current" fill="none" strokeWidth="1.8" viewBox="0 0 24 24">
                    <rect height="10" rx="2.5" width="14" x="5" y="11" />
                    <path d="M8 11V7a4 4 0 018 0v4" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#212522] border border-[#383e3a] focus:border-[#65d697] focus:ring-1 focus:ring-[#65d697] pl-12 pr-12 py-3 rounded-2xl text-sm text-gray-200 placeholder-[#79817a] outline-none transition"
                  placeholder="Senha"
                  required
                  type={showPassword ? 'text' : 'password'}
                />
                <button
                  aria-label="Alternar exibição da senha"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-[#79817a] hover:text-[#9ea69f] focus:outline-none cursor-pointer"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5 stroke-current text-[#65d697]" fill="none" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 stroke-current" fill="none" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Input Confirmar Senha */}
              <div className="relative flex items-center">
                <span className="absolute left-4 text-[#8e968f] pointer-events-none">
                  <svg className="w-5 h-5 stroke-current" fill="none" strokeWidth="1.8" viewBox="0 0 24 24">
                    <rect height="10" rx="2.5" width="14" x="5" y="11" />
                    <path d="M8 11V7a4 4 0 018 0v4" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#212522] border border-[#383e3a] focus:border-[#65d697] focus:ring-1 focus:ring-[#65d697] pl-12 pr-12 py-3 rounded-2xl text-sm text-gray-200 placeholder-[#79817a] outline-none transition"
                  placeholder="Confirmar senha"
                  required
                  type={showConfirmPassword ? 'text' : 'password'}
                />
                <button
                  aria-label="Alternar exibição da confirmação de senha"
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 text-[#79817a] hover:text-[#9ea69f] focus:outline-none cursor-pointer"
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5 stroke-current text-[#65d697]" fill="none" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 stroke-current" fill="none" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              </div>

              {/* CTA Criar conta */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#65d697] hover:bg-[#58c588] active:scale-[0.98] text-[#131b15] font-semibold text-sm py-3.5 rounded-3xl mt-2 flex items-center justify-center space-x-2 transition duration-150 shadow-md shadow-[#65d697]/10 cursor-pointer"
              >
                <span>{isLoading ? 'Criando conta...' : 'Criar conta'}</span>
                <svg className="w-4 h-4 stroke-current stroke-2" fill="none" viewBox="0 0 24 24">
                  <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </form>

            {/* Divider "ou" */}
            <div className="relative my-4 flex items-center justify-center">
              <div className="border-t border-[#363d38] w-full" />
              <span className="bg-[#202422] px-3 text-[11px] font-normal text-[#808781] uppercase tracking-wider absolute">
                ou
              </span>
            </div>

            {/* Google Register Button */}
            <button
              onClick={handleGoogleLogin}
              type="button"
              className="w-full bg-transparent border border-[#3b433e] hover:border-[#4d5650] hover:bg-white/5 active:scale-[0.98] text-white text-sm font-medium py-3 rounded-full flex items-center justify-center space-x-2.5 transition duration-150 cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                <path d="M12.24 10.285V13.8h6.887C18.6 15.618 16.92 18 12.24 18c-3.327 0-6.027-2.7-6.027-6s2.7-6 6.027-6c1.68 0 3.033.642 3.974 1.543l2.82-2.82C17.29 2.977 14.97 2 12.24 2 6.58 2 2 6.58 2 12.24s4.58 10.24 10.24 10.24c5.918 0 9.84-4.16 9.84-10.016 0-.672-.072-1.317-.18-1.92H12.24z" />
              </svg>
              <span className="text-xs text-[#d1d5d2] font-normal">Cadastrar com o Google</span>
            </button>

            {/* Footer Link (Voltar para Login) */}
            <div className="mt-5 mb-2 text-center text-xs text-[#8f9690]">
              Já tem uma conta?{' '}
              <button
                type="button"
                onClick={() => setIsRegister(false)}
                className="text-[#65d697] font-medium underline hover:text-[#7ce2a7] ml-0.5 focus:outline-none cursor-pointer"
              >
                Entrar
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Botanical Graphic - Broto/folhas no canto inferior esquerdo */}
      <div
        className={`relative z-10 pl-6 pb-4 pointer-events-none select-none transition-opacity duration-300 ${
          isRegister ? 'opacity-20' : 'opacity-100'
        }`}
      >
        <svg className="w-16 h-16 drop-shadow" fill="none" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
          {/* Haste sutil curva */}
          <path d="M22 66 C 22 55, 30 46, 36 38" stroke="#375543" strokeLinecap="round" strokeWidth="2.5" />
          {/* Folha inferior esquerda */}
          <path d="M22 62 C 14 62, 10 54, 13 46 C 18 48, 23 54, 22 62 Z" fill="#65d697" opacity="0.9" />
          {/* Folha central superior */}
          <path d="M37 38 C 36 26, 46 22, 53 25 C 52 34, 46 39, 37 38 Z" fill="#7ae2a7" opacity="0.95" />
          {/* Folha direita média */}
          <path d="M33 48 C 36 43, 50 42, 54 50 C 47 54, 38 52, 33 48 Z" fill="#4ea878" opacity="0.85" />
        </svg>
      </div>

      {/* Safe area iOS Home Indicator */}
      <div className="relative z-20 pb-2 w-full flex justify-center">
        <div className="w-32 h-1 bg-white/20 rounded-full" />
      </div>
    </div>
  );
};
