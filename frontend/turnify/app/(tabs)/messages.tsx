import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../providers/AuthProvider';
import { apiRequest, showApiError } from '../../utils/api';
import { router } from 'expo-router';
import { useChatUpdate } from '../../hooks/useChatUpdate';

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
    sender_id: number | null;
  };
  updated_at: string;
  unread_count: number;
}

export default function MessagesScreen() {
  const { user } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchChatRooms = useCallback(async () => {
    try {
      const result = await apiRequest<{success: boolean, rooms: ChatRoom[]}>('/api/chat/rooms/', {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });

      if (result.error) {
        showApiError(result.error, 'Error al cargar chats');
        return;
      }

      // Filtrar solo chats que tienen mensajes
      const allRooms = result.data?.rooms || [];
      console.log('Todos los chats recibidos:', allRooms.length);
      
      const roomsWithMessages = allRooms.filter(room => {
        const hasMessages = room.last_message && 
          room.last_message.text && 
          room.last_message.text.trim() !== '';
        
        console.log(`Chat ${room.id} (${room.other_user?.name}): ${hasMessages ? 'Tiene mensajes' : 'Sin mensajes'}`);
        return hasMessages;
      });

      console.log(`Chats con mensajes: ${roomsWithMessages.length} de ${allRooms.length}`);
      setChatRooms(roomsWithMessages);
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.token]);

  // Usar el hook de actualización automática
  useChatUpdate({
    onUpdate: fetchChatRooms,
    interval: 3000, // Actualizar cada 3 segundos
  });

  useEffect(() => {
    fetchChatRooms();
  }, [fetchChatRooms]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchChatRooms();
    setRefreshing(false);
  };

  const getOtherParticipant = (room: ChatRoom) => {
    return room.other_user;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 48) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  };

  const renderChatRoom = ({ item }: { item: ChatRoom }) => {
    const otherParticipant = getOtherParticipant(item);
    const isOwnMessage = item.last_message?.sender_id?.toString() === user?.id;
    
    return (
      <TouchableOpacity
        style={styles.chatRoomItem}
        onPress={() => {
          // Navegar al chat individual
          console.log('Navegando al chat con ID:', item.id);
          try {
            router.push(`/chat/${item.id}`);
            console.log('Navegación exitosa');
          } catch (error) {
            console.error('Error en navegación:', error);
          }
        }}
      >
        <View style={styles.avatarContainer}>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={24} color="#666" />
          </View>
          {item.unread_count > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>
                {item.unread_count > 99 ? '99+' : item.unread_count}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.participantName}>
              {otherParticipant.name}
            </Text>
            {item.last_message?.timestamp && (
              <Text style={styles.timestamp}>
                {formatTime(item.last_message.timestamp)}
              </Text>
            )}
          </View>

          {item.last_message && item.last_message.text ? (
            <Text style={[
              styles.lastMessage,
              !isOwnMessage && item.unread_count > 0 && styles.unreadMessage
            ]} numberOfLines={1}>
              {isOwnMessage ? 'Tú: ' : ''}
              {item.last_message.text}
            </Text>
          ) : (
            <Text style={styles.noMessages}>No hay mensajes aún</Text>
          )}
        </View>

        <Ionicons name="chevron-forward" size={20} color="#666" />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando chats...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mensajes</Text>
        <TouchableOpacity
          style={styles.newChatButton}
          onPress={() => {
            // Navegar a la pantalla para crear nuevo chat
            router.push('/new-chat');
          }}
        >
          <Ionicons name="add" size={24} color="#34eb89" />
        </TouchableOpacity>
      </View>

      {chatRooms.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color="#666" />
          <Text style={styles.emptyTitle}>No tienes chats aún</Text>
          <Text style={styles.emptySubtitle}>
            Inicia una conversación con un profesional
          </Text>
          <TouchableOpacity
            style={styles.startChatButton}
            onPress={() => router.push('/new-chat')}
          >
            <Text style={styles.startChatButtonText}>Iniciar Chat</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={chatRooms}
          renderItem={renderChatRoom}
          keyExtractor={(item) => item.id.toString()}
          style={styles.chatList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c1c',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#1c1c1c',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  newChatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 30,
  },
  startChatButton: {
    backgroundColor: '#34eb89',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  startChatButtonText: {
    color: '#1c1c1c',
    fontSize: 16,
    fontWeight: 'bold',
  },
  chatList: {
    flex: 1,
  },
  chatRoomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff4757',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  unreadCount: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  lastMessage: {
    fontSize: 14,
    color: '#999',
  },
  unreadMessage: {
    color: '#ffffff',
    fontWeight: '600',
  },
  noMessages: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
}); 