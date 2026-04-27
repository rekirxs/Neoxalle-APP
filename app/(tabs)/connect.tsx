import { createTemplateStyles } from "@/assets/styles/template.styles";
import useTheme from "@/hooks/useTheme";
import { Entypo, Ionicons } from "@expo/vector-icons";
import { Buffer } from "buffer";
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

const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
const CMD_CHAR_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";
const NOTIFY_CHAR_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a9";
const PODS = [1, 2, 3, 4];

function GlowingLogo({ isConnected }: { isConnected: boolean }) {
  const glowAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (isConnected) {
      glowAnim.setValue(1);
      return;
    }
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
  }, [glowAnim, isConnected]);

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
              ? require("@/assets/images/pod-transparent-color.png")
              : require("@/assets/images/pod-transparent.png")
          }
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

type HitResult = { id: string; text: string; time: string; hit: boolean };

const ConnectScreen = () => {
  const { colors } = useTheme();
  const templateStyles = createTemplateStyles(colors);

  const managerRef = useRef(new BleManager());

  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<HitResult[]>([]);
  const [activePod, setActivePod] = useState<number | null>(null);
  const deviceRef = useRef<Device | null>(null);

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

  const subscribeToNotifications = (d: Device) => {
    d.monitorCharacteristicForService(
      SERVICE_UUID,
      NOTIFY_CHAR_UUID,
      (error, characteristic) => {
        if (error || !characteristic?.value) return;
        const msg = Buffer.from(characteristic.value, "base64").toString(
          "utf-8",
        );
        parseResult(msg);
      },
    );
  };

  const parseResult = (msg: string) => {
    const now = new Date().toLocaleTimeString();
    let text = "";
    let hit = false;

    const clean = msg.trim();

    if (clean.startsWith("HIT:")) {
      // ← use clean
      const parts = clean.split(":");
      text = `Pod ${parts[1]}  ${parts[2]}ms  ${parts[3]}G`;
      hit = true;
      setActivePod(null);
    } else if (clean.startsWith("MISS:")) {
      // ← use clean
      text = `Pod ${clean.split(":")[1]} Missed`;
      setActivePod(null);
    }
    if (text) {
      setResults((prev) => [
        { id: Date.now().toString(), text, time: now, hit },
        ...prev,
      ]);
    }
  };

  const startScan = async () => {
    setIsScanning(true);

    if (Platform.OS === "android") {
      const hasPermissions = await checkAndroidPermissions();
      if (!hasPermissions) {
        setIsScanning(false);
        return;
      }
    }

    const state = await managerRef.current.state();
    if (state !== "PoweredOn") {
      Alert.alert(
        "Bluetooth is Off",
        "Please turn on Bluetooth in your device settings",
      );
      setIsScanning(false);
      return;
    }

    managerRef.current.startDeviceScan(null, null, async (error, device) => {
      if (error) {
        setIsScanning(false);
        return;
      }

      if (device?.name === "NeoXalle-Master") {
        managerRef.current.stopDeviceScan();
        setIsScanning(false);

        try {
          const connected = await device.connect();
          await connected.discoverAllServicesAndCharacteristics();
          setConnectedDevice(connected);
          deviceRef.current = connected;
          setIsConnected(true);
          subscribeToNotifications(connected);

          managerRef.current.onDeviceDisconnected(connected.id, () => {
            setIsConnected(false);
            setConnectedDevice(null);
            deviceRef.current = null;
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

    setTimeout(() => {
      managerRef.current.stopDeviceScan(); // ← CHANGED: managerRef.current
      setIsScanning(false);
    }, 15000);
  };

  const sendCommand = async (cmd: string) => {
    if (!deviceRef.current) return;
    const encoded = Buffer.from(cmd).toString("base64");
    await deviceRef.current.writeCharacteristicWithResponseForService(
      SERVICE_UUID,
      CMD_CHAR_UUID,
      encoded,
    );
  };

  const triggerPod = async (pod: number) => {
    setActivePod(pod);
    await sendCommand(`ON:${pod}`);
  };

  const stopAll = async () => {
    setActivePod(null);
    await sendCommand("OFF:ALL");
  };

  useEffect(() => {
    return () => {
      managerRef.current.stopDeviceScan();
      managerRef.current.destroy();
    };
  }, []);

  return (
    <LinearGradient
      colors={colors.gradients.background}
      style={templateStyles.container}
    >
      <SafeAreaView style={templateStyles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={templateStyles.header}>
            <View style={templateStyles.titleContainer}>
              <LinearGradient
                colors={colors.gradients.primary}
                style={templateStyles.iconContainer}
              >
                <Ionicons name="bluetooth" size={28} color="#ffffff" />
              </LinearGradient>
              <Text style={templateStyles.title}>NeoXalle</Text>
            </View>
          </View>

          <View
            style={{
              alignSelf: "center",
              marginTop: 4,
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
            <Entypo
              name="dot-single"
              size={20}
              color={isConnected ? "#66c04b" : colors.textMuted}
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

          <View style={{ marginTop: 16 }}>
            <GlowingLogo isConnected={isConnected} />
          </View>

          <View
            style={{
              marginTop: 24,
              gap: 12,
              paddingHorizontal: 24,
              flexDirection: "row",
            }}
          >
            <TouchableOpacity
              onPress={
                isScanning
                  ? () => {
                      managerRef.current.stopDeviceScan();
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
                {isScanning ? "Stop" : "Scan"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={async () => {
                try {
                  if (connectedDevice) await connectedDevice.cancelConnection();
                } catch (e) {
                } finally {
                  managerRef.current.stopDeviceScan();
                  managerRef.current.destroy();
                  managerRef.current = new BleManager(); // ← CHANGED: fresh manager
                  setIsConnected(false);
                  setConnectedDevice(null);
                  deviceRef.current = null;
                  setActivePod(null);
                }
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
                style={{
                  color: colors.danger,
                  fontSize: 16,
                  fontWeight: "700",
                }}
              >
                Disconnect
              </Text>
            </TouchableOpacity>
          </View>

          {isConnected && (
            <View style={{ paddingHorizontal: 24, marginTop: 28 }}>
              <Text
                style={{
                  color: colors.textMuted,
                  fontSize: 13,
                  fontWeight: "600",
                  marginBottom: 12,
                }}
              >
                PODS
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                {PODS.map((pod) => {
                  const isActive = activePod === pod;
                  return (
                    <TouchableOpacity
                      key={pod}
                      onPress={() => triggerPod(pod)}
                      style={{
                        width: "47%",
                        paddingVertical: 20,
                        borderRadius: 16,
                        alignItems: "center",
                        backgroundColor: isActive
                          ? colors.primary
                          : colors.primary + "20",
                        borderWidth: 2,
                        borderColor: isActive
                          ? colors.primary
                          : colors.primary + "50",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 22,
                          fontWeight: "800",
                          color: isActive ? "#fff" : colors.primary,
                        }}
                      >
                        Pod {pod}
                      </Text>
                      {isActive && (
                        <Text
                          style={{
                            fontSize: 11,
                            color: "#ffffff90",
                            marginTop: 4,
                          }}
                        >
                          waiting...
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                onPress={stopAll}
                style={{
                  marginTop: 12,
                  paddingVertical: 16,
                  borderRadius: 14,
                  alignItems: "center",
                  backgroundColor: colors.danger + "20",
                  borderWidth: 2,
                  borderColor: colors.danger + "60",
                }}
              >
                <Text
                  style={{
                    color: colors.danger,
                    fontSize: 16,
                    fontWeight: "700",
                  }}
                >
                  Stop All
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* results */}
          {results.length > 0 && (
            <View
              style={{ paddingHorizontal: 24, marginTop: 28, marginBottom: 20 }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    color: colors.textMuted,
                    fontSize: 13,
                    fontWeight: "600",
                  }}
                >
                  RESULTS
                </Text>
                <TouchableOpacity onPress={() => setResults([])}>
                  <Text style={{ color: colors.danger, fontSize: 12 }}>
                    Clear
                  </Text>
                </TouchableOpacity>
              </View>
              {results.map((item) => (
                <View
                  key={item.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.primary + "20",
                  }}
                >
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: item.hit ? "#66c04b" : colors.danger,
                    }}
                  />
                  <Text
                    style={{ color: colors.textMuted, fontSize: 11, width: 70 }}
                  >
                    {item.time}
                  </Text>
                  <Text style={{ color: colors.text, fontSize: 14, flex: 1 }}>
                    {item.text}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default ConnectScreen;
