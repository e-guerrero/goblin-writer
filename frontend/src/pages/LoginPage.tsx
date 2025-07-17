import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { pb } from "../lib/pocketbase";
import styles from "./LoginPage.module.css";
import "../index.css";

interface LoginPageProps {
  name: string;
}

const LoginPage: React.FC<LoginPageProps> = ({ name }) => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [resetEmail, setResetEmail] = useState<string>(""); // Email for password reset
  const [isResetSent, setIsResetSent] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [loginFailed, setLoginFailed] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      setLoginFailed(false);
      setLoading(true);
      await pb.collection("users").authWithPassword(username, password);
    } catch (error) {
      setLoading(false);
      setLoginFailed(true);
    }
  };

  const handlePasswordReset = async () => {
    try {
      await pb.collection("users").requestPasswordReset(resetEmail);
      setIsResetSent(true);
      console.log("Password reset email sent successfully.");
    } catch (error) {
      console.error("Failed to send password reset email:", error);
    }
  };

  // useEffect(() => {
  //   handleLogin();
  // }, []);

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginForm}>
        <h2 className={styles.formTitle}>{name}</h2>
        <input
          name="username"
          className={styles.inputField}
          type="text"
          placeholder="Username or Email"
          value={username}
          autoComplete="username"
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          name="password"
          className={styles.inputField}
          type="password"
          placeholder="Password"
          value={password}
          autoComplete="current-password"
          onChange={(e) => setPassword(e.target.value)}
        />
        {loginFailed && (
          <p className={styles.error}>
            Invalid username or email and/or password
          </p>
        )}
        {loading && <p className={styles.success}>Loading...</p>}
        <button className={styles.submitButton} onClick={handleLogin}>
          Login
        </button>
        <button
          className={styles.createAccountButton}
          onClick={() => navigate("create-account")}
        >
          Create Account
        </button>

        {/* Password Reset Section */}
        <h3 className={styles.passwordResetTitle}>Forgot Password?</h3>
        <input
          name="email"
          className={styles.inputField}
          type="email"
          placeholder="Enter your email"
          value={resetEmail}
          autoComplete="email"
          onChange={(e) => setResetEmail(e.target.value)}
        />
        <button
          className={styles.forgotPasswordButton}
          onClick={handlePasswordReset}
        >
          Send Password Reset Email
        </button>
        {isResetSent && (
          <p className={styles.successMessage}>
            Password reset email sent! Check your inbox.
          </p>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
