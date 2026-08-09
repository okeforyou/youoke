import re

with open('src/pages/creator.tsx', 'r') as f:
    content = f.read()

tap_sync_func = """
    const handleToggleTapSync = () => {
        setIsRecording(!isRecording);
        if (!isRecording) {
            setRecordingIndex(0);
        }
    };
"""
# insert before togglePlay
content = content.replace('const togglePlay = () => {', tap_sync_func.strip() + '\n\n    const togglePlay = () => {')

# Wait, we also need recordingIndex state if it doesn't exist.
if 'const [recordingIndex, setRecordingIndex]' not in content:
    state_decl = """    const [recordingIndex, setRecordingIndex] = useState(0);"""
    content = content.replace('const [isRecording, setIsRecording] = useState(false);', 'const [isRecording, setIsRecording] = useState(false);\n' + state_decl)

with open('src/pages/creator.tsx', 'w') as f:
    f.write(content)
