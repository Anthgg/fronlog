import { apiFetch, API_BASE_URL } from "./client";

export interface MfaStatusResponse {
  enabled: boolean;
  methods: string[];
  recovery_codes_remaining: number;
}

export interface MfaTotpEnrollResponse {
  enrollment_id: string;
  manual_key: string;
  qr_endpoint: string;
  otpauth_url: string;
}

export interface MfaTotpConfirmResponse {
  status: string;
  factor_id: string;
  recovery_codes: string[];
}

export interface MfaRecoveryRegenerateResponse {
  recovery_codes: string[];
}

export interface StepUpVerifyResponse {
  status: string;
  grant_id: string;
  policy_code: string;
  expires_at: string;
}

export const mfaApi = {
  getStatus: async (): Promise<MfaStatusResponse> => {
    return apiFetch<MfaStatusResponse>("/api/auth/mfa/status");
  },

  enrollTotp: async (currentPassword: string): Promise<MfaTotpEnrollResponse> => {
    return apiFetch<MfaTotpEnrollResponse>("/api/auth/mfa/totp/enroll", {
      method: "POST",
      body: JSON.stringify({ current_password: currentPassword }),
    });
  },

  getQrUrl: (qrEndpoint: string): string => {
    return qrEndpoint.startsWith("http") ? qrEndpoint : `${API_BASE_URL}${qrEndpoint}`;
  },

  confirmTotp: async (enrollmentId: string, code: string): Promise<MfaTotpConfirmResponse> => {
    return apiFetch<MfaTotpConfirmResponse>("/api/auth/mfa/totp/confirm", {
      method: "POST",
      body: JSON.stringify({ enrollment_id: enrollmentId, code }),
    });
  },

  disableMfa: async (currentPassword: string): Promise<{ status: string }> => {
    return apiFetch<{ status: string }>("/api/auth/mfa/disable", {
      method: "POST",
      body: JSON.stringify({ current_password: currentPassword }),
    });
  },

  regenerateRecoveryCodes: async (): Promise<MfaRecoveryRegenerateResponse> => {
    return apiFetch<MfaRecoveryRegenerateResponse>("/api/auth/mfa/recovery-codes/regenerate", {
      method: "POST",
    });
  },

  verifyStepUp: async (
    challengeId: string,
    method: "TOTP" | "RECOVERY_CODE",
    code: string
  ): Promise<StepUpVerifyResponse> => {
    return apiFetch<StepUpVerifyResponse>("/api/auth/step-up/verify", {
      method: "POST",
      body: JSON.stringify({
        challenge_id: challengeId,
        method,
        code,
      }),
    });
  },
};
