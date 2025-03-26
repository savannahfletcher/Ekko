
import { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore"; 
import { auth, db } from "../../firebaseConfig"; // ✅ Ensure Firestore is correctly imported


import espresso from '@/assets/images/songImages/Espresso.jpg';
import juna from '@/assets/images/songImages/Juna.jpeg';
import lalalala from '@/assets/images/songImages/LALALALA.jpeg';
import profilePic1 from '@/assets/images/profileImages/profilePic1.jpg';
import profilePic2 from '@/assets/images/profileImages/profilePic2.jpg';
import profilePic3 from '@/assets/images/profileImages/profilePic3.jpg';

const FeedScreen = () => {
    const [userEmail, setUserEmail] = useState(null);
    const [username, setUsername] = useState(null);
    const [posts, setPosts] = useState([
        {id: '1', profile: profilePic1, username: 'Carl Smith', songName: 'Espresso', albumCover: espresso, artist: 'Sabrina Carpenter'},
        {id: '2', profile: profilePic2, username: 'Gloria Shell', songName: 'Juna', albumCover: juna, artist: 'Clairo'},
        {id: '3', profile: profilePic3, username: 'Aria Coolidge', songName: 'LALALALA', albumCover: lalalala, artist: 'Stray Kids'},
    ]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserEmail(user.email);
                try {
                    // ✅ Use Firebase v9+ syntax
                    const userRef = doc(db, "users", user.uid);
                    const userDoc = await getDoc(userRef);

                    if (userDoc.exists()) {
                        setUsername(userDoc.data().username);
                    } else {
                        console.log("No user document found in Firestore");
                    }
                } catch (error) {
                    console.log("Error fetching username: ", error);
                }
            } else {
                setUserEmail(null);
                setUsername(null);
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <View style = {styles.container}>
            {/* ✅ Display the welcome message */}
            {(username || userEmail) && (
                <Text style={styles.welcomeText}>
                    Welcome, {username || userEmail}!
                </Text>
            )}
            <FlatList 
                data = {posts}
                keyExtractor={(item) => item.id} // unique key
                renderItem={( {item} ) => (

                    <LinearGradient
                        colors={['#3A0398', '#150F29']} // Example gradient colors
                        start={{ x: 0.5, y: 0 }}
                        end={{ x: 0.5, y: 0.7 }}
                        
                        style={styles.postItem}>
                        <View style={styles.postHeader}> 
                            <Image source={item.profile} style={styles.profilePic}/>

                            <Text style = {styles.postUsername}>
                                {item.username}
                            </Text>
                        </View>

                        <Image source= { item.albumCover } style={styles.image}/>
                        <Text style = {styles.postSongName}>
                            {item.songName}
                        </Text>
                        <Text style = {styles.postDetails}>
                            Song • {item.artist}
                        </Text>
                    </LinearGradient>
                )}
            />
        </View>

    );
};

const styles = StyleSheet.create ({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#2f2f2f',
      },
    welcomeText: {
        color: '#fff', // Makes the text white
        fontSize: 24, // Adjust size to your preference
        fontWeight: 'bold', // Optional, makes the text bold
        marginBottom: 20, // Adds some space below the welcome message
    },
    postItem: {
        padding: 20,
        marginBottom: 50,
        borderRadius: 19,
    },
    postHeader: { // contains the profile picture and username
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
})

export default FeedScreen;