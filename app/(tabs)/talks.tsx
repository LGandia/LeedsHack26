import { LogOut, MessageCircle, Send, Trash2, Volume2, VolumeX } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { 
  ActivityIndicator,
  Alert, 
  Keyboard, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Pod Services (existing)
import { 
  ensureAuth, 
  findOrCreatePod, 
  getUserPod, 
  isPodExpired, 
  leavePod, 
  sendMessage as sendPodMessage, 
  subscribeToPodMessages 
} from './podService';

// AI Mentor Services (new)
import {
  clearConversationHistory,
  generateWelcomeMessage,
  getUserProfile,
  loadConversationHistory,
  saveMessage,
  sendMessageToMentor,
} from './aiMentorService';

// Voice Service (optional - will gracefully handle if API key is missing)
import { textToSpeech, VOICE_OPTIONS } from './elevenLabsService';

// Uncomment these if you want voice support:
// import { Audio } from 'expo-av';

// ============================================================================
// TYPES
// ============================================================================

type TalksTab = 'ai' | 'community';

// ============================================================================
// CONSTANTS
// ============================================================================

// ADHD-friendly soft colors for user messages
const USER_COLORS = [
  '#E8F5E9', // Soft mint green
  '#E3F2FD', // Soft sky blue
  '#FFF9C4', // Soft warm yellow
  '#F3E5F5', // Soft lavender
  '#FFE0B2', // Soft peach
];

// Quick prompts for AI chat
const QUICK_PROMPTS = [
  { text: "I'm feeling overwhelmed", icon: "🌊" },
  { text: "Help me focus on a task", icon: "🎯" },
  { text: "I need encouragement", icon: "💪" },
  { text: "Just need to talk", icon: "💙" },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Assign color based on userId
const getUserColor = (userId) => {
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return USER_COLORS[hash % USER_COLORS.length];
};

// Format timestamp
const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  const displayHours = date.getHours() % 12 || 12;
  const displayMinutes = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
  const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
  return `${displayHours}:${displayMinutes} ${ampm}`;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function TalksScreen() {
  // Tab state
  const [activeTab, setActiveTab] = useState('ai');
  
  // ====== AI MENTOR STATE ======
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInputText, setAiInputText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiLoadingHistory, setAiLoadingHistory] = useState(true);
  const [userProfile, setUserProfile] = useState({ tags: [], name: null, goals: [] });
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [generatingVoice, setGeneratingVoice] = useState(false);
  const aiScrollViewRef = useRef(null);
  // const soundRef = useRef(null); // Uncomment if using expo-av
  
  // ====== COMMUNITY PODS STATE ======
  const [currentPod, setCurrentPod] = useState(null);
  const [podMessages, setPodMessages] = useState([]);
  const [podMessageText, setPodMessageText] = useState('');
  const [podLoading, setPodLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');
  const [struggle, setStruggle] = useState('');
  const [supportStyle, setSupportStyle] = useState('');
  const [duration, setDuration] = useState('');
  const [joining, setJoining] = useState(false);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      const userId = await ensureAuth();
      setCurrentUserId(userId);
    };
    init();
  }, []);

  // Load AI chat when switching to AI tab
  useEffect(() => {
    if (activeTab === 'ai') {
      initializeAIMentor();
    }
  }, [activeTab]);

  // Load Community Pod when switching to community tab
  useEffect(() => {
    if (activeTab === 'community') {
      loadUserPod();
    }
  }, [activeTab]);

  // Subscribe to pod messages
  useEffect(() => {
    if (currentPod) {
      const unsubscribe = subscribeToPodMessages(currentPod.id, (msgs) => {
        setPodMessages(msgs);
      });
      return () => unsubscribe();
    }
  }, [currentPod]);

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
    const messageText = customText || aiInputText.trim();
    if (!messageText || aiLoading) return;

    setAiInputText('');
    Keyboard.dismiss();

    // Add user message to UI immediately
    const userMsg = {
      role: 'user',
      text: messageText,
      timestamp: new Date(),
    };
    setAiMessages(prev => [...prev, userMsg]);

    // Save user message
    await saveMessage('user', messageText);

    // Get AI response
    setAiLoading(true);
    try {
      const response = await sendMessageToMentor(messageText, aiMessages, userProfile);

      // Add AI response to UI
      const aiMsg = {
        role: 'model',
        text: response,
        timestamp: new Date(),
      };
      setAiMessages(prev => [...prev, aiMsg]);

      // Save AI message
      await saveMessage('model', response);

      // Generate voice if enabled (optional)
      if (voiceEnabled) {
        generateVoiceForMessage(response);
      }

      // Auto-scroll to bottom
      setTimeout(() => {
        aiScrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error getting AI response:', error);
      Alert.alert('Error', error.message || 'Failed to get response. Please try again.');
    } finally {
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
    Alert.alert(
      'Clear Conversation?',
      'This will delete your entire conversation history. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearConversationHistory();
              setAiMessages([]);
              
              // Send new welcome message
              const welcomeMessage = generateWelcomeMessage(userProfile);
              const welcomeMsg = {
                role: 'model',
                text: welcomeMessage,
                timestamp: new Date(),
              };
              setAiMessages([welcomeMsg]);
              await saveMessage('model', welcomeMessage);
              
              Alert.alert('Cleared', 'Conversation history cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear history');
            }
          },
        },
      ]
    );
  };

  // ============================================================================
  // COMMUNITY POD FUNCTIONS
  // ============================================================================

  const loadUserPod = async () => {
    setPodLoading(true);
    try {
      const pod = await getUserPod();
      setCurrentPod(pod);
    } catch (error) {
      console.error('Error loading pod:', error);
    }
    setPodLoading(false);
  };

  const handleJoinPod = async () => {
    if (!struggle || !supportStyle || !duration) {
      Alert.alert('Missing Info', 'Please answer all questions');
      return;
    }

    setJoining(true);
    try {
      await findOrCreatePod(struggle, supportStyle, duration);
      await loadUserPod();
      Alert.alert('Welcome! 🎉', 'You\'ve joined a pod. Be kind and supportive.');
    } catch (error) {
      console.error('Error joining pod:', error);
      Alert.alert('Error', 'Could not join a pod. Please try again.');
    }
    setJoining(false);
  };

  const handleSendPodMessage = async () => {
    if (!podMessageText.trim() || !currentPod) return;

    const textToSend = podMessageText;
    setPodMessageText('');
    Keyboard.dismiss();

    try {
      await sendPodMessage(currentPod.id, textToSend);
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
              setPodMessages([]);
            } catch (error) {
              console.error('Error leaving pod:', error);
            }
          },
        },
      ]
    );
  };

  // ============================================================================
  // RENDER FUNCTIONS - AI MENTOR
  // ============================================================================

  const renderAIChatScreen = () => {
    if (aiLoadingHistory) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.loadingText}>Loading your mentor...</Text>
        </View>
      );
    }

    return (
      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* AI Chat Header */}
        <View style={styles.aiHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.aiHeaderTitle}>AI Mentor</Text>
            <Text style={styles.aiHeaderSubtitle}>Your personal support companion</Text>
          </View>
          <View style={styles.headerActions}>
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

        {/* Quick Prompts */}
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

        {/* Messages */}
        <ScrollView
          ref={aiScrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => {
            aiScrollViewRef.current?.scrollToEnd({ animated: true });
          }}
        >
          {aiMessages.map((msg, index) => (
            <View
              key={index}
              style={[
                styles.messageWrapper,
                msg.role === 'user' ? styles.userMessageWrapper : styles.aiMessageWrapper,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  msg.role === 'user' ? styles.userMessage : styles.aiMessage,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    msg.role === 'user' ? styles.userMessageText : styles.aiMessageText,
                  ]}
                >
                  {msg.text}
                </Text>
                <Text style={[
                  styles.messageTime,
                  msg.role === 'user' && styles.userMessageTime
                ]}>
                  {formatTimestamp(msg.timestamp)}
                </Text>
              </View>
            </View>
          ))}
          
          {aiLoading && (
            <View style={styles.aiMessageWrapper}>
              <View style={[styles.messageBubble, styles.aiMessage]}>
                <ActivityIndicator size="small" color="#8b5cf6" />
                <Text style={[styles.messageText, styles.aiMessageText, styles.typingText]}>
                  Thinking...
                </Text>
              </View>
            </View>
          )}

          {generatingVoice && (
            <View style={styles.voiceIndicator}>
              <Volume2 size={16} color="#8b5cf6" />
              <Text style={styles.voiceIndicatorText}>Generating voice...</Text>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={aiInputText}
            onChangeText={setAiInputText}
            placeholder="Share what's on your mind..."
            placeholderTextColor="#999"
            multiline
            maxLength={1000}
            editable={!aiLoading}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!aiInputText.trim() || aiLoading) && styles.sendButtonDisabled,
            ]}
            onPress={() => handleSendAIMessage()}
            disabled={!aiInputText.trim() || aiLoading}
          >
            <Send size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  };

  // ============================================================================
  // RENDER FUNCTIONS - COMMUNITY PODS
  // ============================================================================

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
          {podMessages.map((msg) => {
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
                  <Text style={styles.podMessageTime}>
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
                setPodMessages([]);
              }}
            >
              <Text style={styles.newPodButtonText}>Join a new pod</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={podMessageText}
              onChangeText={setPodMessageText}
              placeholder="Share your thoughts..."
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, !podMessageText.trim() && styles.sendButtonDisabled]}
              onPress={handleSendPodMessage}
              disabled={!podMessageText.trim()}
            >
              <Send size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Talks</Text>
        <Text style={styles.subtitle}>Connect and share with others</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'ai' && styles.tabActive]}
          onPress={() => setActiveTab('ai')}
        >
          <Text style={[styles.tabText, activeTab === 'ai' && styles.tabTextActive]}>
            AI Mentor
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
      ) : podLoading ? (
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

// ============================================================================
// STYLES
// ============================================================================

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
  
  // Tabs
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

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },

  // AI Chat
  chatContainer: {
    flex: 1,
  },
  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerLeft: {
    flex: 1,
  },
  aiHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
  },
  aiHeaderSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonActive: {
    backgroundColor: '#f3e8ff',
  },

  // Quick Prompts
  quickPromptsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  quickPromptsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  quickPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f4ff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9d5ff',
    marginRight: 8,
  },
  quickPromptIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  quickPromptText: {
    fontSize: 13,
    color: '#8b5cf6',
    fontWeight: '500',
  },

  // Messages
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageWrapper: {
    marginBottom: 16,
    maxWidth: '85%',
  },
  userMessageWrapper: {
    alignSelf: 'flex-end',
  },
  aiMessageWrapper: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 14,
    borderRadius: 16,
  },
  userMessage: {
    backgroundColor: '#8b5cf6',
    borderBottomRightRadius: 4,
  },
  aiMessage: {
    backgroundColor: '#f3f4f6',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#fff',
  },
  aiMessageText: {
    color: '#111',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 6,
    color: '#999',
  },
  userMessageTime: {
    color: '#fff',
    opacity: 0.8,
  },
  typingText: {
    fontStyle: 'italic',
    opacity: 0.7,
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
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: 20,
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
    paddingVertical: 12,
    fontSize: 15,
    maxHeight: 100,
    color: '#111',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#d1d5db',
  },

  // Community Pods
  content: {
    flex: 1,
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

  // Pod Chat
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
  messageItem: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 12,
    maxWidth: '80%',
    alignSelf: 'flex-start',
    marginBottom: 12,
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
  systemMessageText: {
    color: '#8b5cf6',
    textAlign: 'center',
    fontSize: 14,
  },
  podMessageTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
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