import React, { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { View, TextInput, ScrollView, Text, StyleSheet, Image , TouchableOpacity } from 'react-native';
import { auth,storage, db  } from '../../firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, doc, setDoc, getDoc,getDocs } from "firebase/firestore";
import { query, where } from "firebase/firestore";

import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator"; // ✅ Import Image Manipulator
import {useRouter} from 'expo-router';
import { useFonts } from 'expo-font';
import Icon from "react-native-vector-icons/FontAwesome";

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [username, setUsername] = useState("");
  const [profilePic, setProfilePic] = useState<string | null>(null); // takes string or null

  const router = useRouter();

  const [fontsLoaded] = useFonts({
    'MontserratAlternates-ExtraBold': require('./../../assets/fonts/MontserratAlternates-ExtraBold.ttf'), // Adjust the path to your font file
  });
  
  if (!fontsLoaded) {
    return <Text>Loading fonts...</Text>; // Show a loading screen while the font is loading
  }

  // ✅ Function to map Firebase error codes to user-friendly messages
  const getErrorMessage = (error: any) => {
    console.error("Firebase Error:", error); // ✅ Debugging

    if (error?.code) {
      switch (error.code) {
        case 'auth/user-not-found':
          return '⚠️ Username not found. Please sign up.';
        case 'auth/invalid-email':
          return '⚠️ Invalid email format. Please enter a valid email.';
        case 'auth/wrong-password':
        case 'auth/invalid-credential':  
          return '⚠️ Incorrect password. Or user not found. Please try again.';
        case 'auth/email-already-in-use':
          return '⚠️ This username already exists. Try logging in.';
        case 'auth/weak-password':
          return '⚠️ Password should be at least 6 characters.';
        default:
          return `⚠️ An unexpected error occurred: ${error.message}`;
      }
    }
    return '⚠️ An unknown error occurred. Please try again.';
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,  // ✅ Fix mediaType
      allowsEditing: true,
      aspect: [4, 4],
      quality: 0.3,
    });
  
    console.log("🔥 DEBUG: ImagePicker result:", result);
  
    if (!result.canceled) {
      const manipResult = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [
          { resize: { width: 300 } }, // Resize by width first
          { crop: { originX: 0, originY: 0, width: 300, height: 300 } }, // Crop to square
        ],
        { base64: true, compress: 0.3 }
      );
  
      console.log("🔥 DEBUG: Manipulated Image:", manipResult);
  
      if (manipResult.base64) {
        console.log("✅ DEBUG: Base64 image size:", manipResult.base64.length);
        setProfilePic(`data:image/jpeg;base64,${manipResult.base64}`);
      } else {
        console.error("❌ ERROR: Image conversion to Base64 failed.");
      }
    }
  };

  // Reroutes user to the login page
  const handleBackToLogin = () => {
    router.replace('./login');
  };
  

  // ✅ Signup function with specific error handling
  const handleSignup = async () => {
    setError('');
    setMessage('');

    try {
       // ✅ Check if username is taken
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", username));
      const querySnapshot = await getDocs(q);

      if (!username) {
        setError("⚠️ Username is required.");
        return;
      }

      if (!email || !password) {
        setError("⚠️ Email and password are required.");
        return;
      }
      if (!querySnapshot.empty) {
        setError("⚠️ That username is already taken. Please choose another.");
        return;
      }

      console.log("🔥 DEBUG: Creating user...");
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("✅ DEBUG: User created:", user.uid);
  
      // console.log("🔥 DEBUG: Uploading profile image...");
      // const profilePicUrl = await uploadImage(user.uid);
  
      console.log("🔥 DEBUG: Storing user data in Firestore...");
      await setDoc(doc(collection(db, "users"), user.uid), {
        username: username,
        email: email,
        profilePic: profilePic|| "",
      });
  
      console.log("✅ DEBUG: User data saved to Firestore!");
  
      setMessage("✅ Account created successfully!");
      router.replace('./feed');
    } catch (err: any) {
      console.error("❌ ERROR: Firestore Error:", err);
      setError(`⚠️ ${err.message}`);
    }
  };
  

  const fetchUserData = async (uid: string) => {
    try {
      console.log("🔥 DEBUG: Fetching user data from Firestore...");
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);
  
      if (userSnap.exists()) {
        console.log("✅ DEBUG: User Data:", userSnap.data());
        return userSnap.data();
      } else {
        console.warn("⚠️ WARNING: No user found in Firestore!");
        return null;
      }
    } catch (err) {
      console.error("❌ ERROR: Firestore fetch failed:", err);
      return null;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style = {styles.ekkoText}> Ekko </Text>
      <Text style = {styles.topText}>
        Welcome to Ekko! Let's create your account!
        </Text>
        <LinearGradient
          colors={['#3A0398', '#150F29']} // Example gradient colors
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.7 }}
          style={styles.loginBox}
          >
       <Text style={styles.promptText}>Username:</Text>
      <TextInput
        style={styles.inputBox}
        placeholder="Enter username"
        value={username}
        onChangeText={setUsername}
      />
          
      <Text style={styles.promptText}>Email:</Text>
      <TextInput
        style={styles.inputBox}
        placeholder="Enter email"
        value={email}
        onChangeText={setEmail}
      />

      <Text style={styles.promptText}>Password:</Text>
      <TextInput
        style={styles.inputBox}
        placeholder="Enter password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
          
      <View style={{ padding: 10}}></View>

      <TouchableOpacity style={styles.loginButton} onPress={pickImage}>
          <Text style={styles.optionalButtonText}>OPTIONAL: SELECT PROFILE PICTURE</Text>
      </TouchableOpacity>
      
      {/* the variable, profilePic holds the user selected image  */}
      {profilePic && <Image source={{ uri: profilePic }} style={{ width: 100, height: 100, marginTop: 10 }} />}
      <View style={{ padding: 20}}></View>
      <TouchableOpacity style={styles.loginButton} onPress={handleSignup}>
          <Text style={styles.loginButtonText}>SIGNUP</Text>
      </TouchableOpacity>

      {message ? <Text style={{ color: 'green', marginTop: 10 }}>{message}</Text> : null}
      {error ? <Text style={{ color: 'red', marginTop: 10 }}>{error}</Text> : null}

      <TouchableOpacity onPress={handleBackToLogin}>
          <Text style={styles.backToLoginText}>
            Already have an account? Login here!
          </Text>
      </TouchableOpacity>

      </LinearGradient>
    </ScrollView>
  );
}

const styles = StyleSheet.create ({
  container: {
      flex: 1,
      padding: 20,
      backgroundColor: '#2f2f2f',
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
  topText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    padding: 20,
  },
  promptText: {
      fontSize: 17,
      color: '#fff',
      paddingLeft: 2,
      paddingTop: 10,
  },
  inputBox: {
    borderWidth: 1, 
    padding: 10, 
    marginVertical: 5 ,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  loginButton: {
    backgroundColor: '#4221D6',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  optionalButtonText:{
    color: '#fff',
    fontSize: 16,
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  backToLoginText: {
      fontSize: 16,
      color: '#A7A7A7',
      paddingTop: 30,
      paddingLeft: 5,
      paddingBottom: 5,
  },
})

export default Register;
