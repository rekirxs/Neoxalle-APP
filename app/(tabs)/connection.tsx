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

const manager = new BleManager();

const ConnectionScreen = () => {
  const { colors } = useTheme();
  const connectionStyles = createConnectionStyles(colors);

  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [error, setError] = useState<string | null>(null);

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

  const checkBluetoothState = async () => {
    const state = await manager.state();
    if (state !== "PoweredOn") {
      Alert.alert(
        "Bluetooth is Off",
        "Please turn on Bluetooth in your device settings",
      );
      return false;
    }
    return true;
  };

  const startScan = async () => {
    setError(null);
    setIsScanning(true);
    setDevices([]);

    if (Platform.OS === "android") {
      const hasPermissions = await checkAndroidPermissions();
      if (!hasPermissions) {
        setIsScanning(false);
        return;
      }
    }

    const isBluetoothOn = await checkBluetoothState();
    if (!isBluetoothOn) {
      setIsScanning(false);
      return;
    }

    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        setError(error.message);
        setIsScanning(false);
        return;
      }

      // ✅ ONLY DEVICES WITH NAMES
      if (device?.name && device.name.trim().length > 0) {
        setDevices((prev) => {
          if (!prev.find((d) => d.id === device.id)) {
            return [...prev, device];
          }
          return prev;
        });
      }
    });

    setTimeout(stopScan, 10000);
  };

  const stopScan = () => {
    manager.stopDeviceScan();
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      manager.stopDeviceScan();
    };
  }, []);

  const renderDeviceItem = ({ item }: { item: Device }) => {
    return (
      <View style={connectionStyles.deviceCard}>
        <View style={connectionStyles.deviceHeader}>
          <View style={connectionStyles.deviceIconContainer}>
            <LinearGradient
              colors={colors.gradients.primary}
              style={connectionStyles.deviceIcon}
            >
              <Ionicons name="bluetooth-outline" size={28} color="#ffffff" />
            </LinearGradient>
          </View>

          <View style={connectionStyles.deviceInfo}>
            <Text style={connectionStyles.deviceName}>{item.name}</Text>

            <Text style={connectionStyles.deviceStatus}>
              {item.rssi ? `RSSI: ${item.rssi} dBm` : "Signal Unknown"}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyList = () => (
    <View style={connectionStyles.emptyState}>
      <View style={connectionStyles.emptyStateIcon}>
        <Ionicons name="bluetooth-outline" size={64} color={colors.textMuted} />
      </View>
      <Text style={[connectionStyles.sectionTitle, { textAlign: "center" }]}>
        No Devices Found
      </Text>
      <Text
        style={[
          connectionStyles.statLabel,
          { textAlign: "center", marginTop: 8 },
        ]}
      >
        Press Scan to search for nearby devices
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
            <View>
              <Text style={connectionStyles.title}>Bluetooth Scanner</Text>
              <Text style={[connectionStyles.statLabel, { marginTop: 4 }]}>
                Discover nearby devices
              </Text>
            </View>
          </View>

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
                {isScanning ? "Scanning..." : "Ready"}
              </Text>
            </View>
            <Text style={[connectionStyles.statLabel, { fontSize: 14 }]}>
              {devices.length} device{devices.length !== 1 ? "s" : ""} found
            </Text>
          </View>

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
              {isScanning ? "Stop Scanning" : "Scan"}
            </Text>
          </TouchableOpacity>

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

        <View style={{ flex: 1, paddingHorizontal: 20 }}>
          {devices.length === 0 && !isScanning ? (
            renderEmptyList()
          ) : (
            <FlatList
              data={devices}
              renderItem={renderDeviceItem}
              showsVerticalScrollIndicator={false}
              keyExtractor={(item) => item.id}
            />
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default ConnectionScreen;
