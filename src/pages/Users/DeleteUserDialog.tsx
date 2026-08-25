import { TriangleAlert, Trash2 } from "lucide-react";
import Button from "@/components/common/Button";
import type { User } from "@/api/users";
import { ROLE_LABELS } from "@/utils/permissions";

type DeleteUserDialogProps = {
  user: User;
  onConfirm: () => void;
  onCancel: () => void;
};


const DeleteUserDialog: React.FC<DeleteUserDialogProps> = ({
  user,
  onConfirm,
  onCancel,
}) => (
  <div
    role="dialog"
    aria-modal="true"
    aria-labelledby="remover-usuario-titulo"
    className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
  >
    <div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-xl">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger">
          <TriangleAlert size={20} strokeWidth={1.8} />
        </span>
        <div className="min-w-0">
          <h2
            id="remover-usuario-titulo"
            className="text-lg font-semibold text-ink"
          >
            Remover usuário
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            <span className="font-medium text-ink">{user.name}</span> (
            {user.account}) perde o acesso ao sistema imediatamente. Esta ação
            não pode ser desfeita.
          </p>
          <p className="mt-2 text-xs text-ink-faint">
            Papel atual: {ROLE_LABELS[user.role]}
          </p>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          onClick={onConfirm}
          icon={<Trash2 size={16} strokeWidth={1.8} />}
          className="bg-danger text-white hover:bg-danger/90"
        >
          Remover
        </Button>
      </div>
    </div>
  </div>
);

export default DeleteUserDialog;
