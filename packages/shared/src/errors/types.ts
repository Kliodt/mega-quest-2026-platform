export interface ApiErrorInfo {
  code: string;
  message: string;
}

export type ApiErrorGroup = Record<string, ApiErrorInfo>;

export type CodesOf<G extends ApiErrorGroup> = G[keyof G]['code'];
