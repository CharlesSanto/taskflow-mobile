import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as NavigationBar from 'expo-navigation-bar';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  LayoutAnimation,
  Modal,
  PixelRatio,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
  useWindowDimensions
} from 'react-native';

// Habilita animações no Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- TIPAGEM ---
interface TaskType {
  id: number;
  title: string;
  desc: string;
  date: string;
  rawDate: Date;
  late: boolean;
  color: string;
  priority: number;
  completed: boolean;
}

// --- FUNÇÕES AUXILIARES ---
function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
}

function formatChartDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

// --- DADOS INICIAIS ---
const today = new Date();
const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 3);

const initialTasks: TaskType[] = [
  { id: 1, title: 'Reunião de Projeto', desc: 'Alinhamento com equipe', date: formatDate(today), rawDate: today, late: true, color: '#ef4444', priority: 1, completed: false },
  { id: 2, title: 'Enviar Relatório', desc: '', date: formatDate(today), rawDate: today, late: true, color: '#f59e42', priority: 2, completed: false },
  { id: 3, title: 'Academia', desc: '', date: formatDate(today), rawDate: today, late: false, color: '#3b82f6', priority: 3, completed: false },
  { id: 4, title: 'Dentista', desc: 'Dr. Silva', date: formatDate(tomorrow), rawDate: tomorrow, late: false, color: '#6b7280', priority: 4, completed: false },
  { id: 5, title: 'Comprar presente', desc: '', date: formatDate(tomorrow), rawDate: tomorrow, late: false, color: '#f59e42', priority: 2, completed: false },
  { id: 6, title: 'Planejamento Q2', desc: '', date: formatDate(nextWeek), rawDate: nextWeek, late: false, color: '#ef4444', priority: 1, completed: false },
  { id: 7, title: 'Ler livro', desc: 'Capítulo 1 a 5', date: formatDate(today), rawDate: today, late: false, color: '#6b7280', priority: 4, completed: true },
  { id: 8, title: 'Pagar conta luz', desc: '', date: '25 de jan', rawDate: new Date(2025, 0, 25), late: false, color: '#ef4444', priority: 1, completed: true },
];

