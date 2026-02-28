import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";

type Step = 1 | 2 | 3 | 4;

const CATEGORIES = [
  { icon: "🗑️", label: "Garbage" },
  { icon: "💧", label: "Water Leakage" },
  { icon: "💡", label: "Streetlight" },
  { icon: "🚧", label: "Road Damage" },
  { icon: "🛡️", label: "Public Safety" },
  { icon: "🌳", label: "Park / Open Space" },
  { icon: "🐕", label: "Stray Animals" },
  { icon: "➕", label: "Other" },
];

const SEVERITY_OPTIONS = [
  { value: "low", label: "Low", color: "#0D9488", icon: "🟢" },
  { value: "medium", label: "Medium", color: "#D97706", icon: "🟡" },
  { value: "high", label: "High", color: "#DC2626", icon: "🔴" },
];

export default function ReportScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [step, setStep] = useState<Step>(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [severity, setSeverity] = useState("medium");
  const [submitted, setSubmitted] = useState(false);
  const [location, setLocation] = useState<string | null>(null);

  const handleNext = () => {
    if (step < 4) setStep((step + 1) as Step);
  };

  const handleBack = () => {
    if (step > 1) setStep((step - 1) as Step);
    else navigation.goBack();
  };

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => navigation.navigate("IssueDetails"), 2500);
  };

  const pickImage = async (fromCamera: boolean) => {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission required");
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync()
      : await ImagePicker.launchImageLibraryAsync();

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const detectLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Location permission denied");
      return;
    }

    const loc = await Location.getCurrentPositionAsync({});
    setLocation(
      `Lat: ${loc.coords.latitude.toFixed(
        4
      )}, Lng: ${loc.coords.longitude.toFixed(4)}`
    );
  };

  if (submitted) {
    return (
      <View style={styles.centered}>
        <Ionicons name="checkmark-circle" size={80} color="#16A34A" />
        <Text style={styles.title}>Issue Submitted!</Text>
        <Text style={styles.subtitle}>
          Your complaint has been registered successfully.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <Text style={styles.headerTitle}>Step {step} of 4</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* STEP 1 */}
        {step === 1 && (
          <View style={styles.grid}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.label}
                style={[
                  styles.categoryBtn,
                  selectedCategory === cat.label && styles.categorySelected,
                ]}
                onPress={() => setSelectedCategory(cat.label)}
              >
                <Text style={styles.emoji}>{cat.icon}</Text>
                <Text style={styles.categoryText}>{cat.label}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <View>
            {!photoUri ? (
              <View>
                <Pressable
                  style={styles.photoBox}
                  onPress={() => pickImage(true)}
                >
                  <Ionicons name="camera" size={40} color="#1E3A8A" />
                  <Text>Tap to capture photo</Text>
                </Pressable>
                <Pressable
                  style={styles.secondaryBtn}
                  onPress={() => pickImage(false)}
                >
                  <Text>Upload from Gallery</Text>
                </Pressable>
              </View>
            ) : (
              <Image source={{ uri: photoUri }} style={styles.image} />
            )}
          </View>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <View>
            <Pressable style={styles.primaryBtn} onPress={detectLocation}>
              <Ionicons name="location" size={20} color="white" />
              <Text style={styles.primaryBtnText}>
                Detect Location
              </Text>
            </Pressable>

            {location && (
              <Text style={{ marginTop: 12, textAlign: "center" }}>
                {location}
              </Text>
            )}
          </View>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <View>
            <Text style={styles.reviewText}>
              Category: {selectedCategory}
            </Text>
            <Text style={styles.reviewText}>
              Severity:
            </Text>

            <View style={styles.severityRow}>
              {SEVERITY_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  style={[
                    styles.severityBtn,
                    severity === opt.value && {
                      borderColor: opt.color,
                    },
                  ]}
                  onPress={() => setSeverity(opt.value)}
                >
                  <Text>{opt.icon}</Text>
                  <Text>{opt.label}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable style={styles.submitBtn} onPress={handleSubmit}>
              <Ionicons name="checkmark" size={20} color="white" />
              <Text style={styles.submitText}>Submit Issue</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {step < 4 && (
        <Pressable
          style={[
            styles.bottomBtn,
            step === 1 && !selectedCategory && styles.disabledBtn,
          ]}
          disabled={step === 1 && !selectedCategory}
          onPress={handleNext}
        >
          <Text style={styles.bottomBtnText}>Continue</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F2F7" },
  header: {
    backgroundColor: "#1E3A8A",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: { color: "white", fontSize: 16, fontWeight: "600" },
  content: { padding: 16 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  categoryBtn: {
    width: "48%",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  categorySelected: {
    borderWidth: 2,
    borderColor: "#1E3A8A",
  },
  emoji: { fontSize: 24 },
  categoryText: { marginTop: 6, fontWeight: "600" },
  photoBox: {
    height: 200,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#BFDBFE",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
  },
  secondaryBtn: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "white",
    borderRadius: 10,
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 16,
  },
  primaryBtn: {
    flexDirection: "row",
    backgroundColor: "#1E3A8A",
    padding: 14,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  primaryBtnText: { color: "white", fontWeight: "600" },
  reviewText: { marginBottom: 8, fontSize: 14 },
  severityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 12,
  },
  severityBtn: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 4,
  },
  submitBtn: {
    backgroundColor: "#1E3A8A",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  submitText: { color: "white", fontWeight: "700" },
  bottomBtn: {
    backgroundColor: "#1E3A8A",
    padding: 16,
    alignItems: "center",
  },
  bottomBtnText: { color: "white", fontWeight: "700" },
  disabledBtn: {
    backgroundColor: "#E5E7EB",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: { fontSize: 22, fontWeight: "700", marginTop: 12 },
  subtitle: { textAlign: "center", marginTop: 8, color: "#6B7280" },
});