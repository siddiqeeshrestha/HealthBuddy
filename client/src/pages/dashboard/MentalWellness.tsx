import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Brain, User, Heart, Lightbulb, BookOpen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mood?: string;
  suggestions?: string[];
  resources?: string[];
  createdAt: string;
}

export default function MentalWellness() {
  const [message, setMessage] = useState("");
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch chat history
  const { data: chatHistory = [], isLoading } = useQuery<ChatMessage[]>({
    queryKey: ['/api/chat/history'],
    refetchOnWindowFocus: false,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      const response = await apiRequest('POST', '/api/chat/message', { 
        message: userMessage 
      });
      return response.json();
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ['/api/chat/history'] });
      toast({
        title: "Message sent",
        description: "HealthBuddy is here to help!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send message",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendMessageMutation.mutate(message);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Brain className="h-12 w-12 text-teal-600 mr-3" />
          <h1 className="text-3xl font-bold text-foreground">HealthBuddy</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Your compassionate mental wellness companion, always here to listen and support you.
        </p>
      </div>

      <Card className="h-[600px] flex flex-col">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-teal-600" />
            Chat with HealthBuddy
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-teal-600 mx-auto mb-2" />
                  <p className="text-muted-foreground">Loading your conversation...</p>
                </div>
              </div>
            ) : chatHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Brain className="h-16 w-16 text-teal-600 mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Welcome to HealthBuddy!</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  I'm here to provide emotional support, practical guidance, and helpful resources. 
                  Share what's on your mind, and let's work through it together.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Mental Health Support</Badge>
                  <Badge variant="secondary">Emotional Guidance</Badge>
                  <Badge variant="secondary">Coping Strategies</Badge>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {chatHistory.map((msg: ChatMessage) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-teal-100 text-teal-600">
                          <Brain className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-1' : ''}`}>
                      <div
                        className={`rounded-lg p-3 ${
                          msg.role === 'user' 
                            ? 'bg-teal-600 text-white ml-auto' 
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        <p className={`text-xs mt-1 opacity-70 ${msg.role === 'user' ? 'text-teal-100' : 'text-muted-foreground'}`}>
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                      
                      {/* AI-specific additions */}
                      {msg.role === 'assistant' && (
                        <div className="mt-2 space-y-2">
                          {msg.mood && (
                            <Badge variant="outline" className="text-xs">
                              Mood: {msg.mood}
                            </Badge>
                          )}
                          
                          {msg.suggestions && msg.suggestions.length > 0 && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                              <div className="flex items-center gap-1 mb-2">
                                <Lightbulb className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Suggestions</span>
                              </div>
                              <ul className="text-sm space-y-1 text-blue-600 dark:text-blue-400">
                                {msg.suggestions.map((suggestion, index) => (
                                  <li key={index}>• {suggestion}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {msg.resources && msg.resources.length > 0 && (
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                              <div className="flex items-center gap-1 mb-2">
                                <BookOpen className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium text-green-700 dark:text-green-300">Resources</span>
                              </div>
                              <ul className="text-sm space-y-1 text-green-600 dark:text-green-400">
                                {msg.resources.map((resource, index) => (
                                  <li key={index}>• {resource}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {msg.role === 'user' && (
                      <Avatar className="h-8 w-8 order-2">
                        <AvatarFallback className="bg-teal-600 text-white">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>
          
          {/* Message input */}
          <div className="p-4 border-t">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share what's on your mind..."
                disabled={sendMessageMutation.isPending}
                className="flex-1"
                data-testid="input-chat-message"
              />
              <Button 
                type="submit" 
                disabled={!message.trim() || sendMessageMutation.isPending}
                data-testid="button-send-message"
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}