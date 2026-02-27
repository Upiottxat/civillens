import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Ellipse, Path, Circle } from "react-native-svg";

export default function CiviLensLogo() {
  return (
    <View style={styles.container}>
      <Svg width={88} height={88} viewBox="0 0 88 88">
        {/* Outer glow */}
        <Ellipse cx="44" cy="50" rx="30" ry="18" fill="rgba(255,255,255,0.08)" />

        {/* Shield body */}
        <Path
          d="M44 8 L74 22 L74 48 Q74 68 44 80 Q14 68 14 48 L14 22 Z"
          fill="rgba(255,255,255,0.12)"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="2"
        />

        {/* Inner shield */}
        <Path
          d="M44 16 L68 28 L68 48 Q68 62 44 72 Q20 62 20 48 L20 28 Z"
          fill="rgba(255,255,255,0.08)"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="1"
        />

        {/* Eye */}
        <Ellipse
          cx="44"
          cy="46"
          rx="15"
          ry="10"
          fill="none"
          stroke="rgba(255,255,255,0.9)"
          strokeWidth="2"
        />

        <Path
          d="M29 46 Q36.5 36 44 46"
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="1"
        />

        <Circle cx="44" cy="46" r="6" fill="white" opacity="0.95" />
        <Circle cx="44" cy="46" r="3" fill="#1E3A8A" />
        <Circle cx="45.5" cy="44.5" r="1" fill="white" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
});