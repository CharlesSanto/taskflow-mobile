
import React, { useState } from 'react';
import { Button, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';


export default function TodoScreen() {
  const [tasks, setTasks] = useState<{ id: string; text: string }[]>([]);
  const [input, setInput] = useState('');

  const addTask = () => {
    if (input.trim()) {
      setTasks(prev => [
        { id: Date.now().toString(), text: input.trim() },
        ...prev,
      ]);
      setInput('');
    }
  };

  const removeTask = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Minhas Tarefas</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Adicionar nova tarefa"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={addTask}
          returnKeyType="done"
        />
        <Button title="Adicionar" onPress={addTask} />
      </View>
      <FlatList
        data={tasks}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.taskRow}>
            <Text style={styles.taskText}>{item.text}</Text>
            <TouchableOpacity onPress={() => removeTask(item.id)}>
              <Text style={styles.removeBtn}>Remover</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Nenhuma tarefa ainda.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#222',
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  taskText: {
    fontSize: 16,
    color: '#333',
  },
  removeBtn: {
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  empty: {
    textAlign: 'center',
    color: '#aaa',
    marginTop: 32,
  },
});
