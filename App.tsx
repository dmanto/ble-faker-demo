import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';

const HEART_RATE_SERVICE        = '0000180d-0000-1000-8000-00805f9b34fb';
const HEART_RATE_CHARACTERISTIC = '00002a37-0000-1000-8000-00805f9b34fb';

const manager = new BleManager();

export default function App() {
  const [scanning, setScanning]               = useState(false);
  const [devices, setDevices]                 = useState<Device[]>([]);
  const [connected, setConnected]             = useState<Device | null>(null);
  const [heartRate, setHeartRate]             = useState<number | null>(null);
  const [lostConnection, setLostConnection]   = useState(false);

  const scan = () => {
    setDevices([]);
    setScanning(true);
    manager.startDeviceScan(null, null, (error, device) => {
      if (error) { console.warn(error); setScanning(false); return; }
      if (device?.name?.includes('CorSense')) {
        setDevices(prev =>
          prev.find(d => d.id === device.id) ? prev : [...prev, device]
        );
      }
    });
    setTimeout(() => { manager.stopDeviceScan(); setScanning(false); }, 5000);
  };

  const connect = async (device: Device) => {
    manager.stopDeviceScan();
    setScanning(false);
    const conn = await manager.connectToDevice(device.id);
    await conn.discoverAllServicesAndCharacteristics();
    setConnected(conn);
    setHeartRate(null);
    conn.monitorCharacteristicForService(
      HEART_RATE_SERVICE,
      HEART_RATE_CHARACTERISTIC,
      (err, char) => {
        if (err) {
          setConnected(null);
          setHeartRate(null);
          setLostConnection(true);
          return;
        }
        if (!char?.value) return;
        const bytes = Uint8Array.from(atob(char.value), c => c.charCodeAt(0));
        const bpm = (bytes[0] & 0x01) === 0 ? bytes[1] : (bytes[1] << 8) + bytes[2];
        setHeartRate(bpm);
      }
    );
  };

  const disconnect = () => {
    if (connected) manager.cancelDeviceConnection(connected.id);
    setConnected(null);
    setHeartRate(null);
    setLostConnection(false);
    setDevices([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {lostConnection ? (
        <View style={styles.center}>
          <Text style={styles.lostIcon}>⚠️</Text>
          <Text style={styles.title}>Connection Lost</Text>
          <Text style={styles.subtitle}>The device disconnected unexpectedly.</Text>
          <TouchableOpacity testID="back-to-scan" style={styles.button} onPress={disconnect}>
            <Text style={styles.buttonText}>Back to scan</Text>
          </TouchableOpacity>
        </View>
      ) : !connected ? (
        <View style={styles.center}>
          <Text style={styles.title}>Heart Rate Monitor</Text>
          <TouchableOpacity testID="scan-button" style={styles.button} onPress={scan} disabled={scanning}>
            {scanning
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Scan for devices</Text>}
          </TouchableOpacity>
          <FlatList
            data={devices}
            keyExtractor={d => d.id}
            style={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.deviceRow} onPress={() => connect(item)}>
                <Text style={styles.deviceName}>{item.name ?? item.id}</Text>
                <Text style={styles.deviceRssi}>{item.rssi} dBm</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      ) : (
        <View style={styles.center}>
          <Text style={styles.title}>{connected.name}</Text>
          <View style={styles.bpmBox}>
            {heartRate !== null
              ? <Text testID="bpm-value" style={styles.bpm}>{heartRate}</Text>
              : <ActivityIndicator size="large" color="#e74c3c" />}
            <Text style={styles.bpmLabel}>BPM</Text>
          </View>
          <TouchableOpacity testID="disconnect-button" style={[styles.button, styles.disconnectButton]} onPress={disconnect}>
            <Text style={styles.buttonText}>Disconnect</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#0f0f1a' },
  center:           { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title:            { fontSize: 24, fontWeight: '600', color: '#fff', marginBottom: 32 },
  button:           { backgroundColor: '#e74c3c', paddingHorizontal: 32, paddingVertical: 14,
                      borderRadius: 32, marginBottom: 24, minWidth: 200, alignItems: 'center' },
  disconnectButton: { backgroundColor: '#555' },
  buttonText:       { color: '#fff', fontSize: 16, fontWeight: '600' },
  list:             { width: '100%', marginTop: 8 },
  deviceRow:        { backgroundColor: '#1e1e2e', borderRadius: 12, padding: 16,
                      marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between' },
  deviceName:       { color: '#fff', fontSize: 16 },
  deviceRssi:       { color: '#888', fontSize: 14 },
  bpmBox:           { alignItems: 'center', marginBottom: 48 },
  bpm:              { fontSize: 120, fontWeight: '700', color: '#e74c3c', lineHeight: 130 },
  bpmLabel:         { fontSize: 20, color: '#888', letterSpacing: 4 },
  lostIcon:         { fontSize: 64, marginBottom: 16 },
  subtitle:         { fontSize: 16, color: '#aaa', textAlign: 'center', marginBottom: 32 },
});
