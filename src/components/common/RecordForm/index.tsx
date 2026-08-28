import type { ReactNode } from "react";
import {
  Controller,
  type FieldValues,
  type Path,
  type SubmitHandler,
  type UseFormReturn,
} from "react-hook-form";
import { ArrowLeft } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Input from "../Input";
import Button from "../Button";
import Select from "../Select";

export type RecordFormInputField<T extends FieldValues> = {
  /** Caminho do campo no schema — as mensagens vêm do resolver (yup pt-BR). */
  name: Path<T>;
  label?: string;
  type?: "text" | "email" | "password" | "number" | "textarea" | "select" | "date";
  icon?: LucideIcon;
  placeholder?: string;
  rows?: number;
  step?: string;
  min?: string;
  max?: string;
  required?: boolean;
  disabled?: boolean;
  options?: Array<{ value: string; label: string }>;
  /** Efeitos colaterais na troca do valor (ex.: preencher campos irmãos). */
  onValueChange?: (value: string) => void;
};

export type RecordFormFieldGroup<T extends FieldValues> = {
  groupLabel: string;
  fields: RecordFormInputField<T>[];
};

export type RecordFormField<T extends FieldValues> =
  | RecordFormInputField<T>
  | RecordFormFieldGroup<T>;

const isFieldGroup = <T extends FieldValues>(
  field: RecordFormField<T>,
): field is RecordFormFieldGroup<T> => "fields" in field;

type RecordFormProps<T extends FieldValues> = {
  title: string;
  subtitle?: string;
  /** Instância criada na página com `useForm` + `yupResolver`. */
  form: UseFormReturn<T>;
  fields: RecordFormField<T>[];
  onSubmit: SubmitHandler<T>;
  onCancel: () => void;
  /** Erro vindo da API (os erros de validação saem do próprio schema). */
  error?: string;
  notice?: ReactNode;
  isSubmitting?: boolean;
  isLoading?: boolean;
  submitLabel: string;
  submittingLabel?: string;
  submitIcon?: ReactNode;
  cancelLabel?: string;
};

const RecordForm = <T extends FieldValues>({
  title,
  subtitle,
  form,
  fields,
  onSubmit,
  onCancel,
  error,
  notice,
  isSubmitting,
  isLoading,
  submitLabel,
  submittingLabel = "Salvando...",
  submitIcon,
  cancelLabel = "Voltar para a lista",
}: RecordFormProps<T>) => {
  const busy = isSubmitting ?? form.formState.isSubmitting;

  const renderField = (field: RecordFormInputField<T>) => (
    <Controller
      key={field.name}
      name={field.name}
      control={form.control}
      render={({ field: controlled, fieldState }) => {
        const value = controlled.value ?? "";
        const message = fieldState.error?.message;

        const handleChange = (next: string) => {
          controlled.onChange(next);
          field.onValueChange?.(next);
        };

        if (field.type === "textarea") {
          return (
            <div className="flex flex-col gap-1.5">
              {field.label && (
                <label
                  htmlFor={field.name}
                  className="text-xs font-medium text-ink-soft"
                >
                  {field.label}
                </label>
              )}
              <textarea
                id={field.name}
                ref={controlled.ref}
                name={controlled.name}
                rows={field.rows ?? 4}
                placeholder={field.placeholder}
                value={value}
                onBlur={controlled.onBlur}
                onChange={(e) => handleChange(e.target.value)}
                className={`w-full resize-none rounded-lg border bg-surface/60 px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10 ${
                  message ? "border-danger/40" : "border-border"
                }`}
              />
              {message && (
                <p className="text-xs font-medium text-danger">{message}</p>
              )}
            </div>
          );
        }

        if (field.type === "select") {
          return (
            <Select
              id={field.name}
              ref={controlled.ref}
              label={field.label}
              icon={field.icon}
              required={field.required}
              disabled={field.disabled}
              error={message}
              placeholder={field.placeholder}
              options={field.options ?? []}
              value={value}
              onChange={handleChange}
            />
          );
        }

        return (
          <Input
            id={field.name}
            ref={controlled.ref}
            name={controlled.name}
            type={field.type ?? "text"}
            step={field.step}
            min={field.min}
            max={field.max}
            required={field.required}
            disabled={field.disabled}
            error={message}
            label={field.label}
            icon={field.icon}
            placeholder={field.placeholder}
            value={value}
            onBlur={controlled.onBlur}
            onChange={(e) => handleChange(e.target.value)}
          />
        );
      }}
    />
  );

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 md:px-10">
      <button
        type="button"
        onClick={onCancel}
        className="mb-4 flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink hover:bg-surface-hover p-2 rounded-lg"
      >
        <ArrowLeft size={16} strokeWidth={1.8} />
        {cancelLabel}
      </button>

      <h1 className="text-2xl font-semibold text-ink">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}

      {notice}

      {isLoading ? (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-6 shadow-sm md:p-8">
          <p className="text-sm text-ink-faint">Carregando dados...</p>
        </div>
      ) : (
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
          className="mt-6 flex flex-col gap-5 rounded-2xl border border-border bg-surface p-6 shadow-sm md:p-8"
        >
          {fields.map((field) =>
            isFieldGroup(field) ? (
              <div key={field.groupLabel}>
                <p className="mb-1.5 text-xs font-medium text-ink-soft">
                  {field.groupLabel}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {field.fields.map(renderField)}
                </div>
              </div>
            ) : (
              renderField(field)
            ),
          )}

          {error && (
            <p className="rounded-lg bg-danger-soft px-3 py-2 text-xs font-medium text-danger">
              {error}
            </p>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              loading={busy}
              loadingText={submittingLabel}
              icon={submitIcon}
            >
              {submitLabel}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default RecordForm;
