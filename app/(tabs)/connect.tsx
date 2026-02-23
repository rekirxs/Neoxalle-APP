import { createTemplateStyles } from "@/assets/styles/template.styles";
import useTheme from "@/hooks/useTheme";
import { Entypo, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  FlatList,
  Image,
  PermissionsAndroid,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BleManager, Device } from "react-native-ble-plx";
import { SafeAreaView } from "react-native-safe-area-context";

const manager = new BleManager();

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
    return () => animation.stop();
  }, [glowAnim]);

  return (
    <View style={{ alignItems: "center" }}>
      <Animated.View style={{ opacity: glowAnim }}>
        <Image
          source={require("@/assets/images/pod-transparent.png")}
          style={{
            width: 180 * 3,
            height: 67.5 * 3,
            resizeMode: "contain",
          }}
        />
      </Animated.View>
    </View>
  );
}

const ConnectScreen = () => {
  const { colors } = useTheme();
  const templateStyles = createTemplateStyles(colors);

  const [devices, setDevices] = useState<Device[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const checkScanPermission = async () => {
    if (Platform.OS !== "android") return true;

    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
    );

    return granted === PermissionsAndroid.RESULTS.GRANTED;
  };

  const startScan = async () => {
    setDevices([]);
    setIsScanning(true);

    const allowed = await checkScanPermission();
    if (!allowed) {
      setIsScanning(false);
      return;
    }

    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log(error);
        setIsScanning(false);
        return;
      }

      if (device?.name && device.name.trim().length > 0) {
        setDevices((prev) => {
          if (!prev.find((d) => d.id === device.id)) {
            return [...prev, device];
          }
          return prev;
        });
      }
    });

    setTimeout(() => {
      manager.stopDeviceScan();
      setIsScanning(false);
    }, 8000);
  };

  useEffect(() => {
    return () => {
      manager.stopDeviceScan();
    };
  }, []);

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
            <Text style={templateStyles.title}>Scan for Devices</Text>
          </View>
        </View>

        <View style={templateStyles.header}>
          <View style={templateStyles.titleContainer}>
            <Entypo
              name="dot-single"
              size={32}
              color={isScanning ? "#f5a623" : "#66c04b"}
            />
            <Text style={templateStyles.settingText}>
              {isScanning ? "Scanning..." : "Ready"}
            </Text>
          </View>
        </View>

        <GlowingLogo />

        <TouchableOpacity
          onPress={startScan}
          style={{
            backgroundColor: colors.primary,
            padding: 15,
            marginHorizontal: 40,
            borderRadius: 12,
            alignItems: "center",
            marginTop: 20,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>Start Scan</Text>
        </TouchableOpacity>

        <FlatList
          data={devices}
          keyExtractor={(item) => item.id}
          style={{ marginTop: 20 }}
          renderItem={({ item }) => (
            <View
              style={{
                padding: 15,
                marginHorizontal: 20,
                marginVertical: 6,
                borderRadius: 12,
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              }}
            >
              <Text style={{ color: colors.text, fontWeight: "600" }}>
                {item.name}
              </Text>
            </View>
          )}
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

export default ConnectScreen;
