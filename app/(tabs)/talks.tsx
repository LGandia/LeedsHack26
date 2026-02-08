import { LogOut, MessageCircle, Send } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { generateWelcomeMessage, getUserProfile, loadConversationHistory, saveMessage, sendMessageToMentor } from './aiMentorService';
import { ensureAuth, findOrCreatePod, getUserPod, isPodExpired, leavePod, sendMessage, subscribeToPodMessages } from './podService';

type TalksTab = 'ai' | 'community';

interface Pod {
  id: string;
  struggle: string;
  supportStyle: string;
  duration: string;
  memberCount: number;
  isActive: boolean;
  expiresAt: any;
  [key: string]: any;
}

interface Message {
  id: string;
  type: 'user' | 'system';
  text: string;
  userId?: string;
  createdAt: any;
}

interface AIChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: any;
}

// ADHD-friendly soft colors for user messages
const USER_COLORS = [
  '#E8F5E9', // Soft mint green
  '#E3F2FD', // Soft sky blue
  '#FFF9C4', // Soft warm yellow
  '#F3E5F5', // Soft lavender
  '#FFE0B2', // Soft peach
];

// Assign color based on userId
const getUserColor = (userId: string): string => {
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return USER_COLORS[hash % USER_COLORS.length];
};

export default function TalksScreen() {
  const [activeTab, setActiveTab] = useState<TalksTab>('ai');
  
<<<<<<< HEAD
  // Community Pods state
  const [currentPod, setCurrentPod] = useState<Pod | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
=======
  // ====== AI MENTOR STATE ======
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInputText, setAiInputText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiLoadingHistory, setAiLoadingHistory] = useState(true);
  const [userProfile, setUserProfile] = useState({ tags: [], name: null, goals: [] });
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [generatingVoice, setGeneratingVoice] = useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true); // NEW: Toggle quick prompts
  const aiScrollViewRef = useRef(null);
  // const soundRef = useRef(null); // Uncomment if using expo-av
