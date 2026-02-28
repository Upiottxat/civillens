import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { complaintsAPI, classifyAPI, SubmitComplaintPayload } from "@/services/api";
import { formatTicketId } from "@/services/slaHelpers";

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
  { value: "LOW", label: "Low", color: "#0D9488", icon: "🟢" },
  { value: "MEDIUM", label: "Medium", color: "#D97706", icon: "🟡" },
  { value: "HIGH", label: "High", color: "#DC2626", icon: "🔴" },
];

export default function ReportScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [severity, setSeverity] = useState("MEDIUM");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  const handleNext = () => {
    if (step < 4) setStep((step + 1) as Step);
  };

  const handleBack = () => {
    if (step > 1) setStep((step - 1) as Step);
    else router.back();
  };

  const handleSubmit = async () => {
    if (!selectedCategory || !coords) {
      Alert.alert("Missing info", "Please complete all steps before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: SubmitComplaintPayload = {
        issueType: selectedCategory,
        description: description || `${selectedCategory} issue reported via CiviLens`,
        imageUrl: photoUri || undefined,
        latitude: coords.latitude,
        longitude: coords.longitude,
        locationLabel: locationLabel || undefined,
        severity,
      };

      const result = await complaintsAPI.submit(payload);
      if (result.success && result.data) {
        // Backend returns { complaint, priority, sla, department }
        const complaintId = result.data.complaint?.id || result.data.id;
        setSubmittedId(complaintId);
        setSubmitted(true);
      } else {
        Alert.alert("Submission Failed", result.error || "Could not submit complaint. Please try again.");
      }
    } catch (error) {
      Alert.alert("Error", "Network error. Please check your connection.");
      console.error("Submit error:", error);
    } finally {
      setIsSubmitting(false);
    }
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
      ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });

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
    setCoords({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    });

    // Try reverse geocoding
    try {
      const [address] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (address) {
        const label = [address.street, address.district, address.city]
          .filter(Boolean)
          .join(", ");
        setLocationLabel(label || `${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`);
      }
    } catch {
      setLocationLabel(
        `Lat: ${loc.coords.latitude.toFixed(4)}, Lng: ${loc.coords.longitude.toFixed(4)}`
      );
    }
  };

  const handleAIClassify = async () => {
    if (!description || description.length < 5) return;
    try {
      const result = await classifyAPI.classify(description);
      if (result.success && result.data) {
        setAiSuggestion(
          `AI suggests: ${result.data.issueType} (${Math.round(result.data.confidence * 100)}% confidence)`
        );
        // Auto-select category if not already selected
        if (!selectedCategory) {
          setSelectedCategory(result.data.issueType);
        }
      }
    } catch (err) {
      // Silently ignore classification errors
    }
  };

  if (submitted) {
    return (
      <View style={styles.centered}>
        <Ionicons name="checkmark-circle" size={80} color="#16A34A" />
        <Text style={styles.title}>Issue Submitted!</Text>
        <Text style={styles.subtitle}>
          Your complaint has been registered and auto-prioritized.
        </Text>
        {submittedId && (
          <View style={styles.ticketBadge}>
            <Text style={styles.ticketText}>{formatTicketId(submittedId)}</Text>
          </View>
        )}
        <Pressable
          style={styles.viewIssueBtn}
          onPress={() => {
            if (submittedId) {
              router.replace(`/IssueDetails?id=${submittedId}` as any);
            } else {
              router.replace("/(tabs)");
            }
          }}
        >
          <Text style={styles.viewIssueBtnText}>View Issue →</Text>
        </Pressable>
        <Pressable
          style={styles.goHomeBtn}
          onPress={() => router.replace("/(tabs)")}
        >
          <Text style={styles.goHomeBtnText}>Back to Home</Text>
        </Pressable>
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
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(step / 4) * 100}%` }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* STEP 1: Category */}
        {step === 1 && (
          <View>
            <Text style={styles.stepTitle}>What type of issue?</Text>
            <Text style={styles.stepSubtitle}>Select the category that best describes the problem</Text>

            {/* Optional description for AI classify */}
            <TextInput
              placeholder="Describe the issue briefly (optional, helps AI classify)..."
              value={description}
              onChangeText={setDescription}
              onBlur={handleAIClassify}
              style={styles.descInput}
              multiline
              numberOfLines={3}
            />
            {aiSuggestion && (
              <View style={styles.aiSuggestion}>
                <Text style={styles.aiSuggestionText}>🤖 {aiSuggestion}</Text>
              </View>
            )}

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
          </View>
        )}

        {/* STEP 2: Photo */}
        {step === 2 && (
          <View>
            <Text style={styles.stepTitle}>Capture evidence</Text>
            <Text style={styles.stepSubtitle}>Take a photo or upload one from your gallery</Text>
            {!photoUri ? (
              <View>
                <Pressable style={styles.photoBox} onPress={() => pickImage(true)}>
                  <Ionicons name="camera" size={40} color="#1E3A8A" />
                  <Text style={styles.photoBoxText}>Tap to capture photo</Text>
                </Pressable>
                <Pressable style={styles.secondaryBtn} onPress={() => pickImage(false)}>
                  <Ionicons name="images-outline" size={18} color="#1E3A8A" />
                  <Text style={styles.secondaryBtnText}>Upload from Gallery</Text>
                </Pressable>
              </View>
            ) : (
              <View>
                <Image source={{ uri: photoUri }} style={styles.image} />
                <Pressable
                  style={styles.retakeBtn}
                  onPress={() => setPhotoUri(null)}
                >
                  <Ionicons name="refresh" size={16} color="#DC2626" />
                  <Text style={styles.retakeBtnText}>Retake Photo</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        {/* STEP 3: Location */}
        {step === 3 && (
          <View>
            <Text style={styles.stepTitle}>Mark location</Text>
            <Text style={styles.stepSubtitle}>Detect your current location or enter manually</Text>
            <Pressable style={styles.primaryBtn} onPress={detectLocation}>
              <Ionicons name="location" size={20} color="white" />
              <Text style={styles.primaryBtnText}>
                {coords ? "Update Location" : "Detect Location"}
              </Text>
            </Pressable>

            {locationLabel && (
              <View style={styles.locationCard}>
                <Ionicons name="location-sharp" size={18} color="#1E3A8A" />
                <Text style={styles.locationText}>{locationLabel}</Text>
              </View>
            )}
            {coords && (
              <Text style={styles.coordsText}>
                📍 {coords.latitude.toFixed(6)}, {coords.longitude.toFixed(6)}
              </Text>
            )}
          </View>
        )}

        {/* STEP 4: Review & Submit */}
        {step === 4 && (
          <View>
            <Text style={styles.stepTitle}>Review & Submit</Text>
            <Text style={styles.stepSubtitle}>Confirm the details below before submitting</Text>

            <View style={styles.reviewCard}>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Category</Text>
                <Text style={styles.reviewValue}>{selectedCategory || "—"}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Location</Text>
                <Text style={styles.reviewValue}>{locationLabel || "Not set"}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Photo</Text>
                <Text style={styles.reviewValue}>{photoUri ? "✅ Attached" : "No photo"}</Text>
              </View>
              {description ? (
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Description</Text>
                  <Text style={[styles.reviewValue, { flex: 1 }]} numberOfLines={2}>{description}</Text>
                </View>
              ) : null}
            </View>

            <Text style={[styles.label, { marginTop: 16 }]}>Severity Level</Text>
            <View style={styles.severityRow}>
              {SEVERITY_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  style={[
                    styles.severityBtn,
                    severity === opt.value && {
                      borderColor: opt.color,
                      borderWidth: 2,
                    },
                  ]}
                  onPress={() => setSeverity(opt.value)}
                >
                  <Text>{opt.icon}</Text>
                  <Text style={styles.severityLabel}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              style={[styles.submitBtn, isSubmitting && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="white" />
                  <Text style={styles.submitText}>Submit Issue</Text>
                </>
              )}
            </Pressable>
          </View>
        )}
      </ScrollView>

      {step < 4 && (
        <Pressable
          style={[
            styles.bottomBtn,
            ((step === 1 && !selectedCategory) || (step === 3 && !coords)) && styles.disabledBtn,
          ]}
          disabled={(step === 1 && !selectedCategory) || (step === 3 && !coords)}
          onPress={handleNext}
        >
          <Text style={styles.bottomBtnText}>Continue</Text>
          <Ionicons name="arrow-forward" size={18} color="white" />
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
    paddingTop: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: { color: "white", fontSize: 16, fontWeight: "600", flex: 1 },
  progressBar: {
    height: 4,
    flex: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#34D399",
    borderRadius: 2,
  },
  content: { padding: 16, paddingBottom: 80 },
  stepTitle: { fontSize: 18, fontWeight: "700", color: "#1A2340", marginBottom: 4 },
  stepSubtitle: { fontSize: 13, color: "#6B7280", marginBottom: 16 },
  descInput: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    fontSize: 13,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
    minHeight: 60,
    textAlignVertical: "top",
  },
  aiSuggestion: {
    backgroundColor: "#F0FDF4",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  aiSuggestionText: { fontSize: 12, color: "#15803D", fontWeight: "600" },
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
    borderWidth: 1.5,
    borderColor: "#ECEEF2",
  },
  categorySelected: {
    borderWidth: 2,
    borderColor: "#1E3A8A",
    backgroundColor: "#EFF6FF",
  },
  emoji: { fontSize: 24 },
  categoryText: { marginTop: 6, fontWeight: "600", fontSize: 12, color: "#1A2340" },
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
  photoBoxText: { fontSize: 13, color: "#6B7280", marginTop: 8 },
  secondaryBtn: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "white",
    borderRadius: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  secondaryBtnText: { fontSize: 13, fontWeight: "600", color: "#1E3A8A" },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 16,
  },
  retakeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
  },
  retakeBtnText: { color: "#DC2626", fontWeight: "600", fontSize: 13 },
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
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "white",
    padding: 14,
    borderRadius: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  locationText: { fontSize: 13, color: "#1A2340", fontWeight: "500", flex: 1 },
  coordsText: { fontSize: 11, color: "#6B7280", textAlign: "center", marginTop: 8 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8 },
  reviewCard: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#ECEEF2",
  },
  reviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  reviewLabel: { fontSize: 12, color: "#6B7280" },
  reviewValue: { fontSize: 13, fontWeight: "600", color: "#1A2340" },
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
    backgroundColor: "white",
  },
  severityLabel: { fontSize: 12, fontWeight: "600", marginTop: 4 },
  submitBtn: {
    backgroundColor: "#1E3A8A",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  submitText: { color: "white", fontWeight: "700", fontSize: 15 },
  bottomBtn: {
    backgroundColor: "#1E3A8A",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  bottomBtnText: { color: "white", fontWeight: "700" },
  disabledBtn: {
    backgroundColor: "#C4C9D4",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#F0F2F7",
  },
  title: { fontSize: 22, fontWeight: "700", marginTop: 12, color: "#1A2340" },
  subtitle: { textAlign: "center", marginTop: 8, color: "#6B7280", fontSize: 14, lineHeight: 20 },
  ticketBadge: {
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  ticketText: { fontFamily: "monospace", fontWeight: "700", color: "#1E3A8A", fontSize: 14 },
  viewIssueBtn: {
    backgroundColor: "#1E3A8A",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    marginTop: 20,
  },
  viewIssueBtnText: { color: "white", fontWeight: "700", fontSize: 15 },
  goHomeBtn: {
    marginTop: 12,
  },
  goHomeBtnText: { color: "#6B7280", fontWeight: "600", fontSize: 13 },
});
