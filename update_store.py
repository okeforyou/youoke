import re

with open('src/stores/useAIVocalStore.ts', 'r') as f:
    content = f.read()

# Add to interface
content = content.replace(
    "processAudio: (videoId: string, titleOrMode?: string, modeOverride?: 'basic' | 'pro') => Promise<void>;",
    "processAudio: (videoId: string, titleOrMode?: string, modeOverride?: 'basic' | 'pro', useManualUpload?: boolean) => Promise<void>;\n    uploadAudioFile: (videoId: string, file: File) => Promise<boolean>;"
)

# Update processAudio implementation
content = content.replace(
    "processAudio: async (videoId: string, titleOrMode?: string, modeOverride?: 'basic' | 'pro') => {",
    "processAudio: async (videoId: string, titleOrMode?: string, modeOverride?: 'basic' | 'pro', useManualUpload?: boolean) => {"
)

# In processAudio, update the request body
# Look for: body: JSON.stringify({ video_id: videoId, title: title, mode: mode, rapidapi_key: rapidapiKey })
content = content.replace(
    "body: JSON.stringify({ video_id: videoId, title: title, mode: mode, rapidapi_key: rapidapiKey })",
    "body: JSON.stringify({ video_id: videoId, title: title, mode: mode, rapidapi_key: rapidapiKey, use_manual_upload: useManualUpload })"
)

# Add uploadAudioFile implementation at the end before the closing })
upload_func = """
    uploadAudioFile: async (videoId: string, file: File) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            // Try both local bridge ports
            const maxRetries = 1;
            for (let attempt = 0; attempt <= maxRetries; attempt++) {
                try {
                    const res5050 = await fetch(`http://127.0.0.1:5050/upload/${videoId}`, {
                        method: 'POST',
                        body: formData
                    });
                    if (res5050.ok) return true;
                } catch(e) {}
                
                try {
                    const res8055 = await fetch(`http://127.0.0.1:8055/upload/${videoId}`, {
                        method: 'POST',
                        body: formData
                    });
                    if (res8055.ok) return true;
                } catch(e) {}
            }
            return false;
        } catch (error) {
            console.error('Error uploading file:', error);
            return false;
        }
    }
"""

content = content.replace(
    "            if (res8055) return res8055;\n            return res5050; // Return the first one as fallback for error handling\n        }\n    }\n",
    "            if (res8055) return res8055;\n            return res5050; // Return the first one as fallback for error handling\n        }\n    },\n" + upload_func
)

with open('src/stores/useAIVocalStore.ts', 'w') as f:
    f.write(content)
