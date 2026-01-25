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
  const todos = useQuery(api.todos.getTodos);
  const totalTodos = todos ? todos.length : 0;
  const completedTodos = todos
    ? todos.filter((todo) => todo.IsCompleted).length
    : 0;
  const activeTodos = totalTodos - completedTodos;
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
            <Text style={settingsStyles.statNumber}>{totalTodos}</Text>
          </View>
        </LinearGradient>
      </LinearGradient>
    </View>
  );
};

export default ProgressStats;
