import { createTemplateStyles } from "@/assets/styles/template.styles";
import useTheme from "@/hooks/useTheme";
import { Entypo, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";

import {
  Animated,
  Easing,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function GlowingLogo() {
  const glowAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.5,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();

    return () => {
      animation.stop();
    };
  }, [glowAnim]);

  const opacity = glowAnim;

  return (
    <View style={{ alignItems: "center" }}>
      <Animated.View
        style={{
          opacity,
          shadowColor: "#A020F0",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 20,
          elevation: 10,
        }}
      >
        <Image
          source={require("@/assets/images/pod-transparent.png")}
          style={{
            width: 180 * 3,
            height: 67.5 * 3,
            resizeMode: "contain",
          }}
        />
        <Animated.View
          style={{
            position: "absolute",
            top: -20,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
            opacity,
          }}
        >
          <Ionicons
            name="search-outline"
            size={28}
            color="#444444"
            style={{ transform: [{ rotate: "70deg" }] }}
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const ConnectScreen = () => {
  const { colors } = useTheme();

  const templateStyles = createTemplateStyles(colors);

  const [isConnected, setIsConnected] = useState(false);

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
              <Ionicons name="bluetooth" size={28} color="#ffffff" />
            </LinearGradient>
            <Text style={templateStyles.title}>Connect to NeoXalle</Text>
          </View>
        </View>
        <View style={templateStyles.header}>
          <View
            style={[
              templateStyles.titleContainer,
              {
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
              },
            ]}
          >
            <Entypo
              name="dot-single"
              size={32}
              color={isConnected ? "66c04b" : colors.textMuted}
              style={{ marginRight: -4 }}
            />
            <Text
              style={[
                templateStyles.settingText,
                { color: isConnected ? "66c04b" : colors.textMuted },
              ]}
            >
              {isConnected ? "Connected" : "Not Connected"}
            </Text>
          </View>
        </View>

        <GlowingLogo />
        <View
          style={{
            alignSelf: "center",
            marginTop: 12,
            paddingHorizontal: 120,
            paddingVertical: 20,
            borderRadius: 8,
            backgroundColor: isConnected
              ? "#66c04b20"
              : colors.textMuted + "20",
            borderWidth: 1,
            borderColor: isConnected ? "#66c04b60" : colors.textMuted + "60",
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
          }}
        >
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              backgroundColor: isConnected ? "#66c04b" : colors.textMuted,
            }}
          />
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: isConnected ? "#66c04b" : colors.textMuted,
            }}
          >
            {isConnected ? "Connected" : "Not Connected"}
          </Text>
        </View>

        <View
          style={{
            marginTop: 32,
            gap: 12,
            paddingHorizontal: 24,
            flexDirection: "row",
          }}
        >
          <TouchableOpacity
            onPress={() => {}}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.primary,
              paddingVertical: 16,
              borderRadius: 14,
              gap: 10,
              flex: 1,
            }}
          >
            <Ionicons name="search-outline" size={22} color="#fff" />
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
              Scan Devices
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {}}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.danger + "20",
              borderWidth: 2,
              borderColor: colors.danger + "60",
              paddingVertical: 16,
              borderRadius: 14,
              gap: 10,
              flex: 1,
            }}
          >
            <Ionicons
              name="close-circle-outline"
              size={22}
              color={colors.danger}
            />
            <Text
              style={{ color: colors.danger, fontSize: 16, fontWeight: "700" }}
            >
              Disconnect
            </Text>
          </TouchableOpacity>
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
export default ConnectScreen;
