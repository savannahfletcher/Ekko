import React from 'react';
import { Modal, View, Text, TextInput, ScrollView, Image, StyleSheet, TouchableWithoutFeedback} from 'react-native';

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
  handleAddFriend: (user: User) => void;
  handleRemoveFriend: (id: string) => void;
}

const FriendsOfFriendsModal: React.FC<Props> = ({
  visible,
  onClose,
  friendsList,
  currentFriends,
  userId,
}) => {
  return (
    
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.friendModalOverlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.friendModalContent}>
                <Text style={styles.modalTitle}>User's Friends</Text>

                <ScrollView style={{ maxHeight: '70%' }}>
                    {friendsList.map((friend) => (
                        <View key={friend.userID} style={styles.friendItem}>
                          <Image
                            source={
                              friend.profilePic
                                ? { uri: friend.profilePic }
                                : require('@/assets/images/profileImages/image.png')
                            }
                            style={styles.friendPic}
                          />
                          <Text style={styles.friendName}>@{friend.username}</Text>
                        </View>
                      ))} 
                </ScrollView>

                <Text style={styles.cancelBtn} onPress={onClose}>
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

export default FriendsOfFriendsModal;
