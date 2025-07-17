// import { StrictMode } from 'react'
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { useEffect, useState } from "react";

import LoginPage from "./pages/LoginPage";
import CreateAccountPage from "./pages/CreateAccountPage";
import { pb } from "./lib/pocketbase.ts";
import DirectoryListComponent from "./components/DirectoryListComponent.tsx";
import FlashcardDetailView from "./components/FlashcardDetailViewComponent.tsx";
import React from "react";
import CreateOrEditDirectoryPage from "./pages/CreateOrEditDirectoryPage.tsx";
import FlashcardCreateOrEditPage from "./pages/FlashcardCreateOrEditPage.tsx";

const Main = () => {
  // // const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // useEffect(() => {
  //   // if (pb.authStore.isValid) {
  //   if (true) {
  //     setIsLoggedIn(true);
  //   } else {
  //     navigate("/login");
  //   }
  // }, []);

  useEffect(() => {
    // Listen for changes in the authentication state
    const unsubscribe = pb.authStore.onChange((isValid) => {
      if (isValid) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
        pb.authStore.clear();
      }
    });
    // Cleanup
    return () => unsubscribe();
  }, []);

  return (
    <Routes>
      {/*  */}
      <Route
        path="/"
        element={<Navigate to={isLoggedIn ? "/app" : "/login"} />}
      />
      {/*  */}
      <Route
        path="/app/*"
        element={isLoggedIn ? <App /> : <Navigate to="/login" />}
      />
      {/*  */}
      <Route
        path="/login"
        element={
          isLoggedIn ? <Navigate to="/app" /> : <LoginPage name="Login Page" />
        }
      />
      {/*  */}
      <Route
        path="/login/create-account"
        element={isLoggedIn ? <Navigate to="/app" /> : <CreateAccountPage />}
      />
      {/* <Route path="*" element={<NotFound />} /> Catch-all for 404 */}
      <Route
        path="*"
        element={isLoggedIn ? <Navigate to="/app" /> : <Navigate to="/login" />}
      />
      <Route
        path="/directories/:id?"
        element={
          isLoggedIn ? <DirectoryListComponent /> : <Navigate to="/login" />
        }
      />
      <Route
        path="/flashcard/:id/:side"
        element={
          isLoggedIn ? <FlashcardDetailView /> : <Navigate to="/login" />
        }
      />
      <Route
        path="/directories/:parentId?/create-edit-directory/:id?"
        element={
          isLoggedIn ? <CreateOrEditDirectoryPage /> : <Navigate to="/login" />
        }
      />
      <Route
        path="/directories/:directory-id?/create-edit-flashcard/:sequential?/:flashcard-front-id?"
        element={
          isLoggedIn ? <FlashcardCreateOrEditPage /> : <Navigate to="/login" />
        }
      />
    </Routes>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Router>
      <Main />
    </Router>
  </React.StrictMode>
);
