/**
 * Auth Modal Component
 * Handles login, signup, and password reset flows
 */
"use client";

import { useState, useMemo } from "react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string) => Promise<{ error?: string } | void>;
  onSignup: (email: string, password: string) => Promise<{ error?: string } | void>;
  onForgotPassword?: (email: string) => Promise<{ error?: string } | void>;
  loading?: boolean;
}

// Password strength requirements
const PASSWORD_RULES = [
  { name: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { name: "At least one uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { name: "At least one lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { name: "At least one number", test: (p: string) => /[0-9]/.test(p) },
  { name: "At least one special character", test: (p: string) => /[!@#$%^&*()_+=\-[\]{};':"\\|,.<>/?]/.test(p) },
];

export function AuthModal({
  isOpen,
  onClose,
  onLogin,
  onSignup,
  onForgotPassword,
  loading,
}: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const passwordRulesMet = useMemo(() => {
    return PASSWORD_RULES.map((rule) => ({
      ...rule,
      met: rule.test(password),
    }));
  }, [password]);

  const allRulesMet = passwordRulesMet.every((rule) => rule.met);
  const passwordsMatch = password === confirmPassword && password.length > 0;
  const canSubmit = isLogin 
    ? email && password 
    : email && allRulesMet && passwordsMatch;
  const isBusy = submitting || !!loading;

  const handleClose = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFormError(null);
    setFormSuccess(null);
    setIsLogin(true);
    setShowForgotPassword(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (showForgotPassword) {
      if (!email || isBusy || !onForgotPassword) return;
      setSubmitting(true);
      setFormError(null);
      setFormSuccess(null);

      const result = await onForgotPassword(email);
      if (result && "error" in result && result.error) {
        setFormError(result.error);
        setSubmitting(false);
        return;
      }

      setFormSuccess("Password reset email sent! Check your inbox.");
      setSubmitting(false);
      return;
    }

    if (!canSubmit || isBusy) return;

    setSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    const result = isLogin
      ? await onLogin(email, password)
      : await onSignup(email, password);

    if (result && "error" in result && result.error) {
      setFormError(result.error);
      setSubmitting(false);
      return;
    }

    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setIsLogin(true);

    // Parent closes modal on success, but close locally as well to reset state
    handleClose();
    setSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="authModal" onClick={(e) => {
      if (e.target === e.currentTarget) {
        handleClose();
      }
    }}>
      <div className="authContent card">
        <button className="closeBtn" onClick={handleClose}>×</button>

        <div className="authHeader">
          <h2>
            {showForgotPassword
              ? "Reset Password"
              : isLogin
              ? "Login"
              : "Create Account"}
          </h2>
          <p className="subtitle">
            {showForgotPassword
              ? "Enter your email to receive a password reset link"
              : isLogin
              ? "Welcome back to Readlist"
              : "Join Readlist to save your links"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="authForm">
          <div className="formGroup">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {!showForgotPassword && (
          <div className="formGroup">
            <label htmlFor="password">Password</label>
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
          )}

          {!isLogin && (
            <>
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
            </>
          )}

          <button
            type="submit"
            className="btn primary"
            style={{ width: "100%" }}
            disabled={
              showForgotPassword
                ? !email || isBusy
                : !canSubmit || isBusy
            }
          >
            {isBusy
              ? "Working…"
              : showForgotPassword
              ? "Send Reset Link"
              : isLogin
              ? "Login"
              : "Sign Up"}
          </button>
          {formError && <p className="errorText" style={{ marginTop: "8px" }}>{formError}</p>}
          {formSuccess && <p className="successText" style={{ marginTop: "8px" }}>{formSuccess}</p>}
        </form>

        {showForgotPassword ? (
        <div className="authToggle">
            <p>
              Remember your password?{" "}
              <button
                type="button"
                className="linkBtn"
                onClick={() => {
                  setShowForgotPassword(false);
                  setFormError(null);
                  setFormSuccess(null);
                }}
              >
                Back to Login
              </button>
            </p>
          </div>
        ) : (
          <div className="authToggle">
            {isLogin && (
              <p style={{ marginBottom: "8px" }}>
                <button
                  type="button"
                  className="linkBtn"
                  onClick={() => {
                    setShowForgotPassword(true);
                    setFormError(null);
                    setFormSuccess(null);
                  }}
                >
                  Forgot password?
                </button>
              </p>
            )}
          <p>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              type="button"
              className="linkBtn"
              onClick={() => {
                setIsLogin(!isLogin);
                setEmail("");
                setPassword("");
                setConfirmPassword("");
                setFormError(null);
                  setFormSuccess(null);
              }}
            >
              {isLogin ? "Sign up" : "Login"}
            </button>
          </p>
        </div>
        )}
      </div>
    </div>
  );
}
