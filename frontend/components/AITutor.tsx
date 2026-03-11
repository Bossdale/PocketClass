import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Keyboard, 
  Platform 
} from 'react-native';
import { MessageCircle, X, Bot, Send, Mic } from 'lucide-react-native';

// Assuming these are your local imports
import { getChatHistory, saveChatMessage, generateId } from '@/lib/store';
import { getAITutorResponse } from '@/lib/quizService';
import type { ChatMessage } from '@/lib/types';

interface AITutorProps {
  lessonId: string;
  lessonTitle: string;
}

const AITutor: React.FC<AITutorProps> = ({ lessonId, lessonTitle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
      const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
     const onShow = (e: any) => setKeyboardHeight(e.endCoordinates.height);
     const onHide = () => setKeyboardHeight(0);
     const showSub = Keyboard.addListener(showEvent, onShow);
     const hideSub = Keyboard.addListener(hideEvent, onHide);
   return () => { showSub.remove(); hideSub.remove(); };
 }, []);

  useEffect(() => {
    async function loadHistory() {
      try {
        // Await the asynchronous storage call
        const history = await getChatHistory(lessonId);
        setMessages(history || []);
      } catch (error) {
        console.error("Failed to load chat history:", error);
        setMessages([]);
      }
    }
    loadHistory();
  }, [lessonId]);

  useEffect(() => {
    // Scroll to bottom when messages or typing state changes
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isTyping]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = {
      id: generateId(),
      lessonId,
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMsg]);
    saveChatMessage(userMsg);
    setInput('');
    setIsTyping(true);

    const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
    const response = await getAITutorResponse(lessonTitle, history);

    const tutorMsg: ChatMessage = {
      id: generateId(),
      lessonId,
      role: 'tutor',
      content: response,
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, tutorMsg]);
    saveChatMessage(tutorMsg);
    setIsTyping(false);
  };

  // 1. The Floating Action Button (Closed State)
  if (!isOpen) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.fab}
        onPress={() => setIsOpen(true)}
      >
        <MessageCircle color="#ffffff" size={24} />
      </TouchableOpacity>
    );
  }

  // 2. The Chat Modal (Open State)
  return (
    <View style={[styles.modalContainer, { bottom: 24 + keyboardHeight }]}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIconContainer}>
            <Bot color="#2563eb" size={20} />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>AI Tutor</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1} ellipsizeMode="tail">
              {lessonTitle}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={() => setIsOpen(false)}
          >
            <X color="#64748b" size={20} />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView 
          ref={scrollRef} 
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.length === 0 && !isTyping && (
            <View style={styles.emptyState}>
              <Bot color="#cbd5e1" size={48} style={styles.emptyIcon} />
              <Text style={styles.emptyTitle}>Hi! I'm your AI tutor.</Text>
              <Text style={styles.emptySubtitle}>Ask me anything about this lesson!</Text>
            </View>
          )}

          {messages.map(msg => {
            const isUser = msg.role === 'user';
            return (
              <View 
                key={msg.id} 
                style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowTutor]}
              >
                <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleTutor]}>
                  <Text style={isUser ? styles.bubbleTextUser : styles.bubbleTextTutor}>
                    {msg.content}
                  </Text>
                </View>
              </View>
            );
          })}

          {isTyping && (
            <View style={[styles.messageRow, styles.messageRowTutor]}>
              <View style={[styles.bubble, styles.bubbleTutor, styles.typingBubble]}>
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputArea}>
          <TouchableOpacity style={styles.iconButton}>
            <Mic color="#64748b" size={20} />
          </TouchableOpacity>
          
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={sendMessage}
            placeholder="Ask a question..."
            placeholderTextColor="#94a3b8"
            returnKeyType="send"
          />
          
          <TouchableOpacity
            onPress={sendMessage}
            disabled={!input.trim()}
            style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
          >
            <Send color="#ffffff" size={18} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// --- STYLES ---
// Colors mapped to match standard Tailwind (Blue / Slate themes)
const colors = {
  primary: '#2563eb', // Blue 600
  primaryForeground: '#ffffff',
  accent: '#f1f5f9', // Slate 100
  accentForeground: '#0f172a', // Slate 900
  foreground: '#0f172a',
  mutedForeground: '#64748b', // Slate 500
  border: '#e2e8f0', // Slate 200
  background: '#ffffff',
};

const styles = StyleSheet.create({
  // Floating Action Button
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    zIndex: 50,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  
  // Modal Layout
  modalContainer: {
    position: 'absolute',
    top: 80,
    bottom: 24,
    left: 16,
    right: 16,
    zIndex: 50,
  },
  card: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)', // Subtle glass effect border
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(37, 99, 235, 0.1)', // Primary with 10% opacity
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },

  // Messages Area
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyIcon: {
    marginBottom: 12,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.mutedForeground,
  },

  // Chat Bubbles
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowTutor: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bubbleUser: {
    backgroundColor: colors.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 4, // Tail
  },
  bubbleTutor: {
    backgroundColor: colors.accent,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 4, // Tail
    borderBottomRightRadius: 20,
  },
  bubbleTextUser: {
    color: colors.primaryForeground,
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextTutor: {
    color: colors.accentForeground,
    fontSize: 14,
    lineHeight: 20,
  },

  // Typing Indicator (Static Approximation)
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 16,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.mutedForeground,
    opacity: 0.5,
  },

  // Input Area
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.foreground,
    marginHorizontal: 8,
    maxHeight: 100, // Allows text input to grow but not indefinitely
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.3,
  },
});

export default AITutor;