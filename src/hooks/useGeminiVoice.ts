import { useState, useRef, useCallback, useEffect } from 'react';
import { useAgentStore, useFinanceStore, useProfileStore, useHabitsStore, useVaultStore } from '../store';

export function useGeminiVoice() {
    const [isConnected, setIsConnected] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    
    const wsRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const captureNodeRef = useRef<AudioWorkletNode | null>(null);
    const playbackNodeRef = useRef<AudioWorkletNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const wakeLockRef = useRef<WakeLockSentinel | null>(null);

    // Screen Wake Lock API
    const requestWakeLock = async () => {
        try {
            if ('wakeLock' in navigator) {
                wakeLockRef.current = await navigator.wakeLock.request('screen');
                console.log('[WakeLock] Screen stay-awake active.');
            }
        } catch (err) {
            console.warn(`[WakeLock] Failed: ${err}`);
        }
    };

    const releaseWakeLock = () => {
        if (wakeLockRef.current) {
            wakeLockRef.current.release();
            wakeLockRef.current = null;
        }
    };

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (wakeLockRef.current !== null && document.visibilityState === 'visible') {
                requestWakeLock();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    // Process Gemini function calls and dispatch to correct stores
    const handleToolCall = useCallback((toolCall: any) => {
        const results: any[] = [];
        
        for (const fc of toolCall.functionCalls || []) {
            console.log(`[TBrain Voice] Executing: ${fc.name}`, fc.args);
            let result = { success: true, message: '' };
            
            try {
                switch (fc.name) {
                    case 'add_transaction': {
                        const amount = fc.args.amount || 0;
                        const type = fc.args.type || 'expense';
                        useFinanceStore.getState().addTransaction(amount, type);
                        result.message = `Transação de R$ ${amount} (${type === 'income' ? 'receita' : 'gasto'}) registrada.`;
                        break;
                    }
                    case 'add_habit': {
                        const name = fc.args.name || 'Nova Meta';
                        const type = fc.args.type || 'DAILY';
                        const urgency = fc.args.urgency || 'NORMAL';
                        useHabitsStore.getState().addHabit(name, type, urgency);
                        result.message = `Meta "${name}" criada como ${type}, urgência ${urgency}.`;
                        break;
                    }
                    case 'add_vault_item': {
                        const content = fc.args.content || '';
                        const type = fc.args.type || 'NOTE';
                        useVaultStore.getState().addItem(content, type);
                        result.message = `Item "${content}" salvo no Cofre Neural como ${type}.`;
                        break;
                    }
                    case 'navigate': {
                        const route = fc.args.route || 'dashboard';
                        useAgentStore.getState().setRoute(route);
                        result.message = `Navegado para ${route}.`;
                        break;
                    }
                    default:
                        result = { success: false, message: `Função "${fc.name}" desconhecida.` };
                }
            } catch (e: any) {
                result = { success: false, message: e.message };
            }
            
            results.push({
                id: fc.id,
                name: fc.name,
                response: { output: result }
            });
        }
        
        // Send responses back to Gemini via WebSocket
        if (wsRef.current?.readyState === WebSocket.OPEN && results.length > 0) {
            wsRef.current.send(JSON.stringify({
                toolResponse: { functionResponses: results }
            }));
        }
    }, []);

    const startSession = useCallback(async () => {
        try {
            await requestWakeLock();

            const geminiKey = useProfileStore.getState().traits.geminiKey;
            if (!geminiKey) {
                alert("TBrain Neural Link inativo. Adicione sua Chave da Google Gemini no Painel de Perfil.");
                return;
            }
            
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            wsRef.current = new WebSocket(`${wsProtocol}//${window.location.host}/api/gemini-ws?key=${geminiKey}`);
            
            if (!window.isSecureContext) {
                alert("TBrain Audio requer contexto seguro (HTTPS) ou localhost.");
                throw new Error("Insecure context blocked microphone.");
            }

            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
                sampleRate: 16000
            });

            await audioContextRef.current.audioWorklet.addModule('/workers/capture.worklet.js');
            await audioContextRef.current.audioWorklet.addModule('/workers/playback.worklet.js');

            streamRef.current = await navigator.mediaDevices.getUserMedia({ 
                audio: { 
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } 
            });

            const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
            captureNodeRef.current = new AudioWorkletNode(audioContextRef.current, 'capture-processor');
            playbackNodeRef.current = new AudioWorkletNode(audioContextRef.current, 'playback-processor');

            captureNodeRef.current.port.onmessage = (event) => {
                if (event.data.event === 'audio' && wsRef.current?.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({
                        realtimeInput: { mediaChunks: [
                            { mimeType: "audio/pcm;rate=16000", data: event.data.audioData }
                        ]}
                    }));
                }
            };

            source.connect(captureNodeRef.current);
            playbackNodeRef.current.connect(audioContextRef.current.destination);

            // Handle incoming WS messages
            wsRef.current.onmessage = (event) => {
                const message = JSON.parse(event.data);
                
                if (message.interrupted) {
                    playbackNodeRef.current?.port.postMessage('flush');
                    setIsThinking(false);
                }

                // Handle Gemini Function Calls (Voice Control)
                if (message.type === 'tool_call' && message.toolCall) {
                    console.log('[TBrain Voice] Processing tool call from Gemini');
                    handleToolCall(message.toolCall);
                }

                if (message.type === 'model_turn') {
                     setIsThinking(true);
                     
                     // Decode and play audio
                     if (message.parts) {
                         message.parts.forEach((part: any) => {
                             if (part.inlineData?.mimeType?.startsWith('audio/')) {
                                 // Decode base64 PCM audio and send to playback worklet
                                 const raw = atob(part.inlineData.data);
                                 const buf = new Int16Array(raw.length / 2);
                                 for (let i = 0; i < buf.length; i++) {
                                     buf[i] = raw.charCodeAt(i * 2) | (raw.charCodeAt(i * 2 + 1) << 8);
                                 }
                                 const float32 = new Float32Array(buf.length);
                                 for (let i = 0; i < buf.length; i++) {
                                     float32[i] = buf[i] / 32768;
                                 }
                                 playbackNodeRef.current?.port.postMessage(float32);
                             }
                         });
                     }
                }

                if (message.type === 'setup_complete') {
                    console.log('[TBrain Voice] Session setup complete, ready for audio.');
                }
            };

            wsRef.current.onopen = () => {
                setIsConnected(true);
                // Send context data for Neural Core prompt
                if (wsRef.current?.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({
                        type: 'context',
                        data: {
                            finance: useFinanceStore.getState(),
                            habits: useHabitsStore.getState().habits,
                            vault: useVaultStore.getState().items
                        }
                    }));
                }
            };
            wsRef.current.onclose = () => stopSession();

        } catch (err) {
            console.error('[TBrain Voice] Init Error:', err);
            alert("Acesso Negado ao Captador TBrain. (HTTPS requerido ou Chave Gemini Faltando)");
            stopSession();
        }
    }, [handleToolCall]);

    const stopSession = useCallback(() => {
        setIsConnected(false);
        setIsThinking(false);
        releaseWakeLock();

        if (wsRef.current) wsRef.current.close();
        if (captureNodeRef.current) captureNodeRef.current.disconnect();
        if (playbackNodeRef.current) playbackNodeRef.current.disconnect();
        if (audioContextRef.current) audioContextRef.current.close();
        if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    }, []);

    return {
        isConnected,
        isThinking,
        startSession,
        stopSession
    };
}
