import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  VideoCameraIcon,
  MicrophoneIcon,
  PhoneXMarkIcon,
  VideoCameraSlashIcon,
  SpeakerXMarkIcon
} from '@heroicons/react/24/solid';
import axios from 'axios';
import toast from 'react-hot-toast';
// @ts-ignore
import Video from 'twilio-video';

const API_URL = import.meta.env.VITE_API_URL || 'https://beautycita.com/api';

interface Consultation {
  id: number;
  host_name: string;
  client_name: string;
  scheduled_at: string;
  status: string;
}

export default function VideoConsultationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);

  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<any>(null);
  const localParticipantRef = useRef<any>(null);

  useEffect(() => {
    if (id) {
      fetchConsultationDetails();
    }
  }, [id]);

  const fetchConsultationDetails = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/video/consultations/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setConsultation(response.data.consultation);
    } catch (error: any) {
      console.error('Fetch consultation error:', error);
      toast.error('Failed to load consultation details');
    } finally {
      setLoading(false);
    }
  };

  const joinVideoCall = async () => {
    setConnecting(true);

    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(
        `${API_URL}/video/consultations/${id}/token`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { token: twilioToken, roomName } = response.data;

      // Connect to Twilio Video room
      const room = await Video.connect(twilioToken, {
        name: roomName,
        audio: audioEnabled,
        video: videoEnabled
      });

      roomRef.current = room;
      setConnected(true);

      // Attach local participant video
      const localParticipant = room.localParticipant;
      localParticipantRef.current = localParticipant;

      localParticipant.tracks.forEach((publication: any) => {
        if (publication.track && localVideoRef.current) {
          localVideoRef.current.appendChild(publication.track.attach());
        }
      });

      // Handle remote participants
      room.participants.forEach((participant: any) => {
        attachParticipantTracks(participant);
      });

      room.on('participantConnected', (participant: any) => {
        console.log('Participant connected:', participant.identity);
        attachParticipantTracks(participant);
      });

      room.on('participantDisconnected', (participant: any) => {
        console.log('Participant disconnected:', participant.identity);
        detachParticipantTracks(participant);
      });

      room.on('disconnected', () => {
        console.log('Disconnected from room');
        setConnected(false);
        cleanupTracks();
      });

      toast.success('Connected to video consultation');
    } catch (error: any) {
      console.error('Join video call error:', error);
      toast.error('Failed to join video call');
      setConnecting(false);
    } finally {
      setConnecting(false);
    }
  };

  const attachParticipantTracks = (participant: any) => {
    participant.tracks.forEach((publication: any) => {
      if (publication.isSubscribed) {
        attachTrack(publication.track);
      }
    });

    participant.on('trackSubscribed', (track: any) => {
      attachTrack(track);
    });
  };

  const attachTrack = (track: any) => {
    if (track && remoteVideoRef.current) {
      const element = track.attach();
      remoteVideoRef.current.appendChild(element);
    }
  };

  const detachParticipantTracks = (participant: any) => {
    participant.tracks.forEach((publication: any) => {
      if (publication.track && remoteVideoRef.current) {
        publication.track.detach().forEach((element: HTMLElement) => {
          element.remove();
        });
      }
    });
  };

  const cleanupTracks = () => {
    if (localVideoRef.current) {
      localVideoRef.current.innerHTML = '';
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.innerHTML = '';
    }
  };

  const toggleAudio = () => {
    if (localParticipantRef.current) {
      localParticipantRef.current.audioTracks.forEach((publication: any) => {
        if (audioEnabled) {
          publication.track.disable();
        } else {
          publication.track.enable();
        }
      });
      setAudioEnabled(!audioEnabled);
    }
  };

  const toggleVideo = () => {
    if (localParticipantRef.current) {
      localParticipantRef.current.videoTracks.forEach((publication: any) => {
        if (videoEnabled) {
          publication.track.disable();
        } else {
          publication.track.enable();
        }
      });
      setVideoEnabled(!videoEnabled);
    }
  };

  const endCall = async () => {
    if (roomRef.current) {
      roomRef.current.disconnect();
    }

    try {
      const token = localStorage.getItem('authToken');
      await axios.post(
        `${API_URL}/video/consultations/${id}/end`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Call ended');
      navigate('/consultations');
    } catch (error: any) {
      console.error('End call error:', error);
      toast.error('Failed to end call');
    }
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
      cleanupTracks();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Consultation not found</h2>
          <button
            onClick={() => navigate('/consultations')}
            className="text-purple-400 hover:text-purple-300"
          >
            Back to consultations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Video Grid */}
      <div className="relative h-screen">
        {/* Remote Video (Full Screen) */}
        <div
          ref={remoteVideoRef}
          className="absolute inset-0 bg-gray-800 flex items-center justify-center"
        >
          {!connected && (
            <div className="text-center text-white">
              <VideoCameraIcon className="h-24 w-24 mx-auto mb-4 text-gray-600" />
              <p className="text-xl">Waiting for other participant...</p>
            </div>
          )}
        </div>

        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute top-4 right-4 w-64 h-48 bg-gray-800 rounded-3xl overflow-hidden shadow-2xl">
          <div ref={localVideoRef} className="w-full h-full">
            {!connected && (
              <div className="w-full h-full flex items-center justify-center">
                <VideoCameraIcon className="h-12 w-12 text-gray-600" />
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-3xl px-6 py-4 flex items-center gap-4">
            {connected ? (
              <>
                <button
                  onClick={toggleAudio}
                  className={`p-4 rounded-full ${
                    audioEnabled
                      ? 'bg-gray-700 hover:bg-gray-600'
                      : 'bg-red-600 hover:bg-red-700'
                  } text-white transition-colors`}
                  title={audioEnabled ? 'Mute' : 'Unmute'}
                >
                  {audioEnabled ? (
                    <MicrophoneIcon className="h-6 w-6" />
                  ) : (
                    <SpeakerXMarkIcon className="h-6 w-6" />
                  )}
                </button>

                <button
                  onClick={toggleVideo}
                  className={`p-4 rounded-full ${
                    videoEnabled
                      ? 'bg-gray-700 hover:bg-gray-600'
                      : 'bg-red-600 hover:bg-red-700'
                  } text-white transition-colors`}
                  title={videoEnabled ? 'Stop Video' : 'Start Video'}
                >
                  {videoEnabled ? (
                    <VideoCameraIcon className="h-6 w-6" />
                  ) : (
                    <VideoCameraSlashIcon className="h-6 w-6" />
                  )}
                </button>

                <button
                  onClick={endCall}
                  className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
                  title="End Call"
                >
                  <PhoneXMarkIcon className="h-6 w-6" />
                </button>
              </>
            ) : (
              <button
                onClick={joinVideoCall}
                disabled={connecting}
                className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-3xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {connecting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Connecting...
                  </>
                ) : (
                  <>
                    <VideoCameraIcon className="h-6 w-6" />
                    Join Call
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Consultation Info */}
        <div className="absolute top-4 left-4 bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-3xl px-4 py-3 text-white">
          <p className="font-semibold">{consultation.host_name} & {consultation.client_name}</p>
          <p className="text-sm text-gray-300">
            {new Date(consultation.scheduled_at).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
