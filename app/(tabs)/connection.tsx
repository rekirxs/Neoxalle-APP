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
    } catch (err) {
      console.log("Permission error:", err);
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
    } catch (err) {
      console.log("Bluetooth check error:", err);
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
    } catch (err) {
      console.log("Start scan error:", err);
      setError((err as Error).message || "Unknown error");
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
    } catch (err) {
      console.log(`❌ Failed to connect to ${device.name}:`, err);
      setConnectionStatus(`❌ Failed to connect to ${device.name}`);
    }
  };

  const disconnectDevice = async (device: Device) => {
    try {
      await device.cancelConnection();
      setConnectedDevices((prev) => prev.filter((d) => d.id !== device.id));
      setConnectionStatus(`Disconnected from ${device.name}`);
      console.log(`🔌 Disconnected from ${device.name}`);
    } catch (err) {
      console.log("Disconnect error:", err);
    }
  };

  const sendCommand = async (device: Device, command: string) => {
    try {
      console.log(`📤 Sending to ${device.name}: "${command}"`);

      await device.writeCharacteristicWithResponseForService(
        "4fafc201-1fb5-459e-8fcc-c5c9c331914b",
        "beb5483e-36e1-4688-b7f5-ea07361b26a8",
        command,
      );

      console.log(`✅ Command sent to ${device.name}`);
      setConnectionStatus(`Sent "${command}" to ${device.name}`);
    } catch (err) {
      console.log(`❌ Failed to send command:`, err);
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
          connectionStyles.deviceCard,
          isConnected
            ? connectionStyles.deviceCardConnected
            : connectionStyles.deviceCardDisconnected,
        ]}
      >
        {/* Encabezado del dispositivo */}
        <View style={connectionStyles.deviceHeader}>
          <View style={connectionStyles.deviceIconContainer}>
            <LinearGradient
              colors={
                isConnected
                  ? [colors.success, colors.success + "CC"]
                  : colors.gradients.primary
              }
              style={connectionStyles.deviceIcon}
            >
              <Ionicons name="bluetooth-outline" size={28} color="#ffffff" />
            </LinearGradient>
          </View>

          <View style={connectionStyles.deviceInfo}>
            <Text style={connectionStyles.deviceName}>
              {item.name || "Unknown Device"}
            </Text>

            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: isConnected
                    ? colors.success
                    : colors.warning,
                  marginRight: 8,
                }}
              />
              <Text
                style={[
                  connectionStyles.deviceStatus,
                  isConnected &&
                    (connectionStyles.deviceStatusConnected as any),
                ]}
              >
                {isConnected ? "Connected" : "Disconnected"}
                {item.rssi ? ` • ${item.rssi} dBm` : ""}
              </Text>
            </View>
          </View>
        </View>

        {/* Botón principal Connect/Disconnect */}
        <TouchableOpacity
          onPress={() =>
            isConnected ? disconnectDevice(item) : connectToDevice(item)
          }
          style={[
            connectionStyles.mainButton,
            isConnected
              ? connectionStyles.mainButtonConnected
              : connectionStyles.mainButtonDisconnected,
          ]}
        >
          <Text
            style={[
              connectionStyles.mainButtonText,
              { color: isConnected ? colors.danger : colors.primary },
            ]}
          >
            {isConnected ? "DISCONNECT" : "CONNECT"}
          </Text>
        </TouchableOpacity>

        {/* Controles solo si está conectado */}
        {isConnected && (
          <View style={connectionStyles.controlsContainer}>
            <Text style={connectionStyles.controlsTitle}>LED Controls</Text>
            aa
            <View style={connectionStyles.controlsGrid}>
              {/* Fila 1 */}
              <TouchableOpacity
                onPress={() => sendCommand(item, "RANDOM")}
                style={[
                  connectionStyles.controlButton,
                  { backgroundColor: colors.primary + "20" },
                ]}
              >
                <Text
                  style={[
                    connectionStyles.controlButtonText,
                    { color: colors.primary },
                  ]}
                >
                  🎲 Random
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => sendCommand(item, "RED")}
                style={[
                  connectionStyles.controlButton,
                  { backgroundColor: "#FF000020" },
                ]}
              >
                <Text
                  style={[
                    connectionStyles.controlButtonText,
                    { color: "#FF0000" },
                  ]}
                >
                  🔴 Red
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => sendCommand(item, "GREEN")}
                style={[
                  connectionStyles.controlButton,
                  { backgroundColor: "#00FF0020" },
                ]}
              >
                <Text
                  style={[
                    connectionStyles.controlButtonText,
                    { color: "#00FF00" },
                  ]}
                >
                  🟢 Green
                </Text>
              </TouchableOpacity>

              {/* Fila 2 */}
              <TouchableOpacity
                onPress={() => sendCommand(item, "BLUE")}
                style={[
                  connectionStyles.controlButton,
                  { backgroundColor: "#0000FF20" },
                ]}
              >
                <Text
                  style={[
                    connectionStyles.controlButtonText,
                    { color: "#0000FF" },
                  ]}
                >
                  🔵 Blue
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => sendCommand(item, "OFF")}
                style={[
                  connectionStyles.controlButton,
                  { backgroundColor: colors.danger + "20" },
                ]}
              >
                <Text
                  style={[
                    connectionStyles.controlButtonText,
                    { color: colors.danger },
                  ]}
                >
                  ⚫ Off
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => sendCommand(item, "PING")}
                style={[
                  connectionStyles.controlButton,
                  { backgroundColor: colors.warning + "20" },
                ]}
              >
                <Text
                  style={[
                    connectionStyles.controlButtonText,
                    { color: colors.warning },
                  ]}
                >
                  🏓 Ping
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderEmptyList = () => (
    <View style={connectionStyles.emptyState}>
      <View style={connectionStyles.emptyStateIcon}>
        <Ionicons name="bluetooth-outline" size={64} color={colors.textMuted} />
      </View>
      <Text style={[connectionStyles.sectionTitle, { textAlign: "center" }]}>
        No NeoXalle Pods Found
      </Text>
      <Text
        style={[
          connectionStyles.statLabel,
          { textAlign: "center", marginTop: 8 },
        ]}
      >
        Press Scan for Pods to search for available devices
      </Text>
    </View>
  );

  return (
    <LinearGradient
      colors={colors.gradients.background}
      style={connectionStyles.container}
    >
      <SafeAreaView style={connectionStyles.safeArea}>
        {/* Header */}
        <View style={connectionStyles.header}>
          <View style={connectionStyles.titleContainer}>
            <LinearGradient
              colors={colors.gradients.primary}
              style={connectionStyles.iconContainer}
            >
              <Ionicons name="bluetooth" size={28} color="#ffffff" />
            </LinearGradient>
            <View>
              <Text style={connectionStyles.title}>NeoXalle Pods</Text>
              <Text style={[connectionStyles.statLabel, { marginTop: 4 }]}>
                Wireless LED Controller System
              </Text>
            </View>
          </View>

          {/* Status Bar */}
          <View style={connectionStyles.statusContainer}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: isScanning ? colors.warning : colors.success,
                  marginRight: 10,
                }}
              />
              <Text style={connectionStyles.statusText}>
                {isScanning ? "Scanning..." : connectionStatus}
              </Text>
            </View>
            <Text style={[connectionStyles.statLabel, { fontSize: 14 }]}>
              {devices.length} pod{devices.length !== 1 ? "s" : ""} found
            </Text>
          </View>

          {/* Scan Button */}
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

          {/* Error Display */}
          {error && (
            <View style={connectionStyles.errorContainer}>
              <Text
                style={[
                  connectionStyles.sectionTitleDanger,
                  { marginBottom: 8, fontSize: 16 },
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

        {/* Lista de Dispositivos */}
        <View style={{ flex: 1, paddingHorizontal: 20 }}>
          <Text style={[connectionStyles.sectionTitle, { marginBottom: 16 }]}>
            {devices.length > 0 ? `Found Pods (${devices.length})` : ""}
          </Text>

          {devices.length === 0 && !isScanning ? (
            renderEmptyList()
          ) : (
            <FlatList
              data={devices}
              renderItem={renderDeviceItem}
              showsVerticalScrollIndicator={false}
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingTop: 8,
                paddingBottom: 30,
              }}
              keyExtractor={(item, index) => item?.id || `pod-${index}`}
            />
          )}
        </View>

        {/* Footer */}
        <View style={connectionStyles.commandsFooter}>
          <Text
            style={[
              connectionStyles.statLabel,
              { textAlign: "center", fontSize: 12 },
            ]}
          >
            Available Commands: RANDOM • RED • GREEN • BLUE • OFF • PING
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default ConnectionScreen;
