import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '../../providers/AuthProvider';
import { apiRequest, showApiError } from '../../utils/api';

interface Message {
  id: number;
  message: string;
  sender: {
    id: number;
    name: string;
  };
  timestamp: string;
  message_type: string;
}

interface ChatRoom {
  id: number;
  name: string;
  other_user: {
    id: number;
    name: string;
    email: string;
  };
  last_message: {
    text: string | null;
    timestamp: string | null;
    sender: string | null;
  };
  updated_at: string;
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  
  console.log('ChatScreen cargado con ID:', id);
  console.log('Usuario actual:', user);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const fetchMessages = async () => {
    try {
      const result = await apiRequest<{success: boolean, messages: Message[]}>(`/api/chat/${id}/messages/`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });

      if (result.error) {
        showApiError(result.error, 'Error al cargar mensajes');
        return;
      }

      setMessages(result.data?.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChatRoom = async () => {
    try {
      // Obtener todas las salas y encontrar la específica
      const result = await apiRequest<{success: boolean, rooms: ChatRoom[]}>(`/api/chat/rooms/`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });

      if (result.error) {
        showApiError(result.error, 'Error al cargar información del chat');
        return;
      }

      console.log('Chat rooms result:', result.data);

      // Encontrar la sala específica por ID
      const rooms = result.data?.rooms || [];
      const room = rooms.find((room: ChatRoom) => room.id.toString() === id);
      setChatRoom(room || null);
    } catch (error) {
      console.error('Error fetching chat room:', error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchChatRoom();
      fetchMessages();
    }
  }, [id]);

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const result = await apiRequest(`/api/chat/${id}/send/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: newMessage.trim(),
          message_type: 'text',
        }),
      });

      if (result.error) {
        showApiError(result.error, 'Error al enviar mensaje');
        return;
      }

      // Agregar el nuevo mensaje a la lista
      if (result.data && typeof result.data === 'object' && 'message' in result.data) {
        setMessages(prev => [...prev, (result.data as any).message as Message]);
      }

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'No se pudo enviar el mensaje');
    } finally {
      setSending(false);
    }
  };

  const getOtherParticipant = () => {
    if (!chatRoom) return null;
    return chatRoom.other_user;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.sender.id.toString() === user?.id;
    
    console.log('Message debug:', {
      messageId: item.id,
      senderId: item.sender.id,
      senderName: item.sender.name,
      userId: user?.id,
      userName: user?.name,
      isOwnMessage: isOwnMessage,
      message: item.message
    });
    
    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownBubble : styles.otherBubble
        ]}>
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {item.message}
          </Text>
          <Text style={[
            styles.messageTime,
            isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
          ]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#34eb89" />
        <Text style={styles.loadingText}>Cargando chat...</Text>
      </View>
    );
  }

  const otherParticipant = getOtherParticipant();

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>
            {otherParticipant?.name || 'Chat'}
          </Text>
          <Text style={styles.headerStatus}>En línea</Text>
        </View>
        
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Escribe un mensaje..."
          placeholderTextColor="#666"
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!newMessage.trim() || sending) && styles.sendButtonDisabled
          ]}
          onPress={sendMessage}
          disabled={!newMessage.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#1c1c1c" />
          ) : (
            <Ionicons name="send" size={20} color="#1c1c1c" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c1c',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1c1c1c',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 15,
    backgroundColor: '#1c1c1c',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  backButton: {
    marginRight: 15,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerStatus: {
    fontSize: 14,
    color: '#34eb89',
  },
  moreButton: {
    marginLeft: 15,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  messageContainer: {
    marginVertical: 5,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  ownBubble: {
    backgroundColor: '#34eb89',
  },
  otherBubble: {
    backgroundColor: '#2a2a2a',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#1c1c1c',
  },
  otherMessageText: {
    color: '#ffffff',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 5,
  },
  ownMessageTime: {
    color: '#1c1c1c',
    opacity: 0.7,
  },
  otherMessageTime: {
    color: '#999',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#1c1c1c',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    color: '#ffffff',
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#34eb89',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#666',
  },
}); 