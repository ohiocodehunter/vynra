import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { formatDistanceToNow } from 'date-fns';

interface CommentItemProps {
  comment: any;
  onReply: (comment: any) => void;
  isReply?: boolean;
}

export default function CommentItem({ comment, onReply, isReply = false }: CommentItemProps) {
  const [showReplies, setShowReplies] = useState(false);

  const hasReplies = comment.replies && comment.replies.length > 0;

  return (
    <View style={[styles.container, isReply && styles.replyContainer]}>
      <Image 
        source={{ uri: comment.author?.avatarUrl || 'https://via.placeholder.com/40' }} 
        style={isReply ? styles.replyAvatar : styles.avatar} 
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.username}>{comment.author?.username || 'User'}</Text>
          <Text style={styles.time}>
            {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : 'Recently'}
          </Text>
        </View>
        <Text style={styles.text}>{comment.text}</Text>
        
        {!isReply && (
          <TouchableOpacity onPress={() => onReply(comment)} style={styles.replyButton}>
            <Text style={styles.replyButtonText}>Reply</Text>
          </TouchableOpacity>
        )}

        {hasReplies && !isReply && (
          <TouchableOpacity onPress={() => setShowReplies(!showReplies)} style={styles.viewRepliesBtn}>
            <Text style={styles.viewRepliesText}>
              {showReplies ? 'Hide replies' : `View ${comment.replies.length} replies`}
            </Text>
          </TouchableOpacity>
        )}

        {showReplies && hasReplies && (
          <View style={styles.repliesWrapper}>
            {comment.replies.map((reply: any) => (
              <CommentItem 
                key={reply._id} 
                comment={reply} 
                onReply={onReply} 
                isReply={true} 
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  replyContainer: {
    paddingHorizontal: 0,
    marginTop: 12,
    marginBottom: 0,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    backgroundColor: '#333',
  },
  replyAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#333',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    color: '#888',
    fontSize: 13,
    fontWeight: 'bold',
    marginRight: 8,
  },
  time: {
    color: '#666',
    fontSize: 12,
  },
  text: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  replyButton: {
    paddingVertical: 4,
  },
  replyButtonText: {
    color: '#aaa',
    fontSize: 12,
    fontWeight: 'bold',
  },
  viewRepliesBtn: {
    marginTop: 8,
  },
  viewRepliesText: {
    color: '#3ea6ff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  repliesWrapper: {
    marginTop: 4,
  }
});
