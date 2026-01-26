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
      paddingVertical: 32,
      paddingBottom: 24,
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
    scrollView: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 20,
      gap: 20,
      paddingBottom: 120,
    },
    section: {
      borderRadius: 20,
      padding: 24,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 8, // elevation is used to create a shadow on the section, in android
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "700",
      marginBottom: 20,
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
    statsContainer: {
      gap: 16,
    },
    statCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: 20,
      borderRadius: 16,
      borderLeftWidth: 4,
    },
    statIconContainer: {
      marginRight: 16,
    },
    statIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
    },
    statNumber: {
      fontSize: 28,
      fontWeight: "800",
      letterSpacing: -1,
      color: colors.text,
    },
    statLabel: {
      fontSize: 14,
      fontWeight: "600",
      marginTop: 2,
      color: colors.textMuted,
    },
    settingItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    settingLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    settingIcon: {
      width: 36,
      height: 36,
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 16,
    },
    settingText: {
      fontSize: 17,
      fontWeight: "600",
      color: colors.text,
    },
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    actionLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    actionIcon: {
      width: 36,
      height: 36,
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 16,
    },
    actionText: {
      fontSize: 17,
      fontWeight: "600",
      color: colors.text,
    },
    actionTextDanger: {
      fontSize: 17,
      fontWeight: "600",
      color: colors.danger,
    },
    scanButtonIconContainer: {
      width: 48,
      height: 48, // Ahora es cuadrado
      borderRadius: 8, // Puedes hacerlo cuadrado con esquinas redondeadas
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12, // Espacio entre el icono y el texto
    },

    // El botón principal ahora es un contenedor horizontal
    scanButton: {
      height: 60, // Una altura razonable para un botón horizontal
      borderRadius: 12, // Bordes redondeados
      justifyContent: "center",
      alignItems: "center",
      marginTop: 20,
      flexDirection: "row", // <--- CRUCIAL: Organiza los hijos en fila
      paddingHorizontal: 20, // Añade padding horizontal para que no se vea pegado
    },
    scanButtonText: {
      color: "#ffffff",
      fontSize: 21,
      fontWeight: "bold",
    },
  });

  return styles;
};
