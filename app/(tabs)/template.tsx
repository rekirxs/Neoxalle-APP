import { createTemplateStyles } from "@/assets/styles/template.styles";
import useTheme from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TemplateScreen = () => {
  const { colors } = useTheme();

  const templateStyles = createTemplateStyles(colors);

  return (
    <LinearGradient
      colors={colors.gradients.background}
      style={templateStyles.container}
    >
      <SafeAreaView style={templateStyles.safeArea}>
        <View style={templateStyles.header}>
          <View style={templateStyles.titleContainer}>
            <LinearGradient
              colors={colors.gradients.primary}
              style={templateStyles.iconContainer}
            >
              <Ionicons name="pencil" size={28} color="#ffffff" />
            </LinearGradient>
            <Text style={templateStyles.title}>template</Text>
          </View>
        </View>

        <ScrollView
          style={templateStyles.scrollView}
          contentContainerStyle={templateStyles.content}
          showsVerticalScrollIndicator={false}
        ></ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};
export default TemplateScreen;