>>>>>>> 340904e705cd98adc3023ec7ddaa9f0a2c981d4d
  
  // Join flow state
  const [struggle, setStruggle] = useState('');
  const [supportStyle, setSupportStyle] = useState('');
  const [duration, setDuration] = useState('');
  const [joining, setJoining] = useState(false);

  // AI Chat state
  const [aiMessages, setAiMessages] = useState<AIChatMessage[]>([]);
  const [aiMessageText, setAiMessageText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInitializing, setAiInitializing] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Initialize AI Chat
  useEffect(() => {
    if (activeTab === 'ai') {
      initializeAIChat();
    }
  }, [activeTab]);

  const initializeAIChat = async () => {
    try {
      setAiInitializing(true);
      const profile = await getUserProfile();
      setUserProfile(profile);
      
      const history = await loadConversationHistory();
      
      if (history.length === 0) {
        // First time - show welcome message
        const welcomeMsg = generateWelcomeMessage(profile);
        const welcomeMessage: AIChatMessage = {
          id: 'welcome-' + Date.now(),
          role: 'model',
          text: welcomeMsg,
          timestamp: new Date(),
        };
        setAiMessages([welcomeMessage]);
      } else {
        setAiMessages(history);
      }
    } catch (error) {
      console.error('Error initializing AI mentor:', error);
    } finally {
      setAiInitializing(false);
    }
  };

  const handleSendAIMessage = async () => {
    if (!aiMessageText.trim()) return;

    const userMsg = aiMessageText.trim();
    setAiMessageText('');

    // Add user message immediately
    const userMessage: AIChatMessage = {
      id: 'user-' + Date.now(),
      role: 'user',
      text: userMsg,
      timestamp: new Date(),
    };
    setAiMessages(prev => [...prev, userMessage]);

    setAiLoading(true);

    try {
      // Save user message
      await saveMessage('user', userMsg);

      // Get AI response
      const aiResponse = await sendMessageToMentor(userMsg, aiMessages, userProfile);

      // Add AI response
      const aiMessage: AIChatMessage = {
        id: 'model-' + Date.now(),
        role: 'model',
        text: aiResponse,
        timestamp: new Date(),
      };
      setAiMessages(prev => [...prev, aiMessage]);

      // Save AI response
      await saveMessage('model', aiResponse);
    } catch (error: any) {
      console.error('Error sending AI message:', error);
      Alert.alert('Error', error.message || 'Failed to send message. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  // Community Pods functions (existing code)
  useEffect(() => {
    if (activeTab === 'community') {
      loadUserPod();
    }
  }, [activeTab]);

  useEffect(() => {
    // Get and store current user ID
    const getCurrentUserId = async () => {
      const userId = await ensureAuth();
      setCurrentUserId(userId);
    };
    getCurrentUserId();
  }, []);

  useEffect(() => {
    if (currentPod) {
      const unsubscribe = subscribeToPodMessages(currentPod.id, (msgs: Message[]) => {
        setMessages(msgs);
      });
      return () => unsubscribe();
    }
  }, [currentPod]);

<<<<<<< HEAD
=======
  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      // if (soundRef.current) {
      //   soundRef.current.unloadAsync();
      // }
    };
  }, []);

  // ============================================================================
  // AI MENTOR FUNCTIONS
  // ============================================================================

  const initializeAIMentor = async () => {
    try {
      setAiLoadingHistory(true);
      
      // Load user profile
      const profile = await getUserProfile();
      setUserProfile(profile);

      // Load conversation history
      const history = await loadConversationHistory();
      setAiMessages(history);

      // If no history, send welcome message
      if (history.length === 0) {
        const welcomeMessage = generateWelcomeMessage(profile);
        const welcomeMsg = {
          role: 'model',
          text: welcomeMessage,
          timestamp: new Date(),
        };
        setAiMessages([welcomeMsg]);
        await saveMessage('model', welcomeMessage);
      }
    } catch (error) {
      console.error('Error initializing AI mentor:', error);
      Alert.alert('Error', 'Failed to load AI mentor');
    } finally {
      setAiLoadingHistory(false);
    }
  };

  const handleSendAIMessage = async (customText = null) => {
    console.log('=== SEND MESSAGE DEBUG START ===');
    const messageText = customText || aiInputText.trim();
    console.log('1. Message text:', messageText);
    console.log('2. AI loading?', aiLoading);
    
    if (!messageText || aiLoading) {
      console.log('3. BLOCKED: Empty message or already loading');
      console.log('=== SEND MESSAGE DEBUG END ===');
      return;
    }

    console.log('4. Clearing input and dismissing keyboard');
    setAiInputText('');
    Keyboard.dismiss();

    // Add user message to UI immediately
    const userMsg = {
      role: 'user',
      text: messageText,
      timestamp: new Date(),
    };
    
    console.log('5. Adding user message to UI');
    // Update messages with user message
    setAiMessages(prev => {
      console.log('6. Current messages count:', prev.length);
      const newMessages = [...prev, userMsg];
      console.log('7. New messages count:', newMessages.length);
      return newMessages;
    });

    // Save user message to Firestore
    console.log('8. Saving user message to Firestore...');
    try {
      await saveMessage('user', messageText);
      console.log('9. User message saved successfully');
    } catch (error) {
      console.error('10. ERROR saving user message:', error);
    }

    // Set loading state BEFORE making API call
    console.log('11. Setting loading state to TRUE');
    setAiLoading(true);
    
    // Scroll to show loading indicator
    setTimeout(() => {
      aiScrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Get AI response with current messages including the user message
      const currentMessages = [...aiMessages, userMsg];
      console.log('12. Current messages for API call:', currentMessages.length);
      console.log('13. User profile:', userProfile);
      console.log('14. Calling sendMessageToMentor...');
      
      const response = await sendMessageToMentor(messageText, currentMessages, userProfile);
      
      console.log('15. Got response from API');
      console.log('16. Response preview:', response.substring(0, 100));

      // Add AI response to UI
      const aiMsg = {
        role: 'model',
        text: response,
        timestamp: new Date(),
      };
      
      console.log('17. Adding AI response to UI');
      setAiMessages(prev => [...prev, aiMsg]);

      // Save AI message to Firestore
      console.log('18. Saving AI message to Firestore...');
      await saveMessage('model', response);
      console.log('19. AI message saved successfully');

      // Generate voice if enabled (optional)
      if (voiceEnabled) {
        console.log('20. Generating voice...');
        generateVoiceForMessage(response);
      }

      // Auto-scroll to bottom
      setTimeout(() => {
        aiScrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
      console.log('21. SUCCESS - Message exchange complete');
      console.log('=== SEND MESSAGE DEBUG END ===');
    } catch (error) {
      console.error('=== SEND MESSAGE ERROR ===');
      console.error('Error:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('=========================');
      
      // Show user-friendly error message
      const errorMessage = error.message || 'Failed to get response. Please try again.';
      Alert.alert('Error', errorMessage);
      
      // Optionally remove the user message if API call failed
      // setAiMessages(prev => prev.slice(0, -1));
    } finally {
      console.log('22. Setting loading state to FALSE');
      setAiLoading(false);
    }
  };

  const generateVoiceForMessage = async (text) => {
    setGeneratingVoice(true);
    try {
      const audioBase64 = await textToSpeech(text, VOICE_OPTIONS.sarah.id);
      
      if (audioBase64) {
        // Play the audio (requires expo-av)
        // await playAudio(audioBase64);
        console.log('Voice generated successfully');
      }
    } catch (error) {
      console.error('Error generating voice:', error);
    } finally {
      setGeneratingVoice(false);
    }
  };

  // Uncomment if using expo-av for voice playback
  /*
  const playAudio = async (audioBase64) => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioBase64 },
        { shouldPlay: true }
      );

      soundRef.current = sound;
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };
  */

  const handleClearAIHistory = () => {
    console.log('=== CLEAR HISTORY BUTTON CLICKED ===');
    Alert.alert(
      'Clear Conversation?',
      'This will delete your entire conversation history. This cannot be undone.',
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => console.log('❌ User cancelled deletion')
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            console.log('✅ User confirmed deletion - starting process...');
            try {
              // Step 1: Clear from Firestore
              console.log('STEP 1: Calling clearConversationHistory...');
              await clearConversationHistory();
              console.log('STEP 1 COMPLETE: Firestore messages deleted');
              
              // Step 2: Clear from UI state
              console.log('STEP 2: Clearing messages from UI state...');
              setAiMessages([]);
              console.log('STEP 2 COMPLETE: UI state cleared');
              
              // Step 3: Create and add welcome message
              console.log('STEP 3: Creating welcome message...');
              const welcomeMessage = generateWelcomeMessage(userProfile);
              console.log('STEP 3a: Welcome message text:', welcomeMessage.substring(0, 50) + '...');
              
              const welcomeMsg = {
                role: 'model',
                text: welcomeMessage,
                timestamp: new Date(),
              };
              
              console.log('STEP 3b: Adding welcome message to UI...');
              setAiMessages([welcomeMsg]);
              console.log('STEP 3c: UI updated with welcome message');
              
              // Step 4: Save welcome message to Firestore
              console.log('STEP 4: Saving welcome message to Firestore...');
              await saveMessage('model', welcomeMessage);
              console.log('STEP 4 COMPLETE: Welcome message saved');
              
              // Step 5: Show success alert
              console.log('STEP 5: Showing success alert');
              Alert.alert('Cleared', 'Conversation history cleared successfully');
              console.log('=== CLEAR HISTORY SUCCESS - ALL STEPS COMPLETE ===');
            } catch (error) {
              console.error('=== CLEAR HISTORY FAILED ===');
              console.error('Error during clear history:', error);
              console.error('Error name:', error.name);
              console.error('Error message:', error.message);
              console.error('Error stack:', error.stack);
              console.error('========================');
              Alert.alert('Error', 'Failed to clear history: ' + error.message);
            }
          },
        },
      ]
    );
  };

  // ============================================================================
  // COMMUNITY POD FUNCTIONS
  // ============================================================================

>>>>>>> 340904e705cd98adc3023ec7ddaa9f0a2c981d4d
  const loadUserPod = async () => {
    setLoading(true);
    try {
      const pod = await getUserPod();
      setCurrentPod(pod as Pod | null);
    } catch (error) {
      console.error('Error loading pod:', error);
    }
    setLoading(false);
  };

  const handleJoinPod = async () => {
    if (!struggle || !supportStyle || !duration) {
      Alert.alert('Missing Info', 'Please answer all questions');
      return;
    }

    setJoining(true);
    try {
      const podId = await findOrCreatePod(struggle, supportStyle, duration);
      await loadUserPod();
      Alert.alert('Welcome! 🎉', 'You\'ve joined a pod. Be kind and supportive.');
    } catch (error) {
      console.error('Error joining pod:', error);
      Alert.alert('Error', 'Could not join a pod. Please try again.');
    }
    setJoining(false);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !currentPod) return;

    const textToSend = messageText;
    setMessageText('');

    try {
      await sendMessage(currentPod.id, textToSend);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Could not send message');
    }
  };

  const handleLeavePod = () => {
    if (!currentPod) return;
    
    Alert.alert(
      'Leave Pod?',
      'Are you sure you want to leave this pod?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await leavePod(currentPod.id);
              setCurrentPod(null);
              setMessages([]);
            } catch (error) {
              console.error('Error leaving pod:', error);
            }
          },
        },
      ]
    );
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes < 10 ? '0' + minutes : minutes;
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  // AI Chat Screen
  const renderAIChatScreen = () => {
    if (aiInitializing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.loadingText}>Initializing AI Mentor...</Text>
        </View>
      );
    }

    return (
      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
<<<<<<< HEAD
        <ScrollView 
=======
        {/* AI Chat Header */}
        <View style={styles.aiHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.aiHeaderTitle}>AI Mentor</Text>
            <Text style={styles.aiHeaderSubtitle}>Your personal support companion</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.iconButton, showQuickPrompts && styles.iconButtonActive]}
              onPress={() => setShowQuickPrompts(!showQuickPrompts)}
            >
              <MessageCircle size={20} color={showQuickPrompts ? "#8b5cf6" : "#666"} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconButton, voiceEnabled && styles.iconButtonActive]}
              onPress={() => setVoiceEnabled(!voiceEnabled)}
            >
              {voiceEnabled ? (
                <Volume2 size={20} color="#8b5cf6" />
              ) : (
                <VolumeX size={20} color="#666" />
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={handleClearAIHistory}>
              <Trash2 size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Prompts - Collapsible */}
        {showQuickPrompts && (
          <ScrollView 
            horizontal 
            style={styles.quickPromptsContainer}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickPromptsContent}
          >
            {QUICK_PROMPTS.map((prompt, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickPrompt}
                onPress={() => handleSendAIMessage(prompt.text)}
              >
                <Text style={styles.quickPromptIcon}>{prompt.icon}</Text>
                <Text style={styles.quickPromptText}>{prompt.text}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Messages */}
        <ScrollView
          ref={aiScrollViewRef}
>>>>>>> 340904e705cd98adc3023ec7ddaa9f0a2c981d4d
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {aiMessages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.aiMessageItem,
                msg.role === 'user' ? styles.aiUserMessage : styles.aiModelMessage
              ]}
            >
              <Text style={[
                styles.messageText,
                msg.role === 'user' && styles.aiUserMessageText
              ]}>
                {msg.text}
              </Text>
              {msg.timestamp && (
                <Text style={styles.messageTime}>
                  {formatTimestamp(msg.timestamp)}
                </Text>
              )}
            </View>
          ))}
          {aiLoading && (
<<<<<<< HEAD
            <View style={[styles.aiMessageItem, styles.aiModelMessage]}>
              <ActivityIndicator size="small" color="#8b5cf6" />
              <Text style={styles.loadingText}>Thinking...</Text>
=======
            <View style={styles.aiMessageWrapper}>
              <View style={[styles.messageBubble, styles.aiMessage, styles.loadingBubble]}>
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#8b5cf6" style={styles.loadingSpinner} />
                  <Text style={[styles.messageText, styles.aiMessageText, styles.typingText]}>
                    Thinking...
                  </Text>
                </View>
              </View>
            </View>
          )}

          {generatingVoice && (
            <View style={styles.voiceIndicator}>
              <Volume2 size={16} color="#8b5cf6" />
              <Text style={styles.voiceIndicatorText}>Generating voice...</Text>
>>>>>>> 340904e705cd98adc3023ec7ddaa9f0a2c981d4d
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={aiMessageText}
            onChangeText={setAiMessageText}
            placeholder="Message your AI mentor..."
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!aiMessageText.trim() || aiLoading) && styles.sendButtonDisabled]}
            onPress={handleSendAIMessage}
            disabled={!aiMessageText.trim() || aiLoading}
          >
            <Send size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  };

  // Community Pods screens (existing code - Join Pod Screen)
  const renderJoinPodScreen = () => (
    <ScrollView style={styles.content}>
      <View style={styles.joinContainer}>
        <MessageCircle size={60} color="#8b5cf6" />
        <Text style={styles.joinTitle}>Join a Community Pod</Text>
        <Text style={styles.joinSubtitle}>
          Connect with 3-5 others in a safe, temporary space
        </Text>

        {/* Question 1: Struggle */}
        <View style={styles.questionSection}>
          <Text style={styles.questionLabel}>What brings you here today?</Text>
          <View style={styles.optionButtons}>
            {['Focus & Motivation', 'Overwhelm', 'Anxiety', 'Loneliness'].map(option => (
              <TouchableOpacity
                key={option}
                style={[styles.optionButton, struggle === option && styles.optionButtonActive]}
                onPress={() => setStruggle(option)}
              >
                <Text style={[styles.optionButtonText, struggle === option && styles.optionButtonTextActive]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Question 2: Support Style */}
        <View style={styles.questionSection}>
          <Text style={styles.questionLabel}>What kind of support helps you most?</Text>
          <View style={styles.optionButtons}>
            {['Just listening', 'Advice & tips', 'Shared experiences'].map(option => (
              <TouchableOpacity
                key={option}
                style={[styles.optionButton, supportStyle === option && styles.optionButtonActive]}
                onPress={() => setSupportStyle(option)}
              >
                <Text style={[styles.optionButtonText, supportStyle === option && styles.optionButtonTextActive]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Question 3: Duration */}
        <View style={styles.questionSection}>
          <Text style={styles.questionLabel}>How long would you like this pod to last?</Text>
          <View style={styles.optionButtons}>
            {[
              { label: '24 hours', value: '24h' },
              { label: '7 days', value: '7d' },
            ].map(option => (
              <TouchableOpacity
                key={option.value}
                style={[styles.optionButton, duration === option.value && styles.optionButtonActive]}
                onPress={() => setDuration(option.value)}
              >
                <Text style={[styles.optionButtonText, duration === option.value && styles.optionButtonTextActive]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.joinButton, (!struggle || !supportStyle || !duration) && styles.joinButtonDisabled]}
          onPress={handleJoinPod}
          disabled={!struggle || !supportStyle || !duration || joining}
        >
          <Text style={styles.joinButtonText}>
            {joining ? 'Finding your pod...' : 'Join a Pod'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.privacyNote}>
          💙 Anonymous • Safe space • No judgment
        </Text>
      </View>
    </ScrollView>
  );

  // Pod Chat Screen (existing code)
  const renderPodChatScreen = () => {
    if (!currentPod) return null;
    
    const expired = isPodExpired(currentPod);

    return (
      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Pod Header */}
        <View style={styles.podHeader}>
          <View style={styles.podHeaderInfo}>
            <Text style={styles.podHeaderTitle}>Your Pod</Text>
            <Text style={styles.podHeaderSubtitle}>
              {currentPod.memberCount} {currentPod.memberCount === 1 ? 'person' : 'people'} • {currentPod.struggle}
            </Text>
          </View>
          <TouchableOpacity onPress={handleLeavePod} style={styles.leaveButton}>
            <LogOut size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView 
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((msg) => {
            const isOwnMessage = msg.type === 'user' && msg.userId === currentUserId;
            
            return (
              <View
                key={msg.id}
                style={[
                  styles.messageItem,
                  msg.type === 'system' && styles.systemMessage,
                  msg.type === 'user' && (isOwnMessage ? styles.ownMessage : styles.otherMessage),
                  msg.type === 'user' && msg.userId && { backgroundColor: getUserColor(msg.userId) }
                ]}
              >
                <Text style={[
                  styles.messageText,
                  msg.type === 'system' && styles.systemMessageText
                ]}>
                  {msg.text}
                </Text>
                {msg.type === 'user' && msg.createdAt && (
                  <Text style={styles.messageTime}>
                    {formatTimestamp(msg.createdAt)}
                  </Text>
                )}
              </View>
            );
          })}
        </ScrollView>

        {/* Input Area */}
        {expired ? (
          <View style={styles.expiredNotice}>
            <Text style={styles.expiredText}>This pod has ended 💙</Text>
            <TouchableOpacity
              style={styles.newPodButton}
              onPress={() => {
                setCurrentPod(null);
                setMessages([]);
              }}
            >
              <Text style={styles.newPodButtonText}>Join a new pod</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Share your thoughts..."
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={!messageText.trim()}
            >
              <Send size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Talks</Text>
        <Text style={styles.subtitle}>Connect and share with others</Text>
      </View>

      {/* Browser-style tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'ai' && styles.tabActive]}
          onPress={() => setActiveTab('ai')}
        >
          <Text style={[styles.tabText, activeTab === 'ai' && styles.tabTextActive]}>
            AI Chat
          </Text>
          {activeTab === 'ai' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'community' && styles.tabActive]}
          onPress={() => setActiveTab('community')}
        >
          <Text style={[styles.tabText, activeTab === 'community' && styles.tabTextActive]}>
            Community Pods
          </Text>
          {activeTab === 'community' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'ai' ? (
        renderAIChatScreen()
      ) : loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : currentPod ? (
        renderPodChatScreen()
      ) : (
        renderJoinPodScreen()
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    backgroundColor: 'rgba(139, 92, 246, 0.85)',
    padding: 24,
    paddingTop: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    position: 'relative',
  },
  tabActive: {
    backgroundColor: '#f8f4ff',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666',
  },
  tabTextActive: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#8b5cf6',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  aiMessageItem: {
    padding: 12,
    borderRadius: 12,
    maxWidth: '80%',
  },
  aiUserMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#8b5cf6',
  },
  aiModelMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f3f4f6',
  },
  aiUserMessageText: {
    color: '#fff',
  },
  messageItem: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 12,
    maxWidth: '80%',
    alignSelf: 'flex-start',
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  systemMessage: {
    backgroundColor: '#f8f4ff',
    alignSelf: 'center',
    maxWidth: '90%',
  },
  messageText: {
    fontSize: 15,
    color: '#111',
    lineHeight: 20,
  },
  systemMessageText: {
    color: '#8b5cf6',
    textAlign: 'center',
    fontSize: 14,
  },
  messageTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
<<<<<<< HEAD
=======
  userMessageTime: {
    color: '#fff',
    opacity: 0.8,
  },
  loadingBubble: {
    backgroundColor: '#f8f4ff',
    borderColor: '#e9d5ff',
    borderWidth: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingSpinner: {
    marginRight: 4,
  },
  typingText: {
    fontStyle: 'italic',
    opacity: 0.7,
    color: '#8b5cf6',
  },
  voiceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  voiceIndicatorText: {
    fontSize: 13,
    color: '#8b5cf6',
    fontStyle: 'italic',
  },

  // Input
>>>>>>> 340904e705cd98adc3023ec7ddaa9f0a2c981d4d
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    backgroundColor: '#fff',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  joinContainer: {
    padding: 20,
    alignItems: 'center',
  },
  joinTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111',
    marginTop: 20,
    marginBottom: 8,
  },
  joinSubtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  questionSection: {
    width: '100%',
    marginBottom: 24,
  },
  questionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 12,
  },
  optionButtons: {
    gap: 8,
  },
  optionButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonActive: {
    backgroundColor: '#f3e8ff',
    borderColor: '#8b5cf6',
  },
  optionButtonText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  optionButtonTextActive: {
    color: '#8b5cf6',
    fontWeight: '600',
  },
  joinButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 16,
    width: '100%',
  },
  joinButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  privacyNote: {
    fontSize: 13,
    color: '#8b5cf6',
    marginTop: 16,
    textAlign: 'center',
  },
  podHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#f8f4ff',
  },
  podHeaderInfo: {
    flex: 1,
  },
  podHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
  },
  podHeaderSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  leaveButton: {
    padding: 8,
  },
  expiredNotice: {
    padding: 20,
    paddingBottom: 12,
    backgroundColor: '#f8f4ff',
    borderTopWidth: 1,
    borderTopColor: '#e9d5ff',
    alignItems: 'center',
  },
  expiredText: {
    fontSize: 16,
    color: '#8b5cf6',
    marginBottom: 12,
  },
  newPodButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  newPodButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});