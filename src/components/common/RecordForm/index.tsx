import type { ReactNode, SyntheticEvent } from "react";
import { ArrowLeft } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Input from "../Input";
import Button from "../Button";
import Select from "../Select";

export type RecordFormInputField = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "number" | "textarea" | "select";
  icon?: LucideIcon;
  placeholder?: string;
  rows?: number;
  step?: string;
  required?: boolean;
  error?: string;
  options?: Array<{ value: string; label: string }>;
};

export type RecordFormFieldGroup = {
  groupLabel: string;
  fields: Array<{
    id: string;
    value: string;
    onChange: (value: string) => void;
    type?: "text" | "number";
    icon?: LucideIcon;
    placeholder?: string;
    step?: string;
    min?: string;
    max?: string;
    required?: boolean;
    error?: string;
  }>;
};

export type RecordFormField = RecordFormInputField | RecordFormFieldGroup;

const isFieldGroup = (field: RecordFormField): field is RecordFormFieldGroup =>
  "fields" in field;

type RecordFormProps = {
  title: string;
  subtitle?: string;
  fields: RecordFormField[];
  error?: string;
  isSubmitting?: boolean;
  submitLabel: string;
  submittingLabel?: string;
  submitIcon?: ReactNode;
  cancelLabel?: string;
  onSubmit: (e: SyntheticEvent<HTMLFormElement>) => void;
  onCancel: () => void;
};

const RecordForm: React.FC<RecordFormProps> = ({
  title,
  subtitle,
  fields,
  error,
  isSubmitting,
  submitLabel,
  submittingLabel = "Salvando...",
  submitIcon,
  cancelLabel = "Voltar para a lista",
  onSubmit,
  onCancel,
}) => {
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

      <form
        onSubmit={onSubmit}
        noValidate
        className="mt-6 flex flex-col gap-5 rounded-2xl border border-border bg-surface p-6 shadow-sm md:p-8"
      >
        {fields.map((field) => {
          if (isFieldGroup(field)) {
            return (
              <div key={field.groupLabel}>
                <p className="mb-1.5 text-xs font-medium text-ink-soft">
                  {field.groupLabel}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {field.fields.map((subField) => (
                    <Input
                      key={subField.id}
                      id={subField.id}
                      type={subField.type ?? "text"}
                      step={subField.step}
                      min={subField.min}
                      max={subField.max}
                      required={subField.required}
                      error={subField.error}
                      icon={subField.icon}
                      placeholder={subField.placeholder}
                      value={subField.value}
                      onChange={(e) => subField.onChange(e.target.value)}
                    />
                  ))}
                </div>
              </div>
            );
          }

          if (field.type === "textarea") {
            return (
              <div key={field.id} className="flex flex-col gap-1.5">
                <label
                  htmlFor={field.id}
                  className="text-xs font-medium text-ink-soft"
                >
                  {field.label}
                </label>
                <textarea
                  id={field.id}
                  rows={field.rows ?? 4}
                  placeholder={field.placeholder}
                  value={field.value}
                  required={field.required}
                  onChange={(e) => field.onChange(e.target.value)}
                  className={`w-full resize-none rounded-lg border bg-surface/60 px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10 ${
                    field.error ? "border-danger/40" : "border-border"
                  }`}
                />
                {field.error && (
                  <p className="text-xs font-medium text-danger">
                    {field.error}
                  </p>
                )}
              </div>
            );
          }

          if (field.type === "select") {
            return (
              <Select
                key={field.id}
                id={field.id}
                label={field.label}
                icon={field.icon}
                required={field.required}
                error={field.error}
                placeholder={field.placeholder}
                options={field.options ?? []}
                value={field.value}
                onChange={field.onChange}
              />
            );
          }

          return (
            <Input
              key={field.id}
              id={field.id}
              type={field.type ?? "text"}
              step={field.step}
              required={field.required}
              error={field.error}
              label={field.label}
              icon={field.icon}
              placeholder={field.placeholder}
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
            />
          );
        })}

        {error && (
          <p className="rounded-lg bg-danger-soft px-3 py-2 text-xs font-medium text-danger">
            {error}
          </p>
        )}

        <div className="flex justify-end">
          <Button
            type="submit"
            loading={isSubmitting}
            loadingText={submittingLabel}
            icon={submitIcon}
          >
            {submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RecordForm;
