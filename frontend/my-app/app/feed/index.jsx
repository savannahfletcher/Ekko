import { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, doc, getDoc } from "firebase/firestore"; 
import { auth, db } from "../../firebaseConfig"; 
import axios from "axios";

// Default profile pictures for testing
import profilePic1 from '@/assets/images/profileImages/profilePic1.jpg';
import profilePic2 from '@/assets/images/profileImages/profilePic2.jpg';
import profilePic3 from '@/assets/images/profileImages/profilePic3.jpg';

const defaultProfilePics = [profilePic1, profilePic2, profilePic3];

const SPOTIFY_TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";
const tokens = require("../../tokens.json");
const SPOTIFY_CLIENT_ID = tokens.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = tokens.SPOTIFY_CLIENT_SECRET;

const FeedScreen = () => {
    const [userEmail, setUserEmail] = useState(null);
    const [username, setUsername] = useState(null);
    const [posts, setPosts] = useState([]); // Stores posts with song details
    const [accessToken, setAccessToken] = useState("");

    // 🔹 Fetch Spotify Access Token (valid for 1 hour)
    const fetchSpotifyAccessToken = async () => {
        try {
            console.log("Fetching Spotify Access Token...");
            const response = await axios.post(SPOTIFY_TOKEN_ENDPOINT, 
                new URLSearchParams({
                    grant_type: "client_credentials",
                    client_id: SPOTIFY_CLIENT_ID,
                    client_secret: SPOTIFY_CLIENT_SECRET,
                }), 
                { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
            );
            setAccessToken(response.data.access_token);
            console.log("Spotify Access Token Set!");
        } catch (error) {
            console.error("Error fetching Spotify token:", error.response?.data || error.message);
        }
    };
    const fetchFeedWithSongs = async () => {
        try {
            console.log("Fetching posts from Firestore...");
            const querySnapshot = await getDocs(collection(db, "feed"));
            let feedData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
            console.log(`Found ${feedData.length} posts in Firestore.`);
    
            if (!feedData.length) return; // No posts, exit early
    
            // Sort posts by timestamp, most recent first
            feedData.sort((a, b) => b.timestamp - a.timestamp);
    
            // Fetch all song details in parallel
            const songDetailsPromises = feedData.map(async (post) => {
                const songDetails = await fetchSongDetails(post.songId);
                return { ...post, songDetails };
            });
    
            const postsWithDetails = await Promise.all(songDetailsPromises);
            setPosts(postsWithDetails);
            console.log("All posts updated with song details!");
    
        } catch (error) {
            console.error("Error fetching feed data:", error);
        }
    };

    // 🔹 Fetch Firestore Feed Data and Merge with Spotify Song Details
    // const fetchFeedWithSongs = async () => {
    //     try {
    //         console.log("Fetching posts from Firestore...");
    //         const querySnapshot = await getDocs(collection(db, "feed"));
    //         let feedData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    //         console.log(`Found ${feedData.length} posts in Firestore.`);

    //         if (!feedData.length) return; // No posts, exit early

    //         // Fetch all song details in parallel
    //         const songDetailsPromises = feedData.map(async (post) => {
    //             const songDetails = await fetchSongDetails(post.songId);
    //             return { ...post, songDetails };
    //         });

    //         const postsWithDetails = await Promise.all(songDetailsPromises);
    //         setPosts(postsWithDetails);
    //         console.log("All posts updated with song details!");

    //     } catch (error) {
    //         console.error("Error fetching feed data:", error);
    //     }
    // };

    // 🔹 Fetch song details from Spotify API
    const fetchSongDetails = async (songId) => {
        if (!accessToken) return null;
        try {
            console.log(`Fetching details for song ID: ${songId}`);
            const response = await axios.get(`https://api.spotify.com/v1/tracks/${songId}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            return response.data;
        } catch (error) {
            console.error(`Error fetching song details for ${songId}:`, error.response?.data || error.message);
            return null;
        }
    };

    // 🔹 Fetch username and email when user logs in
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserEmail(user.email);
                try {
                    const userRef = doc(db, "users", user.uid);
                    const userDoc = await getDoc(userRef);
                    if (userDoc.exists()) {
                        setUsername(userDoc.data().username);
                    }
                } catch (error) {
                    console.error("Error fetching username:", error);
                }
            } else {
                setUserEmail(null);
                setUsername(null);
            }
        });
        return () => unsubscribe();
    }, []);

    // 🔹 Fetch Spotify Token First, Then Fetch Feed Data
    useEffect(() => {
        const fetchData = async () => {
            await fetchSpotifyAccessToken();
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (accessToken) {
            fetchFeedWithSongs();
        }
    }, [accessToken]);

    return (
        <View style={styles.container}>
            {(username || userEmail) && (
                <Text style={styles.welcomeText}>
                    Welcome, @{username || userEmail}!
                </Text>
            )}
            <FlatList 
                data={posts}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => {
                    const profilePic = defaultProfilePics[index % defaultProfilePics.length];

                    return (
                        <LinearGradient
                            colors={['#3A0398', '#150F29']}
                            start={{ x: 0.5, y: 0 }}
                            end={{ x: 0.5, y: 0.7 }}
                            style={styles.postItem}
                        >
                            <View style={styles.postHeader}> 
                                <Image source={profilePic} style={styles.profilePic} />
                                <Text style={styles.postUsername}>{item.username || "Unknown User"}</Text>
                            </View>

                            {/* 🔹 Show Song Details */}
                            {item.songDetails ? (
                                <>
                                    <Image source={{ uri: item.songDetails.album.images[0].url }} style={styles.image} />
                                    <Text style={styles.postSongName}>{item.songDetails.name}</Text>
                                    <Text style={styles.postDetails}>Song • {item.songDetails.artists.map(a => a.name).join(", ")}</Text>
                                </>
                            ) : (
                                <Text style={styles.loadingText}>Loading song details...</Text>
                            )}

                            <Text style={styles.captionText}>
                                "{item.caption}"
                            </Text>
                        </LinearGradient>
                    );
                }}
            />
        </View>
    );
};

// 🔹 Styles
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#2f2f2f',
    },
    welcomeText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    postItem: {
        padding: 20,
        marginBottom: 30,
        borderRadius: 19,
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    postUsername: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        paddingLeft: 5,
        paddingBottom: 5,
    },
    postSongName: {
        fontSize: 17,
        color: '#fff',
        paddingLeft: 2,
        paddingTop: 5,
    },
    postDetails: {
        fontSize: 12,
        color: '#A7A7A7',
        paddingLeft: 2,
    },
    captionText: {
        fontSize: 14,
        color: '#EAEAEA',
        fontStyle: "italic",
        marginTop: 10,
    },
    profilePic: {
        width: 50,
        height: 50,
        borderRadius: 50,
    },
    image: {
        width: 300,
        height: 300,
        borderRadius: 9,
    },
    loadingText: {
        fontSize: 14,
        color: '#A7A7A7',
        textAlign: 'center',
        marginVertical: 10,
    },
});

export default FeedScreen;