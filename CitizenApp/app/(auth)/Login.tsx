import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import CiviLensLogo from "../../components/Logo";
import { useAuth } from "@/contexts/AuthContext";

type LoginStep = "phone" | "otp";

export default function WelcomeScreen() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<LoginStep>("phone");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { sendOtp, verifyOtp } = useAuth();

  const handleSendOTP = async () => {
    if (phone.length !== 10) {
      Alert.alert("Invalid Phone Number", "Please enter a valid 10-digit mobile number");
      return;
    }

    setIsLoading(true);
    try {
      const result = await sendOtp(phone);
      if (result.success) {
        setStep("otp");
      } else {
        Alert.alert("Error", result.error || "Failed to send OTP");
      }
    } catch (error) {
      Alert.alert("Error", "Network error. Is the server running?");
      console.error("Send OTP error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      Alert.alert("Invalid OTP", "Please enter the 6-digit OTP");
      return;
    }

    setIsLoading(true);
    try {
      const result = await verifyOtp(phone, otp);
      if (result.success) {
        router.replace("/(tabs)");
      } else {
        Alert.alert("Invalid OTP", result.error || "Please check the OTP and try again");
      }
    } catch (error) {
      Alert.alert("Error", "Verification failed. Please try again.");
      console.error("Verify OTP error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDigiLockerLogin = async () => {
    // For demo: auto-login as the seeded citizen user
    setIsLoading(true);
    try {
      const sendResult = await sendOtp("9876543210");
      if (sendResult.success) {
        const verifyResult = await verifyOtp("9876543210", "123456");
        if (verifyResult.success) {
          router.replace("/(tabs)");
          return;
        }
      }
      Alert.alert("Login Failed", "Please try again");
    } catch (error) {
      Alert.alert("Login Failed", "Please try again");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Section */}
      <LinearGradient
        colors={["#1E3A8A", "#1E40AF", "#1D4ED8"]}
        style={styles.hero}
      >
        <CiviLensLogo />

        <Text style={styles.title}>CiviLens</Text>
        <Text style={styles.subtitle}>
          Report civic issues. Track resolution. Hold authorities accountable.
        </Text>

        <View style={styles.badgesContainer}>
          {["Government Verified", "ISO Secured", "DPDP Compliant"].map(
            (badge) => (
              <View key={badge} style={styles.badge}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            )
          )}
        </View>
      </LinearGradient>

      {/* Form Section */}
      <View style={styles.formSection}>
        <Text style={styles.welcome}>Welcome to CiviLens</Text>
        <Text style={styles.description}>
          Report civic issues with transparency
        </Text>

        {step === "phone" ? (
          <>
            <Text style={styles.label}>Mobile Number</Text>
            <View style={styles.phoneContainer}>
              <View style={styles.countryCode}>
                <Text style={{ fontSize: 16 }}>📱</Text>
              </View>
              <TextInput
                placeholder="Enter 10-digit mobile number"
                keyboardType="number-pad"
                maxLength={10}
                value={phone}
                onChangeText={setPhone}
                style={styles.input}
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, (isLoading || phone.length !== 10) && styles.primaryButtonDisabled]}
              onPress={handleSendOTP}
              disabled={isLoading || phone.length !== 10}
              activeOpacity={0.7}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Send OTP</Text>
                  <Ionicons name="arrow-forward" size={18} color="white" />
                </>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.label}>Enter OTP sent to +91 {phone}</Text>
            <View style={styles.phoneContainer}>
              <View style={styles.countryCode}>
                <Text style={{ fontSize: 16 }}>🔒</Text>
              </View>
              <TextInput
                placeholder="Enter 6-digit OTP"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
                style={styles.input}
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, (isLoading || otp.length !== 6) && styles.primaryButtonDisabled]}
              onPress={handleVerifyOTP}
              disabled={isLoading || otp.length !== 6}
              activeOpacity={0.7}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Verify & Login</Text>
                  <Ionicons name="checkmark-circle" size={18} color="white" />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { setStep("phone"); setOtp(""); }}
              style={styles.backLink}
            >
              <Ionicons name="arrow-back" size={14} color="#1E3A8A" />
              <Text style={styles.backLinkText}>Change phone number</Text>
            </TouchableOpacity>

            <View style={styles.otpHint}>
              <Ionicons name="information-circle-outline" size={14} color="#6B7280" />
              <Text style={styles.otpHintText}>Demo OTP: 123456</Text>
            </View>
          </>
        )}

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.line} />
        </View>

        {/* DigiLocker Button */}
        <TouchableOpacity
          style={[styles.secondaryButton, isLoading && styles.secondaryButtonDisabled]}
          onPress={handleDigiLockerLogin}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          <Image
            source={{
              uri: "https://www.digilocker.gov.in/assets/img/digilocker_logo.png",
            }}
            style={{ height: 16, width: 80, resizeMode: "contain" }}
          />
          <Ionicons name="shield-checkmark" size={16} color="#1E3A8A" />
          <Text style={styles.secondaryButtonText}>
            Quick Demo Login
          </Text>
        </TouchableOpacity>

        {/* Security Note */}
        <View style={styles.securityBox}>
          <Ionicons name="lock-closed" size={14} color="#6B7280" />
          <Text style={styles.securityText}>
            Your reports are tracked transparently. By continuing, you agree to our
            <Text style={styles.link}> Terms of Service </Text>
            and
            <Text style={styles.link}> Privacy Policy</Text>.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F0F2F7",
    flexGrow: 1,
  },
  hero: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  title: {
    color: "white",
    fontSize: 30,
    fontWeight: "700",
  },
  subtitle: {
    color: "rgba(186,210,253,0.9)",
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 18,
    maxWidth: 240,
  },
  badgesContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  badge: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 10,
    color: "rgba(186,210,253,0.9)",
    fontWeight: "500",
  },
  formSection: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  welcome: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A2340",
  },
  description: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 28,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    color: "#374151",
  },
  phoneContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    marginBottom: 16,
  },
  countryCode: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    backgroundColor: "#FAFAFA",
    borderRightWidth: 1,
    borderRightColor: "#F3F4F6",
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 14,
    color: "#1A2340",
  },
  primaryButton: {
    backgroundColor: "#1E3A8A",
    padding: 15,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  primaryButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 15,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  backLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
  },
  backLinkText: {
    color: "#1E3A8A",
    fontWeight: "600",
    fontSize: 13,
  },
  otpHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 6,
    backgroundColor: "#FFF7ED",
    borderRadius: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  otpHintText: {
    fontSize: 12,
    color: "#92400E",
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
    gap: 12,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#E9ECF2",
  },
  dividerText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  secondaryButton: {
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    padding: 13,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A2340",
  },
  secondaryButtonDisabled: {
    opacity: 0.6,
  },
  securityBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    backgroundColor: "#F8FAFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E8EEFF",
    marginTop: 16,
  },
  securityText: {
    fontSize: 11,
    color: "#6B7280",
    flex: 1,
    lineHeight: 16,
  },
  link: {
    color: "#1E3A8A",
    fontWeight: "600",
  },
});
