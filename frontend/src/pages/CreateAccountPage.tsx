import React, { useEffect, useState } from "react";
import { pb } from "../lib/pocketbase";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import styles from "./CreateAccountPage.module.css";

const CreateAccountPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  // const [birthday, setBirthday] = useState(""); // ISO 8601 format
  const [birthday, setBirthday] = useState<Date | null>(null);
  const [sex, setSex] = useState(true); // Male as default

  const [usernameError, setUsernameError] = useState("");
  const [usernameSuccess, setUsernameSuccess] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [birthdayError, setBirthdayError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  const normalizedUsername = username.toLowerCase();

  // Utility function to validate email format
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Utility function to validate password length
  const isValidPassword = (password: string) => {
    const length = password.length;
    const test = length >= 10;
    return test;
  };

  // Email validation
  const checkEmail = async (email: string) => {
    if (isValidEmail(email.toString())) {
      try {
        const result = await pb
          .collection("users")
          .getFirstListItem(`email="${email.toString()}"`);
        if (result != null) {
          setEmailError("Email already exists");
        }
      } catch (error) {
        setEmailError("");
      }
    } else if (email.toString().trim() === "") {
      setEmailError("");
    } else {
      setEmailError("Invalid email");
    }
  };

  // Password validation
  const checkPassword = (password: string) => {
    if (isValidPassword(password)) {
      setPasswordError("");
    } else {
      setPasswordError("Invalid Password (10 character minimum)");
    }
  };

  // Debounced username validation
  useEffect(() => {
    const delay = setTimeout(async () => {
      if (username) {
        try {
          const result = await pb.collection("users").getList(1, 1, {
            filter: `username="${normalizedUsername}"`,
          });
          if (result.items.length > 0) {
            setUsernameError("Username already exists");
            setUsernameSuccess("");
          } else {
            setUsernameError("");
            setUsernameSuccess("Available");
          }
        } catch (error) {
          console.error("Error checking username:", error);
        }
      } else {
        setUsernameError("");
        setUsernameSuccess("");
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [username]);

  // Debounced password validation
  useEffect(() => {
    const delay = setTimeout(async () => {
      if (password.length === 0) setPasswordError("");
      else if (password.length >= 1) checkPassword(password.toString());
    }, 300);
    return () => clearTimeout(delay);
  }, [password]);

  // Add focusout listener for email validation
  useEffect(() => {
    const handleFocusOut = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      if (
        target?.tagName === "INPUT" &&
        target?.getAttribute("type") === "email"
      ) {
        checkEmail(email.toString());
      }
    };
    document.addEventListener("focusout", handleFocusOut);
    return () => {
      document.removeEventListener("focusout", handleFocusOut);
    };
  }, [email]);

  // // Add focusout listener for password validation
  // useEffect(() => {
  //   const handleFocusOut = (event: FocusEvent) => {
  //     const target = event.target as HTMLElement;
  //     if (
  //       target?.tagName === "INPUT" &&
  //       target?.getAttribute("type") === "password"
  //     ) {
  //       checkPassword(password.toString());
  //     }
  //   };
  //   document.addEventListener("focusout", handleFocusOut);

  //   return () => {
  //     document.removeEventListener("focusout", handleFocusOut);
  //   };
  // }, [password]);

  const handleCreateAccount = async () => {
    if (
      username.toString().trim() === "" ||
      email.toString().trim() === "" ||
      password.toString().trim() === "" ||
      firstName.toString().trim() === "" ||
      lastName.toString().trim() === "" ||
      birthday === null
    ) {
      if (username.toString().trim() === "") {
        setUsernameError("Missing");
      } else {
        setUsernameError("");
      }
      if (email.toString().trim() === "") {
        setEmailError("Missing");
      } else {
        setEmailError("");
      }

      if (password.toString().trim() === "") {
        setPasswordError("Missing");
      } else {
        checkPassword(password.toString());
      }

      if (firstName.toString().trim() === "") {
        setFirstNameError("Missing");
      } else {
        setFirstNameError("");
      }
      if (lastName.toString().trim() === "") {
        setLastNameError("Missing");
      } else {
        setLastNameError("");
      }
      if (birthday === null) {
        setBirthdayError("Missing");
      } else {
        setBirthdayError("");
      }
      return;
    }

    try {
      setGeneralError("");
      setSuccess(false);

      // Convert boolean sex value to string
      const sexString = sex ? "male" : "female";
      const date = birthday ? birthday.toISOString() : "";

      // const newUser = await pb.collection("users").create({
      await pb.collection("users").create({
        username: normalizedUsername,
        email,
        password,
        passwordConfirm: password,
        firstName,
        lastName,
        birthday: date,
        sex: sexString,
      });
      // console.log("Account created:", newUser);
      // alert("Account created successfully!");
      setSuccess(true);
    } catch (err: any) {
      // console.error("Error:", err.message);
      setGeneralError("Error: " + err || "An error occurred.");
    }
  };

  // return (
  //   <div style={styles.container}>
  //     <h1>{name}</h1>
  //   </div>
  // );

  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <h1 className={styles.header}>Create Account</h1>
        {generalError && <p className={styles.error}>{generalError}</p>}
        {success && (
          <p className={styles.success}>Account created successfully!</p>
        )}
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={styles.input}
        />
        {usernameError && <p className={styles.error}>{usernameError}</p>}
        {usernameSuccess && <p className={styles.success}>{usernameSuccess}</p>}
        <input
          type="email"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
          onFocus={(e) => setEmail(e.target.value)}
          className={styles.input}
        />
        {emailError && <p className={styles.error}>{emailError}</p>}
        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
          className={styles.input}
        />
        {passwordError && <p className={styles.error}>{passwordError}</p>}
        <input
          type="text"
          placeholder="First Name"
          onChange={(e) => setFirstName(e.target.value)}
          className={styles.input}
        />
        {firstNameError && <p className={styles.error}>{firstNameError}</p>}
        <input
          type="text"
          placeholder="Last Name"
          onChange={(e) => setLastName(e.target.value)}
          className={styles.input}
        />
        {lastNameError && <p className={styles.error}>{lastNameError}</p>}
        <DatePicker
          selected={birthday}
          onChange={(day) => setBirthday(day)}
          dateFormat="MM-dd-yyyy" // Customize the format
          placeholderText="Click here to set the birthday"
          className={styles.datePickerInput}
          wrapperClassName={styles.datePickerContainer}
          calendarClassName={styles.datePickerCalendar}
        />
        {birthdayError && <p className={styles.error}>{birthdayError}</p>}
        <div className={styles.radioContainer}>
          <label className={styles.radioLabel}>
            Male
            <input
              type="radio"
              name="sex"
              checked={sex === true} // Might not be needed. Not sure.
              onChange={() => setSex(true)}
              className={styles.radioInput}
            />
          </label>
          <label className={styles.radioLabel}>
            Female
            <input
              type="radio"
              name="sex"
              checked={sex === false} // Might not be needed. Not sure.
              onChange={() => setSex(false)}
              className={styles.radioInput}
            />
          </label>
        </div>
        {success && (
          <p className={styles.success}>
            A verification email has been sent to your email!
          </p>
        )}
        {success && (
          <p className={styles.success}>
            Please verify before trying to login to your new account!
          </p>
        )}
        <button
          onClick={handleCreateAccount}
          className={styles.button}
          // disabled={!!usernameError || !!emailError} // if none-empty errors, disable button.
        >
          Create Account
        </button>
        <button onClick={() => navigate("/login")} className={styles.button}>
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default CreateAccountPage;
