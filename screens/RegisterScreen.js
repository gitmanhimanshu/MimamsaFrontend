import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import API from "../api";

export default function RegisterScreen({ onSwitchToLogin }) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const register = async () => {
    if (!email || !username || !password) {
      alert("Please fill all fields");
      return;
    }

    console.log("=== REGISTRATION ATTEMPT ===");
    console.log("API Base URL:", API.defaults.baseURL);
    console.log("Endpoint: /app/register/");
    console.log("Data:", { email, username, password: "***" });

    setLoading(true);
    try {
      const res = await API.post("/app/register/", {
        email,
        username,
        password,
      });
      console.log("✓ Registration success:", res.data);
      console.log("Status:", res.status);
      alert("✓ Registered successfully!\nPlease login now.");
      onSwitchToLogin();
    } catch (err) {
      console.log("=== REGISTRATION ERROR ===");
      console.log("Error type:", err.message);
      console.log("Error response:", err.response);
      console.log("Error status:", err.response?.status);
      console.log("Error data:", err.response?.data);
      console.log("Full error:", JSON.stringify(err, null, 2));
      
      const errorMsg = err.response?.data 
        ? JSON.stringify(err.response.data, null, 2)
        : `Network Error: ${err.message}\n\nMake sure Django is running on:\nhttp://192.168.0.35:8000`;
      alert(`Registration failed:\n${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to get started</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput 
              placeholder="Enter your email" 
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Username</Text>
            <TextInput 
              placeholder="Choose a username" 
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              style={styles.input}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput 
              placeholder="Create a password" 
              value={password}
              secureTextEntry 
              onChangeText={setPassword}
              style={styles.input}
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={register}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Creating account..." : "Register"}
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={onSwitchToLogin}>
              <Text style={styles.link}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f4f8",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  header: {
    marginBottom: 48,
    alignItems: "center",
  },
  title: {
    fontSize: 36,
    fontWeight: "800",
    color: "#1a202c",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    color: "#718096",
    fontWeight: "500",
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2d3748",
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  input: {
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 18,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#1a202c",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  button: {
    backgroundColor: "#48bb78",
    padding: 20,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 16,
    shadowColor: "#48bb78",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: "#a0aec0",
    shadowOpacity: 0.1,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 32,
  },
  footerText: {
    color: "#718096",
    fontSize: 15,
    fontWeight: "500",
  },
  link: {
    color: "#4299e1",
    fontSize: 15,
    fontWeight: "700",
  },
});
