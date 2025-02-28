import {useState} from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { View, Text, StyleSheet, FlatList, Image } from 'react-native'
import espresso from '@/assets/images/songImages/Espresso.jpg';
import juna from '@/assets/images/songImages/Juna.jpeg';
import lalalala from '@/assets/images/songImages/LALALALA.jpeg';



const FeedScreen = () => {

    const [posts, setPosts] = useState([
        {id: '1', username: 'Carl Smith', songName: 'Espresso', albumCover: espresso,artist: 'Sabrina Carpenter'},
        {id: '2', username: 'Gloria Shell', songName: 'Juna', albumCover: juna, artist: 'Clairo'},
        {id: '3', username: 'Aria Coolidge', songName: 'LALALALA', albumCover: lalalala, artist: 'Stray Kids'},
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
                            
                        <Text style = {styles.postUsername}>
                            {item.username}
                        </Text>
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
    postUsername: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        paddingLeft: 2,
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

    image: {
        width: 300,
        height: 300,
        borderRadius: 9,
    },
})

export default FeedScreen;