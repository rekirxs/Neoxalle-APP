import { createConnectionStyles } from "@/assets/styles/connection.style";
import useTheme from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  PermissionsAndroid,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BleManager, Device } from "react-native-ble-plx";
import { SafeAreaView } from "react-native-safe-area-context";

const DEVICE_PREFIX = "NeoXalle_Pod";

const manager = new BleManager();

const ConnectionScreen = () => {
  const { colors } = useTheme();
  const connectionStyles = createConnectionStyles(colors);

  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [connectedDevices, setConnectedDevices] = useState<Device[]>([]);
  const [connectionStatus, setConnectionStatus] = useState("Ready to scan");

  const checkAndroidPermissions = async () => {
    if (Platform.OS !== "android") return true;

    const androidVersion = Platform.Version as number;

    try {
      if (androidVersion >= 31) {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        const scanGranted =
          granted["android.permission.BLUETOOTH_SCAN"] ===
          PermissionsAndroid.RESULTS.GRANTED;
        const connectGranted =
          granted["android.permission.BLUETOOTH_CONNECT"] ===
          PermissionsAndroid.RESULTS.GRANTED;
        const locationGranted =
          granted["android.permission.ACCESS_FINE_LOCATION"] ===
          PermissionsAndroid.RESULTS.GRANTED;

        return scanGranted && connectGranted && locationGranted;
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch (error) {
      console.log("Permission error:", error);
      return false;
    }
  };

  const checkBluetoothState = async () => {
    try {
      const state = await manager.state();

      if (state !== "PoweredOn") {
        Alert.alert(
          "Bluetooth is Off",
          "Please turn on Bluetooth in your device settings",
          [{ text: "OK" }],
        );
        return false;
      }
      return true;
    } catch (error) {
      console.log("Bluetooth check error:", error);
      return false;
    }
  };

  const isTargetDevice = (deviceName: string) => {
    if (!deviceName) return false;
    return deviceName.startsWith(DEVICE_PREFIX);
  };

  const startScan = async () => {
    console.log("=== STARTING SCAN ===");
    console.log("🔍 Scanning for NeoXalle Pods only...");
    setError(null);
    setIsScanning(true);
    setDevices([]);

    try {
      if (Platform.OS === "android") {
        const hasPermissions = await checkAndroidPermissions();
        if (!hasPermissions) {
          Alert.alert(
            "Permissions Required",
            "Please grant all Bluetooth permissions to continue",
            [{ text: "OK" }],
          );
          setIsScanning(false);
          return;
        }
      }

      const isBluetoothOn = await checkBluetoothState();
      if (!isBluetoothOn) {
        setIsScanning(false);
        return;
      }

      console.log("Starting BLE scan...");

      manager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.log("Scan error:", error.message);
          setError(error.message);
          setIsScanning(false);
          return;
        }

        if (device && device.name) {
          const deviceName = device.name;

          if (isTargetDevice(deviceName)) {
            console.log("✅ ACCEPTED - NeoXalle Pod:", deviceName);

            setDevices((prevDevices) => {
              const exists = prevDevices.find((d) => d.id === device.id);
              if (!exists) {
                console.log("➕ Adding to list:", deviceName);
                return [...prevDevices, device];
              }
              return prevDevices;
            });
          }
        }
      });

      setTimeout(() => {
        stopScan();
      }, 10000);
    } catch (error) {
      console.log("Start scan error:", error);
      setError(error.message || "Unknown error");
      setIsScanning(false);
    }
  };

  const stopScan = () => {
    console.log("Stopping scan...");
    console.log(`Found ${devices.length} NeoXalle Pods`);
    manager.stopDeviceScan();
    setIsScanning(false);
  };

  const connectToDevice = async (device: Device) => {
    try {
      setConnectionStatus(`Connecting to ${device.name}...`);

      const connectedDevice = await device.connect();
      await connectedDevice.discoverAllServicesAndCharacteristics();

      setConnectedDevices((prev) => {
        const exists = prev.find((d) => d.id === connectedDevice.id);
        if (!exists) {
          return [...prev, connectedDevice];
        }
        return prev;
      });

      setConnectionStatus(`✅ Connected to ${device.name}`);
      console.log(`✅ Connected to: ${device.name}`);
    } catch (error) {
      console.log(`❌ Failed to connect to ${device.name}:`, error);
      setConnectionStatus(`❌ Failed to connect to ${device.name}`);
    }
  };

  const disconnectDevice = async (device: Device) => {
    try {
      await device.cancelConnection();
      setConnectedDevices((prev) => prev.filter((d) => d.id !== device.id));
      setConnectionStatus(`Disconnected from ${device.name}`);
      console.log(`🔌 Disconnected from ${device.name}`);
    } catch (error) {
      console.log("Disconnect error:", error);
    }
  };

  // SIMPLE COMMAND SENDING - PLAIN TEXT
  const sendCommand = async (device: Device, command: string) => {
    try {
      console.log(`📤 Sending to ${device.name}: "${command}"`);

      // Send plain text command (ASCII)
      await device.writeCharacteristicWithResponseForService(
        "4fafc201-1fb5-459e-8fcc-c5c9c331914b",
        "beb5483e-36e1-4688-b7f5-ea07361b26a8",
        command,
      );

      console.log(`✅ Command sent to ${device.name}`);
      setConnectionStatus(`Sent "${command}" to ${device.name}`);
    } catch (error) {
      console.log(`❌ Failed to send command:`, error);
      setConnectionStatus(`Failed to send command to ${device.name}`);
    }
  };

  useEffect(() => {
    return () => {
      manager.stopDeviceScan();
    };
  }, []);

  const renderDeviceItem = ({ item }: { item: Device }) => {
    const isConnected = connectedDevices.some((d) => d.id === item.id);

    return (
      <View
        style={[
          connectionStyles.statCard,
          {
            borderLeftColor: isConnected ? colors.success : colors.primary,
            backgroundColor: "rgba(255,255,255,0.05)",
            marginBottom: 12,
          },
        ]}
      >
        <View style={connectionStyles.statIconContainer}>
          <LinearGradient
            colors={
              isConnected
                ? [colors.success, colors.success + "CC"]
                : colors.gradients.primary
            }
            style={connectionStyles.statIcon}
          >
            <Ionicons name="bluetooth-outline" size={20} color="#ffffff" />
          </LinearGradient>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[connectionStyles.statNumber, { fontSize: 16 }]}>
            {item.name || "Unknown Device"}
          </Text>
          <Text style={connectionStyles.statLabel}>
            Signal: {item.rssi || "N/A"} dBm
          </Text>
          <View
            style={{ flexDirection: "row", marginTop: 8, alignItems: "center" }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: isConnected ? colors.success : colors.warning,
                marginRight: 6,
              }}
            />
            <Text
              style={{
                color: isConnected ? colors.success : colors.warning,
                fontSize: 12,
              }}
            >
              {isConnected ? "Connected" : "Disconnected"}
            </Text>
          </View>
        </View>

        {/* Connect/Disconnect Button */}
        <TouchableOpacity
          onPress={() =>
            isConnected ? disconnectDevice(item) : connectToDevice(item)
          }
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 6,
            backgroundColor: isConnected
              ? colors.danger + "20"
              : colors.primary + "20",
            borderWidth: 1,
            borderColor: isConnected
              ? colors.danger + "40"
              : colors.primary + "40",
          }}
        >
          <Text
            style={{
              color: isConnected ? colors.danger : colors.primary,
              fontSize: 12,
              fontWeight: "600",
            }}
          >
            {isConnected ? "Disconnect" : "Connect"}
          </Text>
        </TouchableOpacity>

        {/* Control Buttons - Only show when connected */}
        {isConnected && (
          <View
            style={{
              flexDirection: "row",
              marginTop: 12,
              gap: 6,
              flexWrap: "wrap",
            }}
          >
            <TouchableOpacity
              onPress={() => sendCommand(item, "RANDOM")}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor: colors.primary + "20",
                flex: 1,
                minWidth: 70,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: colors.primary,
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                🎲 Random
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => sendCommand(item, "RED")}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor: "#FF000020",
                flex: 1,
                minWidth: 70,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: "#FF0000",
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                🔴 Red
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => sendCommand(item, "GREEN")}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor: "#00FF0020",
                flex: 1,
                minWidth: 70,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: "#00FF00",
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                🟢 Green
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => sendCommand(item, "BLUE")}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor: "#0000FF20",
                flex: 1,
                minWidth: 70,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: "#0000FF",
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                🔵 Blue
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => sendCommand(item, "OFF")}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor: colors.danger + "20",
                flex: 1,
                minWidth: 70,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: colors.danger,
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                ⚫ Off
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => sendCommand(item, "PING")}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor: colors.warning + "20",
                flex: 1,
                minWidth: 70,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: colors.warning,
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                🏓 Ping
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderEmptyList = () => (
    <View
      style={{
        alignItems: "center",
        padding: 40,
        justifyContent: "center",
      }}
    >
      <Ionicons name="bluetooth-outline" size={48} color={colors.textMuted} />
      <Text
        style={[
          connectionStyles.sectionTitle,
          { marginTop: 16, textAlign: "center" },
        ]}
      >
        No NeoXalle Pods Found
      </Text>
      <Text
        style={[
          connectionStyles.statLabel,
          { textAlign: "center", marginTop: 8 },
        ]}
      >
        Press Scan to search for NeoXalle Pods
      </Text>
    </View>
  );

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
            <Text style={connectionStyles.title}>NeoXalle Pods</Text>
          </View>

          <View style={[connectionStyles.section, { marginTop: 16 }]}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: isScanning
                      ? colors.warning
                      : colors.success,
                    marginRight: 8,
                  }}
                />
                <Text
                  style={[
                    connectionStyles.settingText,
                    { color: colors.textMuted },
                  ]}
                >
                  {isScanning ? "Scanning..." : connectionStatus}
                </Text>
              </View>
              <Text style={[connectionStyles.statLabel, { fontSize: 12 }]}>
                {devices.length} pod{devices.length !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>

          <View style={{ marginTop: 20 }}>
            <TouchableOpacity
              onPress={isScanning ? stopScan : startScan}
              style={[
                connectionStyles.scanButton,
                {
                  backgroundColor: isScanning ? colors.danger : colors.primary,
                },
              ]}
            >
              <LinearGradient
                colors={
                  isScanning
                    ? [colors.danger, colors.danger + "CC"]
                    : colors.gradients.button
                }
                style={connectionStyles.scanButtonIconContainer}
              >
                <Ionicons
                  name={isScanning ? "stop" : "search"}
                  size={28}
                  color="#ffffff"
                />
              </LinearGradient>
              <Text style={connectionStyles.scanButtonText}>
                {isScanning ? "Stop Scanning" : "Scan for Pods"}
              </Text>
            </TouchableOpacity>

            {error && (
              <View
                style={[
                  connectionStyles.section,
                  {
                    backgroundColor: colors.danger + "20",
                    borderLeftColor: colors.danger,
                    marginTop: 16,
                    padding: 16,
                  },
                ]}
              >
                <Text
                  style={[
                    connectionStyles.sectionTitleDanger,
                    { marginBottom: 8 },
                  ]}
                >
                  Error
                </Text>
                <Text
                  style={[connectionStyles.statLabel, { color: colors.danger }]}
                >
                  {error}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={{ flex: 1, paddingHorizontal: 20, marginTop: 20 }}>
          <Text
            style={[
              connectionStyles.sectionTitle,
              { marginBottom: 12, fontSize: 18 },
            ]}
          >
            Found Pods ({devices.length})
          </Text>

          {devices.length === 0 && !isScanning ? (
            renderEmptyList()
          ) : (
            <FlatList
              data={devices}
              renderItem={renderDeviceItem}
              showsVerticalScrollIndicator={true}
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 20 }}
              keyExtractor={(item, index) => item?.id || `pod-${index}`}
            />
          )}
        </View>

        <View
          style={[
            connectionStyles.section,
            {
              backgroundColor: colors.backgrounds + "20",
              alignItems: "center",
              marginHorizontal: 20,
              marginBottom: 20,
              padding: 12,
            },
          ]}
        >
          <Text
            style={[
              connectionStyles.statLabel,
              { textAlign: "center", fontSize: 12 },
            ]}
          >
            Commands: RANDOM • RED • GREEN • BLUE • OFF • PING
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default ConnectionScreen;
