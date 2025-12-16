"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface PasswordRule {
  name: string;
  test: (password: string) => boolean;
}

const PASSWORD_RULES: PasswordRule[] = [
  { name: "At least 8 characters", test: (p) => p.length >= 8 },
  { name: "At least one uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { name: "At least one lowercase letter", test: (p) => /[a-z]/.test(p) },
  { name: "At least one number", test: (p) => /[0-9]/.test(p) },
  { name: "At least one special character (!@#$%^&*)", test: (p) => /[!@#$%^&*()_+=\-[\]{};':"\\|,.<>/?]/.test(p) },
];

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordRulesMet = useMemo(() => {
    return PASSWORD_RULES.map((rule) => ({
      ...rule,
      met: rule.test(password),
    }));
  }, [password]);

  const allRulesMet = passwordRulesMet.every((rule) => rule.met);
  const passwordsMatch = password === confirmPassword && password.length > 0;
  const canSubmit = allRulesMet && passwordsMatch && !loading;

  useEffect(() => {
    // Check if we have a valid session (user should be authenticated via the callback)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Invalid or expired reset link. Please request a new password reset.");
      }
    };
    checkSession();
  }, [supabase]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSubmit) return;

      setLoading(true);
      setError(null);

      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      setLoading(false);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/");
      }, 2000);
    },
    [password, canSubmit, supabase, router]
  );

  if (success) {
    return (
      <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div className="card" style={{ maxWidth: "400px", width: "100%", padding: "2rem" }}>
          <h2 style={{ marginBottom: "1rem" }}>Password Reset Successful!</h2>
          <p>Your password has been updated. Redirecting to home...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div className="card" style={{ maxWidth: "500px", width: "100%", padding: "2rem" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <h2>Reset Password</h2>
          <p className="subtitle" style={{ marginTop: "0.5rem", opacity: 0.7 }}>
            Enter your new password below
          </p>
        </div>

        <form onSubmit={handleSubmit} className="authForm">
          <div className="formGroup">
            <label htmlFor="password">New Password</label>
            <input
              id="password"
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="formGroup">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              className="input"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            {confirmPassword && !passwordsMatch && (
              <span className="errorText">Passwords do not match</span>
            )}
          </div>

          <div className="passwordRules">
            <p className="rulesTitle">Password must contain:</p>
            <ul className="rulesList">
              {passwordRulesMet.map((rule) => (
                <li key={rule.name} className={`rule ${rule.met ? "met" : ""}`}>
                  <span className="ruleIcon">{rule.met ? "✓" : "○"}</span>
                  <span className="ruleName">{rule.name}</span>
                </li>
              ))}
            </ul>
          </div>

          {error && <p className="errorText" style={{ marginTop: "8px" }}>{error}</p>}

          <button
            type="submit"
            className="btn primary"
            style={{ width: "100%", marginTop: "1rem" }}
            disabled={!canSubmit}
          >
            {loading ? "Updating…" : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
