import { createSettingsStyles } from "@/assets/styles/settings.styles";
import { api } from "@/convex/_generated/api";
import useTheme from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Text, View } from "react-native";

const ProgressStats = () => {
  const { colors } = useTheme();
  const settingsStyles = createSettingsStyles(colors);
  const games = useQuery(api.games.getGames);
  const totalGames = games ? games.length : 0;

  return (
    <View>
      <LinearGradient
        colors={colors.gradients.surface}
        style={settingsStyles.section}
      >
        <Text style={settingsStyles.sectionTitle}>Stats</Text>
        <LinearGradient
          colors={colors.gradients.background}
          style={[settingsStyles.statCard, { borderLeftColor: colors.primary }]}
        >
          <View style={settingsStyles.statIconContainer}>
            <LinearGradient
              colors={colors.gradients.primary}
              style={settingsStyles.statIcon}
            >
              <Ionicons name="list" size={20} colors="#fff" />
            </LinearGradient>
          </View>
          <View>
            <Text style={settingsStyles.statLabel}>Total</Text>
            <Text style={settingsStyles.statNumber}>{totalGames}</Text>
          </View>
        </LinearGradient>
      </LinearGradient>
    </View>
  );
};

export default ProgressStats;
