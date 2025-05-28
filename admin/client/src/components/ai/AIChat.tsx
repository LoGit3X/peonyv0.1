import { FC, useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Loader2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// تعریف ساختار پیام‌ها
interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AIChat: FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: 'سلام! من دستیار هوش مصنوعی کافه پیونی هستم. چطور می‌توانم به شما کمک کنم؟', 
      timestamp: new Date() 
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // اسکرول خودکار به آخرین پیام
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ارسال پیام به API هوش مصنوعی
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // در اینجا به API هوش مصنوعی متصل می‌شویم
      // این بخش با API کلید شما تکمیل خواهد شد
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage]
            .map(msg => ({ role: msg.role, content: msg.content }))
        }),
      });
      
      if (!response.ok) {
        throw new Error('خطا در ارتباط با هوش مصنوعی');
      }
      
      const data = await response.json();
      
      const aiResponse: Message = {
        role: 'assistant',
        content: data.response || 'متأسفانه در پاسخ به سؤال شما مشکلی پیش آمد.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      toast({
        title: 'خطا در ارتباط با هوش مصنوعی',
        description: 'لطفاً دوباره تلاش کنید.',
        variant: 'destructive',
      });
      
      // پیام خطا به کاربر
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: 'متأسفانه در برقراری ارتباط مشکلی پیش آمد. لطفاً دوباره تلاش کنید.', 
          timestamp: new Date() 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* دکمه نمایش چت */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-50 bg-[#FF8F00] hover:bg-[#F9A825] text-white shadow-lg rounded-full h-12 w-12 flex items-center justify-center"
        size="icon"
      >
        <MessageSquare className="h-5 w-5" />
      </Button>

      {/* پنجره چت */}
      <div className={cn(
        "fixed bottom-0 left-0 z-50 w-96 bg-[#2C2F33] shadow-lg rounded-t-xl transition-all duration-300 transform border border-gray-700 border-b-0",
        isOpen ? "translate-y-0" : "translate-y-full"
      )}>
        {/* هدر چت */}
        <div className="p-4 flex items-center justify-between bg-[#23272A] rounded-t-xl border-b border-gray-700">
          <div className="flex items-center">
            <Bot className="text-[#5865F2] mr-2 h-5 w-5" />
            <h3 className="text-white font-bold">دستیار هوشمند کافه پیونی</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* محتوای چت */}
        <div className="h-96 overflow-y-auto p-4 space-y-4 bg-[#36393F]">
          {messages.map((msg, i) => (
            <div 
              key={i} 
              className={cn(
                "flex max-w-[85%] rounded-xl p-3",
                msg.role === 'user' 
                  ? "bg-[#5865F2] text-white mr-auto rounded-br-none" 
                  : "bg-[#2C2F33] text-white ml-auto rounded-bl-none"
              )}
            >
              <p className="text-sm">{msg.content}</p>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="h-5 w-5 animate-spin text-[#5865F2]" />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ورودی پیام */}
        <div className="p-3 border-t border-gray-700 bg-[#2C2F33]">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }} 
            className="flex items-center gap-2"
          >
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="پیام خود را بنویسید..."
              className="flex-1 bg-[#40444B] border-gray-700 text-white placeholder-gray-400 pr-4 focus:ring-[#5865F2]"
            />
            <Button 
              type="submit" 
              disabled={!input.trim() || isLoading}
              className="bg-[#5865F2] hover:bg-blue-600 text-white"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </div>
    </>
  );
};

export default AIChat; 