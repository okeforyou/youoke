const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';
const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3/files';
const FOLDER_NAME = 'YouOke Separated Audio';

export class GoogleDriveService {
  /**
   * Search for the folder or create it if not found.
   */
  static async getOrCreateFolder(accessToken: string): Promise<string> {
    const query = encodeURIComponent(`name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
    const res = await fetch(`${DRIVE_API_URL}?q=${query}&fields=files(id)`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error?.message || 'Failed to search folder');
    }
    
    const data = await res.json();

    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }

    // Create folder
    const createRes = await fetch(DRIVE_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder'
      })
    });
    
    if (!createRes.ok) {
      const createData = await createRes.json();
      throw new Error(createData.error?.message || 'Failed to create folder');
    }
    
    const createData = await createRes.json();
    return createData.id;
  }

  /**
   * Upload an audio file to the Drive folder
   */
  static async uploadAudio(accessToken: string, folderId: string, fileName: string, fileBlob: Blob): Promise<{ id: string, webViewLink: string }> {
    const metadata = {
      name: fileName,
      mimeType: fileBlob.type || 'audio/mpeg',
      parents: [folderId]
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', fileBlob);

    const url = `${DRIVE_UPLOAD_URL}?uploadType=multipart&fields=id,webViewLink`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      body: form
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to upload audio file');
    }
    
    return await res.json(); // Returns { id, webViewLink }
  }
}
