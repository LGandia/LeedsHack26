import { Calendar, Clock, Coffee, Edit2, Moon, Zap } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TaskEditModal from './TaskEditModal';
import { getSharedTasks, initializeTasks, Task } from './taskStorage';

type EnergyLevel = 'high' | 'medium' | 'low';
type SortBy = 'date' | 'priority';

export default function AllTasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    // Initialize tasks on first load
    initializeTasks().then(() => {
      setTasks(getSharedTasks());
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const latestTasks = getSharedTasks();
      setTasks(latestTasks);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  };

  const sortTasks = (tasks: Task[]) => {
    const sorted = [...tasks];
    
    if (sortBy === 'date') {
      sorted.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    } else {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      sorted.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    }
    
    return sorted;
  };

  const getEnergyIcon = (level: EnergyLevel) => {
    switch(level) {
      case 'high': return Zap;
      case 'medium': return Coffee;
      case 'low': return Moon;
    }
  };

  const getEnergyColor = (level: EnergyLevel) => {
    switch(level) {
      case 'high': return '#F59E0B';
      case 'medium': return '#8b5cf6';
      case 'low': return '#38BDF8';
    }
  };

  const getEnergyCardColor = (level: EnergyLevel) => {
    switch(level) {
      case 'high': return { border: '#F59E0B', bg: '#FEF3C7' };
      case 'medium': return { border: '#8b5cf6', bg: '#F3E8FF' };
      case 'low': return { border: '#38BDF8', bg: '#E0F2FE' };
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowEditModal(true);
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setEditingTask(null);
  };

  const handleSaveTask = () => {
    setTasks(getSharedTasks());
  };

  const sortedTasks = sortTasks(tasks.filter(t => !t.completed));
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>All Tasks</Text>
          <Text style={styles.subtitle}>{sortedTasks.length} active • {completedTasks.length} completed</Text>
        </View>

        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'date' && styles.sortButtonActive]}
            onPress={() => setSortBy('date')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'date' && styles.sortButtonTextActive]}>Date</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'priority' && styles.sortButtonActive]}
            onPress={() => setSortBy('priority')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'priority' && styles.sortButtonTextActive]}>Priority</Text>
          </TouchableOpacity>
        </View>

        {sortedTasks.map(task => {
          const colors = getEnergyCardColor(task.energy);
          const EnergyIcon = getEnergyIcon(task.energy);
          
          return (
            <TouchableOpacity
              key={task.id}
              onPress={() => handleEditTask(task)}
              style={[styles.taskCard, { borderLeftColor: colors.border, backgroundColor: colors.bg }]}
            >
              <View style={styles.taskCardContent}>
                <View style={styles.taskInfo}>
                  <Text style={styles.taskName}>{task.name}</Text>
                  <View style={styles.taskMeta}>
                    <View style={styles.metaItem}>
                      <Calendar size={16} color="#666" />
                      <Text style={styles.metaText}>{formatDate(task.dueDate)}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Clock size={16} color="#666" />
                      <Text style={styles.metaText}>{task.time}m</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <EnergyIcon size={16} color={getEnergyColor(task.energy)} />
                      <Text style={styles.metaText}>{task.energy}</Text>
                    </View>
                    <View style={styles.priorityBadge}>
                      <Text style={[styles.priorityText, { color: colors.border }]}>{task.priority} priority</Text>
                    </View>
                  </View>
                  {task.type && (
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeText}>{task.type}</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => handleEditTask(task)}
                  style={styles.editButton}
                >
                  <Edit2 size={20} color="#8b5cf6" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}

        {sortedTasks.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No tasks yet!</Text>
            <Text style={styles.emptySubtext}>Add a task to get started</Text>
          </View>
        )}
      </ScrollView>

      <TaskEditModal
        visible={showEditModal}
        task={editingTask}
        onClose={handleCloseModal}
        onSave={handleSaveTask}
      />
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
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  sortButtonActive: {
    backgroundColor: '#8b5cf6',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  sortButtonTextActive: {
    color: '#fff',
  },
  taskCard: {
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  taskCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  taskInfo: {
    flex: 1,
  },
  taskName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 8,
  },
  taskMeta: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#666',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeText: {
    fontSize: 11,
    color: '#666',
  },
  editButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
});