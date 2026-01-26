import { Tabs } from 'expo-router';
import { Heart, Home, List, PlusCircle } from 'lucide-react-native';

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
      {/* Hide non-route files */}
      <Tabs.Screen
        name="taskStorage"
        options={{
          href: null, // This makes it not appear as a route
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
          href: null, // Hide the modal from tabs
        }}
      />
    </Tabs>
  );
}