import * as yup from "yup";

/**
 * Mensagens padrão em pt-BR para TODOS os schemas da aplicação.
 *
 * Com o locale configurado aqui, os schemas só precisam declarar as regras
 * (`.required()`, `.min()`, `.email()`…) e dar um `.label()` ao campo — a
 * mensagem sai pronta e traduzida. Escreva mensagem manual apenas em regras
 * de negócio específicas (ex.: comparação entre dois campos).
 */
yup.setLocale({
  mixed: {
    default: "${path} é inválido.",
    required: "${path} é obrigatório.",
    defined: "${path} deve ser preenchido.",
    notNull: "${path} não pode ser nulo.",
    notType: "${path} é inválido.",
    oneOf: "${path} deve ser um dos valores: ${values}.",
    notOneOf: "${path} não pode ser um dos valores: ${values}.",
  },
  string: {
    length: "${path} deve ter exatamente ${length} caracteres.",
    min: "${path} deve ter no mínimo ${min} caracteres.",
    max: "${path} deve ter no máximo ${max} caracteres.",
    matches: "${path} está em um formato inválido.",
    email: "${path} deve ser um e-mail válido.",
    url: "${path} deve ser uma URL válida.",
    uuid: "${path} deve ser um UUID válido.",
    trim: "${path} não pode começar ou terminar com espaços.",
    lowercase: "${path} deve estar em minúsculas.",
    uppercase: "${path} deve estar em maiúsculas.",
  },
  number: {
    min: "${path} deve ser maior ou igual a ${min}.",
    max: "${path} deve ser menor ou igual a ${max}.",
    lessThan: "${path} deve ser menor que ${less}.",
    moreThan: "${path} deve ser maior que ${more}.",
    positive: "${path} deve ser um número positivo.",
    negative: "${path} deve ser um número negativo.",
    integer: "${path} deve ser um número inteiro.",
  },
  date: {
    min: "${path} deve ser posterior a ${min}.",
    max: "${path} deve ser anterior a ${max}.",
  },
  array: {
    min: "${path} deve ter no mínimo ${min} item(ns).",
    max: "${path} deve ter no máximo ${max} item(ns).",
    length: "${path} deve ter ${length} item(ns).",
  },
  boolean: {
    isValue: "${path} deve ser ${value}.",
  },
});

/**
 * Campo numérico alimentado por `<input type="number">`: o input entrega
 * string, e string vazia precisa virar `undefined` para cair na mensagem de
 * "obrigatório" em vez de "inválido".
 */
export const numberField = () =>
  yup
    .number()
    .transform((value, originalValue) =>
      typeof originalValue === "string" && originalValue.trim() === ""
        ? undefined
        : value,
    );

/** Percentual de umidade (0% a 100%). */
export const percentField = () => numberField().min(0).max(100);

export { yup };
