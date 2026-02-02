import { createHomeStyles } from "@/assets/styles/home.style";
import useTheme from "@/hooks/useTheme";
import AntDesign from "@expo/vector-icons/AntDesign";
import { LinearGradient } from "expo-linear-gradient";
import { Text, View } from "react-native";

const EmptyState = () => {
  const { colors } = useTheme();

  const homeStyles = createHomeStyles(colors);

  return (
    <View style={homeStyles.emptyContainer}>
      <LinearGradient
        colors={colors.gradients.empty}
        style={homeStyles.emptyIconContainer}
      >
        <AntDesign name="ellipsis" size={60} color={colors.textMuted} />
      </LinearGradient>
      <Text style={homeStyles.emptyText}>Nothing here, yet...</Text>
      <Text style={homeStyles.emptySubtext}>
        Add your first game above to get started
      </Text>
    </View>
  );
};
export default EmptyState;
