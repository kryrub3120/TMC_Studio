import type { GoogleOAuthSurface } from './oauthSurface';

export type AuthFlowStatus =
  | 'idle'
  | 'emailSubmitting'
  | 'oauthOpening'
  | 'oauthWaitingForProvider'
  | 'oauthCallbackReceived'
  | 'sessionReady'
  | 'profileHydrating'
  | 'done'
  | 'cancelled'
  | 'error';

export type AuthFlowMethod = 'email' | 'google' | null;

export type AuthFlowState = {
  status: AuthFlowStatus;
  method: AuthFlowMethod;
  surface: GoogleOAuthSurface | null;
  startedAt: number | null;
  error: string | null;
  retryable: boolean;
};

export const idleAuthFlow: AuthFlowState = {
  status: 'idle',
  method: null,
  surface: null,
  startedAt: null,
  error: null,
  retryable: false,
};

