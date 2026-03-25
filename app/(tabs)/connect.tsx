import { createTemplateStyles } from "@/assets/styles/template.styles";
import useTheme from "@/hooks/useTheme";
import { Entypo, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Image,
  PermissionsAndroid,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BleManager, Device } from "react-native-ble-plx";
import { SafeAreaView } from "react-native-safe-area-context";

const manager = new BleManager();

function GlowingLogo({ isConnected }: { isConnected: boolean }) {
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
          source={
            isConnected
            ? require("@/assets/images/pod-transparent-color.png")}
            : require("@/assets/images/pod-transparent.png")}
          style={{ width: 180 * 3, height: 67.5 * 3, resizeMode: "contain" }}
        />
        {!isConnected && (
          <Animated.View
            style={{
              position: "absolute",
              top: -30,
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
              color="#ffffff"
              style={{ transform: [{ rotate: "75deg" }] }}
            />
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
}

const ConnectScreen = () => {
  const { colors } = useTheme();
  const templateStyles = createTemplateStyles(colors);

  const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const checkAndroidPermissions = async () => {
    if (Platform.OS !== "android") return true;
    const androidVersion = Platform.Version as number;
    try {
      if (androidVersion >= 31) {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        return (
          granted["android.permission.BLUETOOTH_SCAN"] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          granted["android.permission.ACCESS_FINE_LOCATION"] ===
            PermissionsAndroid.RESULTS.GRANTED
        );
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch {
      return false;
    }
  };

  const startScan = async () => {
    setDevices([]);
    setIsScanning(true);

    if (Platform.OS === "android") {
      const hasPermissions = await checkAndroidPermissions();
      if (!hasPermissions) {
        setIsScanning(false);
        return;
      }
    }

    const state = await manager.state();
    if (state !== "PoweredOn") {
      Alert.alert(
        "Bluetooth is Off",
        "Please turn on Bluetooth in your device settings",
      );
      setIsScanning(false);
      return;
    }

    manager.startDeviceScan(null, null, async (error, device) => {
      if (error) {
        setIsScanning(false);
        return;
      }

      if (device?.name === "NeoXalle-Master") {
        manager.stopDeviceScan();
        setIsScanning(false);

        try {
          const connected = await device.connect();
          await connected.discoverAllServicesAndCharacteristics();
          setConnectedDevice(connected);
          setIsConnected(true);

          // Listen for disconnection
          manager.onDeviceDisconnected(connected.id, () => {
            setIsConnected(false);
            setConnectedDevice(null);
          });
        } catch (e) {
          Alert.alert(
            "Connection Failed",
            "Could not connect to NeoXalle-Master",
          );
          setIsConnected(false);
        }
      }
    });

    // Stop scan after 15 seconds if not found
    setTimeout(() => {
      manager.stopDeviceScan();
      setIsScanning(false);
    }, 15000);
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
              color={isConnected ? "#66c04b" : colors.textMuted}
              style={{ marginRight: -4 }}
            />
            <Text
              style={[
                templateStyles.settingText,
                { color: isConnected ? "#66c04b" : colors.textMuted },
              ]}
            >
              {isConnected ? "Connected" : "Not Connected"}
            </Text>
          </View>
        </View>

        <GlowingLogo isConnected={isConnected} />

        <View
          style={{
            alignSelf: "center",
            marginTop: 12,
            paddingHorizontal: 14,
            paddingVertical: 6,
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
            onPress={
              isScanning
                ? () => {
                    manager.stopDeviceScan();
                    setIsScanning(false);
                  }
                : startScan
            }
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.primary,
              paddingVertical: 16,
              borderRadius: 14,
              gap: 10,
            }}
          >
            <Ionicons
              name={isScanning ? "stop" : "search-outline"}
              size={22}
              color="#fff"
            />
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
              {isScanning ? "Stop" : "Scan Devices"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={async () => {
              if (connectedDevice) {
                await connectedDevice.cancelConnection();
              }
              setIsConnected(false);
              setConnectedDevice(null);
            }}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.danger + "20",
              borderWidth: 2,
              borderColor: colors.danger + "60",
              paddingVertical: 16,
              borderRadius: 14,
              gap: 10,
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

        {devices.length > 0 && (
          <View style={{ paddingHorizontal: 24, marginTop: 20, gap: 10 }}>
            <Text
              style={{
                color: colors.textMuted,
                fontSize: 13,
                fontWeight: "600",
                marginBottom: 4,
              }}
            >
              {devices.length} device{devices.length !== 1 ? "s" : ""} found
            </Text>
            {devices.map((device) => (
              <View
                key={device.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: colors.backgrounds + "40",
                  borderRadius: 12,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: colors.primary + "40",
                  gap: 12,
                }}
              >
                <Ionicons
                  name="bluetooth-outline"
                  size={20}
                  color={colors.primary}
                />
                <View>
                  <Text
                    style={{
                      color: colors.text,
                      fontWeight: "700",
                      fontSize: 15,
                    }}
                  >
                    {device.name}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                    {device.rssi ? `${device.rssi} dBm` : "Signal Unknown"}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <ScrollView
          style={templateStyles.scrollView}
          contentContainerStyle={templateStyles.content}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

export default ConnectScreen;
