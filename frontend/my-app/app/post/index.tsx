import { View, Text, StyleSheet, Pressable, TextInput, Image, FlatList } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import { useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store"; // Optional for storing tokens

const tokens = require("../../tokens.json");
const SPOTIFY_CLIENT_ID = tokens.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = tokens.SPOTIFY_CLIENT_SECRET;

const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";

const PostScreen = () => {
    
    const [accessToken, setAccessToken] = useState("");
    const [input, setInput] = useState(""); // user input
    const [songs, setSongs] = useState<any[]>([]); // set of queried songs
    const [hasTyped, setHasTyped] = useState(false); // track if user has started typing

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
      console.error("Error fetching access token:", error);
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

  useEffect(() => {
    fetchAccessToken();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Search Songs</Text>

      <Pressable style={styles.searchBar}>
        <Icon style={styles.searchIcon} name="search" size={30} color="#000" />
        <TextInput
          value={input}
          onChangeText={(text) => {
            setInput(text)
            setHasTyped(true)
            getSongs()
            text?.length == 0 && (setSongs([]))
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
        <>
          <Text style={styles.tagline}>Post a song of the day for your friends to see!</Text>
          <Text style={styles.tagline_sub}>
            It could be what you’re listening to right now or a song that captures your vibe for the day!
          </Text>
        </>
      )}

    {/* when the user starts typing, show them their songs */}
    {/* if the user clicks the bar but doesn't type, prompt them to keep typing */}
    {hasTyped && (
    <View style={styles.resultsContainer}>
        {songs?.length > 0 ? (
            
            <FlatList 
                data={songs}
                keyExtractor={(song) => song.id} // Ensure each item has a unique key
                contentContainerStyle={{ paddingBottom: 20 }} // Prevents cut-off at bottom
                keyboardShouldPersistTaps="handled" // Allows scrolling without dismissing keyboard
                renderItem={({ item }) => (
        
            <View style={styles.rowContainer}>
                {item.album.images.length > 0 ? (
                    <Image 
                        source={{ uri: item.album.images[0].url }} 
                        style={{ width: 70, height: 70, borderRadius: 8 }} 
                        resizeMode="cover"
                    />
                ) : (
                    <View style={{ width: 70, height: 70, borderRadius: 8, backgroundColor: "#aaa"}} 
                    
                    />
                    // <Text style={{ color: "#aaa" }}>No Image Available</Text>
                )}
                <View style={styles.songInfo}>
                  <Text style={styles.songTitle}>{item.name}</Text>
                  <Text style={styles.songDetails}>Song • {item.artists[0].name}</Text>
                </View>
                
            </View>
        )} />
        
        ) : (
            <Text style={styles.keep_typing}>Keep typing...</Text>
        )}
    </View>
    )}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 30,
    backgroundColor: "#2f2f2f",
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
