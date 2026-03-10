import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Modal, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { MessageCircle, X, Bot, Send, Mic } from 'lucide-react-native';
import { getChatHistory, saveChatMessage, generateId } from '../lib/store';
import { getAITutorResponse } from '../lib/quizService';
import type { ChatMessage } from '../lib/types';

interface AITutorProps {
  lessonId: string;
  lessonTitle: string;
}

export default function AITutor({ lessonId, lessonTitle }: AITutorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Load chat history asynchronously
  useEffect(() => {
    async function loadHistory() {
      const history = await getChatHistory(lessonId);
      setMessages(history);
    }
    if (isOpen) {
      loadHistory();
    }
  }, [lessonId, isOpen]);

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
    setInput('');
    setIsTyping(true);
    
    // Auto-scroll down immediately after user sends
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    // Await the storage save
    await saveChatMessage(userMsg);

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
    setIsTyping(false);
    
    // Auto-scroll down after tutor replies
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    // Await the tutor storage save
    await saveChatMessage(tutorMsg);
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <Pressable
          onPress={() => setIsOpen(true)}
          className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-blue-500 shadow-lg items-center justify-center z-50"
        >
          <MessageCircle size={28} color="white" />
        </Pressable>
      )}

      {/* Chat Window Modal */}
      <Modal visible={isOpen} animationType="slide" transparent={true}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end bg-black/40"
        >
          <View className="bg-white dark:bg-gray-900 h-[85%] rounded-t-3xl overflow-hidden">
            
            {/* Header */}
            <View className="flex-row items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-800">
              <View className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 items-center justify-center">
                <Bot size={20} color="#3b82f6" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-foreground text-base">AI Tutor</Text>
                <Text className="text-xs text-gray-500" numberOfLines={1}>{lessonTitle}</Text>
              </View>
              <Pressable onPress={() => setIsOpen(false)} className="p-2 rounded-full bg-gray-100 dark:bg-gray-800">
                <X size={20} color="#6b7280" />
              </Pressable>
            </View>

            {/* Messages */}
            <ScrollView 
              ref={scrollRef}
              className="flex-1 p-4"
              contentContainerStyle={{ paddingBottom: 20 }}
              onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
            >
              {messages.length === 0 && !isTyping && (
                <View className="items-center justify-center py-10">
                  <Bot size={48} color="#9ca3af" className="mb-4 opacity-50" />
                  <Text className="text-base font-medium text-foreground">Hi! I'm your AI tutor.</Text>
                  <Text className="text-sm text-gray-500 mt-1">Ask me anything about this lesson!</Text>
                </View>
              )}
              
              {messages.map(msg => (
                <View key={msg.id} className={`flex-row mb-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <View className={`px-4 py-3 max-w-[80%] ${
                    msg.role === 'user'
                      ? 'bg-blue-500 rounded-2xl rounded-tr-sm'
                      : 'bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm'
                  }`}>
                    <Text className={`text-sm ${msg.role === 'user' ? 'text-white' : 'text-foreground'}`}>
                      {msg.content}
                    </Text>
                  </View>
                </View>
              ))}
              
              {isTyping && (
                <View className="flex-row justify-start mb-4">
                  <View className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 flex-row items-center gap-1">
                    <ActivityIndicator size="small" color="#3b82f6" />
                    <Text className="text-xs text-gray-500 ml-2">Tutor is typing...</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Input Area */}
            <View className="p-3 border-t border-gray-100 dark:border-gray-800 flex-row items-center gap-2 bg-white dark:bg-gray-900 pb-8">
              <Pressable className="w-10 h-10 rounded-full items-center justify-center bg-gray-100 dark:bg-gray-800">
                <Mic size={20} color="#6b7280" />
              </Pressable>
              
              <TextInput
                value={input}
                onChangeText={setInput}
                onSubmitEditing={sendMessage}
                placeholder="Ask a question..."
                placeholderTextColor="#9ca3af"
                className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 text-sm text-foreground"
              />
              
              <Pressable
                onPress={sendMessage}
                disabled={!input.trim() || isTyping}
                className={`w-12 h-12 rounded-full items-center justify-center ${
                  input.trim() && !isTyping ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <Send size={20} color={input.trim() && !isTyping ? 'white' : '#9ca3af'} />
              </Pressable>
            </View>
            
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}