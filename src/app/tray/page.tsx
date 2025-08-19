'use client';

import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface TimestampFormat {
  name: string;
  format: string;
  value: string;
}

export default function TrayInterface() {
  const [formats, setFormats] = useState<TimestampFormat[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadFormats();
    // Auto-refresh every second
    const interval = setInterval(() => {
      loadFormats();
      setLastUpdate(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadFormats = async () => {
    try {
      const result = await invoke<TimestampFormat[]>('get_current_formats');
      setFormats(result);
    } catch (error) {
      console.error('Failed to load formats:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (value: string, name: string) => {
    try {
      await invoke('copy_to_clipboard', { text: value });
      toast.success(`${name} copied!`, {
        duration: 2000,
      });
    } catch (error) {
      console.error('Copy failed:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  const refreshFormats = async () => {
    setLoading(true);
    await loadFormats();
  };

  if (loading && formats.length === 0) {
    return (
      <div className="p-4 w-80 h-64 flex items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-3 w-80 max-h-96 overflow-y-auto bg-background border border-border rounded-xl shadow-xl mt-2">
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Quick Timestamps</h2>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={refreshFormats}
            disabled={loading}
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        {formats.map((format) => (
          <Card key={format.format} className="p-2 hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground font-medium">
                  {format.name}
                </div>
                <div className="text-xs font-mono truncate mt-1 select-all">
                  {format.value}
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 ml-2 shrink-0"
                onClick={() => copyToClipboard(format.value, format.name)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </Card>
        ))}
        
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Updated: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
