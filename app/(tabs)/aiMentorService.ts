import {
  addDoc,
  collection,
<<<<<<< HEAD:app/(tabs)/aiMentorService.ts
  doc,
  getDoc,
=======
  deleteDoc,
  doc,
>>>>>>> 340904e705cd98adc3023ec7ddaa9f0a2c981d4d:app/(tabs)/aiMentorService.js
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { ensureAuth } from './podService';

// Try to get API key from multiple sources
let GEMINI_API_KEY = '';

try {
  // Method 1: Try expo-constants first (works with app.config.js)
  const Constants = require('expo-constants').default;
  GEMINI_API_KEY = Constants.expoConfig?.extra?.GEMINI_API_KEY || '';
  console.log('Tried expo-constants:', GEMINI_API_KEY ? 'FOUND' : 'NOT FOUND');
} catch (error) {
  console.log('expo-constants not available, trying process.env');
}

// Method 2: Try process.env (works with .env file)
if (!GEMINI_API_KEY) {
  GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
  console.log('Tried process.env:', GEMINI_API_KEY ? 'FOUND' : 'NOT FOUND');
}

// Method 3: Check if still not found
if (!GEMINI_API_KEY) {
  console.error('⚠️ GEMINI API KEY NOT CONFIGURED!');
  console.error('Please set EXPO_PUBLIC_GEMINI_API_KEY in your .env file');
  console.error('Or add it to app.config.js under extra.GEMINI_API_KEY');
} else {
  console.log('✅ API Key configured, length:', GEMINI_API_KEY.length);
  console.log('✅ API Key preview:', GEMINI_API_KEY.substring(0, 10) + '...');
}

// TEMPORARY DEBUG - Remove after testing
console.log('========== API KEY DEBUG ==========');
console.log('API Key exists:', !!GEMINI_API_KEY);
console.log('API Key length:', GEMINI_API_KEY.length);
console.log('First 10 chars:', GEMINI_API_KEY.substring(0, 10));
console.log('Last 10 chars:', GEMINI_API_KEY.substring(GEMINI_API_KEY.length - 10));
console.log('===================================');

// ============================================================================
// USER PROFILE MANAGEMENT
// ============================================================================

// Get user profile with tags from Firestore
export const getUserProfile = async () => {
  try {
    const userId = await ensureAuth();
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        tags: userData.tags || [],
        name: userData.name || null,
        goals: userData.goals || [],
      };
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
  }
  
  // Return default profile if not found
  return { tags: [], name: null, goals: [] };
};

// ============================================================================
// CONVERSATION HISTORY MANAGEMENT
// ============================================================================

// Load conversation history from Firestore
export const loadConversationHistory = async () => {
  console.log('=== LOAD CONVERSATION HISTORY START ===');
  try {
    const userId = await ensureAuth();
    console.log('1. User ID:', userId);
    
    const chatsRef = collection(db, 'aiMentorChats');
    const q = query(
      chatsRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(50) // Last 50 messages
    );
    
    console.log('2. Querying last 50 messages...');
    const snapshot = await getDocs(q);
<<<<<<< HEAD:app/(tabs)/aiMentorService.ts
    const messages: any[] = [];
=======
    console.log('3. Query complete - found messages:', snapshot.size);
    
    const messages = [];
>>>>>>> 340904e705cd98adc3023ec7ddaa9f0a2c981d4d:app/(tabs)/aiMentorService.js
    
    snapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`4.${index + 1}. Loading: ${data.role} - ${data.text?.substring(0, 40)}...`);
      messages.push({
        id: doc.id,
        role: data.role,
        text: data.text,
        timestamp: data.timestamp,
        audioUrl: data.audioUrl || null,
      });
    });
    
    const reversedMessages = messages.reverse(); // Oldest first
    console.log('5. Loaded and reversed messages, total:', reversedMessages.length);
    console.log('=== LOAD CONVERSATION HISTORY END ===');
    return reversedMessages;
  } catch (error) {
    console.error('=== LOAD CONVERSATION ERROR ===');
    console.error('Error loading conversation history:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('==============================');
    return [];
  }
};

// Save message to Firestore
export const saveMessage = async (role: string, text: string, audioUrl: string | null = null) => {
  try {
    const userId = await ensureAuth();
    await addDoc(collection(db, 'aiMentorChats'), {
      userId,
      role, // 'user' or 'model'
      text,
      timestamp: serverTimestamp(),
      audioUrl,
    });
  } catch (error) {
    console.error('Error saving message:', error);
    throw error;
  }
};

