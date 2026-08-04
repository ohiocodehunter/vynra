import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  Animated, 
  Dimensions, 
  TouchableOpacity, 
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { X, Send } from 'lucide-react-native';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import CommentItem from './CommentItem';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.75;

interface CommentsSheetProps {
  isVisible: boolean;
  onClose: () => void;
  videoId: string;
}

export default function CommentsSheet({ isVisible, onClose, videoId }: CommentsSheetProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<any>(null);
  
  const { user } = useAuth();
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Build comment tree (1 level deep)
  const buildCommentTree = (flatComments: any[]) => {
    const parentComments = flatComments.filter(c => !c.parentComment);
    const replies = flatComments.filter(c => c.parentComment);
    
    return parentComments.map(parent => ({
      ...parent,
      replies: replies.filter(r => r.parentComment === parent._id)
    }));
  };

  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await client.get(`/comments/${videoId}`);
      setComments(buildCommentTree(res.data));
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isVisible) {
      fetchComments();
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SHEET_HEIGHT,
          duration: 250,
          useNativeDriver: true
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true
        })
      ]).start();
      
      // Reset state on close
      setTimeout(() => {
        setReplyingTo(null);
        setInputText('');
      }, 300);
    }
  }, [isVisible]);

  const handlePostComment = async () => {
    if (!inputText.trim() || !user) return;
    
    try {
      const payload = {
        text: inputText.trim(),
        parentCommentId: replyingTo?._id || undefined
      };
      
      const res = await client.post(`/comments/${videoId}`, payload);
      
      // Refresh comments to show new one
      fetchComments();
      setInputText('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  return (
    <Modal visible={isVisible} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView 
        style={styles.overlay} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableOpacity style={styles.backdropTouch} onPress={onClose} activeOpacity={1} />
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.sheet,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Comments</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color="#fff" size={24} />
            </TouchableOpacity>
          </View>
          
          {loading && comments.length === 0 ? (
            <ActivityIndicator style={styles.loader} color="#fff" />
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <CommentItem 
                  comment={item} 
                  onReply={(comment) => setReplyingTo(comment)} 
                />
              )}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No comments yet. Be the first to comment!</Text>
                </View>
              }
            />
          )}

          <View style={styles.inputContainer}>
            {replyingTo && (
              <View style={styles.replyingToBanner}>
                <Text style={styles.replyingToText}>
                  Replying to @{replyingTo.author?.username}
                </Text>
                <TouchableOpacity onPress={() => setReplyingTo(null)}>
                  <X color="#888" size={16} />
                </TouchableOpacity>
              </View>
            )}
            
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                placeholder={user ? "Add a comment..." : "Log in to comment"}
                placeholderTextColor="#888"
                value={inputText}
                onChangeText={setInputText}
                multiline
                editable={!!user}
              />
              <TouchableOpacity 
                style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
                onPress={handlePostComment}
                disabled={!inputText.trim() || !user}
              >
                <Send color={inputText.trim() ? "#3ea6ff" : "#555"} size={20} />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  backdropTouch: {
    flex: 1,
  },
  sheet: {
    backgroundColor: '#222',
    height: SHEET_HEIGHT,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  loader: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    textAlign: 'center',
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    padding: 12,
    backgroundColor: '#222',
  },
  replyingToBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#333',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  replyingToText: {
    color: '#aaa',
    fontSize: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#333',
    color: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 100,
    minHeight: 40,
  },
  sendBtn: {
    padding: 10,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  }
});
