import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ThumbsUp, MessageSquare, CheckCircle, Award, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function ForumTopicDetails() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const topicId = urlParams.get('id');
  const [replyContent, setReplyContent] = useState("");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: topic, isLoading: loadingTopic } = useQuery({
    queryKey: ['forumTopic', topicId],
    queryFn: async () => {
      const topics = await base44.entities.ForumTopic.filter({ id: topicId });
      const topic = topics[0];
      
      // Increment views
      if (topic) {
        await base44.entities.ForumTopic.update(topicId, {
          views_count: (topic.views_count || 0) + 1
        });
      }
      
      return topic;
    },
    enabled: !!topicId,
  });

  const { data: replies, isLoading: loadingReplies } = useQuery({
    queryKey: ['forumReplies', topicId],
    queryFn: () => base44.entities.ForumReply.filter({ topic_id: topicId }, 'created_date'),
    enabled: !!topicId,
    initialData: [],
  });

  const createReplyMutation = useMutation({
    mutationFn: async (content) => {
      const reply = await base44.entities.ForumReply.create({
        topic_id: topicId,
        content,
        author_email: user?.email,
        author_name: user?.full_name,
        author_type: "owner" // You could determine this from user's profiles
      });

      // Update topic reply count
      await base44.entities.ForumTopic.update(topicId, {
        replies_count: (topic.replies_count || 0) + 1,
        last_activity_date: new Date().toISOString()
      });

      // Notify topic author
      if (topic.author_email !== user?.email) {
        await base44.entities.Notification.create({
          recipient_email: topic.author_email,
          title: "New Reply to Your Topic",
          message: `${user?.full_name} replied to "${topic.title}"`,
          type: "system",
          related_id: topicId,
          action_url: `/ForumTopicDetails?id=${topicId}`
        });
      }

      return reply;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forumReplies', topicId] });
      queryClient.invalidateQueries({ queryKey: ['forumTopic', topicId] });
      setReplyContent("");
      toast.success("Reply posted!");
    },
  });

  const markAsSolutionMutation = useMutation({
    mutationFn: async (replyId) => {
      await base44.entities.ForumReply.update(replyId, {
        is_solution: true
      });
      await base44.entities.ForumTopic.update(topicId, {
        is_solved: true,
        solved_by_reply_id: replyId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forumReplies', topicId] });
      queryClient.invalidateQueries({ queryKey: ['forumTopic', topicId] });
      toast.success("Marked as solution!");
    },
  });

  const voteReplyMutation = useMutation({
    mutationFn: async ({ replyId, currentVotes }) => {
      const existingVote = await base44.entities.ForumVote.filter({
        reply_id: replyId,
        user_email: user?.email
      });

      if (existingVote.length > 0) {
        await base44.entities.ForumVote.delete(existingVote[0].id);
        await base44.entities.ForumReply.update(replyId, {
          upvotes: currentVotes - 1
        });
      } else {
        await base44.entities.ForumVote.create({
          reply_id: replyId,
          user_email: user?.email,
          vote_type: "upvote"
        });
        await base44.entities.ForumReply.update(replyId, {
          upvotes: currentVotes + 1
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forumReplies', topicId] });
    },
  });

  if (loadingTopic) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-6 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Topic not found</h2>
          <Button onClick={() => navigate(createPageUrl('Community'))}>
            Back to Community
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="outline"
          className="mb-6"
          onClick={() => navigate(createPageUrl('Community'))}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Forum
        </Button>

        {/* Topic Card */}
        <Card className="border-0 shadow-2xl mb-6">
          <CardContent className="p-8">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">{topic.title}</h1>
                <div className="flex items-center gap-3 text-sm text-gray-600 mb-4">
                  <span className="font-semibold text-gray-900">{topic.author_name}</span>
                  <span>•</span>
                  <span>{format(new Date(topic.created_date), "MMM d, yyyy 'at' h:mm a")}</span>
                  <span>•</span>
                  <Badge variant="outline">{topic.category}</Badge>
                </div>
              </div>
              {topic.is_solved && (
                <Badge className="bg-green-500 text-white text-lg px-4 py-2">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Solved
                </Badge>
              )}
            </div>

            <p className="text-gray-800 text-lg leading-relaxed mb-6 whitespace-pre-wrap">
              {topic.content}
            </p>

            <div className="flex items-center gap-6 pt-4 border-t text-gray-600">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                <span className="font-semibold">{topic.replies_count || 0} replies</span>
              </div>
              <div className="flex items-center gap-2">
                <ThumbsUp className="w-5 h-5" />
                <span className="font-semibold">{topic.upvotes || 0} upvotes</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Replies */}
        <div className="space-y-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
          </h2>
          
          {replies.map((reply, index) => (
            <motion.div
              key={reply.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`border-0 shadow-lg ${reply.is_solution ? 'ring-2 ring-green-500' : ''}`}>
                <CardContent className="p-6">
                  {reply.is_solution && (
                    <Badge className="bg-green-500 text-white mb-3">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Solution
                    </Badge>
                  )}
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">{reply.author_name?.[0]}</span>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900">{reply.author_name}</span>
                        {reply.is_expert_answer && (
                          <Badge className="bg-purple-500 text-white text-xs">
                            <Award className="w-3 h-3 mr-1" />
                            Expert
                          </Badge>
                        )}
                        <span className="text-sm text-gray-500">
                          {format(new Date(reply.created_date), "MMM d, yyyy 'at' h:mm a")}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 mb-3 whitespace-pre-wrap">{reply.content}</p>
                      
                      <div className="flex items-center gap-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => voteReplyMutation.mutate({
                            replyId: reply.id,
                            currentVotes: reply.upvotes || 0
                          })}
                          className="hover:text-green-600"
                        >
                          <ThumbsUp className="w-4 h-4 mr-1" />
                          {reply.upvotes || 0}
                        </Button>
                        
                        {!topic.is_solved && user?.email === topic.author_email && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markAsSolutionMutation.mutate(reply.id)}
                            className="text-green-600 border-green-600 hover:bg-green-50"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Mark as Solution
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Reply Form */}
        <Card className="border-0 shadow-xl">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Your Reply</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (replyContent.trim()) {
                createReplyMutation.mutate(replyContent);
              }
            }}>
              <Textarea
                placeholder="Share your thoughts or answer..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={6}
                className="mb-4"
              />
              <Button
                type="submit"
                className="bg-green-600"
                disabled={!replyContent.trim() || createReplyMutation.isPending}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Post Reply
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}