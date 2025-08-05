import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '../../providers/AuthProvider';
import { apiRequest, showApiError } from '../../utils/api';
import { useChatUpdate } from '../../hooks/useChatUpdate';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

interface Message {
  id: number;
  message: string;
  sender: {
    id: number;
    name: string;
  };
  timestamp: string;
  message_type: string;
  audio_file?: string;
  audio_duration?: number;
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

  // Audio recording state
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [playingAudio, setPlayingAudio] = useState<number | null>(null);
  const [audioPlayer, setAudioPlayer] = useState<Audio.Sound | null>(null);
  const recordingInterval = useRef<number | null>(null);

  const fetchMessages = useCallback(async () => {
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
  }, [id, user?.token]);

  const fetchChatRoom = useCallback(async () => {
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
  }, [id, user?.token]);

  // Usar el hook de actualización automática para mensajes
  useChatUpdate({
    onUpdate: fetchMessages,
    interval: 2000, // Actualizar cada 2 segundos
  });

  const markMessagesAsRead = async () => {
    try {
      await apiRequest(`/api/chat/${id}/read/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchChatRoom();
      fetchMessages();
      // Marcar mensajes como leídos cuando se abre el chat
      markMessagesAsRead();
    }
  }, [id, fetchChatRoom, fetchMessages]);

  // Cleanup audio resources on unmount
  useEffect(() => {
    return () => {
      if (audioPlayer) {
        audioPlayer.unloadAsync();
      }
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    };
  }, [audioPlayer]);

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const result = await apiRequest<{success: boolean, message: Message}>(`/api/chat/${id}/send/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: newMessage.trim(),
        }),
      });

      if (result.error) {
        showApiError(result.error, 'Error al enviar mensaje');
        return;
      }

      setNewMessage('');
      setTimeout(() => {
        fetchMessages();
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  // Audio recording functions
  const startRecording = async () => {
    try {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos requeridos', 'Necesitamos permisos de micrófono para grabar audio');
        return;
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration timer
      recordingInterval.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'No se pudo iniciar la grabación');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
        recordingInterval.current = null;
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (uri && recordingDuration > 0) {
        await sendAudioMessage(uri, recordingDuration);
      }

      setRecordingDuration(0);
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'No se pudo detener la grabación');
    }
  };

  const sendAudioMessage = async (audioUri: string, duration: number) => {
    try {
      setSending(true);

      // Create form data
      const formData = new FormData();
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'audio.m4a',
      } as any);
      formData.append('duration', duration.toString());

      const result = await apiRequest<{success: boolean, message: Message}>(`/api/chat/${id}/send-audio/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (result.error) {
        showApiError(result.error, 'Error al enviar audio');
        return;
      }

      setTimeout(() => {
        fetchMessages();
      }, 100);
    } catch (error) {
      console.error('Error sending audio:', error);
      Alert.alert('Error', 'No se pudo enviar el audio');
    } finally {
      setSending(false);
    }
  };

  const playAudio = async (audioUrl: string, messageId: number) => {
    try {
      // Stop any currently playing audio
      if (audioPlayer) {
        await audioPlayer.unloadAsync();
      }

      setPlayingAudio(messageId);
      const { sound } = await Audio.Sound.createAsync({ uri: audioUrl });
      setAudioPlayer(sound);

      await sound.playAsync();

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingAudio(null);
          setAudioPlayer(null);
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'No se pudo reproducir el audio');
      setPlayingAudio(null);
    }
  };

  const stopAudio = async () => {
    if (audioPlayer) {
      await audioPlayer.stopAsync();
      await audioPlayer.unloadAsync();
      setAudioPlayer(null);
    }
    setPlayingAudio(null);
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
    const isOwnMessage = item.sender.id === user?.id;

    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownBubble : styles.otherBubble
        ]}>
          {item.message_type === 'audio' && item.audio_file ? (
            <View style={styles.audioContainer}>
                             <TouchableOpacity
                 style={styles.audioMessageButton}
                 onPress={() => {
                  if (playingAudio === item.id) {
                    stopAudio();
                  } else {
                    playAudio(item.audio_file!, item.id);
                  }
                }}
              >
                <Ionicons 
                  name={playingAudio === item.id ? "pause" : "play"} 
                  size={24} 
                  color={isOwnMessage ? "#1c1c1c" : "#ffffff"} 
                />
              </TouchableOpacity>
              <View style={styles.audioInfo}>
                <Text style={[
                  styles.audioText,
                  isOwnMessage ? styles.ownMessageText : styles.otherMessageText
                ]}>
                  {playingAudio === item.id ? "Reproduciendo..." : "Audio"}
                </Text>
                {item.audio_duration && (
                  <Text style={[
                    styles.audioDuration,
                    isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
                  ]}>
                    {Math.floor(item.audio_duration)}s
                  </Text>
                )}
              </View>
            </View>
          ) : (
            <Text style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText
            ]}>
              {item.message}
            </Text>
          )}
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
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
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
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Input */}
        <View style={styles.inputContainer}>
          {isRecording ? (
            <View style={styles.recordingContainer}>
              <View style={styles.recordingIndicator}>
                <Ionicons name="mic" size={20} color="#ff4444" />
                <Text style={styles.recordingText}>
                  Grabando... {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.stopRecordingButton}
                onPress={stopRecording}
              >
                <Ionicons name="stop" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={styles.audioButton}
                onPress={startRecording}
                disabled={sending}
              >
                <Ionicons name="mic" size={24} color="#34eb89" />
              </TouchableOpacity>
              
              <TextInput
                style={styles.textInput}
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder="Escribe un mensaje..."
                placeholderTextColor="#666"
                multiline
                maxLength={500}
                textAlignVertical="top"
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
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1c1c1c',
  },
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
    minHeight: 70,
  },
  audioButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#34eb89',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginRight: 10,
    color: '#ffffff',
    fontSize: 16,
    maxHeight: 100,
    minHeight: 40,
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
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  audioMessageButton: {
    marginRight: 10,
  },
  audioInfo: {
    flex: 1,
  },
  audioText: {
    fontSize: 14,
    color: '#999',
  },
  audioDuration: {
    fontSize: 12,
    color: '#999',
  },
  recordingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    flex: 1,
    marginRight: 10,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  recordingText: {
    fontSize: 14,
    color: '#ffffff',
    marginLeft: 5,
  },
  stopRecordingButton: {
    marginLeft: 10,
  },
}); 