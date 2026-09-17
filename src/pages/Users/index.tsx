import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useDeleteUser, useUsers } from "@/api/queries/useUsers";
import type { User } from "@/api/users";
import Button from "@/components/common/Button";
import DataTable, { type DataTableColumn } from "@/components/common/DataTable";
import { usePermissions } from "@/hooks/UsePermissions";
import { useAuth } from "@/hooks/UseAuth";
import { ROLE_LABELS, canManageRole, type Role } from "@/utils/permissions";
import { cn } from "@/utils/cn";
import UserForm from "./UserForm";
import DeleteUserDialog from "./DeleteUserDialog";

const PAGE_SIZE = 10;

const ROLE_BADGE: Record<Role, string> = {
  admin: "border border-primary bg-white text-primary",
  owner: "bg-primary text-white",
  editor: "bg-primary/15 text-primary",
  viewer: "bg-ink-faint/20 text-ink-muted",
};

const Users: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = Number(searchParams.get("page"));
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const { data, isLoading } = useUsers({ page, pageSize: PAGE_SIZE });
  const users = data?.data ?? [];
  const meta = data?.meta;

  const deleteUser = useDeleteUser();
  const { role: actorRole, can } = usePermissions();
  const { user: sessionUser } = useAuth();

  const [pendingDeletion, setPendingDeletion] = useState<User | null>(null);

  const formParam = searchParams.get("usuario");
  const isFormOpen = formParam !== null;
  const editingUserId = formParam && formParam !== "novo" ? formParam : null;

  const isSelf = (user: User) => String(user.id) === String(sessionUser?.id);

  const canManage = (user: User) =>
    !isSelf(user) && canManageRole(actorRole, user.role);

  const canEdit = (user: User) => canManage(user) && can("u");
  const canDelete = (user: User) => canManage(user) && can("d");

  const openForm = (user?: User) => {
    const next = new URLSearchParams(searchParams);
    next.set("usuario", user ? user.id : "novo");
    setSearchParams(next);
  };

  const closeForm = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("usuario");
    setSearchParams(next);
  };

  const goToPage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(nextPage));
    setSearchParams(next);
  };

  const totalPages = meta?.totalPages;
  useEffect(() => {
    if (totalPages !== undefined && totalPages > 0 && page > totalPages) {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.set("page", String(totalPages));
          return next;
        },
        { replace: true },
      );
    }
  }, [totalPages, page, setSearchParams]);

  const editingTarget = editingUserId
    ? users.find((user) => user.id === editingUserId)
    : undefined;
  const editingBlocked = Boolean(editingTarget && !canEdit(editingTarget));

  useEffect(() => {
    if (isFormOpen && editingBlocked) closeForm();
  }, [isFormOpen, editingBlocked]);

  if (isFormOpen && !editingBlocked) {
    return (
      <UserForm
        userId={editingUserId}
        onCancel={closeForm}
        onSaved={closeForm}
      />
    );
  }

  const columns: DataTableColumn<User>[] = [
    {
      header: "Usuário",
      align: "left",
      width: "25%",
      render: (user) => (
        <span className="flex items-center gap-2">
          <span className="truncate font-medium text-ink">{user.account}</span>
          {isSelf(user) && (
            <span className="shrink-0 rounded-full border border-border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-faint">
              você
            </span>
          )}
        </span>
      ),
    },
    {
      header: "Nome",
      align: "left",
      width: "25%",
      render: (user) => <span className="text-ink-soft">{user.name}</span>,
    },
    // {
    //   header: "E-mail",
    //   align: "center",
    //   width: "25%",
    //   render: (user) => (
    //     <span className="text-ink-soft">{user.email || "—"}</span>
    //   ),
    // },
    // {
    //   header: "Telegram",
    //   align: "center",
    //   width: "25%",
    //   render: (user) => (
    //     <span className="text-ink-soft">{user.telegramUser || "—"}</span>
    //   ),
    // },
    {
      header: "Telefone",
      align: "center",
      width: "25%",
      render: (user) => (
        <div className="flex flex-col items-center gap-1">
          <span className="text-ink-soft">{user.phone || "-"}</span>
          
          {/* Exibe a badge de status caso o usuário tenha um telefone cadastrado */}
          {user.phone && (
            <span
              className={cn(
                "inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                user.telegramVerified
                  ? "bg-primary/10 text-primary"
                  : "bg-danger-soft text-danger"
              )}
            >
              {user.telegramVerified ? "Verificado" : "Pendente"}
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Papel",
      align: "center",
      width: "15%",
      render: (user) => (
        <span
          className={cn(
            "inline-flex rounded-lg px-3 py-1 text-xs font-medium",
            ROLE_BADGE[user.role],
          )}
        >
          {ROLE_LABELS[user.role]}
        </span>
      ),
    },
    {
      header: "Ações",
      align: "center",
      width: "10%",
      render: (user) =>
        canEdit(user) || canDelete(user) ? (
          <div className="flex items-center justify-center gap-1">
            {canEdit(user) && (
              <button
                type="button"
                onClick={() => openForm(user)}
                aria-label={`Editar ${user.account}`}
                className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-primary/10 hover:text-primary"
              >
                <Pencil size={16} strokeWidth={1.8} />
              </button>
            )}
            {canDelete(user) && (
              <button
                type="button"
                onClick={() => setPendingDeletion(user)}
                aria-label={`Remover ${user.account}`}
                className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-danger-soft hover:text-danger"
              >
                <Trash2 size={16} strokeWidth={1.8} />
              </button>
            )}
          </div>
        ) : (
          <span className="text-xs text-ink-faint">—</span>
        ),
    },
  ];

  return (
    <div className="px-6 py-10 md:px-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Usuários</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Contas com acesso ao monitoramento. Você gerencia apenas papéis
            abaixo do seu.
          </p>
        </div>
        {can("c") && (
          <Button
            icon={<Plus size={16} strokeWidth={1.8} />}
            onClick={() => openForm()}
          >
            Novo usuário
          </Button>
        )}
      </div>

      <div className="mt-6">
        <DataTable
          columns={columns}
          data={users}
          getRowKey={(user) => user.id}
          onPageChange={goToPage}
          pagination={meta}
          isLoading={isLoading}
          skeletonRows={Math.min(PAGE_SIZE, 5)}
          emptyMessage="Nenhum usuário cadastrado ainda."
        />
      </div>

      {pendingDeletion && (
        <DeleteUserDialog
          user={pendingDeletion}
          onCancel={() => setPendingDeletion(null)}
          onConfirm={() => {
            deleteUser.mutate(pendingDeletion.id);
            setPendingDeletion(null);
          }}
        />
      )}
    </div>
  );
};

export default Users;