// ============================================================================
// AI PERSONALITY & PROMPTS
// ============================================================================

// Create personalized system prompt based on user profile
const createSystemPrompt = (userProfile: any) => {
  const { tags = [], name, goals = [] } = userProfile;
  
  const tagContext = tags.length > 0 
    ? `The user identifies with: ${tags.join(', ')}. `
    : '';
  
  const nameContext = name ? `Their name is ${name}. ` : '';
  
  const goalsContext = goals.length > 0
    ? `Their current goals include: ${goals.join(', ')}. `
    : '';

  return `You are a warm, empathetic AI mentor and companion. You're here to provide genuine support, encouragement, and practical advice.

${nameContext}${tagContext}${goalsContext}

Your personality:
- Warm and friendly, like talking to a trusted friend
- Use casual, natural language - contractions, conversational tone
- Show empathy and validate feelings
- Be encouraging but honest
- Use emojis occasionally (but not excessively) to add warmth 💙
- Keep responses conversational - not too formal or clinical
- Share relevant insights and practical strategies
- Ask thoughtful follow-up questions when appropriate
- Remember context from the conversation

For ADHD support specifically:
- Break down complex ideas into digestible chunks
- Offer practical, actionable strategies
- Understand executive function challenges
- Validate the struggle while empowering action
- Suggest tools, techniques, and coping strategies

For anxiety/stress:
- Acknowledge feelings without dismissing them
- Offer grounding techniques
- Normalize the experience
- Provide perspective when helpful

For motivation/productivity:
- Help break down overwhelming tasks
- Celebrate small wins
- Offer accountability and structure
- Suggest realistic approaches

Remember: You're not a therapist, but a supportive mentor who genuinely cares. Be real, be kind, be helpful.`;
};

// Generate welcome message based on user profile
export const generateWelcomeMessage = (userProfile: any) => {
  const { name, tags } = userProfile;
  const nameGreeting = name ? `Hi ${name}! ` : 'Hey there! ';
  
  let tagContext = '';
  if (tags.includes('ADHD')) {
    tagContext = " I know navigating ADHD can be challenging, but you're not alone in this.";
  } else if (tags.includes('Anxiety')) {
    tagContext = " I'm here to support you through the ups and downs.";
  }
  
  return `${nameGreeting}I'm your AI mentor. 💙${tagContext} How are you doing today? What's on your mind?`;
};

// ============================================================================
// GEMINI API INTEGRATION
// ============================================================================

