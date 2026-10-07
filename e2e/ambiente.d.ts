// Só o que a configuração usa do Node, sem acrescentar @types/node ao projeto.
declare const process: { env: Record<string, string | undefined> };
