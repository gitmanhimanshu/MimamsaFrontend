import React, { useState } from "react";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";

export default function App() {
  const [showLogin, setShowLogin] = useState(true);

  return showLogin ? <LoginScreen /> : <RegisterScreen />;
}
