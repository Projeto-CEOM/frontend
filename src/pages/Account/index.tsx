import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TriangleAlert } from "lucide-react";
import { useAuth } from "@/hooks/UseAuth";
import UserForm from "../Users/UserForm";

const NOTICE_TIMEOUT_MS = 6000;

type SaveStatus = "idle" | "success" | "error";

/**
 * Auto-serviço da própria conta, aberto a qualquer papel.
 *
 * A versão somente-leitura para editor/viewer deixou de existir quando o
 * backend passou a liberar `GET`/`PUT` de `/users/:id` para o próprio dono do
 * token (`allowSelfOrRole`). Por isso aqui não há mais checagem de permissão:
 * quem gerencia terceiros é a tela de Usuários, que continua atrás do bit
 * `users`.
 */
const Account: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [status, setStatus] = useState<SaveStatus>("idle");
  const [failedAt, setFailedAt] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (status === "idle") return;

    timer.current = setTimeout(() => setStatus("idle"), NOTICE_TIMEOUT_MS);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [status, failedAt]);

  const goBackOrDashboard = () => {
    const isFirstEntry = (window.history.state?.idx ?? 0) === 0;

    if (isFirstEntry) navigate("/dashboard", { replace: true });
    else navigate(-1);
  };

  const handleResult = (result: "success" | "error") => {
    if (result === "success") {
      goBackOrDashboard();
      return;
    }

    setStatus("error");
    setFailedAt(
      new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    );
  };

  if (!user) return null;

  return (
    <UserForm
      userId={user.id}
      title="Configurações da conta"
      cancelLabel="Voltar"
      onCancel={goBackOrDashboard}
      onSaved={() => undefined}
      onResult={handleResult}
      notice={
        status === "error" ? (
          <div
            role="status"
            aria-live="polite"
            className="mt-4 flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger-soft p-4"
          >
            <TriangleAlert
              size={16}
              strokeWidth={1.8}
              className="mt-0.5 shrink-0 text-danger"
            />
            <p className="text-xs text-ink-soft">
              <span className="font-medium text-ink">
                Não foi possível salvar
              </span>{" "}
              às {failedAt} — os campos voltaram ao estado anterior. Confira a
              mensagem do erro e tente de novo.
            </p>
          </div>
        ) : null
      }
    />
  );
};

export default Account;
