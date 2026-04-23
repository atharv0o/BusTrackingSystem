import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useAppStore } from "../storage/AppStore";
import GradientShell from "../components/GradientShell";
import { normalizeText } from "../utils/helpers";

export default function AuthScreen({ navigation, route }) {
  const role = route?.params?.role === "student" ? "student" : "driver";
  const { actions } = useAppStore();
  const [mode, setMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const roleLabel = useMemo(
    () => (role === "driver" ? "Driver" : "Student"),
    [role],
  );

  const submit = async () => {
    setLoading(true);
    setError("");

    try {
      if (mode === "signup") {
        await actions.signUp({
          role,
          fullName,
          email,
          password,
        });
      } else {
        await actions.signIn({
          role,
          email,
          password,
        });
      }
    } catch (err) {
      setError(err?.message || "Unable to continue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientShell>
      <View style={styles.container}>
        <Text style={styles.kicker}>{roleLabel} Access</Text>
        <Text style={styles.title}>
          {mode === "login" ? "Welcome back" : "Create your account"}
        </Text>
        <Text style={styles.subtitle}>
          {mode === "login"
            ? "Log in to access your dashboard and sync with Firebase when available."
            : "Create your account for this device and enable Firebase sync."}
        </Text>

        <View style={styles.segment}>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              mode === "login" && styles.segmentActive,
            ]}
            onPress={() => setMode("login")}
          >
            <Text
              style={[
                styles.segmentText,
                mode === "login" && styles.segmentTextActive,
              ]}
            >
              Login
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              mode === "signup" && styles.segmentActive,
            ]}
            onPress={() => setMode("signup")}
          >
            <Text
              style={[
                styles.segmentText,
                mode === "signup" && styles.segmentTextActive,
              ]}
            >
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>

        {mode === "signup" ? (
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Full name"
            placeholderTextColor="#94A3B8"
            style={styles.input}
          />
        ) : null}

        <TextInput
          value={normalizeText(email)}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor="#94A3B8"
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor="#94A3B8"
          secureTextEntry
          style={styles.input}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          disabled={loading}
          onPress={submit}
          style={[styles.primaryBtn, loading && styles.disabled]}
        >
          <Text style={styles.primaryBtnText}>
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Login"
                : "Create Account"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("Launch")}
          style={styles.secondaryBtn}
        >
          <Text style={styles.secondaryBtnText}>Back</Text>
        </TouchableOpacity>
      </View>
    </GradientShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  kicker: {
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: "#64748B",
    fontSize: 12,
    fontWeight: "800",
  },
  title: {
    marginTop: 8,
    fontSize: 32,
    lineHeight: 38,
    color: "#0F172A",
    fontWeight: "900",
  },
  subtitle: {
    marginTop: 10,
    marginBottom: 18,
    color: "#475569",
    lineHeight: 22,
  },
  segment: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
  },
  segmentBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  segmentActive: {
    backgroundColor: "#FFFFFF",
  },
  segmentText: {
    color: "#64748B",
    fontWeight: "800",
  },
  segmentTextActive: {
    color: "#111827",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    fontSize: 15,
    color: "#111827",
  },
  error: {
    color: "#DC2626",
    marginBottom: 12,
    fontWeight: "700",
  },
  primaryBtn: {
    backgroundColor: "#111827",
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
  },
  disabled: {
    opacity: 0.72,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  secondaryBtn: {
    marginTop: 12,
    alignItems: "center",
  },
  secondaryBtnText: {
    color: "#2563EB",
    fontWeight: "700",
  },
});
