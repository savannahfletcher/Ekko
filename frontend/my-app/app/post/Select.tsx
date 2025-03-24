import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Image, TouchableOpacity } from "react-native";
import Modal from "react-native-modal";
import {useRouter} from 'expo-router';

const SelectPopup = ({ isVisible, onClose, selectedSong, handlePost }) => {
  const [caption, setCaption] = useState("");

  const router = useRouter();

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

        <TouchableOpacity style={styles.postButton} onPress={() => {
            handlePost(selectedSong, caption)
            router.push('./feed')
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
});

export default SelectPopup;