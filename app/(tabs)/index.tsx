import { createHomeStyles } from "@/assets/styles/home.style";
import EmptyState from "@/components/EmptyState";
import GameInput from "@/components/GameInput";
import LoadingSpinner from "@/components/LoadingSpinner";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import useTheme from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  FlatList,
  Image,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Game = Doc<"games">;

function GlowingLogo() {
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

    return () => {
      animation.stop();
    };
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
          elevation: 50,
        }}
      >
        <Image
          source={require("@/assets/images/NeoXalle.png")}
          style={{
            width: 180 * 1.3,
            height: 67.5 * 1.3,
            resizeMode: "contain",
            top: -30,
          }}
        />
      </Animated.View>
    </View>
  );
}

export default function Index() {
  const { colors } = useTheme();
  const router = useRouter();

  const [editingId, setEditingId] = useState<Id<"games"> | null>(null);
  const [editText, setEditText] = useState("");

  const homeStyles = createHomeStyles(colors);

  const games = useQuery(api.games.getGames);
  const toggleGame = useMutation(api.games.toggleGame);
  const deleteGame = useMutation(api.games.deleteGames);
  const updateGame = useMutation(api.games.updateGame);

  const isLoading = games === undefined;

  if (isLoading) return <LoadingSpinner />;

  const handleToggleGame = async (id: Id<"games">) => {
    try {
      await toggleGame({ id });
    } catch (error) {
      console.log("Error toggling game", error);
      Alert.alert("Error", "Failed to toggle game");
    }
  };

  const handleDeleteGame = async (id: Id<"games">) => {
    Alert.alert("Delete Game", "Are you sure you want to delete this game?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteGame({ id }),
      },
    ]);
  };

  const handleEditGame = (game: Game) => {
    setEditText(game.text);
    setEditingId(game._id);
  };

  const handleSaveEdit = async () => {
    if (editingId) {
      try {
        await updateGame({ id: editingId, text: editText.trim() });
        setEditingId(null);
        setEditText("");
      } catch (error) {
        console.log("Error updating game", error);
        Alert.alert("Error", "Failed to update game");
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const connectButton = () => {
    router.push("/connect");
  };

  const renderGameItem = ({ item }: { item: Game }) => {
    const isEditing = editingId === item._id;
    return (
      <View style={homeStyles.gameItemWrapper}>
        <LinearGradient
          colors={colors.gradients.surface}
          style={homeStyles.gameItem}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {isEditing ? (
            <View style={homeStyles.editContainer}>
              <TextInput
                style={homeStyles.editInput}
                value={editText}
                onChangeText={setEditText}
                autoFocus
                multiline
                placeholder="Edit your game..."
                placeholderTextColor={colors.textMuted}
              />
              <View style={homeStyles.editButtons}>
                <TouchableOpacity onPress={handleSaveEdit} activeOpacity={0.8}>
                  <LinearGradient
                    colors={colors.gradients.success}
                    style={homeStyles.editButton}
                  >
                    <Ionicons name="checkmark" size={16} color="#fff" />
                    <Text style={homeStyles.editButtonText}>Save</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleCancelEdit}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={colors.gradients.muted}
                    style={homeStyles.editButton}
                  >
                    <Ionicons name="close" size={16} color="#fff" />
                    <Text style={homeStyles.editButtonText}>Cancel</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={homeStyles.gameTextContainer}>
              <Text
                style={[
                  homeStyles.gameText,
                  item.SinglePlayer && {
                    textDecorationLine: "line-through",
                    color: colors.textMuted,
                    opacity: 0.6,
                  },
                ]}
              >
                {item.text}
              </Text>

              <View style={homeStyles.gameActions}>
                <TouchableOpacity
                  onPress={() => handleEditGame(item)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={colors.gradients.warning}
                    style={homeStyles.actionButton}
                  >
                    <Ionicons name="pencil" size={14} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteGame(item._id)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={colors.gradients.danger}
                    style={homeStyles.actionButton}
                  >
                    <Ionicons name="trash" size={14} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </LinearGradient>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={colors.gradients.background}
      style={homeStyles.container}
    >
      <StatusBar barStyle={colors.statusBarStyle} />
      <SafeAreaView style={homeStyles.safeArea}>
        {/*<TouchableOpacity
          style={{
            position: "absolute",
            top: 40,
            right: 20,
            backgroundColor: colors.primary,
            padding: 8,
            marginTop: 20,
            borderRadius: 30,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
          }}
          onPress={() => connectButton()}
        >
          <Ionicons name="bluetooth" size={20} color="#fff" />
        </TouchableOpacity>
*/}
        <View
          style={{
            alignItems: "center",
            marginTop: 40,
            marginBottom: 30,
          }}
        >
          <GlowingLogo />
        </View>

        <GameInput />

        <FlatList
          data={games}
          renderItem={renderGameItem}
          keyExtractor={(item) => item._id}
          style={homeStyles.gameList}
          contentContainerStyle={homeStyles.gameListContent}
          ListEmptyComponent={<EmptyState />}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}
