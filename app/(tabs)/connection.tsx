import { createConnectionStyles } from "@/assets/styles/connection.style";
import useTheme from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  Text,
  TouchableOpacity,
  View,
  PermissionsAndroid,
  Platform,
  Alert,
  scrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BleManager, Device } from "react-native-ble-plx";
import { useState, useEffect } from "react";

const manager = new BleManager();

const ConnectionScreen = () => {
  const { colors } = useTheme();
  const connectionStyles = createConnectionStyles(colors);

  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [error, setError] = useState<string | null>(null);

  
  const checkAndroidPermissions = async () => {
    if (Platform.OS !== 'android') return true;
    
    const androidVersion = Platform.Version as number;
    console.log("Android API level:", androidVersion);
    
    try {
      // Android 12+ (API 31+)
      if (androidVersion >= 31) {
        console.log("Requesting Android 12+ permissions...");
        
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        
        const scanGranted = granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED;
        const connectGranted = granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED;
        const locationGranted = granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED;
        
        console.log("Permissions:", { scanGranted, connectGranted, locationGranted });
        
        return scanGranted && connectGranted && locationGranted;
      } 
      // Android 6-11
      else {
        console.log("Requesting location permission for Android 6-11...");
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        
        console.log("Location permission:", granted);
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch (error) {
      console.log("Permission error:", error);
      return false;
    }
  };

  // Check Bluetooth state
  const checkBluetoothState = async () => {
    try {
      const state = await manager.state();
      console.log("Bluetooth state:", state);
      
      if (state !== 'PoweredOn') {
        Alert.alert(
          'Bluetooth is Off',
          'Please turn on Bluetooth in your device settings',
          [{ text: 'OK' }]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.log("Bluetooth check error:", error);
      return false;
    }
  };

  // Main scan function
  const startScan = async () => {
    console.log("=== STARTING SCAN ===");
    setError(null);
    setIsScanning(true);
    setDevices([]);
    
    try {
      // 1. Check Android permissions
      if (Platform.OS === 'android') {
        const hasPermissions = await checkAndroidPermissions();
        if (!hasPermissions) {
          Alert.alert(
            'Permissions Required',
            'Please grant all Bluetooth permissions to continue',
            [{ text: 'OK' }]
          );
          setIsScanning(false);
          return;
        }
      }
      
      // 2. Check Bluetooth state
      const isBluetoothOn = await checkBluetoothState();
      if (!isBluetoothOn) {
        setIsScanning(false);
        return;
      }
      
      // 3. Start scanning
      console.log("Starting BLE scan...");
      
      manager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.log("Scan error:", error.message);
          setError(error.message);
          setIsScanning(false);
          return;
        }
        
        if (device) {
          console.log("Found device:", device.name || "Unnamed", "RSSI:", device.rssi);
          
          setDevices(prevDevices => {
            // Check if device already exists
            const exists = prevDevices.find(d => d.id === device.id);
            if (!exists) {
              return [...prevDevices, device];
            }
            return prevDevices;
          });
        }
      });
      
      // Auto-stop after 10 seconds
      setTimeout(() => {
        stopScan();
      }, 10000);
      
    } catch (error) {
      console.log("Start scan error:", error);
      setError(error.message || "Unknown error");
      setIsScanning(false);
    }
  };

  // Stop scanning
  const stopScan = () => {
    console.log("Stopping scan...");
    manager.stopDeviceScan();
    setIsScanning(false);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      manager.stopDeviceScan();
    };
  }, []);

  return (
  <LinearGradient
    colors={colors.gradients.background}
    style={connectionStyles.container}
  >
    <SafeAreaView style={connectionStyles.safeArea}>
      <View style={connectionStyles.header}>
        {/* Header content stays the same... */}
        <View style={connectionStyles.titleContainer}>
          <LinearGradient
            colors={colors.gradients.primary}
            style={connectionStyles.iconContainer}
          >
            <Ionicons name="bluetooth" size={28} color="#ffffff" />
          </LinearGradient>
          <Text style={connectionStyles.title}>Connection</Text>
        </View>

        <View style={{ marginTop: 20 }}>
          <TouchableOpacity
            onPress={isScanning ? stopScan : startScan}
            style={[
              connectionStyles.scanButton,
              { 
                backgroundColor: isScanning ? "#ff4444" : "#433c46"
              },
            ]}
          >
            <LinearGradient
              colors={isScanning ? ["#ff4444", "#cc0000"] : colors.gradients.button}
              style={connectionStyles.scanButtonIconContainer}
            >
              <Ionicons 
                name={isScanning ? "stop" : "scan"} 
                size={28} 
                color="#ffffff" 
              />
            </LinearGradient>

            <Text style={connectionStyles.scanButtonText}>
              {isScanning ? "Stop Scan" : "Scan"}
            </Text>
          </TouchableOpacity>
          
          {isScanning && (
            <View style={{ alignItems: 'center', marginTop: 10 }}>
              <Text style={{ color: colors.text, fontSize: 14 }}>
                🔍 Scanning for devices...
              </Text>
            </View>
          )}
          
          {error && (
            <View style={{ 
              backgroundColor: 'rgba(255, 0, 0, 0.1)', 
              padding: 10, 
              borderRadius: 5,
              marginTop: 10 
            }}>
              <Text style={{ color: 'red', fontSize: 12, textAlign: 'center' }}>
                Error: {error}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* DEVICES LIST WITH SCROLLVIEW */}
      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        <Text style={{ 
          color: colors.text, 
          fontSize: 18, 
          fontWeight: 'bold',
          marginBottom: 10 
        }}>
          Found Devices ({devices.length})
        </Text>
        
        <ScrollView 
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {devices.map((device, index) => (
            <View 
              key={device.id || index}
              style={{ 
                backgroundColor: 'rgba(255,255,255,0.1)',
                padding: 15,
                borderRadius: 8,
                marginBottom: 8
              }}
            >
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '500' }}>
                {device.name || "Unknown Device"}
              </Text>
              <Text style={{ color: colors.text, fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                ID: {device.id?.substring(0, 10)}...
              </Text>
              {device.rssi && (
                <Text style={{ color: colors.text, fontSize: 12, opacity: 0.7 }}>
                  Signal: {device.rssi} dBm
                </Text>
              )}
            </View>
          ))}
          
          {/* Empty state */}
          {!isScanning && devices.length === 0 && (
            <View style={{ alignItems: 'center', marginTop: 40, opacity: 0.5 }}>
              <Ionicons name="bluetooth-outline" size={48} color={colors.text} />
              <Text style={{ color: colors.text, marginTop: 10, fontSize: 16 }}>
                No devices found
              </Text>
              <Text style={{ 
                color: colors.text, 
                marginTop: 5, 
                fontSize: 14,
                textAlign: 'center' 
              }}>
                Press "Scan" to search for nearby Bluetooth devices
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
      
      {/* Debug info */}
      <View style={{ 
        padding: 15, 
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        marginHorizontal: 20,
        marginBottom: 10
      }}>
        <Text style={{ 
          color: colors.text, 
          fontSize: 12,
          opacity: 0.7,
          textAlign: 'center'
        }}>
          Platform: {Platform.OS} • Scanning: {isScanning ? 'Yes' : 'No'}
        </Text>
      </View>
    </SafeAreaView>
  </LinearGradient>
);