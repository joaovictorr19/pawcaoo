
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Plus, Search, TrendingUp, CheckCircle, Eye, ThumbsUp, Filter, Pin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";

export default function Community() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [newTopic, setNewTopic] = useState({
    title: "",
    content: "",
    category: "general",
    tags: []
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: topics, isLoading } = useQuery({
    queryKey: ['forumTopics', filterCategory, filterStatus],
    queryFn: async () => {
      let query = {};
      if (filterCategory !== "all") query.category = filterCategory;
      if (filterStatus === "solved") query.is_solved = true;
      if (filterStatus === "unsolved") query.is_solved = false;
      
      return await base44.entities.ForumTopic.filter(query, '-last_activity_date');
    },
    initialData: [],
  });

  const createTopicMutation = useMutation({
    mutationFn: async (topicData) => {
      return await base44.entities.ForumTopic.create({
        ...topicData,
        author_email: user.email,
        author_name: user.full_name,
        author_type: user.account_type || 'owner',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forumTopics'] });
      setShowNewTopic(false); // Corrected from setShowCreateModal to setShowNewTopic
      setNewTopic({ title: '', content: '', category: 'general', tags: [] });
      toast.success('Tópico criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar tópico: ' + error.message);
    }
  });

  const filteredTopics = topics.filter(topic =>
    !searchQuery ||
    topic.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = [
    { value: "general", label: "General", icon: "💬", color: "bg-gray-100 text-gray-700" },
    { value: "health", label: "Health", icon: "🏥", color: "bg-red-100 text-red-700" },
    { value: "training", label: "Training", icon: "🎓", color: "bg-blue-100 text-blue-700" },
    { value: "behavior", label: "Behavior", icon: "🐕", color: "bg-purple-100 text-purple-700" },
    { value: "nutrition", label: "Nutrition", icon: "🍖", color: "bg-green-100 text-green-700" },
    { value: "grooming", label: "Grooming", icon: "✂️", color: "bg-pink-100 text-pink-700" },
    { value: "exercise", label: "Exercise", icon: "⚽", color: "bg-orange-100 text-orange-700" },
    { value: "travel", label: "Travel", icon: "✈️", color: "bg-indigo-100 text-indigo-700" },
    { value: "adoption", label: "Adoption", icon: "❤️", color: "bg-rose-100 text-rose-700" },
    { value: "emergency", label: "Emergency", icon: "🚨", color: "bg-red-200 text-red-800" }
  ];

  const getCategoryInfo = (value) => categories.find(c => c.value === value) || categories[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🐾 Community Forum</h1>
          <p className="text-gray-600">Ask questions, share knowledge, and connect with pet lovers</p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold">{topics.length}</div>
              <div className="text-sm opacity-90">Total Topics</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold">{topics.filter(t => t.is_solved).length}</div>
              <div className="text-sm opacity-90">Solved</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold">{topics.filter(t => !t.is_solved).length}</div>
              <div className="text-sm opacity-90">Open Questions</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold">{topics.reduce((sum, t) => sum + (t.views_count || 0), 0)}</div>
              <div className="text-sm opacity-90">Total Views</div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filters */}
        <Card className="border-0 shadow-xl mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="md:w-48 h-12">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="md:w-40 h-12">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="solved">Solved</SelectItem>
                  <SelectItem value="unsolved">Unsolved</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => setShowNewTopic(true)}
                className="bg-gradient-to-r from-green-600 to-green-500 h-12"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Topic
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Topics List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : filteredTopics.length === 0 ? (
            <Card className="border-0 shadow-xl">
              <CardContent className="p-12 text-center">
                <MessageSquare className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">No topics found</h3>
                <p className="text-gray-600 mb-6">Be the first to start a conversation!</p>
                <Button onClick={() => setShowNewTopic(true)} className="bg-green-600">
                  Create First Topic
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredTopics.map((topic, index) => {
              const categoryInfo = getCategoryInfo(topic.category);
              return (
                <motion.div
                  key={topic.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                    onClick={() => navigate(createPageUrl(`ForumTopicDetails?id=${topic.id}`))}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Category Icon */}
                        <div className={`w-12 h-12 ${categoryInfo.color} rounded-xl flex items-center justify-center text-2xl flex-shrink-0`}>
                          {categoryInfo.icon}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {topic.is_pinned && (
                                  <Pin className="w-4 h-4 text-orange-500" />
                                )}
                                <h3 className="text-lg font-bold text-gray-900 hover:text-green-600 transition-colors">
                                  {topic.title}
                                </h3>
                                {topic.is_solved && (
                                  <Badge className="bg-green-500 text-white">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Solved
                                  </Badge>
                                )}
                              </div>
                              <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                                {topic.content}
                              </p>
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span className="font-medium text-gray-700">{topic.author_name}</span>
                                <span>•</span>
                                <span>{format(new Date(topic.created_date), "MMM d, yyyy")}</span>
                                <span>•</span>
                                <Badge variant="outline" className={categoryInfo.color}>
                                  {categoryInfo.label}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="flex items-center gap-6 mt-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MessageSquare className="w-4 h-4" />
                              <span className="font-semibold">{topic.replies_count || 0}</span>
                              <span className="hidden sm:inline">replies</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Eye className="w-4 h-4" />
                              <span className="font-semibold">{topic.views_count || 0}</span>
                              <span className="hidden sm:inline">views</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <ThumbsUp className="w-4 h-4" />
                              <span className="font-semibold">{topic.upvotes || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>

        {/* New Topic Modal */}
        <AnimatePresence>
          {showNewTopic && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-2xl"
              >
                <Card className="border-0 shadow-2xl">
                  <CardHeader className="bg-gradient-to-r from-green-600 to-green-500 text-white">
                    <CardTitle className="text-2xl">Create New Topic</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      createTopicMutation.mutate(newTopic);
                    }} className="space-y-4">
                      <div>
                        <label className="text-sm font-semibold text-gray-900 mb-2 block">
                          Category
                        </label>
                        <Select
                          value={newTopic.category}
                          onValueChange={(value) => setNewTopic({...newTopic, category: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(cat => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.icon} {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-gray-900 mb-2 block">
                          Title *
                        </label>
                        <Input
                          required
                          placeholder="What's your question or topic?"
                          value={newTopic.title}
                          onChange={(e) => setNewTopic({...newTopic, title: e.target.value})}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-gray-900 mb-2 block">
                          Description *
                        </label>
                        <Textarea
                          required
                          placeholder="Provide details about your question..."
                          value={newTopic.content}
                          onChange={(e) => setNewTopic({...newTopic, content: e.target.value})}
                          rows={6}
                        />
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowNewTopic(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          className="flex-1 bg-green-600"
                          disabled={createTopicMutation.isPending}
                        >
                          Create Topic
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
