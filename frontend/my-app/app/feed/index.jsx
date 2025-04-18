import { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, TextInput} from "react-native";
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { LinearGradient } from "expo-linear-gradient";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc} from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { Modal, ScrollView } from "react-native";
import { addDoc, serverTimestamp } from "firebase/firestore"; 
import { useFocusEffect } from '@react-navigation/native';
import axios from "axios";

import profilePic1 from '../../assets/images/profileImages/image.png';

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
    const [likedPosts, setLikedPosts] = useState(new Set());
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedLikes, setSelectedLikes] = useState([]);
    const [selectedPostId, setSelectedPostId] = useState(null);
    const [selectedComments, setSelectedComments] = useState([]);
    const [activeTab, setActiveTab] = useState("likes"); // "likes" or "comments"
    const [newComment, setNewComment] = useState("");
    const [personalSongs, setPersonalSongs] = useState([]);
    const [hasPostedToday, setHasPostedToday] = useState(false);

    // variables to reduce spotify api traffic
    const [visibleCount, setVisibleCount] = useState(5);
    const [allPosts, setAllPosts] = useState([]);
    const songCache = {};

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
                fetchPersonalSongs(user.uid);

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

    useFocusEffect(
        useCallback(() => {
            if (userId) {
                fetchPersonalSongs(userId);
                fetchFriendIDs();
            }
        }, [userId])
    );

    // Fetch user's songs to see if user has posted today already
    const fetchPersonalSongs = async (uid) => {
        try {
            const songsRef = collection(db, "users", uid, "personalSongs");
            const snapshot = await getDocs(songsRef);
            const songs = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds); // sort newest to oldest
    
            setPersonalSongs(songs);

            // Check if the latest song was posted today
            const latestSong = songs[0];
            let hasPostedToday = false;

            if (latestSong?.timestamp) {
                const today = new Date();
                const postDate = latestSong.timestamp.toDate();

                hasPostedToday =
                    postDate.getDate() === today.getDate() &&
                    postDate.getMonth() === today.getMonth() &&
                    postDate.getFullYear() === today.getFullYear();
            }

            setHasPostedToday(hasPostedToday);
            console.log("Has posted today:", hasPostedToday);

            // const today = new Date();
            // const hasPostedToday = songs.some(song => {
            //     if (!song.timestamp) return false;
            //     const postDate = song.timestamp.toDate(); // Firestore Timestamp to JS Date
            //     return (
            //         postDate.getDate() === today.getDate() &&
            //         postDate.getMonth() === today.getMonth() &&
            //         postDate.getFullYear() === today.getFullYear()
            //     );
            // });
            // console.log("Has posted today:", hasPostedToday);
            // setHasPostedToday(hasPostedToday);
        } catch (error) {
            console.error("Error fetching user's songs:", error);
        }
    };

    const fetchFriendIDs = async () => {
        try {
          const friendsRef = collection(db, "users", userId, "friends");
          const snapshot = await getDocs(friendsRef);
          const friendList = snapshot.docs.map(doc => doc.id);
          setFriendIDs([...friendList, userId]); // include yourself too
        } catch (error) {
          console.error("Error fetching friends:", error);
        }
      };


    useEffect(() => {
        setPosts(allPosts.slice(0, visibleCount));
    }, [visibleCount, allPosts]);

    const fetchFeedWithSongs = async () => {
        if (!userId) return; 
        try {
            const tempLikedPosts = new Set();
            const querySnapshot = await getDocs(collection(db, "feed"));
           // let feedData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
           let feedData = querySnapshot.docs
            .map(doc => {
                const data = doc.data();
                if (!data.userId) {
                console.warn("⚠️ Skipping post with missing userId:", doc.id);
                return null;
                }
                return { id: doc.id, ...data };
            })
            .filter(Boolean); // Removes nulls
    
            // Only posts from friends + yourself
            if (showOnlyFriends) {
                feedData = feedData.filter(post => post.userId && friendIDs.includes(post.userId));
            }
    
            // Sort by timestamp (descending)
            feedData.sort((a, b) => b.timestamp - a.timestamp);
          
            // const tempLikedPosts = new Set(); // ✅ declare this here
            const postsWithDetails = await Promise.all(feedData.map(async (post) => {
                let songDetails = songCache[post.songId];
                if (!songDetails) {
                    songDetails = await fetchSongDetails(post.songId);
                    if (songDetails) songCache[post.songId] = songDetails;
                }
            
                // 🔹 Get likes
                const likesSnapshot = await getDocs(collection(db, "feed", post.id, "likes"));
                // const likeCount = likesSnapshot.size; // ✅ count of likes
                // const likedByUser = likesSnapshot.docs.find(doc => doc.id === userId);
                let likeCount = 0;
                let likedByUser = false;

                await Promise.all(likesSnapshot.docs.map(async (likeDoc) => {
                const likedUserId = likeDoc.id;

                // Check if the user who liked still exists
                const userRef = doc(db, "users", likedUserId);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    likeCount++;
                    if (likedUserId === userId) {
                    likedByUser = true;
                    }
                } else {
                    // 🔄 Clean up orphaned like doc (optional but nice)
                    await deleteDoc(likeDoc.ref);
                }
                }));
                if (likedByUser) {
                    tempLikedPosts.add(post.id);
                }

                 // 🔹 Get comment count
                const commentsSnapshot = await getDocs(collection(db, "feed", post.id, "comments"));
                const commentCount = commentsSnapshot.size;
                        
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
                    likeCount,
                    commentCount,
                };
            }));
    
            setAllPosts(postsWithDetails); // store all
            setPosts(postsWithDetails.slice(0, visibleCount)); // show only some
            setLikedPosts(tempLikedPosts); 
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

    const handleLoadMore = () => {
        if (visibleCount < allPosts.length) {
            setVisibleCount(prev => prev + 5);
        }
    };

    const handleLikePost = async (postId) => {
        if (!userId || !username) return;
    
        const likeRef = doc(db, "feed", postId, "likes", userId);
        const alreadyLiked = likedPosts.has(postId);
    
        try {
            let newLikedPosts = new Set(likedPosts);
            let newPosts = [...posts];
    
            const postIndex = newPosts.findIndex(p => p.id === postId);
            if (postIndex === -1) return;
    
            if (alreadyLiked) {
                await deleteDoc(likeRef);
                newLikedPosts.delete(postId);
                newPosts[postIndex].likeCount = Math.max((newPosts[postIndex].likeCount || 1) - 1, 0);
            } else {
                await setDoc(likeRef, {
                    userID: userId
                });
                newLikedPosts.add(postId);
                newPosts[postIndex].likeCount = (newPosts[postIndex].likeCount || 0) + 1;
            }
    
            setLikedPosts(newLikedPosts);
            setPosts(newPosts);
        } catch (error) {
            console.error("Error liking/unliking post:", error);
        }
    };

    const fetchLikers = async (postId) => {
        try {
            const likesRef = collection(db, "feed", postId, "likes");
            const snapshot = await getDocs(likesRef);
            const users = await Promise.all(snapshot.docs.map(async (docSnap) => {
                const { userID } = docSnap.data();
                const userRef = doc(db, "users", userID);
                const userDoc = await getDoc(userRef);
                return userDoc.exists() ? { id: userID, ...userDoc.data() } : null;
            }));
            setSelectedLikes(users.filter(Boolean));
            setSelectedPostId(postId);
            setActiveTab("likes"); // ← ADD THIS LINE
            await fetchComments(postId); // ← ADD THIS LINE
            setModalVisible(true);
        } catch (error) {
            console.error("Error fetching likers:", error);
        }
    };

    const fetchComments = async (postId) => {
        try {
            const commentsRef = collection(db, "feed", postId, "comments");
            const snapshot = await getDocs(commentsRef);
    
            const comments = await Promise.all(snapshot.docs.map(async (docSnap) => {
                const { userId, caption, timestamp } = docSnap.data();
                const userRef = doc(db, "users", userId);
                const userDoc = await getDoc(userRef);
                const userData = userDoc.exists() ? userDoc.data() : {};
                return {
                    id: docSnap.id,
                    caption,
                    timestamp,
                    userId,
                    username: userData.username || "Unknown",
                    profilePic: userData.profilePic || null,
                };
            }));
    
            setSelectedComments(comments);
        } catch (error) {
            console.error("Error fetching comments:", error);
        }
    };

    const handlePostComment = async () => {
        if (!userId || !newComment.trim() || !selectedPostId) return;
    
        try {
            await addDoc(collection(db, "feed", selectedPostId, "comments"), {
                caption: newComment.trim(),
                userId,
                timestamp: serverTimestamp(),
            });
            setNewComment("");
            await fetchComments(selectedPostId); // Refresh comments

             // ✅ Increment commentCount locally
            setPosts(prevPosts =>
                prevPosts.map(post =>
                    post.id === selectedPostId
                        ? { ...post, commentCount: (post.commentCount || 0) + 1 }
                        : post
                )
            );
        } catch (error) {
            console.error("Error posting comment:", error);
        }
    };

    const handleOpenComments = async (postId) => {
        setSelectedPostId(postId);
        await fetchComments(postId);
        setActiveTab("comments");
        setModalVisible(true);
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
                onEndReached={handleLoadMore} 
                onEndReachedThreshold={0.75} // loads more when you're halfway to the bottom
                ListHeaderComponent={
                    <>
                        {hasPostedToday ? (
                        <Text style={styles.welcomeText}>
                            You've already posted your Ekko today!
                        </Text>
                    ) : (
                        <Text style={styles.welcomeText}>
                            You haven’t posted today...
                        </Text>
                    )}
                    {!hasPostedToday && (
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
                    )}
                        <Text style={styles.subWelcomeText}>See what your friends are listening to!</Text>
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
                                <TouchableOpacity
                                onPress={() => router.push({
                                    pathname: '/friendProfile',
                                    params: { userId: item.userId }
                                })}
                                >
                                <Text style={styles.postUsername}>@{item.username}</Text>
                                </TouchableOpacity>
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
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                                {/* Like toggle */}
                                <TouchableOpacity onPress={() => handleLikePost(item.id)}>
                                    <Text style={{ color: likedPosts.has(item.id) ? '#A338F4' : '#ccc', fontWeight: 'bold' }}>
                                    {likedPosts.has(item.id) ? "♥ Liked" : "♡ Like"}
                                    </Text>
                                </TouchableOpacity>

                                <Text style={{ color: '#aaa', marginHorizontal: 6 }}>·</Text>

                                {/* Open modal in Likes tab */}
                                <TouchableOpacity
                                    onPress={() => {
                                    setSelectedPostId(item.id);
                                    setActiveTab("likes");
                                    fetchLikers(item.id);
                                    setModalVisible(true);
                                    }}
                                >
                                    <Text style={{ color: '#aaa' }}>
                                    {item.likeCount} like{item.likeCount !== 1 ? 's' : ''}
                                    </Text>
                                </TouchableOpacity>

                                <Text style={{ color: '#aaa', marginHorizontal: 6 }}>·</Text>

                                {/* Open modal in Comments tab */}
                                <TouchableOpacity
                                    onPress={() => {
                                    (async () => {
                                        setSelectedPostId(item.id);
                                        await fetchComments(item.id);
                                        setActiveTab("comments");
                                        setModalVisible(true);
                                    })();
                                    }}
                                >
                                    <Text style={{ color: '#aaa' }}>
                                    {item.commentCount} Comment{item.likeCount !== 1 ? 's' : ''}
                                    </Text>
                                </TouchableOpacity>
                             </View>
                            </LinearGradient>

                    );
                }}
                ListFooterComponent={
                    visibleCount < allPosts.length ? (
                        <Text style={{ textAlign: "center", padding: 10 }}>Loading more...</Text>
                    ) : null
                }
            />
        <Modal
            visible={modalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setModalVisible(false)}
        >
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 }}>
                <View style={{ backgroundColor: '#222', padding: 20, borderRadius: 10, maxHeight: '80%' }}>
                    {/* Tabs */}
                    <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 10 }}>
                        <TouchableOpacity onPress={() => setActiveTab("likes")} style={{ marginHorizontal: 10 }}>
                            <Text style={{ color: activeTab === "likes" ? '#A338F4' : '#aaa', fontWeight: 'bold' }}>Likes</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setActiveTab("comments")} style={{ marginHorizontal: 10 }}>
                            <Text style={{ color: activeTab === "comments" ? '#A338F4' : '#aaa', fontWeight: 'bold' }}>Comments</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView>
                        {activeTab === "likes" && selectedLikes.map(user => (
                            <View key={user.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                                <Image
                                    source={user.profilePic ? { uri: user.profilePic } : require('../../assets/images/profileImages/image.png')}
                                    style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }}
                                />
                                <Text style={{ color: '#fff', fontSize: 16 }}>@{user.username}</Text>
                            </View>
                        ))}

                        {activeTab === "comments" && selectedComments.map(comment => (
                            <View key={comment.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                                <Image
                                    source={comment.profilePic ? { uri: comment.profilePic } : require('../../assets/images/profileImages/image.png')}
                                    style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }}
                                />
                                <View>
                                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>@{comment.username}</Text>
                                    <Text style={{ color: '#ccc' }}>{comment.caption}</Text>
                                </View>
                            </View>
                        ))}
                    </ScrollView>

                    {activeTab === "comments" && (
                        <View style={{ flexDirection: 'row', marginTop: 10, alignItems: 'center' }}>
                            <TextInput
                                value={newComment}
                                onChangeText={setNewComment}
                                placeholder="Add a comment..."
                                placeholderTextColor="#aaa"
                                style={{
                                    flex: 1,
                                    backgroundColor: '#333',
                                    color: 'white',
                                    borderRadius: 6,
                                    paddingHorizontal: 10,
                                    paddingVertical: 6,
                                    marginRight: 10,
                                }}
                            />
                            <TouchableOpacity onPress={handlePostComment}>
                                <Text style={{ color: '#A338F4', fontWeight: 'bold' }}>Post</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: 20 }}>
                        <Text style={{ color: '#A338F4', textAlign: 'center', fontSize: 16 }}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
        </View>
    );
};


// 🔹 Styles
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#2f2f2f',
        paddingBottom: 80, // making sure navbar doesnt cover content
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
    subWelcomeText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#A9A9A9',
        paddingLeft: 5,
        paddingBottom: 5,
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