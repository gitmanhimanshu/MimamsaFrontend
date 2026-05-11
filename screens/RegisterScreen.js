import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import API from "../api";
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from "../constants/theme";

export default function RegisterScreen({ onSwitchToLogin, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      // Step 1: Register user
      const registerRes = await API.post("/app/register/", {
        email,
        username,
        password,
      });
      console.log("✓ Registration success:", registerRes.data);
      
      // Step 2: Auto-login after registration
      console.log("=== AUTO-LOGIN AFTER REGISTRATION ===");
      const loginRes = await API.post("/app/login/", {
        email,
        password,
      });
      console.log("✓ Auto-login success:", loginRes.data);
      
      // Step 3: Navigate to HomeScreen directly
      if (onLoginSuccess) {
        onLoginSuccess(loginRes.data);
      }
    } catch (err) {
      console.log("=== REGISTRATION ERROR ===");
      console.log("Error type:", err.message);
      console.log("Error response:", err.response);
      console.log("Error status:", err.response?.status);
      console.log("Error data:", err.response?.data);
      console.log("Full error:", JSON.stringify(err, null, 2));
      
      const errorMsg = err.response?.data 
        ? JSON.stringify(err.response.data, null, 2)
        : `Network Error: ${err.message}\n\nMake sure backend is running`;
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
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
              <TextInput 
                placeholder="Enter your email" 
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Username</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
              <TextInput 
                placeholder="Choose a username" 
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
              <TextInput 
                placeholder="Create a password" 
                value={password}
                secureTextEntry={!showPassword}
                onChangeText={setPassword}
                style={styles.input}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                activeOpacity={0.7}
              >
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: SPACING.xl,
  },
  header: {
    marginBottom: SPACING.xxl,
    alignItems: "center",
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  label: {
    ...TYPOGRAPHY.caption,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    ...SHADOWS.sm,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    padding: SPACING.md,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  eyeButton: {
    padding: SPACING.sm,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md + 4,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
    marginTop: SPACING.md,
    ...SHADOWS.lg,
  },
  buttonDisabled: {
    backgroundColor: COLORS.gray[400],
    shadowOpacity: 0.1,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: SPACING.xl,
  },
  footerText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  link: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: "700",
  },
});
