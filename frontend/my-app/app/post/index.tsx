import { View, Text, StyleSheet, Pressable, TextInput, Image, FlatList } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import { useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store"; // Optional for storing tokens
import SelectPopup from "./Select";
import { auth,storage, db,app  } from '../../firebaseConfig';
import { collection, addDoc, doc, getDoc,serverTimestamp,setDoc } from "firebase/firestore";
import { Alert } from "react-native";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import axios from "axios";
import {useRouter} from 'expo-router';
import { Audio } from 'expo-av';
import React from "react";

const tokens = require("../../tokens.json");
const SPOTIFY_CLIENT_ID = tokens.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = tokens.SPOTIFY_CLIENT_SECRET;

const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";

const PostScreen = () => {
    
  const [accessToken, setAccessToken] = useState("");
  const [input, setInput] = useState(""); // user input
  const [songs, setSongs] = useState<any[]>([]); // set of queried songs
  const playlistsJson = [
    { id: "1", title: "Trending Songs", playlistId: "774kUuKDzLa8ieaSmi8IfS" },
    { id: "2", title: "Pop Hits 2000-2025", playlistId: "6mtYuOxzl58vSGnEDtZ9uB" },
  ];
  const [playlists, setPlaylists] = useState<any[]>([]); // set of queried songs
  const [hasTyped, setHasTyped] = useState(false); // track if user has started typing

  const [selectedSong, setSelectedSong] = useState(null); // the song to be sent to backend
  const [isModalVisible, setModalVisible] = useState(false);
  const [currentSound, setCurrentSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);


  const router = useRouter();

  // fetch a new access token (valid for 1 hour)
  async function fetchAccessToken() {
    try {
      const authParams = new URLSearchParams();
      authParams.append("grant_type", "client_credentials");
      authParams.append("client_id", SPOTIFY_CLIENT_ID);
      authParams.append("client_secret", SPOTIFY_CLIENT_SECRET);

      const response = await fetch(TOKEN_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: authParams.toString(),
      });

      const data = await response.json();
      setAccessToken(data.access_token);

      // Store the token securely (optional)
      await SecureStore.setItemAsync("spotify_token", data.access_token);
    } catch (error) {
     // console.error("Error fetching access token:", error);
    }
  }

    // fetch Spotify songs based on user input
  async function getSongs() {
    if (!accessToken) {
      console.warn("No access token available. Fetching a new one...");
      await fetchAccessToken();
    }

    // if input isn't long enough, don't query anything yet
    if (input?.length < 2) {
        return;
    }

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(
          input
        )}&type=track&limit=20`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();
      setSongs(data.tracks.items);
    //   console.log(songs);
    } catch (error) {
      console.error("Error fetching songs:", error);
    }
  }

  async function fetchPlaylistTracks(playlistId: string) {
    if (!accessToken) {
      console.warn("No access token available. Fetching a new one...");
      await fetchAccessToken();
    }
  
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=10`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
  
      const data = await response.json();
      return data?.items || [];
    } catch (error) {
      console.error("Error fetching playlist tracks:", error);
      return [];
    }
  
  }

  useEffect(() => {
    const fetchData = async () => {
        await fetchAccessToken();
    }
    fetchData();
  }, []);

  // Fetch songs for all playlists when access token updates
  useEffect(() => {
    const fetchPlaylists = async () => {
      const fetchedPlaylists = await Promise.all(
        playlistsJson.map(async (p) => ({
          ...p,
          tracks: await fetchPlaylistTracks(p.playlistId),
        }))
      );
      setPlaylists(fetchedPlaylists);
    };
    
    if (accessToken) fetchPlaylists();
  }, [accessToken]);

  // useEffect(() => {
  //   console.log(playlists)
  // }, [playlists]);

  // call getSongs whenever the input changes
  useEffect(() => {
    if (input.length > 1) {
      getSongs();
    } else {
      setSongs([]); // Clear results when input is too short
    }
  }, [input]);

  const handleSongPress = (song: any) => {
    setSelectedSong(song);
    setModalVisible(true);
  };

  
  const handlePost = async (song: any, caption: string) => {
    console.log("POSTING:", { song, caption });
    try {
      // Get the currently logged-in user from Firebase Authentication
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "User not authenticated. Please log in.");
        return;
      }
      // const token = await user.getIdToken(); // Ensure this returns a valid token
      console.log("User id:", user.uid);
  
      // Add the song to Firestore under "personalSongs"
      // FOR FRONTEND PEEPS: userSong is the object that holds the song chosen! so userSong.songId is the api id. 
      const userSong = await addDoc(collection(db, "users", user.uid, "personalSongs"), {
        songId: song.id,
        title: song.name,
        artist: song.artists.map((a: any) => a.name).join(", "), // ✅ add artist field
        albumCover: song.album.images[0]?.url || "",
        caption: caption,
        timestamp: new Date(),
      });
  
      console.log("Song POSTED with ID:", userSong.id);

      console.log("POSTING SONG TO FEED DATABASE NOW"); 

    // 🔹 Retrieve username from Firestore
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);
    const username = userDocSnap.exists() ? userDocSnap.data().username : "Unknown User";

     // 🔹  Post song to "feed" collection
     await setDoc(doc(db, "feed", userSong.id), {
      userId: user.uid,
      songId: song.id,
      title: song.name,
      artist: song.artists.map((a: any) => a.name).join(", "),
      albumCover: song.album.images[0]?.url || "", // ✅ Add this
      caption: caption,
      username: username,
      timestamp: serverTimestamp(),
    });

    console.log("✅ Song posted to FEED with ID:", userSong.id);
    
    router.push('./feed')


    } catch (error) {
      console.error("Error posting song:", error);
    }

  };

  // Preview Song Funcitons

  const playPreview = async (songName: string, artistName: string) => {
    const songQuery = `${songName} ${artistName}`;
    try {
      const response = await fetch(`https://spotify-preview-api.onrender.com/preview?song=${encodeURIComponent(songQuery)}`);
      const data = await response.json();
      const previewUrl = data.previewUrl;
  
      if (!previewUrl) {
        console.warn("No preview URL available.");
        return;
      }
  
      if (currentSound) {
        await currentSound.stopAsync();
        await currentSound.unloadAsync();
        setCurrentSound(null);
      }
  
      const { sound } = await Audio.Sound.createAsync(
        { uri: previewUrl },
        { shouldPlay: true }
      );
  
      setCurrentSound(sound);
      setIsPlaying(true);
    } catch (error) {
      console.error("Error playing preview:", error);
    }
  };
  
  const stopPreview = async () => {
    if (currentSound) {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
      setCurrentSound(null);
      setIsPlaying(false);
    }
  };
  


  return (
    <>
    <FlatList style={styles.container}
    ListHeaderComponent={
        <>
            <Text style={styles.title}>Search Songs</Text>

            <Pressable style={styles.searchBar}>
                <Icon style={styles.searchIcon} name="search" size={30} color="#000" />
                <TextInput
                value={input}
                onChangeText={(text) => {
                    setInput(text)
                    setHasTyped(true)
                }}
                placeholder="Search songs on Spotify"
                placeholderTextColor={"#888888"}
                onSubmitEditing={getSongs}
                style={styles.inputText}
                onBlur={() => input?.length == 0 && setHasTyped(false)}

                />
            </Pressable>

            {/* the tagline shows by default */}
            {!hasTyped && (
                <View>
                <Text style={styles.tagline}>Post a song of the day for your friends to see!</Text>
                <Text style={styles.tagline_sub}>
                    It could be what you’re listening to right now or a song that captures your vibe for the day!
                </Text>
                </View>
            )}
            {/* <View style = {{ marginTop: 130, }}/> */}
        </>
    }
    data={playlists}
    keyExtractor={(playlists) => playlists.id}
    renderItem={({ item }) => (
        // recommended playlists
        !hasTyped ? (
        <View>
            <Text style={styles.trendingTitle}>{item.title ?? ""}</Text>
            <FlatList
                data={item.tracks}
                keyExtractor={(track) => track.track.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item: track }) => (
                <View style={styles.trendingSongContainer}>
                    {track.track.album.images.length > 0 && (
                    <Pressable onPress={() => handleSongPress(track.track)}>
                      <View>
                          <Image
                          source={{ uri: track.track.album.images[0].url }}
                          style={{ width: 140, height: 140 }}
                          resizeMode="cover"
                          />
                          <Text style={styles.trendingSongTitle}>{track.track.name ?? "Unknown Title"}</Text>
                      </View>
                    </Pressable>
                    )}
                </View>
                )}
            />
        </View>
        ) : null
        )}
    ListFooterComponent={
      // Search functionality
      hasTyped ? (
      <View style={styles.resultsContainer}>
          {songs?.length > 0 ? (
            <>
              <FlatList 
                  data={songs}
                  keyExtractor={(song) => song.id} // Ensure each item has a unique key
                  contentContainerStyle={{ paddingBottom: 20 }} // Prevents cut-off at bottom
                  keyboardShouldPersistTaps="handled" // Allows scrolling without dismissing keyboard
                  renderItem={({ item }) => (
                  <Pressable onPress={() => handleSongPress(item)}>
                    <View style={styles.rowContainer}>
                        {item.album.images.length > 0 ? (
                            <Image 
                                source={{ uri: item.album.images[0].url }} 
                                style={{ width: 70, height: 70, borderRadius: 8 }} 
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={{ width: 70, height: 70, borderRadius: 8, backgroundColor: "#aaa"}} />
                            // <Text style={{ color: "#aaa" }}>No Image Available</Text>
                        )}
                        <View style={styles.songInfo}>
                            <Text style={styles.songTitle}>{item.name}</Text>
                            <Text style={styles.songDetails}>Song • {item.artists[0].name ?? "Unknown Artist"}</Text>
                        </View>
                    </View> 
                  </Pressable>
              )} />

              
            </>
          
          ) : (
              <Text style={styles.keep_typing}>Keep typing...</Text>
          )}
      </View>
      ) : null
    }
    />
   <SelectPopup
  isVisible={isModalVisible}
  onClose={() => {
    setModalVisible(false);
    stopPreview();
  }}
  selectedSong={selectedSong}
  handlePost={handlePost}
  playPreview={playPreview}
  stopPreview={stopPreview}