export default function App() {
  const { width: windowWidth } = useWindowDimensions();
  const scale = Math.min(windowWidth, 450) / 375;

  const normalize = (size: number) => {
    const newSize = size * scale;
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  };

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync("#27272a");
      NavigationBar.setButtonStyleAsync("light");
    }
  }, []);

  // --- ESTADOS ---
  const [currentTab, setCurrentTab] = useState('Home');
  const [tasks, setTasks] = useState<TaskType[]>(initialTasks);
  const [statsFilter, setStatsFilter] = useState('7 Dias');
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskType | null>(null);
  
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDate, setNewDate] = useState<Date>(new Date());
  const [newPriority, setNewPriority] = useState<number>(4);
  const [error, setError] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showLateTasks, setShowLateTasks] = useState(true);

  const PRIORITY_OPTIONS = [
    { value: 1, label: 'Prioridade 1', color: '#ef4444' },
    { value: 2, label: 'Prioridade 2', color: '#f59e42' },
    { value: 3, label: 'Prioridade 3', color: '#3b82f6' },
    { value: 4, label: 'Prioridade 4', color: '#6b7280' },
  ];

  // --- CRUD ---
  function handleSaveTask() {
    if (!newTitle.trim()) { setError('Digite o nome da tarefa'); return; }
    
    const priorityColor = PRIORITY_OPTIONS.find(p => p.value === newPriority)?.color || '#6b7280';
    const formattedDate = formatDate(newDate);
    const isLate = newDate.setHours(0,0,0,0) < new Date().setHours(0,0,0,0);

    if (editingTask) {
      setTasks(prevTasks => prevTasks.map(t => t.id === editingTask.id ? {
        ...t, title: newTitle, desc: newDesc, date: formattedDate, rawDate: newDate, priority: newPriority, color: priorityColor, late: isLate
      } : t));
    } else {
      const newTask: TaskType = {
        id: Date.now(), 
        title: newTitle, 
        desc: newDesc, 
        date: formattedDate, 
        rawDate: newDate, 
        late: isLate, 
        color: priorityColor, 
        priority: newPriority, 
        completed: false,
      };
      setTasks(prevTasks => [...prevTasks, newTask]);
    }
    setModalVisible(false);
  }

  function handleToggleComplete(id: number) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTasks(prevTasks => prevTasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  }

  function handleDeleteTask() {
    if (!editingTask) return;
    Alert.alert("Excluir", "Deseja apagar esta tarefa?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: () => {
          setTasks(prevTasks => prevTasks.filter(t => t.id !== editingTask.id));
          setModalVisible(false);
      }}
    ]);
  }

  function openModal(task: TaskType | null = null) {
    setEditingTask(task);
    setNewTitle(task ? task.title : '');
    setNewDesc(task ? task.desc : '');
    setNewDate(task ? (task.rawDate instanceof Date ? task.rawDate : new Date()) : new Date());
    setNewPriority(task ? task.priority : 4);
    setError('');
    setShowDatePicker(false);
    setModalVisible(true);
  }

  // --- FILTROS ---
  const todayStr = formatDate(new Date());
  
  const homeTasks = useMemo(() => tasks.filter(t => !t.completed && (t.date === todayStr || t.late)), [tasks, todayStr]);
  const lateTasksList = homeTasks.filter(t => t.late);
  const todayTasksList = homeTasks.filter(t => !t.late);

  const upcomingTasks = useMemo(() => {
    const future = tasks.filter(t => !t.completed && !t.late && t.date !== todayStr);
    const grouped: { [key: string]: TaskType[] } = {};
    future.forEach(t => { 
        if (!grouped[t.date]) grouped[t.date] = []; 
        grouped[t.date].push(t); 
    });
    return grouped;
  }, [tasks, todayStr]);

  const completedTasks = useMemo(() => tasks.filter(t => t.completed), [tasks]);

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) setNewDate(selectedDate);
  };

  // --- ESTILOS RESPONSIVOS ---
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#18181b' },
    headerTitle: { fontSize: normalize(24), fontWeight: 'bold', color: '#fff', marginBottom: 4 },
    headerSub: { fontSize: normalize(14), color: '#a1a1aa', marginBottom: 20 },
    
    // Cards
    card: {
      backgroundColor: '#27272a',
      borderRadius: 12,
      paddingVertical: normalize(12),
      paddingHorizontal: normalize(14),
      marginBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 3,
    },
    colorPill: {
      width: 4,
      height: 32,
      borderRadius: 4,
      marginRight: 14,
    },
    cardTitle: {
      fontSize: normalize(16),
      fontWeight: '600',
      color: '#fff',
      marginBottom: 2
    },
    cardSub: {
      fontSize: normalize(13),
      color: '#a1a1aa',
      marginTop: 0,
      marginBottom: 4
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    metaText: {
      fontSize: normalize(11),
      marginLeft: 4,
      fontWeight: '500'
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Abas
    tabBar: {
      flexDirection: 'row',
      backgroundColor: '#27272a',
      borderTopWidth: 1,
      borderTopColor: '#3f3f46',
      paddingTop: 12,
      paddingBottom: Platform.OS === 'ios' ? 28 : 48, 
    },
    
    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: '#232326', padding: 20, borderRadius: 18, elevation: 10, width: '90%', maxWidth: 400 },
    input: { backgroundColor: '#18181b', color: '#fff', borderRadius: 10, padding: 14, marginBottom: 12, fontSize: normalize(14) },
    
    // Buttons
    btnPrimary: { backgroundColor: '#6366f1', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10 },
    btnGhost: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10 },
    
    // Section Headers
    dateSection: {
      color: '#71717a',
      fontSize: normalize(11),
      fontWeight: 'bold',
      marginTop: 16,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 1
    },

    // Stats
    barContainer: { alignItems: 'center', flex: 1 },
    bar: { width: 8, borderRadius: 4, marginBottom: 8, minHeight: 8 }
  });

  // --- COMPONENTES ---
  const TaskCard = ({ task }: { task: TaskType }) => (
    <TouchableOpacity activeOpacity={0.7} onPress={() => openModal(task)} style={[styles.card, task.completed && { opacity: 0.5 }]}>
      <View style={[styles.colorPill, { backgroundColor: task.completed ? '#52525b' : task.color }]} />
      
      <View style={{ flex: 1 }}>
        <Text style={[styles.cardTitle, task.completed && { textDecorationLine: 'line-through', color: '#71717a' }]} numberOfLines={1}>
          {task.title}
        </Text>
        {task.desc ? <Text style={styles.cardSub} numberOfLines={1}>{task.desc}</Text> : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
          <Ionicons name="calendar-outline" size={normalize(12)} color={task.late && !task.completed ? '#ef4444' : '#71717a'} />
          <Text style={[styles.metaText, { color: task.late && !task.completed ? '#ef4444' : '#71717a' }]}>
            {task.date}
          </Text>
          {!task.completed && (
            <>
              <Text style={{ color: '#3f3f46', marginHorizontal: 6 }}>•</Text>
              <Ionicons name="flag" size={normalize(11)} color={task.color} />
            </>
          )}
        </View>
      </View>

      <Pressable hitSlop={10} onPress={() => handleToggleComplete(task.id)} style={{ paddingLeft: 10 }}>
        <View style={[styles.checkbox, { borderColor: task.completed ? '#10b981' : '#52525b', backgroundColor: task.completed ? '#10b981' : 'transparent' }]}>
          {task.completed && <Ionicons name="checkmark" size={14} color="#fff" />}
        </View>
      </Pressable>
    </TouchableOpacity>
  );

  const TabButton = ({ name, icon, label }: { name: string; icon: any; label: string }) => (
    <TouchableOpacity onPress={() => setCurrentTab(name)} style={{ alignItems: 'center', flex: 1 }}>
      <Ionicons name={currentTab === name ? icon : icon + '-outline'} size={24} color={currentTab === name ? '#6366f1' : '#71717a'} />
      <Text style={{ fontSize: 10, color: currentTab === name ? '#6366f1' : '#71717a', marginTop: 4, fontWeight: currentTab === name ? '600' : '400' }}>{label}</Text>
    </TouchableOpacity>
  );

  // --- TELAS ---
  const renderHome = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
      <Text style={styles.headerTitle}>Hoje</Text>
      <Text style={styles.headerSub}>{todayTasksList.length + lateTasksList.length} tarefas pendentes</Text>

      {lateTasksList.length > 0 && (
        <View style={{ marginBottom: 10 }}>
          <TouchableOpacity onPress={() => setShowLateTasks(!showLateTasks)} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
             <Ionicons name={showLateTasks ? "chevron-down" : "chevron-forward"} size={16} color="#ef4444" />
             <Text style={{ color: '#ef4444', fontWeight: 'bold', marginLeft: 6, fontSize: normalize(14) }}>Atrasadas ({lateTasksList.length})</Text>
          </TouchableOpacity>
          {showLateTasks && lateTasksList.map(t => <TaskCard key={t.id} task={t} />)}
        </View>
      )}

      {todayTasksList.map(t => <TaskCard key={t.id} task={t} />)}
      
      {todayTasksList.length === 0 && lateTasksList.length === 0 && (
        <View style={{ alignItems: 'center', marginTop: 60, opacity: 0.4 }}>
          <Ionicons name="sparkles-outline" size={60} color="#a1a1aa" />
          <Text style={{ color: '#a1a1aa', marginTop: 16, fontSize: 16 }}>Tudo limpo por aqui!</Text>
        </View>
      )}
    </ScrollView>
  );

  const renderUpcoming = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
      <Text style={styles.headerTitle}>Em Breve</Text>
      <Text style={styles.headerSub}>Planejamento futuro</Text>
      
      {Object.keys(upcomingTasks).length === 0 ? 
        <Text style={{ color: '#52525b', textAlign: 'center', marginTop: 20 }}>Nada agendado.</Text> : 
        Object.keys(upcomingTasks)
          .sort((a, b) => {
            // Ordena as datas do mais próximo para o mais distante
            const dateA = upcomingTasks[a][0]?.rawDate instanceof Date ? upcomingTasks[a][0].rawDate : new Date();
            const dateB = upcomingTasks[b][0]?.rawDate instanceof Date ? upcomingTasks[b][0].rawDate : new Date();
            return dateA.getTime() - dateB.getTime();
          })
          .map(date => (
            <View key={date}>
              <Text style={styles.dateSection}>{date}</Text>
              {(upcomingTasks[date] as TaskType[]).map((t: TaskType) => <TaskCard key={t.id} task={t} />)}
            </View>
          ))
      }
    </ScrollView>
  );

  const renderHistory = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
      <Text style={styles.headerTitle}>Histórico</Text>
      <Text style={styles.headerSub}>Tarefas concluídas</Text>
      <Text style={styles.dateSection}>JANEIRO 2026</Text>
      {completedTasks.length === 0 && <Text style={{ color: '#52525b', marginTop: 10 }}>Nenhuma tarefa concluída.</Text>}
      {completedTasks.map(t => <TaskCard key={t.id} task={t} />)}
    </ScrollView>
  );

  const renderStats = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d;
    });
    const mockValues = [15, 25, 10, 45, 80, 50, 20]; 
    
    // -- ATUALIZADO: Apenas as 3 opções solicitadas --
    const filters = ['7 Dias', '30 Dias', '1 Ano'];

    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <Text style={styles.headerTitle}>Estatísticas</Text>
        <Text style={styles.headerSub}>Produtividade semanal</Text>

        <View style={{ backgroundColor: '#27272a', borderRadius: 20, padding: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 }}>
            <View>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Produtividade</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 6 }}>
                <Text style={{ color: '#6366f1', fontSize: 32, fontWeight: 'bold' }}>{completedTasks.length}</Text>
                <Text style={{ color: '#a1a1aa', fontSize: 12, fontWeight: '600', marginLeft: 6 }}>CONCLUÍDAS</Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 8 }}>
                <View style={{ flexDirection: 'row', backgroundColor: '#18181b', borderRadius: 8, padding: 2 }}>
                    {/* Renderiza todos os filtros */}
                    {filters.map(f => (
                        <TouchableOpacity key={f} onPress={() => setStatsFilter(f)} style={{ backgroundColor: statsFilter === f ? '#3f3f46' : 'transparent', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }}>
                            <Text style={{ color: statsFilter === f ? '#fff' : '#71717a', fontSize: 10, fontWeight: '600' }}>{f}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
          </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 200 }}>
            {last7Days.map((date, idx) => {
               const isToday = idx === 6;
               return (
                <View key={idx} style={styles.barContainer}>
                  <View style={[styles.bar, { 
                    height: `${mockValues[idx]}%`, 
                    backgroundColor: isToday ? '#6366f1' : '#3f3f46',
                    width: isToday ? 12 : 8 
                  }]} />
                  <Text style={{ color: isToday ? '#fff' : '#52525b', fontSize: 10, fontWeight: '600' }}>{formatChartDate(date)}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#18181b" 
        translucent={false} 
      />
      
      <View style={{ flex: 1, paddingHorizontal: normalize(20), paddingTop: normalize(50) }}>
        {currentTab === 'Home' && renderHome()}
        {currentTab === 'Upcoming' && renderUpcoming()}
        {currentTab === 'History' && renderHistory()}
        {currentTab === 'Stats' && renderStats()}
      </View>

      {/* FAB */}
      {(currentTab === 'Home' || currentTab === 'Upcoming') && (
        <TouchableOpacity 
          onPress={() => openModal()}
          style={{ 
            position: 'absolute', bottom: normalize(110), right: normalize(20), 
            backgroundColor: '#6366f1', paddingHorizontal: 20, paddingVertical: 12, 
            borderRadius: 30, flexDirection: 'row', alignItems: 'center',
            shadowColor: '#6366f1', shadowOpacity: 0.4, shadowOffset: {width: 0, height: 4}, elevation: 8
          }}>
            <Ionicons name="add" size={22} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 6 }}>Nova Tarefa</Text>
        </TouchableOpacity>
      )}

      <View style={styles.tabBar}>
        <TabButton name="Home" icon="home" label="Hoje" />
        <TabButton name="Upcoming" icon="calendar" label="Em Breve" />
        <TabButton name="History" icon="time" label="Histórico" />
        <TabButton name="Stats" icon="stats-chart" label="Estatísticas" />
      </View>

      {/* MODAL */}
      <Modal visible={modalVisible} animationType="fade" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>{editingTask ? 'Editar' : 'Nova Tarefa'}</Text>
              {editingTask && (
                <TouchableOpacity onPress={handleDeleteTask} style={{ padding: 4 }}>
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>
            
            <TextInput style={[styles.input, { fontWeight: '600', fontSize: 18 }]} placeholder="Nome da tarefa" placeholderTextColor="#52525b" value={newTitle} onChangeText={t => { setNewTitle(t); setError(''); }} autoFocus={!editingTask} />
            <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Descrição (opcional)" placeholderTextColor="#52525b" value={newDesc} onChangeText={setNewDesc} multiline />
            
            {error ? <Text style={{ color: '#ef4444', marginBottom: 10, fontSize: 12 }}>{error}</Text> : null}

            <View style={{ flexDirection: 'row', gap: 10, zIndex: 10 }}>
              <TouchableOpacity style={{ flex: 1, backgroundColor: '#18181b', padding: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center' }} onPress={() => setShowDatePicker(!showDatePicker)}>
                <Ionicons name="calendar-outline" size={18} color="#a1a1aa" />
                <Text style={{ color: '#fff', marginLeft: 8, fontSize: 14 }}>{formatDate(newDate)}</Text>
              </TouchableOpacity>
              
              <View style={{ flex: 1 }}>
                <TouchableOpacity style={{ flex: 1, backgroundColor: '#18181b', padding: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }} onPress={() => setShowPriorityDropdown(!showPriorityDropdown)}>
                   <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                     <Ionicons name="flag" size={18} color={PRIORITY_OPTIONS.find(p => p.value === newPriority)?.color} />
                     <Text style={{ color: '#fff', marginLeft: 8, fontSize: 14 }}>Pri. {newPriority}</Text>
                   </View>
                </TouchableOpacity>
                {showPriorityDropdown && (
                  <View style={{ position: 'absolute', top: 55, left: 0, right: 0, backgroundColor: '#27272a', borderRadius: 10, padding: 4, zIndex: 99, borderWidth: 1, borderColor: '#3f3f46' }}>
                    {PRIORITY_OPTIONS.map(opt => (
                      <TouchableOpacity key={opt.value} style={{ flexDirection: 'row', alignItems: 'center', padding: 10 }} onPress={() => { setNewPriority(opt.value); setShowPriorityDropdown(false); }}>
                        <Ionicons name="flag" size={16} color={opt.color} style={{ marginRight: 8 }} />
                        <Text style={{ color: '#e5e7eb', fontSize: 12 }}>{opt.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {showDatePicker && (
               <View style={{ marginTop: 10, backgroundColor: Platform.OS === 'ios' ? '#18181b' : 'transparent', borderRadius: 10, overflow: 'hidden' }}>
                 <DateTimePicker value={newDate} mode="date" display="default" onChange={onDateChange} minimumDate={new Date(2020, 0, 1)} themeVariant="dark" accentColor="#6366f1" />
               </View>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 24, gap: 12 }}>
              <TouchableOpacity style={styles.btnGhost} onPress={() => setModalVisible(false)}><Text style={{ color: '#a1a1aa', fontWeight: '600' }}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={styles.btnPrimary} onPress={handleSaveTask}><Text style={{ color: '#fff', fontWeight: 'bold' }}>Salvar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}