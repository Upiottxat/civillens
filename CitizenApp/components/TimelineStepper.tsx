import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

export interface TimelineStep {
  label: string;
  description?: string;
  timestamp?: string;
  status: "completed" | "current" | "pending";
}

interface TimelineStepperProps {
  steps: TimelineStep[];
}

export default function TimelineStepper({
  steps,
}: TimelineStepperProps) {
  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const isCompleted = step.status === "completed";
        const isCurrent = step.status === "current";
        const isPending = step.status === "pending";

        return (
          <View key={step.label} style={styles.row}>
            {/* Icon Column */}
            <View style={styles.iconColumn}>
              {/* Circle */}
              <View
                style={[
                  styles.circle,
                  isCompleted && styles.completedCircle,
                  isCurrent && styles.currentCircle,
                  isPending && styles.pendingCircle,
                ]}
              >
                {isCompleted ? (
                  <Feather
                    name="check"
                    size={16}
                    color="white"
                  />
                ) : (
                  <View
                    style={[
                      styles.innerDot,
                      isCurrent && styles.currentDot,
                      isPending && styles.pendingDot,
                    ]}
                  />
                )}
              </View>

              {/* Connector Line */}
              {!isLast && (
                <View
                  style={[
                    styles.connector,
                    isCompleted && styles.completedConnector,
                  ]}
                />
              )}
            </View>

            {/* Content Column */}
            <View
              style={[
                styles.content,
                !isLast && { paddingBottom: 20 },
              ]}
            >
              <Text
                style={[
                  styles.label,
                  isPending && styles.pendingLabel,
                  isCurrent && styles.currentLabel,
                ]}
              >
                {step.label}
              </Text>

              {step.description && (
                <Text style={styles.description}>
                  {step.description}
                </Text>
              )}

              {step.timestamp && !isPending && (
                <Text style={styles.timestamp}>
                  {step.timestamp}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}
const styles = StyleSheet.create({
    container: {
      flexDirection: "column",
    },
  
    row: {
      flexDirection: "row",
      gap: 16,
    },
  
    iconColumn: {
      alignItems: "center",
    },
  
    circle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: "center",
      alignItems: "center",
    },
  
    completedCircle: {
      backgroundColor: "#0D9488",
      shadowColor: "#0D9488",
      shadowOpacity: 0.2,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 0 },
      elevation: 3,
    },
  
    currentCircle: {
      backgroundColor: "#1E3A8A",
      borderWidth: 2,
      borderColor: "#1E3A8A",
    },
  
    pendingCircle: {
      backgroundColor: "#F3F4F6",
      borderWidth: 2,
      borderColor: "#D1D5DB",
      borderStyle: "dashed",
    },
  
    innerDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
  
    currentDot: {
      backgroundColor: "white",
    },
  
    pendingDot: {
      backgroundColor: "#D1D5DB",
    },
  
    connector: {
      width: 2,
      flex: 1,
      minHeight: 24,
      backgroundColor: "#E9ECF2",
      marginVertical: 4,
    },
  
    completedConnector: {
      backgroundColor: "#0D9488",
    },
  
    content: {
      flex: 1,
      paddingTop: 6,
    },
  
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: "#1A2340",
      marginBottom: 2,
    },
  
    pendingLabel: {
      fontWeight: "400",
      color: "#9CA3AF",
    },
  
    currentLabel: {
      color: "#1E3A8A",
    },
  
    description: {
      fontSize: 12,
      color: "#6B7280",
      marginBottom: 3,
    },
  
    timestamp: {
      fontSize: 11,
      color: "#9CA3AF",
    },
  });