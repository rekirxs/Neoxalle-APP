import { createConnectionStyles } from "@/assets/styles/connection.style";
import useTheme from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ConnectionScreen = () => {
  const { colors } = useTheme();

  const connectionStyles = createConnectionStyles(colors);

  return (
    <LinearGradient
      colors={colors.gradients.background}
      style={connectionStyles.container}
    >
      <SafeAreaView style={connectionStyles.safeArea}>
        <View style={connectionStyles.header}>
          <View style={connectionStyles.titleContainer}>
            <LinearGradient
              colors={colors.gradients.primary}
              style={connectionStyles.iconContainer}
            >
              <Ionicons name="bluetooth" size={28} color="#ffffff" />
            </LinearGradient>
            <Text style={connectionStyles.title}>Connection</Text>
          </View>
        </View>

        <ScrollView
          style={connectionStyles.scrollView}
          contentContainerStyle={connectionStyles.content}
          showsVerticalScrollIndicator={false}
        ></ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};
export default ConnectionScreen;
