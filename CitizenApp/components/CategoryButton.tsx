import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

interface CategoryButtonProps {
  icon: string;
  label: string;
  selected: boolean;
  onSelect: () => void;
}

export default function CategoryButton({
  icon,
  label,
  selected,
  onSelect,
}: CategoryButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onSelect}
      style={[
        styles.container,
        selected && styles.selectedContainer,
      ]}
    >
      <Text style={styles.icon}>{icon}</Text>

      <Text
        style={[
          styles.label,
          selected && styles.selectedLabel,
        ]}
        numberOfLines={2}
      >
        {label}
      </Text>

      {selected && <View style={styles.dot} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
    container: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      paddingHorizontal: 8,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: "#E9ECF2",
      backgroundColor: "white",
      width: "100%",
  
      // subtle shadow
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 },
      elevation: 2,
    },
  
    selectedContainer: {
      borderColor: "#1E3A8A",
      backgroundColor: "#EEF2FF",
  
      shadowColor: "#1E3A8A",
      shadowOpacity: 0.15,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 2 },
      elevation: 4,
    },
  
    icon: {
      fontSize: 26,
      lineHeight: 26,
    },
  
    label: {
      fontSize: 11,
      fontWeight: "500",
      color: "#374151",
      textAlign: "center",
      marginTop: 8,
      lineHeight: 14,
    },
  
    selectedLabel: {
      fontWeight: "600",
      color: "#1E3A8A",
    },
  
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: "#1E3A8A",
      marginTop: 6,
    },
  });