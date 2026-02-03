import { api } from "@/convex/_generated/api";
import useTheme from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { Text, View } from "react-native";
import { createHomeStyles } from "../assets/styles/home.style";

const Header = () => {
  const { colors } = useTheme();

  const homeStyles = createHomeStyles(colors);

  const game = useQuery(api.games.getGames);

  return (
    <View style={homeStyles.header}>
      <View style={homeStyles.titleContainer}>
        <LinearGradient
          colors={colors.gradients.primary}
          style={homeStyles.iconContainer}
        >
          <Ionicons name="flash-outline" size={28} color="#fff" />
        </LinearGradient>

        <View style={homeStyles.titleTextContainer}>
          <Text style={homeStyles.title}>Welcome! </Text>
        </View>
      </View>
    </View>
  );
};

export default Header;
