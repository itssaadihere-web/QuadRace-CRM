import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { io } from 'socket.io-client';

const API_BASE = 'http://localhost:5000';

export default function MobileInboxScreen() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchConversations = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/conversations?org_id=org-demo-123`);
      const data = await res.json();
      if (data.success) {
        setConversations(data.conversations);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();

    const socket = io(API_BASE);
    socket.emit('join_conversation', { orgId: 'org-demo-123' });

    socket.on('conversation_updated', () => {
      fetchConversations();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleTakeover = async (id: string, currentStatus: string) => {
    const socket = io(API_BASE);
    socket.emit('human_takeover', {
      conversationId: id,
      orgId: 'org-demo-123',
      agentId: 'usr-agent-mobile',
      action: currentStatus === 'human_active' ? 'release' : 'takeover'
    });
    fetchConversations();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Omnichannel Live Inbox</Text>
        <Text style={styles.badge}>Socket Sync Active</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.visitorName}>{item.visitor_name || 'Anonymous Visitor'}</Text>
                <Text style={styles.statusTag}>{item.status.replace('_', ' ')}</Text>
              </View>
              
              <Text style={styles.metaText}>Channel: {item.channel} • Visitor ID: {item.visitor_id}</Text>

              <View style={styles.actionRow}>
                <TouchableOpacity 
                  style={[styles.takeoverBtn, item.status === 'human_active' ? styles.releaseBtn : styles.takeoverActiveBtn]}
                  onPress={() => handleTakeover(item.id, item.status)}
                >
                  <Text style={styles.btnText}>
                    {item.status === 'human_active' ? 'Resume Solomon AI' : 'Interrupt AI & Takeover'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16', padding: 16 },
  headerBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  badge: { color: '#34d399', fontSize: 12, backgroundColor: 'rgba(52, 211, 153, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  card: { backgroundColor: '#0f172a', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  visitorName: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },
  statusTag: { color: '#818cf8', fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  metaText: { color: '#94a3b8', fontSize: 12, marginBottom: 12 },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  takeoverBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  takeoverActiveBtn: { backgroundColor: '#d97706' },
  releaseBtn: { backgroundColor: '#334155' },
  btnText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' }
});
