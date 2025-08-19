'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { invoke } from '@tauri-apps/api/core';
import { getStore } from '@tauri-apps/plugin-store';

type Preset = { name: string; format: string };

export default function PreferencesPage() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [defaultFormat, setDefaultFormat] = useState<string>('');
  const [timezone, setTimezone] = useState<string>('UTC');
  const [locale, setLocale] = useState<string>('en-US');
  const [closeOnBlur, setCloseOnBlur] = useState<boolean>(true);
  const [alwaysOnTop, setAlwaysOnTop] = useState<boolean>(true);
  const [shortcut, setShortcut] = useState<string>('Cmd+Alt+T');
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetFormat, setNewPresetFormat] = useState('');

  useEffect(() => {
    // Load from store via JS API
    (async () => {
      try {
        const isDesktop = typeof window !== 'undefined' && typeof (window as unknown as { __TAURI__?: unknown }).__TAURI__ !== 'undefined';
        if (isDesktop) {
          const store = await getStore('prefs.json');
          if (store) {
            setPresets((await store.get('presets')) as Preset[] || []);
            setDefaultFormat((await store.get('defaultFormat')) as string || '{day}, {month} {date} {time} {period}');
            setTimezone((await store.get('timezone')) as string || 'UTC');
            setLocale((await store.get('locale')) as string || 'en-US');
            setCloseOnBlur((await store.get('closeOnBlur')) as boolean ?? true);
            setAlwaysOnTop((await store.get('alwaysOnTop')) as boolean ?? true);
            setShortcut((await store.get('shortcut')) as string || 'Cmd+Alt+T');
          }
        } else {
          // web fallback
          const ls = (k: string) => localStorage.getItem(`thymestamp-${k}`);
          setDefaultFormat(ls('defaultFormat') || '{day}, {month} {date} {time} {period}');
          setTimezone(ls('timezone') || 'UTC');
          setLocale(ls('locale') || 'en-US');
          setCloseOnBlur(ls('closeOnBlur') === 'true');
          setAlwaysOnTop(ls('alwaysOnTop') !== 'false');
          setShortcut(ls('shortcut') || '');
          try { setPresets(JSON.parse(ls('presets') || '[]')); } catch {}
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const saveAll = async () => {
  const isDesktop = typeof window !== 'undefined' && typeof (window as unknown as { __TAURI__?: unknown }).__TAURI__ !== 'undefined';
    if (isDesktop) {
      const store = await getStore('prefs.json');
      if (store) {
        await store.set('presets', presets);
        await store.set('defaultFormat', defaultFormat);
        await store.set('timezone', timezone);
        await store.set('locale', locale);
        await store.set('closeOnBlur', closeOnBlur);
        await store.set('alwaysOnTop', alwaysOnTop);
        await store.set('shortcut', shortcut);
        await store.save();
      }
    } else {
      const s = (k: string, v: string) => localStorage.setItem(`thymestamp-${k}`, v);
      s('defaultFormat', defaultFormat);
      s('timezone', timezone);
      s('locale', locale);
      s('closeOnBlur', String(closeOnBlur));
      s('alwaysOnTop', String(alwaysOnTop));
      s('shortcut', shortcut);
      s('presets', JSON.stringify(presets));
    }
  // apply immediate effects
  await invoke('set_close_on_blur', { value: closeOnBlur });
  await invoke('set_always_on_top', { value: alwaysOnTop });
    toast.success('Preferences saved');
  };

  const applyShortcut = async () => {
    try {
      await invoke('register_global_shortcut', { shortcutString: shortcut });
      toast.success('Shortcut updated');
    } catch (e) {
      console.error(e);
      toast.error('Failed to register shortcut');
    }
  };

  const removePreset = (idx: number) => {
    setPresets(p => p.filter((_, i) => i !== idx));
  };

  const movePreset = (idx: number, dir: -1 | 1) => {
    setPresets(p => {
      const np = [...p];
      const j = idx + dir;
      if (j < 0 || j >= np.length) return p;
      [np[idx], np[j]] = [np[j], np[idx]];
      return np;
    });
  };

  const addPreset = () => {
    if (!newPresetName.trim() || !newPresetFormat.trim()) return;
    setPresets(p => [{ name: newPresetName.trim(), format: newPresetFormat.trim() }, ...p]);
    setNewPresetName('');
    setNewPresetFormat('');
  };

  return (
    <div className="p-6 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold">Preferences</h1>
      <Card className="p-4 space-y-3">
        <div className="space-y-2">
          <Label>Presets</Label>
          <div className="grid grid-cols-3 gap-2">
            <Input className="col-span-1" placeholder="Name" value={newPresetName} onChange={e => setNewPresetName(e.target.value)} />
            <Input className="col-span-2" placeholder="Format" value={newPresetFormat} onChange={e => setNewPresetFormat(e.target.value)} />
          </div>
          <div>
            <Button size="sm" onClick={addPreset}>Add Preset</Button>
          </div>
          <div className="space-y-2">
            {presets.map((p, i) => (
              <div key={`${p.name}-${i}`} className="flex items-center gap-2 text-sm">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{p.name}</div>
                  <div className="font-mono text-xs text-muted-foreground truncate">{p.format}</div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => movePreset(i, -1)}>↑</Button>
                  <Button size="sm" variant="outline" onClick={() => movePreset(i, 1)}>↓</Button>
                  <Button size="sm" variant="destructive" onClick={() => removePreset(i)}>Remove</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <div>
          <Label>Default Format</Label>
          <Input value={defaultFormat} onChange={e => setDefaultFormat(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Timezone</Label>
            <Input value={timezone} onChange={e => setTimezone(e.target.value)} placeholder="e.g. America/Los_Angeles" />
          </div>
          <div>
            <Label>Locale</Label>
            <Input value={locale} onChange={e => setLocale(e.target.value)} placeholder="e.g. en-US" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={closeOnBlur} onChange={e => setCloseOnBlur(e.target.checked)} />
            Close on blur
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={alwaysOnTop} onChange={e => setAlwaysOnTop(e.target.checked)} />
            Always on top
          </label>
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <div>
          <Label>Global Shortcut</Label>
          <div className="flex gap-2">
            <Input value={shortcut} onChange={e => setShortcut(e.target.value)} placeholder="Cmd+Alt+T" />
            <Button onClick={applyShortcut}>Set</Button>
            <Button variant="outline" onClick={() => invoke('unregister_shortcut').then(() => toast.success('Shortcut cleared'))}>Clear</Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">On macOS, you may need to grant Accessibility permissions in System Settings → Privacy & Security.</p>
      </Card>

      <div className="flex gap-2">
        <Button onClick={saveAll}>Save</Button>
      </div>
    </div>
  );
}
