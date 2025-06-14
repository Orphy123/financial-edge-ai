
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Bot, Send, User, TrendingUp, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  symbol?: string;
}

interface AIChatAssistantProps {
  symbol?: string;
  name?: string;
}

const AIChatAssistant = ({ symbol, name }: AIChatAssistantProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (symbol) {
      // Add welcome message when symbol changes
      const welcomeMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: `Hello! I'm your AI trading assistant. I can help you analyze ${symbol} (${name}). Ask me about market trends, technical analysis, or trading strategies!`,
        timestamp: new Date(),
        symbol
      };
      setMessages([welcomeMessage]);
    }
  }, [symbol, name]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
      symbol
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: inputMessage,
          symbol: symbol || '',
          context: messages.slice(-5) // Send last 5 messages for context
        }
      });

      if (error) throw error;

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: data.response || 'I apologize, but I encountered an issue processing your request.',
        timestamp: new Date(),
        symbol
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `I'm currently experiencing technical difficulties. However, I can still help with general analysis of ${symbol || 'the markets'}. Try asking about price trends, technical indicators, or market sentiment!`,
        timestamp: new Date(),
        symbol
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestedQuestions = [
    `What's the current sentiment for ${symbol || 'the market'}?`,
    `Should I buy or sell ${symbol || 'this stock'} now?`,
    `What are the key support and resistance levels?`,
    `What's the technical analysis outlook?`
  ];

  return (
    <Card className="bg-gray-900 border-gray-800 h-96 flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center space-x-2">
          <Bot className="h-5 w-5 text-green-400" />
          <span>AI Trading Assistant</span>
          {symbol && (
            <Badge variant="outline" className="text-blue-400 border-blue-400/30">
              {symbol}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-4 pt-0">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 mt-8">
              <Bot className="h-12 w-12 mx-auto mb-4 text-gray-600" />
              <p>Start a conversation about market analysis!</p>
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-100 border border-gray-700'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {message.type === 'ai' ? (
                    <Bot className="h-4 w-4 mt-1 text-green-400 flex-shrink-0" />
                  ) : (
                    <User className="h-4 w-4 mt-1 text-blue-300 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 text-gray-100 border border-gray-700 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Bot className="h-4 w-4 text-green-400" />
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {messages.length === 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-400 mb-2">Try asking:</p>
            <div className="grid grid-cols-1 gap-2">
              {suggestedQuestions.slice(0, 2).map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setInputMessage(question)}
                  className="text-xs text-left justify-start bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="flex space-x-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Ask about ${symbol || 'the markets'}...`}
            className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
            disabled={isLoading}
          />
          <Button
            onClick={sendMessage}
            disabled={isLoading || !inputMessage.trim()}
            size="sm"
            className="px-3"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIChatAssistant;
