import { Check, Coffee as CoffeeIcon, Edit2, Heart, LucideIcon, Moon, Plus, Settings, Sun } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getLifeTasks, initializeLifeTasks, LifeTask, TimeOfDay, toggleLifeTaskCompleted, toggleLifeTaskEnabled } from '../lifeTaskStorage';
import { getPinnedTask, hasPinnedTask, setPinnedTask } from '../pinnedTaskStorage';
import LifeTaskModal from './LifeTaskModal';
import PinnedTaskBanner from './PinnedTaskBanner';

export default function LifeTasksScreen() {
  const [tasks, setTasks] = useState<LifeTask[]>([]);
  const [showSetup, setShowSetup] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const isModalOpenRef = useRef(false);
  const [, forceUpdate] = useState({});

  const [editingTask, setEditingTask] = useState<LifeTask | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  useEffect(() => {
    // Initialize life tasks from AsyncStorage on first load
    initializeLifeTasks().then(() => {
      setTasks(getLifeTasks());
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      // Don't update if modal is open
      if (!isModalOpenRef.current) {
        setTasks(getLifeTasks());
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Update ref when modal state changes
  useEffect(() => {
    isModalOpenRef.current = showEditModal;
  }, [showEditModal]);

  const enabledTasks = tasks.filter(t => t.enabled);
  const hasAnyEnabled = enabledTasks.length > 0;

  const groupedTasks: Record<TimeOfDay, LifeTask[]> = {
    morning: tasks.filter(t => t.timeOfDay === 'morning'),
    midday: tasks.filter(t => t.timeOfDay === 'midday'),
    evening: tasks.filter(t => t.timeOfDay === 'evening'),
  };

  const getTimeIcon = (timeOfDay: TimeOfDay): LucideIcon => {
    switch(timeOfDay) {
      case 'morning': return Sun;
      case 'midday': return CoffeeIcon;
      case 'evening': return Moon;
    }
  };

  const getTimeColor = (timeOfDay: TimeOfDay) => {
    switch(timeOfDay) {
      case 'morning': return '#F59E0B';
      case 'midday': return '#8b5cf6';
      case 'evening': return '#38BDF8';
    }
  };

  const getTimeLabel = (timeOfDay: TimeOfDay) => {
    switch(timeOfDay) {
      case 'morning': return 'Morning Basics';
      case 'midday': return 'Midday Check-in';
      case 'evening': return 'Evening Wind-down';
    }
  };

  const handleToggleTask = async (id: string) => {
    await toggleLifeTaskCompleted(id);
    setTasks(getLifeTasks());
  };

  const handleToggleEnabled = async (id: string) => {
    await toggleLifeTaskEnabled(id);
    setTasks(getLifeTasks());
  };

  const handleLongPressLifeTask = (task: LifeTask) => {
    if (hasPinnedTask()) {
      const currentPinned = getPinnedTask();
      Alert.alert(
        'Replace pinned task?',
        `You already have "${currentPinned?.name}" pinned.\n\nReplace it with "${task.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Replace',
            onPress: () => {
              setPinnedTask({
                id: task.id,
                name: task.name,
                type: 'life',
                emoji: task.emoji,
                timeWindow: task.timeWindow,
                pinnedAt: new Date().toISOString(),
              });
              forceUpdate({});
              Alert.alert('📌 Pinned!', `"${task.name}" is now in focus mode`);
            },
          },
        ]
      );
    } else {
      setPinnedTask({
        id: task.id,
        name: task.name,
        type: 'life',
        emoji: task.emoji,
        timeWindow: task.timeWindow,
        pinnedAt: new Date().toISOString(),
      });
      forceUpdate({});
      Alert.alert('📌 Pinned!', `"${task.name}" is now in focus mode`);
    }
  };

  const openEditModal = (task: LifeTask) => {
    setEditingTask(task);
    setIsCreatingNew(false);
    setShowEditModal(true);
  };

  const openCreateModal = (timeOfDay: TimeOfDay) => {
    // Create a temporary task with just the timeOfDay set
    setEditingTask({ timeOfDay } as LifeTask);
    setIsCreatingNew(true);
    setShowEditModal(true);
  };

  const getCompletedCount = (timeOfDay: TimeOfDay) => {
    const dayTasks = enabledTasks.filter(t => t.timeOfDay === timeOfDay);
    const completed = dayTasks.filter(t => t.completed).length;
    return { completed, total: dayTasks.length };
  };

  // Setup screen
  if (showSetup) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.setupHeader}>
            <Heart size={40} color="#8b5cf6" />
            <Text style={styles.setupTitle}>Manage Your Reminders</Text>
            <Text style={styles.setupSubtitle}>Toggle, edit, or add custom life tasks</Text>
          </View>

          {(['morning', 'midday', 'evening'] as TimeOfDay[]).map(timeOfDay => {
            const Icon = getTimeIcon(timeOfDay);
            const color = getTimeColor(timeOfDay);
            const tasksForTime = groupedTasks[timeOfDay];

            return (
              <View key={timeOfDay} style={styles.setupSection}>
                <View style={[styles.setupSectionHeader, { backgroundColor: color + '20' }]}>
                  <View style={styles.setupSectionHeaderLeft}>
                    <Icon size={20} color={color} />
                    <Text style={[styles.setupSectionTitle, { color }]}>{getTimeLabel(timeOfDay)}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => openCreateModal(timeOfDay)}
                    style={styles.addTaskButton}
                  >
                    <Plus size={18} color={color} />
                  </TouchableOpacity>
                </View>
                {tasksForTime.map(task => (
                  <View key={task.id} style={styles.setupItem}>
                    <View style={styles.setupItemLeft}>
                      <Text style={styles.setupItemEmoji}>{task.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.setupItemName}>{task.name}</Text>
                        <Text style={styles.setupItemTime}>{task.timeWindow}</Text>
                      </View>
                    </View>
                    <View style={styles.setupItemRight}>
                      <TouchableOpacity
                        onPress={() => openEditModal(task)}
                        style={styles.editIconButton}
                      >
                        <Edit2 size={16} color="#666" />
                      </TouchableOpacity>
                      <Switch
                        value={task.enabled}
                        onValueChange={() => handleToggleEnabled(task.id)}
                        trackColor={{ false: '#d1d5db', true: '#c4b5fd' }}
                        thumbColor={task.enabled ? '#8b5cf6' : '#f3f4f6'}
                      />
                    </View>
                  </View>
                ))}
              </View>
            );
          })}

          <TouchableOpacity 
            style={styles.doneButton}
            onPress={() => setShowSetup(false)}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </ScrollView>
        
        <LifeTaskModal
          visible={showEditModal}
          task={editingTask}
          isCreatingNew={isCreatingNew}
          onClose={() => setShowEditModal(false)}
          onSave={() => setTasks(getLifeTasks())}
        />
      </SafeAreaView>
    );
  }

  // Main screen - No tasks enabled yet
  if (!hasAnyEnabled) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.emptyState}>
            <Heart size={60} color="#8b5cf6" />
            <Text style={styles.emptyTitle}>Life Tasks</Text>
            <Text style={styles.emptySubtitle}>Gentle reminders for daily self-care</Text>
            <Text style={styles.emptyDescription}>
              Get optional reminders for things like meals, hydration, exercise, and rest. 
              No pressure, no judgment — just supportive nudges when you need them.
            </Text>
            <TouchableOpacity 
              style={styles.setupButton}
              onPress={() => setShowSetup(true)}
            >
              <Text style={styles.setupButtonText}>Choose Your Reminders</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Main screen - With enabled tasks
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <PinnedTaskBanner onUpdate={() => forceUpdate({})} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.title}>Life Tasks</Text>
            <Text style={styles.subtitle}>Taking care of yourself today 💙</Text>
          </View>
          <TouchableOpacity onPress={() => setShowSetup(true)}>
            <Settings size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {(['morning', 'midday', 'evening'] as TimeOfDay[]).map(timeOfDay => {
          const Icon = getTimeIcon(timeOfDay);
          const color = getTimeColor(timeOfDay);
          const { completed, total } = getCompletedCount(timeOfDay);
          const enabledTasksForTime = enabledTasks.filter(t => t.timeOfDay === timeOfDay);

          if (total === 0) return null;

          return (
            <View key={timeOfDay} style={styles.section}>
              <View style={[styles.sectionHeader, { backgroundColor: color + '20' }]}>
                <View style={styles.sectionLeft}>
                  <Icon size={24} color={color} />
                  <Text style={[styles.sectionTitle, { color }]}>{getTimeLabel(timeOfDay)}</Text>
                </View>
                <View style={styles.progressBadge}>
                  <Text style={styles.progressText}>{completed}/{total}</Text>
                </View>
              </View>

              {enabledTasksForTime.map(task => (
                <TouchableOpacity
                  key={task.id}
                  onPress={() => handleToggleTask(task.id)}
                  onLongPress={() => handleLongPressLifeTask(task)}
                  delayLongPress={500}
                  style={[styles.taskCard, task.completed && styles.taskCardCompleted]}
                >
                  <View style={styles.taskLeft}>
                    <View style={[styles.checkbox, task.completed && styles.checkboxCompleted]}>
                      {task.completed && <Check size={16} color="#fff" />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.taskNameRow}>
                        <Text style={styles.taskEmoji}>{task.emoji}</Text>
                        <Text style={[styles.taskName, task.completed && styles.taskNameCompleted]}>
                          {task.name}
                        </Text>
                      </View>
                      <Text style={styles.taskTime}>Anytime between {task.timeWindow}</Text>
                      {task.repeats && task.repeats > 1 && (
                        <View style={styles.progressContainer}>
                          <View style={styles.progressDots}>
                            {Array.from({ length: task.repeats }).map((_, index) => (
                              <View
                                key={index}
                                style={[
                                  styles.progressDot,
                                  index < task.completedCount && styles.progressDotFilled,
                                ]}
                              />
                            ))}
                          </View>
                          <Text style={styles.progressTextSmall}>
                            {task.completed 
                              ? 'All done! 🎉' 
                              : task.completedCount > 0 
                                ? `${task.completedCount}/${task.repeats} done today`
                                : `${task.repeats}x today`}
                          </Text>
                        </View>
                      )}
                      <Text style={styles.pinHint}>💡 Long-press to pin</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          );
        })}

        <View style={styles.encouragement}>
          <Text style={styles.encouragementText}>
            {enabledTasks.filter(t => t.completed).length === enabledTasks.length
              ? "Amazing! You've taken care of yourself today 🌟"
              : "Remember: These are gentle reminders, not obligations. Do what you can 💙"}
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  headerContainer: {
    backgroundColor: 'rgba(139, 92, 246, 0.85)',
    marginHorizontal: -20,
    marginTop: -20,
    padding: 24,
    paddingTop: 20,
    marginBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  setupButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  setupButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  setupHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  setupTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111',
    marginTop: 16,
    marginBottom: 8,
  },
  setupSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  setupSection: {
    marginBottom: 24,
  },
  setupSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  setupSectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  setupSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  addTaskButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setupItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
  },
  setupItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  setupItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editIconButton: {
    padding: 4,
  },
  setupItemEmoji: {
    fontSize: 24,
  },
  setupItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111',
  },
  setupItemTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  doneButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  doneButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  progressBadge: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  progressText: {
    fontSize: 13,
    color: '#8b5cf6',
    fontWeight: '600',
  },
  taskCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  taskCardCompleted: {
    backgroundColor: '#f0fdf4',
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  taskNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskEmoji: {
    fontSize: 20,
  },
  taskName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111',
  },
  taskNameCompleted: {
    color: '#666',
    textDecorationLine: 'line-through',
  },
  taskTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  encouragement: {
    backgroundColor: '#f8f4ff',
    padding: 20,
    borderRadius: 12,
    marginTop: 8,
  },
  encouragementText: {
    fontSize: 14,
    color: '#8b5cf6',
    textAlign: 'center',
    lineHeight: 20,
  },
  progressContainer: {
    marginTop: 8,
    gap: 6,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 6,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d1d5db',
  },
  progressDotFilled: {
    backgroundColor: '#22c55e',
  },
  progressTextSmall: {
    fontSize: 11,
    color: '#8b5cf6',
    fontWeight: '500',
  },
  pinHint: {
    fontSize: 10,
    color: '#8b5cf6',
    marginTop: 6,
  },
});