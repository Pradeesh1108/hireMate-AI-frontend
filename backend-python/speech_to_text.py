import speech_recognition as sr
import os
import tempfile
from pydub import AudioSegment
import io

def convert_audio_to_text(audio_data, audio_format="wav"):
    """
    Convert audio data to text using Google Speech Recognition
    
    Args:
        audio_data: Raw audio data (bytes)
        audio_format: Format of the audio (wav, mp3, etc.)
    
    Returns:
        dict: {"success": bool, "text": str, "error": str}
    """
    try:
        print(f"Processing audio data of size: {len(audio_data)} bytes")
        print(f"Audio format: {audio_format}")
        
        # Create a recognizer instance
        recognizer = sr.Recognizer()
        
        # Convert audio data to AudioSegment
        try:
            if audio_format.lower() == "wav":
                audio = AudioSegment.from_wav(io.BytesIO(audio_data))
            elif audio_format.lower() == "mp3":
                audio = AudioSegment.from_mp3(io.BytesIO(audio_data))
            elif audio_format.lower() == "ogg":
                audio = AudioSegment.from_ogg(io.BytesIO(audio_data))
            elif audio_format.lower() == "webm":
                audio = AudioSegment.from_file(io.BytesIO(audio_data), format="webm")
            else:
                # Try to detect format automatically
                audio = AudioSegment.from_file(io.BytesIO(audio_data))
        except Exception as format_error:
            print(f"Error converting audio format: {format_error}")
            # Try with webm format as fallback
            try:
                audio = AudioSegment.from_file(io.BytesIO(audio_data), format="webm")
            except Exception as fallback_error:
                print(f"Fallback conversion also failed: {fallback_error}")
                return {
                    "success": False,
                    "text": "",
                    "error": f"Unsupported audio format: {audio_format}. Error: {format_error}"
                }
        
        print(f"Audio duration: {len(audio)} ms")
        
        # Convert to WAV format for speech recognition
        wav_data = io.BytesIO()
        audio.export(wav_data, format="wav")
        wav_data.seek(0)
        
        print("Audio converted to WAV format")
        
        # Create AudioFile object
        with sr.AudioFile(wav_data) as source:
            # Adjust for ambient noise
            recognizer.adjust_for_ambient_noise(source, duration=0.5)
            
            # Record the audio
            audio_data = recognizer.record(source)
            
            print("Sending to Google Speech Recognition...")
            
            # Use Google Speech Recognition
            text = recognizer.recognize_google(audio_data)
            
            print(f"Recognition successful: {text}")
            
            return {
                "success": True,
                "text": text,
                "error": None
            }
            
    except sr.UnknownValueError:
        print("Speech could not be understood")
        return {
            "success": False,
            "text": "",
            "error": "Speech could not be understood. Please try speaking more clearly."
        }
    except sr.RequestError as e:
        print(f"Google Speech Recognition request error: {e}")
        return {
            "success": False,
            "text": "",
            "error": f"Could not request results from Google Speech Recognition service: {str(e)}"
        }
    except Exception as e:
        print(f"Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "text": "",
            "error": f"Error processing audio: {str(e)}"
        }

def convert_audio_file_to_text(file_path, audio_format="wav"):
    """
    Convert audio file to text using Google Speech Recognition
    
    Args:
        file_path: Path to the audio file
        audio_format: Format of the audio file
    
    Returns:
        dict: {"success": bool, "text": str, "error": str}
    """
    try:
        # Create a recognizer instance
        recognizer = sr.Recognizer()
        
        # Use the audio file as the source
        with sr.AudioFile(file_path) as source:
            # Adjust for ambient noise
            recognizer.adjust_for_ambient_noise(source, duration=0.5)
            
            # Record the audio
            audio_data = recognizer.record(source)
            
            # Use Google Speech Recognition
            text = recognizer.recognize_google(audio_data)
            
            return {
                "success": True,
                "text": text,
                "error": None
            }
            
    except sr.UnknownValueError:
        return {
            "success": False,
            "text": "",
            "error": "Speech could not be understood. Please try speaking more clearly."
        }
    except sr.RequestError as e:
        return {
            "success": False,
            "text": "",
            "error": f"Could not request results from Google Speech Recognition service: {str(e)}"
        }
    except Exception as e:
        return {
            "success": False,
            "text": "",
            "error": f"Error processing audio file: {str(e)}"
        } 