import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Thermometer, Mail, Lock, LogIn } from "lucide-react";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import { useAuth } from "../../contexts/AuthContext";

const Login: React.FC = () => {
  const { user: loggedInUser, login } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user.trim() || !password.trim()) {
      setError("Preencha usuário e senha para continuar.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    setIsSubmitting(false);
    login(user);
    navigate("/dashboard", { replace: true });
  };

  if (loggedInUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="animated-gradient min-h-screen w-full flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-white/40 bg-surface/75 p-8 shadow-2xl shadow-primary/20 backdrop-blur-xl">
          <div className="mb-8 flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-sm shadow-primary/30">
              <Thermometer size={20} strokeWidth={1.8} />
            </div>
            <div className="leading-tight">
              <p className="text-base font-bold uppercase tracking-tight text-ink">
                CEOM
              </p>
              <p className="text-[11px] font-medium uppercase tracking-widest text-ink-muted">
                Monitoramento
              </p>
            </div>
          </div>

          <h1 className="text-xl font-semibold text-ink">Bem-vindo de volta</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Entre com suas credenciais para acessar o monitoramento do acervo.
          </p>

          <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
            <Input
              id="user"
              type="email"
              label="Usuário"
              icon={Mail}
              autoComplete="user"
              placeholder="user@domain"
              value={user}
              onChange={(e) => setUser(e.target.value)}
            />

            <Input
              id="password"
              type="password"
              label="Senha"
              icon={Lock}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <label className="flex select-none items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-primary focus:ring-primary/30"
              />
              Lembrar de mim
            </label>

            {error && (
              <p className="rounded-lg bg-danger-soft/90 px-3 py-2 text-xs font-medium text-danger">
                {error}
              </p>
            )}

            <Button
              type="submit"
              loading={isSubmitting}
              loadingText="Entrando..."
              icon={<LogIn size={16} strokeWidth={1.8} />}
              disabled={isSubmitting}
            >
              Entrar
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-ink">
          Centro de Memória do Oeste de Santa Catarina - UFFS
        </p>
      </div>
    </div>
  );
};

export default Login;
