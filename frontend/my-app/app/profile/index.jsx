import { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, Image} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { getFirestore, collection, doc, getDocs } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig"; // ✅ Ensure Firebase is correctly imported
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useFonts } from 'expo-font';

import tempProfilePic from '@/assets/images/profileImages/profilePic2.jpg';

const ProfileScreen = () => {
    const [personalSongs, setPersonalSongs] = useState([]);
    const [userId, setUserId] = useState(null);

    const [fontsLoaded] = useFonts({
        'MontserratAlternates-ExtraBold': require('./../../assets/fonts/MontserratAlternates-ExtraBold.ttf'), // Adjust the path to your font file
    });
    
    if (!fontsLoaded) {
        return <Text>Loading fonts...</Text>; // Show a loading screen while the font is loading
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);
                fetchPersonalSongs(user.uid);
            }
        });

        return () => unsubscribe();
    }, []);

    const fetchPersonalSongs = async (uid) => {
        try {
            const songsRef = collection(db, "users", uid, "personalSongs"); // ✅ Correct Firestore path
            const songsSnapshot = await getDocs(songsRef);

            const songsList = songsSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            setPersonalSongs(songsList);
        } catch (error) {
            console.error("Error fetching personal songs:", error);
        }
    };

    return (
        <View style={styles.container}>
            <Text style = {styles.ekkoText}> Ekko </Text>
            <LinearGradient
            colors={['#3A0398', '#150F29']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.7 }}
            style={styles.loginBox}
            >
                <View style={styles.profileHeader}>
                    {/* TODO: replace tempProfilePic with actual loaded profile pics */}
                    <Image source={tempProfilePic} style={styles.profilePic} />
                    <View style={styles.subHeader}>
                        {/* TODO: replace [username] and [num] with variables for each */}
                        <Text style={styles.userNameText}>[username]</Text>
                        <Text style={styles.friendsText}>[num] friends</Text> 
                    </View>
                </View>
                <Text style={styles.title}>Badges</Text>
                {/* TODO: support badges on the profile */}
                <Text style={styles.title}>Previous Ekkos</Text>
                <FlatList
                    data={personalSongs}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={styles.songItem}>
                            <Text style={styles.songTitle}>{item.title}</Text>
                            <Text style={styles.songArtist}>Artist: {item.artist}</Text>
                            <Text style={styles.songCaption}>{item.caption}</Text>
                        </View>
                    )}
                />
            </LinearGradient>
            
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#2f2f2f",
    },
    ekkoText: {
        fontSize: 36,
        color: '#fff',
        textAlign: 'center',
        fontFamily: 'MontserratAlternates-ExtraBold',
        padding: 10,
    },
    loginBox: {
        padding: 20,
        marginBottom: 50,
        borderRadius: 19,
    },
    profileHeader: { // contains profile pic and subHeader (username & friends count)
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 15,
    },
    profilePic: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    subHeader: { // contains username & friends count
        marginLeft: 15,
    },
    userNameText: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#fff",
    },
    friendsText: {
        fontSize: 16,
        fontWeight: "bold",
        color: '#B3B3B3',
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 10,
        color: "#fff",
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
});

export default ProfileScreen;