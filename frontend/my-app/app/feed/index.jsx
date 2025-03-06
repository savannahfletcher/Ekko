import {useState} from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { View, Text, StyleSheet, FlatList, Image } from 'react-native'
import espresso from '@/assets/images/songImages/Espresso.jpg';
import juna from '@/assets/images/songImages/Juna.jpeg';
import lalalala from '@/assets/images/songImages/LALALALA.jpeg';
import profilePic1 from '@/assets/images/profileImages/profilePic1.jpg';
import profilePic2 from '@/assets/images/profileImages/profilePic2.jpg';
import profilePic3 from '@/assets/images/profileImages/profilePic3.jpg';

const FeedScreen = () => {

    const [posts, setPosts] = useState([
        {id: '1', profile: profilePic1, username: 'Carl Smith', songName: 'Espresso', albumCover: espresso, artist: 'Sabrina Carpenter'},
        {id: '2', profile: profilePic2, username: 'Gloria Shell', songName: 'Juna', albumCover: juna, artist: 'Clairo'},
        {id: '3', profile: profilePic3, username: 'Aria Coolidge', songName: 'LALALALA', albumCover: lalalala, artist: 'Stray Kids'},
    ])

    return (
        <View style = {styles.container}>
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