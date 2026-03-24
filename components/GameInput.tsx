import { createHomeStyles } from "@/assets/styles/home.style";
import useTheme from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Alert, TextInput, TouchableOpacity, View } from "react-native";

type Props = {
  onAdd?: (text: string) => void;
};

const GameInput = ({ onAdd }: Props) => {
  const { colors } = useTheme();
  const homeStyles = createHomeStyles(colors);

  const [newGame, setNewGame] = useState("");
  const handleAddGame = async () => {
    if (newGame.trim()) {
      try {
        if (onAdd) onAdd(newGame.trim());
        setNewGame("");
      } catch (error) {
        console.log("Error adding a Game", error);
        Alert.alert("Error", "Failed to add Game.");
      }
    }
  };

  return (
    <View style={homeStyles.inputSection}>
      <View style={homeStyles.inputWrapper}>
        <TextInput
          style={homeStyles.input}
          placeholder="Whats needs to be done"
          value={newGame}
          onChangeText={setNewGame}
          onSubmitEditing={handleAddGame}
          placeholderTextColor={colors.textMuted}
        />
        <TouchableOpacity
          onPress={handleAddGame}
          activeOpacity={0.8}
          disabled={!newGame.trim()}
        >
          <LinearGradient
            colors={
              newGame.trim() ? colors.gradients.primary : colors.gradients.muted
            }
            style={[
              homeStyles.addButton,
              !newGame.trim() && homeStyles.addButtonDisabled,
            ]}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default GameInput;
