import { Stack, usePathname } from "expo-router";
import { View, StyleSheet, Platform } from "react-native";
import Navbar from './components/Navbar';

export const unstable_settings = {
  initialRouteName: "index",
  basePath: "/Ekko",
};

const RootLayout = () => {
  const pathname = usePathname();
  const hideNavbar = ["/", "/login", "/register"];

  const isMobileWeb = Platform.OS === "web" && window.innerWidth < 768;

  return (
    <View style={styles.appWrapper}>
      <View style={styles.appContainer}>
    <Stack 
      screenOptions={{
        headerShown: !isMobileWeb, // hide header on mobile web
        headerStyle: {
          backgroundColor: '#2f2f2f',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontSize: 20,
          fontWeight: 'bold',
        },
        contentStyle: {
          // paddingHorizontal: 10,
          // paddingTop: 10,
          backgroundColor: '#fff',
          maxWidth: 400,
        },
      }}>

      {isMobileWeb && (
        <View style={styles.customHeader}>
          <Text style={styles.ekkoText}>Ekko</Text>
        </View>
      )}

      <Stack.Screen name = 'index' options = {{title: 'Ekko Home'}} />
      <Stack.Screen name = 'register' options = {{headerTitle: 'Register'}} />
      <Stack.Screen name = 'login' options = {{headerTitle: 'Login'}} />
      <Stack.Screen name = 'feed' options = {({ route }) => ({ headerTitle: 'Feed', animation: route.params?.instant ? 'none' : 'default', })} />
      <Stack.Screen name = 'post' options = {({ route }) => ({ headerTitle: 'Search', animation: route.params?.instant ? 'none' : 'default', })} />
      <Stack.Screen name = 'profile' options = {({ route }) => ({ headerTitle: 'Profile', animation: route.params?.instant ? 'none' : 'default', })} />
      <Stack.Screen name = 'friendProfile' options = {({ route }) => ({ headerTitle: 'FriendProfile', animation: route.params?.instant ? 'none' : 'default', })} />
    </Stack>

    {!hideNavbar.includes(pathname) && <Navbar />}
    </View>
    </View>
  );
};

const styles = StyleSheet.create({
  appWrapper: {
    flex: 1,
    backgroundColor: '#111', // outer background color
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  appContainer: {
    flex: 1,
    maxWidth: 400,
    width: '100%',
    backgroundColor: '#fff',
  },
  customHeader: {
    backgroundColor: '#2f2f2f',
    width: '100%',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  ekkoText: {
    fontSize: 36,
    color: '#fff',
    textAlign: 'center',
    fontFamily: 'MontserratAlternates-ExtraBold',
    padding: 10,
  },
});

export default RootLayout;