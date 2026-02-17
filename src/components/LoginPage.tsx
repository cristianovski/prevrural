import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";
import { LayoutDashboard, LogIn, UserPlus, AlertCircle } from "lucide-react";

export function LoginPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false); // Alternar entre Login e Cadastro
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (session) {
      navigate("/");
    }
  }, [session, navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      if (isSignUp) {
        // CADASTRO
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMsg("✅ Cadastro realizado! Verifique seu e-mail ou faça login.");
      } else {
        // LOGIN
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      setMsg("❌ " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl p-8 space-y-6 animate-in fade-in zoom-in-95 duration-300">
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mx-auto">
             <LayoutDashboard size={24} />
          </div>
          <h1 className="text-2xl font-bold text-foreground">PrevRural</h1>
          <p className="text-muted-foreground">O sistema definitivo para Direito Previdenciário Rural.</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">E-mail Profissional</label>
            <input 
              type="email" 
              required
              className="w-full bg-secondary/30 border border-input rounded-xl p-3 outline-none focus:border-primary transition-colors"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Senha</label>
            <input 
              type="password" 
              required
              className="w-full bg-secondary/30 border border-input rounded-xl p-3 outline-none focus:border-primary transition-colors"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          {msg && (
            <div className="p-3 bg-secondary/50 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle size={14} />
              {msg}
            </div>
          )}

          <button 
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {loading ? "Processando..." : (isSignUp ? "Criar Conta Grátis" : "Entrar no Sistema")}
            {!loading && (isSignUp ? <UserPlus size={18} /> : <LogIn size={18} />)}
          </button>
        </form>

        <div className="text-center">
          <button 
            onClick={() => { setIsSignUp(!isSignUp); setMsg(""); }}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {isSignUp ? "Já tem uma conta? Faça Login" : "Não tem conta? Cadastre-se"}
          </button>
        </div>

      </div>
    </div>
  );
}