// Send message to Gemini and get response
<<<<<<< HEAD:app/(tabs)/aiMentorService.ts
export const sendMessageToMentor = async (userMessage: string, conversationHistory: any[], userProfile: any) => {
=======
export const sendMessageToMentor = async (userMessage, conversationHistory, userProfile) => {
  console.log('=== GEMINI API DEBUG START ===');
  console.log('1. User message:', userMessage);
  console.log('2. Conversation history length:', conversationHistory.length);
  console.log('3. User profile:', userProfile);
  
>>>>>>> 340904e705cd98adc3023ec7ddaa9f0a2c981d4d:app/(tabs)/aiMentorService.js
  try {
    // Check API key
    if (!GEMINI_API_KEY) {
      console.error('ERROR: No API key found');
      throw new Error('Gemini API key not configured. Please add EXPO_PUBLIC_GEMINI_API_KEY to your .env file');
    }
    console.log('4. API key present:', GEMINI_API_KEY.substring(0, 10) + '...');

    // Build system prompt for context
    const systemPrompt = createSystemPrompt(userProfile);
    console.log('5. System prompt created (length):', systemPrompt.length);
    
    // Use the 2.5 Flash-Lite model endpoint
    const MODEL_NAME = "gemini-2.0-flash-exp";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;
    console.log('6. Model:', MODEL_NAME);
    console.log('7. API URL:', url.substring(0, 80) + '...');
    
    // Format history: 2.5 Flash Lite handles long context well, but we'll stick to 20 for speed
    const recentHistory = conversationHistory.slice(-20);
    console.log('8. Recent history (last 20):', recentHistory.length);
    
    const contents = [
<<<<<<< HEAD:app/(tabs)/aiMentorService.ts
      {
        role: 'user',
        parts: [{ text: systemPrompt }],
      },
      {
        role: 'model',
        parts: [{ text: 'I understand. I\'m here to support you with warmth, empathy, and practical guidance. How can I help you today?' }],
      },
      ...recentHistory.map((msg: any) => ({
=======
      ...recentHistory.map(msg => ({
>>>>>>> 340904e705cd98adc3023ec7ddaa9f0a2c981d4d:app/(tabs)/aiMentorService.js
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.text }],
      })),
      {
        role: 'user',
        parts: [{ text: userMessage }],
      },
    ];
    console.log('9. Total contents array length:', contents.length);

    const body = {
      // 2.5 Models support a dedicated system_instruction field
      system_instruction: {
        parts: [{ text: systemPrompt }]
      },
      contents,
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 1000,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ],
    };
    
    console.log('10. Request body prepared');
    console.log('11. Making API call...');

    // Call Gemini API
<<<<<<< HEAD:app/(tabs)/aiMentorService.ts
const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent?key=' + GEMINI_API_KEY, {      method: 'POST',
      headers: {
=======
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
>>>>>>> 340904e705cd98adc3023ec7ddaa9f0a2c981d4d:app/(tabs)/aiMentorService.js
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('12. Response status:', response.status);
    console.log('13. Response ok?', response.ok);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('14. ERROR - API response:', JSON.stringify(errorData, null, 2));
      throw new Error(`Gemini API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('15. Response received');
    console.log('16. Response data keys:', Object.keys(data));
    
    // Extract the text from the response
    if (data.candidates && data.candidates[0]?.content) {
      const responseText = data.candidates[0].content.parts[0].text;
      console.log('17. SUCCESS - Response length:', responseText.length);
      console.log('18. Response preview:', responseText.substring(0, 100) + '...');
      console.log('=== GEMINI API DEBUG END ===');
      return responseText;
    }
    
    console.error('19. ERROR - Unexpected response format:', JSON.stringify(data, null, 2));
    throw new Error('Unexpected response format from Gemini API');
  } catch (error) {
    console.error('=== GEMINI API ERROR ===');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('========================');
    throw new Error(`Failed to get response: ${error.message}`);
  }
};

// ============================================================================
// CONVERSATION MANAGEMENT
// ============================================================================

// Clear conversation history - FIXED VERSION
export const clearConversationHistory = async () => {
  console.log('=== DELETE CONVERSATION DEBUG START ===');
  try {
    const userId = await ensureAuth();
    console.log('1. User ID:', userId);
    
    if (!userId) {
      console.error('ERROR: No user ID found');
      throw new Error('User not authenticated');
    }
    
    const chatsRef = collection(db, 'aiMentorChats');
    console.log('2. Collection reference created');
    
    const q = query(chatsRef, where('userId', '==', userId));
    console.log('3. Query created for userId:', userId);
    
    console.log('4. Executing query...');
    const snapshot = await getDocs(q);
    console.log('5. Query completed');
    console.log('6. Documents found:', snapshot.size);
    console.log('7. Is snapshot empty?', snapshot.empty);
    
    if (snapshot.empty) {
      console.log('8. No messages to delete - collection is empty');
      console.log('=== DELETE CONVERSATION DEBUG END ===');
      return;
    }
    
    // Log all document IDs before deletion
    console.log('9. Document IDs to delete:');
    snapshot.docs.forEach((document, index) => {
      console.log(`   ${index + 1}. ${document.id} - ${document.data().role}: ${document.data().text?.substring(0, 30)}...`);
    });
    
    // Delete each document individually with error handling
    console.log('10. Starting deletion process...');
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < snapshot.docs.length; i++) {
      const document = snapshot.docs[i];
      try {
        console.log(`11. Deleting document ${i + 1}/${snapshot.docs.length}: ${document.id}`);
        const docRef = doc(db, 'aiMentorChats', document.id);
        await deleteDoc(docRef);
        successCount++;
        console.log(`    ✅ Successfully deleted ${document.id}`);
      } catch (error) {
        errorCount++;
        console.error(`    ❌ Failed to delete ${document.id}:`, error.message);
        console.error(`    Error code:`, error.code);
      }
    }
    
    console.log('12. Deletion complete!');
    console.log(`    Total documents: ${snapshot.docs.length}`);
    console.log(`    Successfully deleted: ${successCount}`);
    console.log(`    Failed to delete: ${errorCount}`);
    
    if (errorCount > 0) {
      console.warn('⚠️ Some documents failed to delete. Check Firebase permissions.');
      throw new Error(`Deleted ${successCount} messages, but ${errorCount} failed. Check permissions.`);
    }
    
    console.log('=== DELETE CONVERSATION DEBUG END (SUCCESS) ===');
  } catch (error) {
    console.error('=== DELETE CONVERSATION ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
    console.error('================================');
    throw error;
  }
};