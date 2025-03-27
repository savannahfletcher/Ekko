import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useRouter, usePathname } from "expo-router";
import Icon from "react-native-vector-icons/FontAwesome";


const Navbar = () => {
    const router = useRouter();
    const pathname = usePathname(); // Get current page

    return (
        <View style={styles.navbar}>
            <TouchableOpacity
                onPress={() => router.push("/feed")}
                style={styles.navButton} >
                <Icon style={[styles.navbarIcon, pathname === "/feed" && styles.active]} name="home" size={30} color="#000" />
                    
                {/* <Text style={styles.navText}>🏠</Text> */}
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => router.push("/post")}
                style={styles.navButton} >
                    <Icon style={[styles.navbarIcon, pathname === "/post" && styles.active]} name="plus-square-o" size={30} color="#000" />
                {/* <Text style={styles.navText}>➕</Text> */}
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => router.push("/profile")} // change when we have a profile page
                style={styles.navButton} >
                    <Icon style={[styles.navbarIcon, pathname === "/profile" && styles.active]} name="user-circle" size={30} color="#000" />
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
        height: 60,
        backgroundColor: "#2F2F2F",
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        borderTopWidth: 1,
        borderTopColor: "#444",
    },
    navButton: {
        padding: 10,
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 5,
    },
    navText: {
        fontSize: 24,
        color: "#fff",
    },
    navbarIcon: {
        fontSize: 30,
        color: "#CAC4D0",
    },
    active: {
        color: "#E6349C",
    },
});

export default Navbar;