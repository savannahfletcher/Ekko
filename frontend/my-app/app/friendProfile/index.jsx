import { useState, useEffect } from "react";
import { View, Text, StyleSheet, Image, ScrollView, TextInput, TouchableWithoutFeedback, Keyboard } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { getDoc, getDocs, collection, doc, setDoc, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { TouchableOpacity, Modal } from "react-native";
import { auth, db } from "../../firebaseConfig";
import { useFonts } from 'expo-font';
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator"; // ✅ Import Image Manipulator
import { serverTimestamp } from 'firebase/firestore';
import FriendsOfFriendsModal from "./Friends";
import { useLocalSearchParams } from 'expo-router';
import { useRouter } from 'expo-router';

const FriendProfileScreen = () => {
    const [personalSongs, setPersonalSongs] = useState([]);
    const [clickedUserId, setClickedUserId] = useState(null); // who we're viewing
    const [viewerId, setViewerId] = useState(null);           // who is logged in

    const [username, setUsername] = useState("Loading...");
    const [profilePic, setProfilePic] = useState(null);
    const [currentFriends, setCurrentFriends] = useState([]);
    const [friendsList, setFriendsList] = useState([]);
    const [friendModalVisible, setFriendModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);

    const [viewerUsername, setViewerUsername] = useState("");
    const [viewerProfilePic, setViewerProfilePic] = useState("");

    const router = useRouter();
    const routeParams = useLocalSearchParams(); // pulled from URL

    const [fontsLoaded] = useFonts({
    'MontserratAlternates-ExtraBold': require('./../../assets/fonts/MontserratAlternates-ExtraBold.ttf'),
    });

    // Set clickedUserId based on route (cleaner than destructuring directly)
    useEffect(() => {
    if (routeParams.userId) {
        setClickedUserId(routeParams.userId);
    }
    }, [routeParams]);

    // Fetch logged-in viewer's data
    useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
        setViewerId(user.uid);

        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) {
            const data = docSnap.data();
            setViewerUsername(data.username || "");
            setViewerProfilePic(data.profilePic || null);
        }
        }
    });

    return () => unsubscribe();
    }, []);

    // Fetch clicked user's data once we have their ID
    useEffect(() => {
    if (!clickedUserId) return;

    fetchUserData(clickedUserId);
    fetchPersonalSongs(clickedUserId);
    fetchCurrentFriends(clickedUserId);
    }, [clickedUserId]);
        

   
    const fetchUserData = async (uid) => {
        try {
            const userDoc = await getDoc(doc(db, "users", uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                setUsername(userData.username || "Unknown User");
                setProfilePic(userData.profilePic || null);
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    };

    const fetchPersonalSongs = async (uid) => {
        try {
            const songsRef = collection(db, "users", uid, "personalSongs");
            const snapshot = await getDocs(songsRef);
            const songs = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds); // 🔥 sort newest to oldest
    
            setPersonalSongs(songs);
        } catch (error) {
            console.error("Error fetching songs:", error);
        }
    };

    const fetchCurrentFriends = async (uid) => {
        try {
            const ref = collection(db, "users", uid, "friends");
            const snapshot = await getDocs(ref);
            const friends = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCurrentFriends(friends.map(f => f.userID));
            setFriendsList(friends);
        } catch (error) {
            console.error("Error fetching friends:", error);
        }
    };

    const handleAddFriend = async (clickedUser) => {
        if (!viewerId || !viewerUsername || !viewerProfilePic) return;
    
        const yourRef = doc(db, "users", viewerId, "friends", clickedUser.id);
        const theirRef = doc(db, "users", clickedUser.id, "friends", viewerId);
    
        try {
            const exists = await getDoc(yourRef);
            if (exists.exists()) return;
    
            // You add them
            await setDoc(yourRef, {
                username: clickedUser.username,
                userID: clickedUser.id,
                profilePic: clickedUser.profilePic || null,
            });
    
            // They add you
            await setDoc(theirRef, {
                username: viewerUsername,
                userID: viewerId,
                profilePic: viewerProfilePic || null,
            });

            setFriendsList(prev => [...prev, {
                username: viewerUsername,
                userID: viewerId,
                profilePic: viewerProfilePic || null,
            }]);
    
            await fetchCurrentFriends(clickedUser.id); // refresh
            //router.replace("/feed?refresh=1");
        } catch (error) {
            console.error("Error adding friend:", error);
        }
    };

    const handleRemoveFriend = async (friendId) => {
        if (!userId) return;

        try {
            await deleteDoc(doc(db, "users", userId, "friends", friendId));
            await deleteDoc(doc(db, "users", friendId, "friends", userId));
            await fetchCurrentFriends(userId);
        } catch (error) {
            console.error("Error removing friend:", error);
        }
    };

    if (!fontsLoaded) return <Text>Loading fonts...</Text>;

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.ekkoText}>Ekko</Text>
            <LinearGradient
                colors={['#3A0398', '#150F29']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 0.7 }}
                style={styles.loginBox}
            >
                <View style={styles.profileHeader}>
                    <Image
                        source={profilePic ? { uri: profilePic } : require('@/assets/images/profileImages/image.png')}
                        style={styles.profilePic}
                    />
                    <View style={styles.subHeader}>
                        <View style={styles.usernameRow}>
                            <Text style={styles.userNameText}>{username}</Text>
                            {viewerId && viewerId !== clickedUserId && (
                            currentFriends.includes(viewerId) ? (
                                <Text style={styles.friendsText}>Friends</Text>
                            ) : (
                                <TouchableOpacity
                                    style={styles.friendButton}
                                    onPress={() => handleAddFriend({
                                        id: clickedUserId,
                                        username,
                                        profilePic,
                                    })}
                                >
                                    <Text style={styles.friendButtonText}>Add Friend</Text>
                                </TouchableOpacity>
                            )
                        )}
                        </View>
                        <TouchableOpacity onPress={() => setFriendModalVisible(true)}>
                            <Text style={styles.friendsText}>
                                {friendsList.length} friend{friendsList.length !== 1 ? 's' : ''}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <Text style={styles.title}>Friends</Text>
                {friendsList.length === 0 ? (
                    <Text style={{ color: '#aaa', fontStyle: 'italic' }}>This user doesn't have any friends yet.</Text>
                ) : (
                    <>
                        {friendsList.slice(0, 2).map((friend) => (
                            <View key={friend.userID} style={styles.friendItem}>
                                <Image
                                    source={friend.profilePic ? { uri: friend.profilePic } : require('@/assets/images/profileImages/image.png')}
                                    style={styles.friendPic}
                                />
                                <Text style={styles.friendName}>@{friend.username}</Text>
                            </View>
                        ))}
                        {friendsList.length > 2 && (
                            <TouchableOpacity onPress={() => setFriendModalVisible(true)}>
                                <Text style={{ color: '#A338F4', fontWeight: 'bold' }}>See more friends...</Text>
                            </TouchableOpacity>
                        )}
                    </>
                )}

                <Text style={styles.title}>Previous Ekkos</Text>
                {personalSongs.length === 0 ? (
                    <Text style={{ color: '#aaa', fontStyle: 'italic' }}>This user hasn't posted any Ekkos yet.</Text>
                ) : (
                    personalSongs.map((song) => (
                        <View key={song.id} style={styles.songItem}>
                            <Text style={styles.songTitle}>{song.title}</Text>
                            <Text style={styles.songArtist}>Artist: {song.artist}</Text>
                            <Text style={styles.songCaption}>{song.caption}</Text>
                            {song.timestamp?.seconds && (
                            <Text style={styles.timestamp}>
                                Posted on: {new Date(song.timestamp.seconds * 1000).toLocaleString()}
                            </Text>
                            )}
                        </View>
                    ))
                )}
            </LinearGradient>
            <FriendsOfFriendsModal
            visible={friendModalVisible}
            onClose={() => setFriendModalVisible(false)}
            friendsList={friendsList}
            currentFriends={currentFriends}
            userId={viewerId}
            />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#2f2f2f" },
    ekkoText: {
        fontSize: 36,
        color: '#fff',
        textAlign: 'center',
        fontFamily: 'MontserratAlternates-ExtraBold',
        padding: 10,
    },
    loginBox: {
        padding: 20,
        borderRadius: 19,
        marginBottom: 30,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    profilePic: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    subHeader: { marginLeft: 15 , flex: 1},
    usernameRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    
    userNameText: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#fff",
    },
    
    friendButton: {
        backgroundColor: '#6E1FD1',
        paddingVertical: 5,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    
    friendButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    userNameText: { fontSize: 24, fontWeight: "bold", color: "#fff" },
    friendsText: { fontSize: 16, fontWeight: "bold", color: '#B3B3B3' },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginTop: 20,
        marginBottom: 10,
        color: "#fff",
    },
    friendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    friendPic: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    friendName: {
        color: '#fff',
        fontSize: 16,
        flex: 1,
    },
    removeBtn: {
        backgroundColor: '#ff4444',
        color: '#fff',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 6,
        fontSize: 14,
    },
    addBtn: {
        backgroundColor: '#6E1FD1',
        color: '#fff',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 6,
        fontSize: 14,
    },
    searchInput: {
        backgroundColor: '#1e1e1e',
        color: 'white',
        padding: 10,
        borderRadius: 8,
        borderColor: '#6E1FD1',
        borderWidth: 1,
        marginBottom: 10,
    },
    songItem: {
        backgroundColor: "#3A0398",
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
    },
    songTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#fff",
    },
    songArtist: {
        fontSize: 16,
        color: "#ddd",
    },
    songCaption: {
        fontSize: 14,
        color: "#bbb",
    },
    timestamp: {
        fontSize: 12,
        color: '#aaa',
        marginTop: 5,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    
    modalContent: {
        backgroundColor: '#222',
        padding: 20,
        borderRadius: 12,
        width: '100%',
    },
    
    modalTitle: {
        fontSize: 20,
        color: '#fff',
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    
    modalPic: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignSelf: 'center',
        marginBottom: 15,
    },
    
    modalInput: {
        backgroundColor: '#333',
        color: 'white',
        padding: 10,
        borderRadius: 8,
        marginBottom: 10,
    },
    cancelBtn: {
        color: '#aaa',
        fontSize: 16,
        padding: 10,
    },
    
    saveBtn: {
        color: '#6E1FD1',
        fontSize: 16,
        padding: 10,
        fontWeight: 'bold',
    },
});

export default FriendProfileScreen;