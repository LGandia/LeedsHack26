import { Check, Pin, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { toggleLifeTaskCompleted } from './lifeTaskStorage';
import { clearPinnedTask, getPinnedTask, PinnedTask } from './pinnedTaskStorage';
import { getSharedTasks, updateSharedTasks } from './taskStorage';

interface PinnedTaskBannerProps {
  onUpdate?: () => void;
}

export default function PinnedTaskBanner({ onUpdate }: PinnedTaskBannerProps) {
  const [pinnedTask, setPinnedTaskState] = useState<PinnedTask | null>(null);

  useEffect(() => {
    // Check for pinned task every 500ms
    const interval = setInterval(() => {
      const task = getPinnedTask();
      setPinnedTaskState(task);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const handleDone = () => {
    if (!pinnedTask) return;

    if (pinnedTask.type === 'task') {
      // Mark regular task as complete
      const tasks = getSharedTasks();
      const updatedTasks = tasks.map(t => 
        t.id === pinnedTask.id ? { ...t, completed: true } : t
      );
      updateSharedTasks(updatedTasks);
      
      Alert.alert('Great job! 🎉', `"${pinnedTask.name}" completed!`);
    } else if (pinnedTask.type === 'life') {
      // Mark life task as complete
      toggleLifeTaskCompleted(pinnedTask.id as string);
      Alert.alert('Nice! 💙', `"${pinnedTask.name}" done!`);
    }

    clearPinnedTask();
    setPinnedTaskState(null);
    onUpdate?.();
  };

  const handleUnpin = () => {
    Alert.alert(
      'Unpin task?',
      `Remove "${pinnedTask?.name}" from focus?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unpin',
          onPress: () => {
            clearPinnedTask();
            setPinnedTaskState(null);
            onUpdate?.();
          },
        },
      ]
    );
  };

  if (!pinnedTask) return null;

  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <View style={styles.header}>
          <Pin size={14} color="#8b5cf6" />
          <Text style={styles.headerText}>Energy – Focus mode</Text>
        </View>
        
        <View style={styles.content}>
          {pinnedTask.emoji && (
            <Text style={styles.emoji}>{pinnedTask.emoji}</Text>
          )}
          <View style={styles.textContainer}>
            <Text style={styles.taskName} numberOfLines={1}>
              {pinnedTask.name}
            </Text>
            {pinnedTask.time && (
              <Text style={styles.taskMeta}>{pinnedTask.time}m task</Text>
            )}
            {pinnedTask.timeWindow && (
              <Text style={styles.taskMeta}>{pinnedTask.timeWindow}</Text>
            )}
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.doneButton]}
            onPress={handleDone}
          >
            <Check size={16} color="#fff" />
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.unpinButton]}
            onPress={handleUnpin}
          >
            <X size={16} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  banner: {
    backgroundColor: '#f8f4ff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  headerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8b5cf6',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  emoji: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  taskName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
    marginBottom: 2,
  },
  taskMeta: {
    fontSize: 12,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  doneButton: {
    flex: 1,
    backgroundColor: '#8b5cf6',
  },
  doneButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  unpinButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
  },
});