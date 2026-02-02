import { StyleSheet } from "react-native";
import { ColorScheme } from "../../hooks/useTheme";

export const createConnectionStyles = (colors: ColorScheme) => {
  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
    },
    header: {
      paddingHorizontal: 24,
      paddingTop: 32,
      paddingBottom: 16,
    },
    titleContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    iconContainer: {
      width: 56,
      height: 56,
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 16,
    },
    title: {
      fontSize: 32,
      fontWeight: "700",
      letterSpacing: -1,
      color: colors.text,
    },
    statusContainer: {
      marginTop: 24,
      padding: 16,
      borderRadius: 12,
      backgroundColor: colors.backgrounds + "30",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    statusText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textMuted,
    },
    section: {
      borderRadius: 20,
      padding: 24,
      shadowColor: "#351f2c",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 8,
    },
    sectionTitle: {
      fontSize: 22,
      fontWeight: "700",
      marginBottom: 16,
      letterSpacing: -0.5,
      color: colors.text,
    },
    sectionTitleDanger: {
      fontSize: 20,
      fontWeight: "700",
      marginBottom: 20,
      letterSpacing: -0.5,
      color: colors.danger,
    },

    // ========== ESTILOS PARA TARJETA DE DISPOSITIVO ==========
    deviceCard: {
      backgroundColor: colors.backgrounds + "40",
      borderRadius: 20,
      padding: 20, // Reducido de 24
      marginBottom: 20,
      borderWidth: 2,
    },
    deviceCardConnected: {
      borderColor: colors.success + "40",
      backgroundColor: colors.success + "10",
    },
    deviceCardDisconnected: {
      borderColor: colors.primary + "40",
    },

    deviceHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16, // Reducido de 24
    },
    deviceIconContainer: {
      marginRight: 12,
    },
    deviceIcon: {
      width: 50, // Reducido de 60
      height: 50, // Reducido de 60
      borderRadius: 25,
      justifyContent: "center",
      alignItems: "center",
    },
    deviceInfo: {
      flex: 1,
    },
    deviceName: {
      fontSize: 18, // Aumentado de 12
      fontWeight: "700",
      color: colors.text,
      marginBottom: 4,
    },
    deviceStatus: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textMuted,
    },
    deviceStatusConnected: {
      color: colors.success,
    },

    // ========== BOTÓN PRINCIPAL CONNECT/DISCONNECT ==========
    mainButton: {
      paddingVertical: 12, // Aumentado de 10
      borderRadius: 10, // Reducido de 12
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16, // Aumentado de 14
    },
    mainButtonConnected: {
      backgroundColor: colors.danger + "20",
      borderWidth: 2,
      borderColor: colors.danger + "40",
    },
    mainButtonDisconnected: {
      backgroundColor: colors.primary + "20",
      borderWidth: 2,
      borderColor: colors.primary + "40",
    },
    mainButtonText: {
      fontSize: 16, // Reducido de 18
      fontWeight: "700",
    },

    // ========== CONTENEDOR DE BOTONES DE CONTROL ==========
    controlsContainer: {
      marginTop: 8,
    },
    controlsTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.textMuted,
      marginBottom: 12, // Aumentado de 8
      textAlign: "center",
    },
    controlsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    // BOTÓN CON FLEXBOX CORREGIDO - NO USAR FLEX NI MINWIDTH JUNTOS
    controlButton: {
      width: "32%", // En lugar de flex y minWidth
      aspectRatio: 1.2, // Para mantener proporción
      marginBottom: 8,
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    controlButtonText: {
      fontSize: 13, // Reducido de 14
      fontWeight: "600",
      textAlign: "center",
    },

    // ========== BOTÓN DE SCAN ==========
    scanButton: {
      height: 60, // Reducido de 64
      borderRadius: 12, // Reducido de 16
      justifyContent: "center",
      alignItems: "center",
      marginTop: 20,
      flexDirection: "row",
      paddingHorizontal: 20, // Reducido de 24
    },
    scanButtonIconContainer: {
      width: 44, // Reducido de 48
      height: 44, // Reducido de 48
      borderRadius: 10, // Reducido de 12
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12, // Reducido de 16
    },
    scanButtonText: {
      color: "#ffffff",
      fontSize: 18, // Reducido de 20
      fontWeight: "bold",
    },

    // ========== ESTILOS GENERALES ==========
    statLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textMuted,
    },
    errorContainer: {
      backgroundColor: colors.danger + "20",
      borderLeftWidth: 4,
      borderLeftColor: colors.danger,
      padding: 12, // Reducido de 16
      borderRadius: 10, // Reducido de 12
      marginTop: 12, // Reducido de 16
    },
    commandsFooter: {
      backgroundColor: colors.backgrounds + "20",
      alignItems: "center",
      marginHorizontal: 20,
      marginBottom: 20,
      padding: 12, // Reducido de 16
      borderRadius: 12, // Reducido de 16
    },
    emptyState: {
      alignItems: "center",
      padding: 40,
      justifyContent: "center",
      flex: 1,
    },
    emptyStateIcon: {
      marginBottom: 20, // Reducido de 24
    },
  });

  return styles;
};
