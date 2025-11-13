
'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Mic, Play, Pause, Trash2, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

const designSteps = [
    {
        icon: "https://placehold.co/50x50/FFFFFF/ED1C24?text=1",
        text: 'Submit request and place order',
    },
    {
        icon: "https://placehold.co/50x50/FFFFFF/ED1C24?text=2",
        text: 'Finalize design with our expert',
    },
    {
        icon: "https://placehold.co/50x50/FFFFFF/ED1C24?text=3",
        text: "We'll print and ship your order",
    },
]

type Recording = {
    id: number;
    blob: Blob;
    url: string;
    duration: number;
};

export default function HireADesignerPage() {
    const [description, setDescription] = useState('');
    const [recordings, setRecordings] = useState<Recording[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [playingId, setPlayingId] = useState<number | null>(null);

    const { toast } = useToast();
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordingStartTimeRef = useRef<number>(0);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (e.target.value.length <= 500) {
            setDescription(e.target.value);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            let audioChunks: Blob[] = [];

            mediaRecorder.addEventListener('dataavailable', event => {
                audioChunks.push(event.data);
            });

            mediaRecorder.addEventListener('stop', () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const audioUrl = URL.createObjectURL(audioBlob);
                const duration = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
                
                setRecordings(prev => [
                    ...prev,
                    { id: Date.now(), blob: audioBlob, url: audioUrl, duration },
                ]);

                stream.getTracks().forEach(track => track.stop());
            });

            mediaRecorder.start();
            setIsRecording(true);
            recordingStartTimeRef.current = Date.now();
            timerIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (error) {
            console.error('Error accessing microphone:', error);
            toast({
                variant: 'destructive',
                title: 'Microphone Access Denied',
                description: 'Please grant microphone permission in your browser to record a voice note.',
            });
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
            setRecordingTime(0);
        }
    };

    const handleVoiceNoteClick = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };
    
    const formatTime = (timeInSeconds: number) => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = timeInSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handlePlayPause = (recording: Recording) => {
        if (playingId === recording.id) {
            audioRef.current?.pause();
            setPlayingId(null);
        } else {
            if (audioRef.current) {
                audioRef.current.pause();
            }
            const newAudio = new Audio(recording.url);
            audioRef.current = newAudio;
            newAudio.play();
            setPlayingId(recording.id);
            newAudio.onended = () => setPlayingId(null);
        }
    };

    const handleDeleteRecording = (id: number) => {
        if (playingId === id) {
            audioRef.current?.pause();
            setPlayingId(null);
        }
        setRecordings(recordings.filter(rec => rec.id !== id));
    };

    const handleDownloadRecording = (recording: Recording) => {
        const a = document.createElement('a');
        a.href = recording.url;
        a.download = `voice-note-${recording.id}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    useEffect(() => {
        // Cleanup audio object on component unmount
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, []);

    return (
        <div className="bg-background">
            <div className="max-w-screen-xl mx-auto py-16 px-5 font-sans">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-16 items-start">
                    <main>
                        <h1 className="text-5xl font-bold leading-tight text-gray-800 mb-10 max-w-4xl">
                            Our designers are ready to create your ideal design
                        </h1>

                        <p className="text-xl font-medium text-gray-800 mb-8">It takes just 3 simple steps:</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
                            {designSteps.map((step, index) => (
                                <div key={index} className="bg-red-600 p-6 rounded-lg flex items-center gap-4 text-white">
                                    <div className="text-4xl font-bold min-w-[30px]">{index + 1}</div>
                                    <Image src={step.icon} width={50} height={50} alt={`Step ${index + 1}`} className="rounded-full"/>
                                    <div className="text-base font-medium leading-snug">{step.text}</div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-10">
                            <Label htmlFor="design-description" className="text-lg font-medium text-gray-800 mb-2 block">
                                Describe your design in a few words
                                <span className="text-red-600 ml-1">*</span>
                            </Label>
                            <p className="text-sm text-gray-600 mb-4">
                                For example: "I want a bold design for my trade show booth."
                            </p>

                            <Textarea
                                id="design-description"
                                placeholder="Start typing here"
                                value={description}
                                onChange={handleDescriptionChange}
                                className="min-h-[150px] text-base"
                            />
                            <div className="text-right text-sm text-gray-600 mt-2">
                                {description.length}/500
                            </div>

                            <div className="mt-4">
                                <p className="text-sm text-gray-600">You can now use voice notes to add your comment</p>
                                <Button
                                    variant="link"
                                    onClick={handleVoiceNoteClick}
                                    className={`p-0 h-auto text-gray-800 hover:text-primary transition-colors ${isRecording ? 'text-red-600' : ''}`}
                                >
                                    <Mic className={`mr-2 h-4 w-4 ${isRecording ? 'animate-pulse' : ''}`} />
                                    {isRecording ? 'Stop Recording' : 'Add a Voice note'}
                                    {isRecording && <span className="ml-2 font-semibold text-red-600">{formatTime(recordingTime)}</span>}
                                </Button>

                                {recordings.length > 0 && (
                                    <div className="mt-5 space-y-3">
                                        {recordings.map((rec) => (
                                            <div key={rec.id} className="flex items-center justify-between p-3 bg-gray-100 rounded-md">
                                                <div className="flex items-center gap-3 flex-1">
                                                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-500">
                                                        <Mic className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="text-sm font-medium text-gray-800">Voice Note {rec.id.toString().slice(-4)}</div>
                                                        <div className="text-xs text-gray-600">{formatTime(rec.duration)}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePlayPause(rec)}>
                                                        {playingId === rec.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownloadRecording(rec)}>
                                                        <Download className="w-4 h-4" />
                                                    </Button>
                                                     <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-100 hover:text-red-600" onClick={() => handleDeleteRecording(rec.id)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </main>

                    <aside>
                        <Card className="p-6 sticky top-5 bg-gray-100">
                            <p className="text-base leading-relaxed text-gray-800 mb-4">
                                "Hello designer: You did an excellent job! I love it...."
                            </p>
                            <p className="text-sm font-medium text-gray-600">Guadalupe Abbud</p>
                        </Card>
                    </aside>
                </div>
            </div>
        </div>
    );
}
