import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addTask, getSharedTasks } from '../taskStorage';

type EnergyLevel = 'high' | 'medium' | 'low';
type Priority = 'high' | 'medium' | 'low';

export default function AddTaskScreen() {
  const [taskName, setTaskName] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [energy, setEnergy] = useState<EnergyLevel>('medium');
  const [timeInMinutes, setTimeInMinutes] = useState(30);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [taskType, setTaskType] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleAddTask = async () => {
    if (!taskName.trim()) {
      Alert.alert('Error', 'Please enter a task name');
      return;
    }

    const newTask = await addTask({
      name: taskName,
      priority,
      energy,
      time: timeInMinutes,
      type: taskType,
      completed: false,
      dueDate: dueDate.toISOString(),
    });

    console.log('✅ NEW TASK ADDED:', newTask);
    console.log('📅 Due date:', dueDate.toISOString());
    console.log('📊 Total tasks now:', getSharedTasks().length);

    Alert.alert('Success', `Task "${taskName}" added!\n\nTotal tasks: ${getSharedTasks().length}`, [
      { text: 'Add Another', onPress: () => {
        setTaskName('');
        setTimeInMinutes(30);
        setTaskType('');
        setDueDate(new Date());
      }},
      { text: 'Done', onPress: () => {
        setTaskName('');
        setTimeInMinutes(30);
        setTaskType('');
        setDueDate(new Date());
      }}
    ]);
  };

  const formatDate = (date: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const getTimePickerValue = () => {
    const date = new Date();
    date.setHours(Math.floor(timeInMinutes / 60));
    date.setMinutes(timeInMinutes % 60);
    date.setSeconds(0);
    return date;
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    
    if (selectedDate) {
      const hours = selectedDate.getHours();
      const minutes = selectedDate.getMinutes();
      const totalMinutes = (hours * 60) + minutes;
      setTimeInMinutes(totalMinutes > 0 ? totalMinutes : 1);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Add New Task</Text>
          <Text style={styles.subtitle}>Create a new task with smart energy matching</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Task Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Write project report"
            value={taskName}
            onChangeText={setTaskName}
            multiline
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Due Date *</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Calendar size={20} color="#666" />
            <Text style={styles.dateButtonText}>{formatDate(dueDate)}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={dueDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (selectedDate) {
                  setDueDate(selectedDate);
                }
              }}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Priority *</Text>
          <View style={styles.optionRow}>
            {(['high', 'medium', 'low'] as Priority[]).map(p => (
              <TouchableOpacity
                key={p}
                onPress={() => setPriority(p)}
                style={[styles.optionButton, priority === p && styles.optionButtonActive]}
              >
                <Text style={[styles.optionText, priority === p && styles.optionTextActive]}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Energy Required *</Text>
          <View style={styles.optionRow}>
            {(['high', 'medium', 'low'] as EnergyLevel[]).map(e => (
              <TouchableOpacity
                key={e}
                onPress={() => setEnergy(e)}
                style={[styles.optionButton, energy === e && styles.optionButtonActive]}
              >
                <Text style={[styles.optionText, energy === e && styles.optionTextActive]}>
                  {e.charAt(0).toUpperCase() + e.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Estimated Time *</Text>
          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={styles.timeButtonText}>{formatTime(timeInMinutes)}</Text>
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              value={getTimePickerValue()}
              mode="time"
              is24Hour={true}
              display={Platform.OS === 'ios' ? 'spinner' : 'spinner'}
              onChange={handleTimeChange}
              minuteInterval={5}
            />
          )}
          {Platform.OS === 'ios' && showTimePicker && (
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => setShowTimePicker(false)}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Task Type (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Admin, Creative, Deep focus"
            value={taskType}
            onChangeText={setTaskType}
          />
          <View style={styles.optionRow}>
            {['Admin', 'Deep focus', 'Creative', 'Physical'].map(type => (
              <TouchableOpacity
                key={type}
                onPress={() => setTaskType(type)}
                style={styles.suggestionChip}
              >
                <Text style={styles.suggestionText}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={handleAddTask}>
          <Text style={styles.addButtonText}>Add Task</Text>
        </TouchableOpacity>

        <Text style={styles.requiredNote}>* Required fields</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  headerContainer: {
    backgroundColor: 'rgba(139, 92, 246, 0.85)',
    marginHorizontal: -20,
    marginTop: -20,
    padding: 24,
    paddingTop: 20,
    marginBottom: 24,
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
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  timeButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  timeButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  doneButton: {
    marginTop: 12,
    backgroundColor: '#8b5cf6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  optionButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonActive: {
    backgroundColor: '#f3e8ff',
    borderColor: '#8b5cf6',
  },
  optionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  optionTextActive: {
    color: '#8b5cf6',
    fontWeight: '600',
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  suggestionText: {
    fontSize: 12,
    color: '#666',
  },
  addButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  requiredNote: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
  },
});