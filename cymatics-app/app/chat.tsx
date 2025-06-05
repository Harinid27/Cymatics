import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface Message {
  id: string;
  text: string;
  timestamp: string;
  isOwn: boolean;
  avatar?: string;
}

const mockMessages: Message[] = [
  {
    id: '1',
    text: 'This is the main chat template',
    timestamp: 'Nov 30, 2023, 9:41 AM',
    isOwn: false,
  },
  {
    id: '2',
    text: 'Oh?',
    timestamp: '',
    isOwn: true,
  },
  {
    id: '3',
    text: 'Cool',
    timestamp: '',
    isOwn: true,
  },
  {
    id: '4',
    text: 'How does it work?',
    timestamp: '',
    isOwn: false,
  },
  {
    id: '5',
    text: 'You just edit any text to type in the conversation you want to show, and delete any bubbles you don\'t want to use',
    timestamp: '',
    isOwn: false,
  },
  {
    id: '6',
    text: 'Boom!',
    timestamp: '',
    isOwn: false,
  },
  {
    id: '7',
    text: 'Hmmm',
    timestamp: '',
    isOwn: true,
  },
  {
    id: '8',
    text: 'I think I get it',
    timestamp: '',
    isOwn: true,
  },
  {
    id: '9',
    text: 'Will head to the Help Center if I have more questions tho',
    timestamp: '',
    isOwn: false,
  },
];

export default function ChatScreen() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(mockMessages);
  const flatListRef = useRef<FlatList>(null);

  const handleBackPress = () => {
    router.back();
  };

  const handleCallPress = () => {
    // Handle call action
    console.log('Call pressed');
  };

  const handleVideoCallPress = () => {
    // Handle video call action
    console.log('Video call pressed');
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: message.trim(),
        timestamp: '',
        isOwn: true,
      };
      setMessages([...messages, newMessage]);
      setMessage('');
      // Scroll to bottom after sending message
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const showTimestamp = item.timestamp !== '';

    return (
      <View style={styles.messageContainer}>
        {showTimestamp && (
          <View style={styles.timestampContainer}>
            <Text style={styles.timestampText}>{item.timestamp}</Text>
          </View>
        )}

        <View style={[
          styles.messageBubbleContainer,
          item.isOwn ? styles.ownMessageContainer : styles.otherMessageContainer
        ]}>
          {!item.isOwn && (
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>VY</Text>
              </View>
            </View>
          )}

          <View style={[
            styles.messageBubble,
            item.isOwn ? styles.ownMessageBubble : styles.otherMessageBubble
          ]}>
            <Text style={[
              styles.messageText,
              item.isOwn ? styles.ownMessageText : styles.otherMessageText
            ]}>
              {item.text}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.contactInfo}>
            <View style={styles.contactAvatar}>
              <Text style={styles.contactAvatarText}>VY</Text>
            </View>
            <View style={styles.contactDetails}>
              <Text style={styles.contactName}>VY Vijay Yaso</Text>
              <Text style={styles.contactStatus}>Active 20m ago</Text>
            </View>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCallPress}>
            <MaterialIcons name="phone" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleVideoCallPress}>
            <MaterialIcons name="videocam" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Input Section */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <View style={styles.inputRow}>
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              value={message}
              onChangeText={setMessage}
              placeholder="Message..."
              placeholderTextColor="#999"
              multiline
              maxLength={1000}
            />
          </View>

          <View style={styles.inputActions}>
            <TouchableOpacity style={styles.inputActionButton}>
              <MaterialIcons name="mic" size={24} color="#999" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.inputActionButton}>
              <MaterialIcons name="emoji-emotions" size={24} color="#999" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.inputActionButton}>
              <MaterialIcons name="photo-camera" size={24} color="#999" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginTop: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerCenter: {
    flex: 1,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  contactStatus: {
    fontSize: 14,
    color: '#666',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  messagesList: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageContainer: {
    marginBottom: 16,
  },
  timestampContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  timestampText: {
    fontSize: 12,
    color: '#999',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messageBubbleContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  ownMessageBubble: {
    backgroundColor: '#000',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#e5e5ea',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#000',
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    minHeight: 40,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 16,
    color: '#000',
    maxHeight: 100,
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputActionButton: {
    padding: 8,
    marginLeft: 4,
  },
});
