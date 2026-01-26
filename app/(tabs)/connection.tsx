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

const DEVICE_PREFIX = "NEOXALLE"; // Fixed spelling - single X

const manager = new BleManager();

const ConnectionScreen = () => {
  const { colors } = useTheme();
  const connectionStyles = createConnectionStyles(colors);

  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [connectedDevices, setConnectedDevices] = useState<Device[]>([]);
  const [connectionStatus, setConnectionStatus] = useState("Ready");

  const checkAndroidPermissions = async () => {
    if (Platform.OS !== "android") return true;

    const androidVersion = Platform.Version as number;

    try {
      // Android 12+ (API 31+)
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
      }
      // Android 6-11
      else {
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

  // Check if device is a NeoXalle device
  const isTargetDevice = (deviceName: string) => {
    if (!deviceName) return false;
    return deviceName.toUpperCase().includes("NEOXALLE");
  };

  const startScan = async () => {
    console.log("=== STARTING SCAN ===");
    console.log("🔍 Scanning for NeoXalle devices only...");
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
          console.log("📡 Found device:", deviceName, "RSSI:", device.rssi);

          // Check if it's a NeoXalle device
          if (isTargetDevice(deviceName)) {
            console.log("✅ ACCEPTED - NeoXalle device");

            setDevices((prevDevices) => {
              const exists = prevDevices.find((d) => d.id === device.id);
              if (!exists) {
                console.log("➕ Adding to list:", deviceName);
                return [...prevDevices, device];
              }
              return prevDevices;
            });
          } else {
            console.log("❌ REJECTED - Not a NeoXalle device");
            // DO NOT add to devices list - only NeoXalle devices
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
    console.log(`Found ${devices.length} NeoXalle devices`);
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

      setConnectionStatus(`Connected to ${device.name}`);
      console.log(`✅ Connected to: ${device.name}`);
    } catch (error) {
      console.log(`❌ Failed to connect to ${device.name}:`, error);
      setConnectionStatus(`Failed to connect to ${device.name}`);
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

  useEffect(() => {
    return () => {
      manager.stopDeviceScan();
    };
  }, []);

  // Render each device item
  const renderDeviceItem = ({ item }: { item: Device }) => {
    const isConnected = connectedDevices.some((d) => d.id === item.id);

    return (
      <View
        style={[
          connectionStyles.statCard,
          {
            borderLeftColor: isConnected ? colors.success : colors.primary,
            backgroundColor: "rgba(255,255,255,0.05)",
            marginBottom: 8,
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
            ID: {item.id?.substring(0, 8)}... • Signal: {item.rssi || "N/A"} dBm
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
      </View>
    );
  };

  // Empty list component
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
        No NeoXalle Devices Found
      </Text>
      <Text
        style={[
          connectionStyles.statLabel,
          { textAlign: "center", marginTop: 8 },
        ]}
      >
        Press Scan to search for NeoXalle devices
      </Text>
    </View>
  );

  return (
    <LinearGradient
      colors={colors.gradients.background}
      style={connectionStyles.container}
    >
      <SafeAreaView style={connectionStyles.safeArea}>
        {/* Header - Fixed at top */}
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

          {/* Status Section */}
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
                  {isScanning
                    ? "Scanning for NeoXalle devices..."
                    : connectionStatus}
                </Text>
              </View>
              <Text style={[connectionStyles.statLabel, { fontSize: 12 }]}>
                {devices.length} device{devices.length !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>

          {/* Scan Button */}
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
                  name={isScanning ? "stop" : "scan"}
                  size={28}
                  color="#ffffff"
                />
              </LinearGradient>

              <Text style={connectionStyles.scanButtonText}>
                {isScanning ? "Stop Scan" : "Scan for NeoXalle"}
              </Text>
            </TouchableOpacity>

            {/* Error Message */}
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

        {/* Devices List */}
        <View style={{ flex: 1, paddingHorizontal: 20, marginTop: 20 }}>
          <Text
            style={[
              connectionStyles.sectionTitle,
              { marginBottom: 12, fontSize: 18 },
            ]}
          >
            NeoXalle Devices ({devices.length})
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
              keyExtractor={(item, index) => item?.id || `device-${index}`}
              ListHeaderComponent={() => (
                <Text
                  style={{
                    color: colors.textMuted,
                    fontSize: 12,
                    marginBottom: 12,
                    textAlign: "center",
                  }}
                >
                  Found {devices.length} NeoXalle device(s)
                </Text>
              )}
            />
          )}
        </View>

        {/* Debug Info - At bottom */}
        <View
          style={[
            connectionStyles.section,
            {
              backgroundColor: colors.backgrounds + "40",
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
            Platform: {Platform.OS} • Scanning: {isScanning ? "Yes" : "No"} •
            Devices: {devices.length}
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default ConnectionScreen;
