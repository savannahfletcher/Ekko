import { Stack } from 'expo-router';

const PostLayout = () => {
    return ( 
    <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ title: "Post a Song" }} />
    </Stack>
    )
}

export default PostLayout;