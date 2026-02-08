import { Tabs } from 'expo-router';
import { Eye, Heart, Home, List, MessageCircle, PlusCircle } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#8b5cf6',
        tabBarInactiveTintColor: '#9ca3af',
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="life"
        options={{
          title: 'Life',
          tabBarIcon: ({ color, size }) => <Heart size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="all-tasks"
        options={{
          title: 'All Tasks',
          tabBarIcon: ({ color, size }) => <List size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="add-task"
        options={{
          title: 'Add Task',
          tabBarIcon: ({ color, size }) => <PlusCircle size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="focus"
        options={{
          title: 'Focus',
          tabBarIcon: ({ color, size }) => <Eye size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="talks"
        options={{
          title: 'Talks',
          tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
        }}
      />
      
      {/* Hide non-route files */}
      <Tabs.Screen
        name="taskStorage"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="lifeTaskStorage"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="LifeTaskModal"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="TaskEditModal"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="pinnedTaskStorage"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="PinnedTaskBanner"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="firebase"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="podService"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="aiMentorService"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="elevenLabsService"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}