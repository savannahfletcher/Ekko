import { React, useState } from 'react';
import { Modal, View, Text, TextInput, ScrollView, Image, StyleSheet, TouchableWithoutFeedback, TouchableOpacity, LayoutAnimation, UIManager, Platform } from 'react-native';
import { useRouter } from 'expo-router';

interface Friend {
  userID: string;
  username: string;
  profilePic?: string;
}

interface User {
  id: string;
  username: string;
  profilePic?: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  friendsList: Friend[];
  matchedUsers: User[];
  currentFriends: string[];
  userId: string;
  searchInput: string;
  searchForFriend: (text: string) => void;
  handleAddFriend: (user: User) => void;
  handleRemoveFriend: (id: string) => void;
}

const FriendsModal: React.FC<Props> = ({
  visible,
  onClose,
  friendsList,
  matchedUsers,
  currentFriends,
  userId,
  searchInput,
  searchForFriend,
  handleAddFriend,
  handleRemoveFriend,
}) => {
  const router = useRouter();

  // enable LayoutAnimation for Android
  if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
  
  const [newlyAddedFriendIds, setNewlyAddedFriendIds] = useState([]);
  
  const handleAddFriendLocal = async (user: User) => {
    await handleAddFriend(user);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setNewlyAddedFriendIds(prev => [...prev, user.id]);

    setTimeout(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setNewlyAddedFriendIds(prev => prev.filter(id => id !== user.id));
    }, 1500);
  };

  return (
    
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {
        onClose(); 
        setNewlyAddedFriendIds([]);
        searchForFriend("");
      }}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.friendModalOverlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.friendModalContent}>
                <Text style={styles.modalTitle}>Your Friends</Text>

                <TextInput
                  placeholder="Search for users"
                  placeholderTextColor="#aaa"
                  value={searchInput}
                  onChangeText={searchForFriend}
                  style={styles.searchInput}
                />

                <ScrollView style={{ maxHeight: '70%' }}>
                  {searchInput.trim() ? (
                    <>
                    <Text style={styles.sectionLabel}>Users</Text>
                      {matchedUsers.map((user) => (
                      <TouchableOpacity
                        key={user.id}
                        style={styles.friendItem}
                        onPress={() => router.push({ pathname: "/friendProfile", params: { userId: user.id } })}
                      >
                        <Image
                          source={
                            user.profilePic
                              ? { uri: user.profilePic }
                              : require('@/assets/images/profileImages/image.png')
                          }
                          style={styles.friendPic}
                        />
                        <Text style={styles.friendName}>@{user.username}</Text>
                        {user.id !== userId && (
                          currentFriends.includes(user.id) && !newlyAddedFriendIds.includes(user.id) ? null : (
                            newlyAddedFriendIds.includes(user.id) ? (
                              <Text style={[styles.addBtn, { color: "gray" }]}>Added!</Text>
                            ) : (
                              <TouchableOpacity
                                onPress={(event) => {
                                  event.stopPropagation?.();
                                  handleAddFriendLocal(user);
                                }}
                              >
                                <Text style={styles.addBtn}>Add Friend</Text>
                              </TouchableOpacity>
                            )
                          )
                        )}

                      </TouchableOpacity>    
                      ))}
                      </>
                    ) : (
                      <>
                      <Text style={styles.sectionLabel}>Friends</Text>
                      {friendsList.map((friend) => (
                        <TouchableOpacity
                          key={friend.userID}
                          style={styles.friendItem}
                          onPress={() => router.push({ pathname: "/friendProfile", params: { userId: friend.userID } })}
                        >
                          <Image
                            source={
                              friend.profilePic
                                ? { uri: friend.profilePic }
                                : require('@/assets/images/profileImages/image.png')
                            }
                            style={styles.friendPic}
                          />
                          <Text style={styles.friendName}>@{friend.username}</Text>
                          <TouchableOpacity
                            onPress={(event) => {
                              event.stopPropagation?.();
                              handleRemoveFriend(friend.userID);
                            }}
                          >
                            <Text style={styles.removeBtn}>Remove</Text>
                          </TouchableOpacity>
                        </TouchableOpacity>     
        
                      ))}
                      </>
                    )}
                </ScrollView>

                <Text style={styles.cancelBtn} onPress={() => { 
                  onClose(); 
                  setNewlyAddedFriendIds([]);
                  searchForFriend("");
                }}>
                  Close
                </Text>
              </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  friendModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  friendModalContent: {
    backgroundColor: '#222',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '75%',
    maxHeight: '90%',
    width: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: 'white',
  },
  sectionLabel: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 8,
    marginTop: 12,
    fontWeight: '600',
  },
  searchInput: {
    backgroundColor: '#333',
    color: 'white',
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  friendPic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    resizeMode: 'cover',
  },
  friendName: {
    color: 'white',
    fontSize: 16,
    flex: 1,
  },
  addBtn: {
    color: '#0af',
    fontWeight: 'bold',
  },
  removeBtn: {
    color: '#f66',
    fontWeight: 'bold',
  },
  cancelBtn: {
    color: '#aaa',
    marginTop: 15,
    textAlign: 'center',
  },
});

export default FriendsModal;
