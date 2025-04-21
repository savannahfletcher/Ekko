import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Image, TouchableOpacity } from "react-native";
import Modal from "react-native-modal";

  type SelectPopupProps = {
    isVisible: boolean;
    onClose: () => void;
    selectedSong: any; // You can refine this later if you want
    handlePost: (song: any, caption: string) => void;
    playPreview: (songName: string, artistName: string) => void;
    stopPreview: () => void;
  };

  const SelectPopup: React.FC<SelectPopupProps> = ({
      isVisible,
      onClose,
      selectedSong,
      handlePost,
      playPreview,
      stopPreview,
    }) => {

    const [caption, setCaption] = useState("");

    if (!selectedSong) return null;

  return (
    <Modal isVisible={isVisible} onBackdropPress={onClose}>
      <View style={styles.modalContainer}>
        <Image source={{ uri: selectedSong.album.images[0].url }} style={styles.albumImage} />
        <Text style={styles.songTitle}>{selectedSong.name}</Text>
        <Text style={styles.artistName}>by {selectedSong.artists[0].name}</Text>

        <TextInput
          style={styles.input}
          placeholder="Add a caption..."
          placeholderTextColor="#aaa"
          value={caption}
          onChangeText={setCaption}
        />

        {selectedSong && (
          <View style={styles.previewControls}>
            <TouchableOpacity onPress={() => playPreview(selectedSong.name, selectedSong.artists[0].name)}>
              <Text style={styles.previewText}>▶ Preview</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={stopPreview}>
              <Text style={styles.previewText}>⏹ Stop</Text>
            </TouchableOpacity>
          </View>
        )}


        <TouchableOpacity style={styles.postButton} onPress={() => {
            handlePost(selectedSong, caption)
            onClose();
          }}>
          <Text style={styles.postButtonText}>Post</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
  
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: "#222",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  albumImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginBottom: 10,
  },
  songTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  artistName: {
    fontSize: 14,
    color: "#aaa",
    marginBottom: 10,
  },
  input: {
    width: "100%",
    backgroundColor: "#333",
    color: "#fff",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  postButton: {
    backgroundColor: "#CD60FF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  postButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  previewControls: {
    flexDirection: "row",
    gap: 15,
    justifyContent: "center",
    marginBottom: 10,
  },
  previewText: {
    color: "#A338F4",
    fontWeight: "bold",
    fontSize: 16,
  },
  
});

export default SelectPopup;