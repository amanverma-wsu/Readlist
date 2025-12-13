"use client";

import { useState, useMemo } from "react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string) => void;
  onSignup: (email: string, password: string) => void;
}

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

export function AuthModal({
  isOpen,
  onClose,
  onLogin,
  onSignup,
}: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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

  const handleClose = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setIsLogin(true);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit) return;

    if (isLogin) {
      onLogin(email, password);
    } else {
      onSignup(email, password);
    }

    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setIsLogin(true);
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
          <h2>{isLogin ? "Login" : "Create Account"}</h2>
          <p className="subtitle">
            {isLogin
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
              placeholder="Raghav@gandu.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

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

          <button type="submit" className="btn primary" style={{ width: "100%" }} disabled={!canSubmit}>
            {isLogin ? "Login" : "Sign Up"}
          </button>
        </form>

        <div className="authToggle">
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
              }}
            >
              {isLogin ? "Sign up" : "Login"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
