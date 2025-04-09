import { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from "react-native";
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { LinearGradient } from "expo-linear-gradient";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import axios from "axios";

import profilePic1 from '@/assets/images/profileImages/image.png';

const defaultProfilePics = [profilePic1];

const SPOTIFY_TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";
const tokens = require("../../tokens.json");
const SPOTIFY_CLIENT_ID = tokens.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = tokens.SPOTIFY_CLIENT_SECRET;

const FeedScreen = () => {
    const router = useRouter();
    const [userId, setUserId] = useState(null);
    const [userEmail, setUserEmail] = useState(null);
    const [username, setUsername] = useState(null);
    const [friendIDs, setFriendIDs] = useState([]);
    const [posts, setPosts] = useState([]);
    const [accessToken, setAccessToken] = useState("");
    const [showOnlyFriends, setShowOnlyFriends] = useState(true);

    const [fontsLoaded] = useFonts({
        'MontserratAlternates-ExtraBold': require('./../../assets/fonts/MontserratAlternates-ExtraBold.ttf'),
    });

    if (!fontsLoaded) return <Text>Loading fonts...</Text>;

    const routeToPost = () => router.replace('./post');

    const fetchSpotifyAccessToken = async () => {
        try {
            const response = await axios.post(SPOTIFY_TOKEN_ENDPOINT,
                new URLSearchParams({
                    grant_type: "client_credentials",
                    client_id: SPOTIFY_CLIENT_ID,
                    client_secret: SPOTIFY_CLIENT_SECRET,
                }),
                { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
            );
            setAccessToken(response.data.access_token);
        } catch (error) {
            console.error("Error fetching Spotify token:", error.response?.data || error.message);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);
                setUserEmail(user.email);

                try {
                    const userRef = doc(db, "users", user.uid);
                    const userDoc = await getDoc(userRef);
                    if (userDoc.exists()) {
                        setUsername(userDoc.data().username);
                    }

                    const friendsRef = collection(db, "users", user.uid, "friends");
                    const snapshot = await getDocs(friendsRef);
                    const friendList = snapshot.docs.map(doc => doc.id);

                    setFriendIDs([...friendList, user.uid]); // ✅ include self
                } catch (error) {
                    console.error("Error fetching user/friends:", error);
                }
            } else {
                setUserId(null);
                setUserEmail(null);
                setFriendIDs([]);
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        fetchSpotifyAccessToken();
    }, []);

    useEffect(() => {
        if (accessToken && friendIDs.length > 0) {
            fetchFeedWithSongs();
        }
    }, [accessToken, friendIDs, showOnlyFriends]);

    const fetchFeedWithSongs = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "feed"));
            let feedData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Only posts from friends + yourself
            if (showOnlyFriends) {
                feedData = feedData.filter(post => friendIDs.includes(post.userId));
            }
            feedData.sort((a, b) => b.timestamp - a.timestamp);

            const postsWithDetails = await Promise.all(feedData.map(async (post) => {
                const songDetails = await fetchSongDetails(post.songId);

                let profilePic = null;
                let postUsername = "Unknown User";

                try {
                    const userSnap = await getDoc(doc(db, "users", post.userId));
                    if (userSnap.exists()) {
                        const userData = userSnap.data();
                        profilePic = userData.profilePic || null;
                        postUsername = userData.username || "Unknown User";
                    }
                } catch (error) {
                    console.error(`Error getting user data for ${post.userId}:`, error);
                }

                return {
                    ...post,
                    songDetails,
                    profilePic,
                    username: postUsername,
                };
            }));

            setPosts(postsWithDetails);
        } catch (error) {
            console.error("Error fetching feed data:", error);
        }
    };

    const fetchSongDetails = async (songId) => {
        if (!accessToken) return null;
        try {
            const response = await axios.get(`https://api.spotify.com/v1/tracks/${songId}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            return response.data;
        } catch (error) {
            console.error(`Error fetching song details for ${songId}:`, error.response?.data || error.message);
            return null;
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.ekkoText}>Ekko</Text>
{/* ----------------------------------TOGGLE----------------------------------------- */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 10 }}>
                <TouchableOpacity
                    onPress={() => setShowOnlyFriends(true)}
                    style={{
                        paddingVertical: 6,
                        paddingHorizontal: 16,
                        backgroundColor: showOnlyFriends ? '#6E1FD1' : '#444',
                        borderTopLeftRadius: 8,
                        borderBottomLeftRadius: 8,
                    }}
                >
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Friends Only</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setShowOnlyFriends(false)}
                    style={{
                        paddingVertical: 6,
                        paddingHorizontal: 16,
                        backgroundColor: !showOnlyFriends ? '#6E1FD1' : '#444',
                        borderTopRightRadius: 8,
                        borderBottomRightRadius: 8,
                    }}
                >
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>All Posts</Text>
                </TouchableOpacity>
            </View>
            <FlatList
                data={posts}
                keyExtractor={(item) => item.id}
                ListHeaderComponent={
                    <>
                        {(username || userEmail) && (
                            <Text style={styles.welcomeText}>Welcome, @{username || userEmail}!</Text>
                        )}
                        <TouchableOpacity onPress={routeToPost} style={styles.shadowContainer}>
                            <View style={styles.buttonContainer}>
                                <LinearGradient
                                    colors={['#6E1FD1', '#A338F4']}
                                    start={{ x: 0, y: 0.5 }}
                                    end={{ x: 1, y: 0.5 }}
                                    style={styles.gradient}
                                >
                                    <Text style={styles.buttonText}>Post your Ekko!</Text>
                                </LinearGradient>
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.postUsername}>See what your friends are listening to!</Text>
                    </>
                }
                renderItem={({ item, index }) => {
                    const profilePic = item.profilePic ? { uri: item.profilePic } : defaultProfilePics[index % defaultProfilePics.length];
                    return (
                        <LinearGradient
                            colors={['#3A0398', '#150F29']}
                            start={{ x: 0.5, y: 0 }}
                            end={{ x: 0.5, y: 0.7 }}
                            style={styles.postItem}
                        >
                            <View style={styles.postHeader}>
                                <Image source={profilePic} style={styles.profilePic} />
                                <Text style={styles.postUsername}>{item.username}</Text>
                            </View>

                            {item.songDetails ? (
                                <>
                                    <Image source={{ uri: item.songDetails.album.images[0].url }} style={styles.image} />
                                    <Text style={styles.postSongName}>{item.songDetails.name}</Text>
                                    <Text style={styles.postDetails}>Song • {item.songDetails.artists.map(a => a.name).join(", ")}</Text>
                                </>
                            ) : (
                                <Text style={styles.loadingText}>Loading song details...</Text>
                            )}

                            <Text style={styles.captionText}>"{item.caption}"</Text>
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
    ekkoText: {
        fontSize: 36,
        color: '#fff',
        textAlign: 'center',
        fontFamily: 'MontserratAlternates-ExtraBold',
        paddingBottom: 10,
    },
    shadowContainer: {
        alignSelf: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 4 }, 
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 6,
        borderRadius: 10, 
    },
    buttonContainer: {
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'black', 
    },
    gradient: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        padding: 15,
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