/>
  </>
  
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 30,
    backgroundColor: "#2f2f2f",
    paddingBottom: 80, // making sure navbar doesnt cover content
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#fff",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fff",
    borderRadius: 14,
  },
  searchIcon: {
    paddingLeft: 10,
    paddingRight: 15,
    color: "#888888",
  },
  inputText: {
    paddingTop: 15,
    paddingBottom: 15,
    flex: 1,
    color: "white",
  },
  tagline: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 50,
    marginBottom: 30,
    alignSelf: "center",
    textAlign: "center",
    color: "#CD60FF",
  },
  tagline_sub: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#B3B3B3",
  },
  trendingTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  trendingContainer: {
    marginTop: 5,
    flexDirection: "row",
  },
  trendingSongContainer: {
    marginTop: 20,
    marginRight: 10,
  },
  trendingSongTitle: {
    fontSize: 13,
    fontWeight: "300",
    color: "#fff",
    textAlign: "center",
    marginTop: 5,
    maxWidth: 140,
    
  },
  keep_typing: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 10,
    color: "#B3B3B3",
  },
  resultsContainer: {
    // marginBottom: 50,
    flex: 1,
  },
  rowContainer: {
    marginTop: 20,
    flexDirection: "row",
  },
  songInfo: {
    justifyContent: "center",
    marginLeft: 20,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  songDetails: {
    fontSize: 14,
    color: "#aaa",
  },
});

export default PostScreen;

