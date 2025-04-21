import { View, TouchableOpacity, Text, StyleSheet, Image, } from "react-native";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "expo-router";
import Icon from "react-native-vector-icons/FontAwesome";
import { auth, db } from "../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";


const Navbar = () => {
    const router = useRouter();
    const pathname = usePathname(); // Get current page
    const [profilePic, setProfilePic] = useState(null);

    useEffect(() => {
        const fetchProfilePic = async () => {
            const user = auth.currentUser;
            if (user) {
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.profilePic) {
                        setProfilePic(data.profilePic);
                    }
                }
            }
        };
        fetchProfilePic();
    }, []);

    return (
        <View style={styles.navbar}>
            <TouchableOpacity
                onPress={() => router.replace({
                    pathname: "/feed",
                    params: { instant: true },
                  })}
                style={styles.navButton} >
                <Icon style={[styles.navbarIcon, pathname === "/feed" && styles.active]} name="home" size={30} color="#000" />
                    
                {/* <Text style={styles.navText}>🏠</Text> */}
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => router.replace({
                    pathname: "/post",
                    params: { instant: true },
                  })}
                style={styles.navButton} >
                    <Icon style={[styles.navbarIcon, pathname === "/post" && styles.active]} name="plus-square-o" size={30} color="#000" />
                {/* <Text style={styles.navText}>➕</Text> */}
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => router.replace({
                    pathname: "/profile",
                    params: { instant: true },
                  })}
                style={styles.navButton} >
                    {profilePic ? (
                        <Image
                            source={{ uri: profilePic }}
                            style={[
                                styles.profileImage,
                                styles.navbarIcon,
                                pathname === "/profile" && styles.activeBorder
                            ]}
                            resizeMode="cover"
                        />
                    ) : (
                    <Icon style={[styles.navbarIcon, pathname === "/profile" && styles.active]} name="user-circle" size={30} color="#000" />
                    )}
                    {/* <Text style={styles.navText}>👤</Text> */}
            </TouchableOpacity>
        </View>
    );

};

const styles = StyleSheet.create({
    navbar: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
        backgroundColor: "#2F2F2F",
        flexDirection: "row",
        alignItems: "center",
        borderTopWidth: 1,
        borderTopColor: "#444",
    },
    navButton: {
        flex: 1,
        padding: 10,
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 5,
        alignContent: "center",
    },
    navText: {
        fontSize: 24,
        color: "#fff",
    },
    navbarIcon: {
        fontSize: 30,
        color: "#CAC4D0",
        alignSelf: "center",
    },
    active: {
        color: "#E6349C",
    },
    profileImage: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: "transparent",
    },
    
    activeBorder: {
        borderColor: "#E6349C",
    },
});

export default Navbar;