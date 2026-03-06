import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

export class GoogleDriveService {
    private drive;
    private cacheDir = path.join(process.cwd(), 'temp', 'pdf_cache');

    constructor() {
        // Ensure cache directory exists
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
        }
        // Option 1: Env Var with full JSON
        const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

        let credentials;
        if (serviceAccountJson) {
            try {
                credentials = JSON.parse(serviceAccountJson);
            } catch (err) {
                console.error('[DRIVE] Error parsing GOOGLE_SERVICE_ACCOUNT_JSON:', err);
            }
        }

        // Option 2: File fallback
        if (!credentials) {
            const credentialsPath = path.join(process.cwd(), 'credentials.json');
            if (fs.existsSync(credentialsPath)) {
                try {
                    credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
                } catch (err) {
                    console.error('[DRIVE] Error reading credentials.json:', err);
                }
            }
        }

        if (!credentials) {
            console.warn('[DRIVE] No credentials found. Google Drive integration disabled.');
            this.drive = null;
        } else {
            const auth = new google.auth.GoogleAuth({
                credentials,
                scopes: ['https://www.googleapis.com/auth/drive.readonly'],
            });
            this.drive = google.drive({ version: 'v3', auth });
        }
    }

    /**
     * Lists PDF files in the configured folder.
     */
    async listPdfFiles() {
        if (!this.drive) return [];
        const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
        if (!folderId) {
            console.warn('[DRIVE] GOOGLE_DRIVE_FOLDER_ID not set.');
            return [];
        }

        try {
            const res = await this.drive.files.list({
                q: `'${folderId}' in parents and mimeType = 'application/pdf' and trashed = false`,
                fields: 'files(id, name, modifiedTime)',
            });
            return res.data.files || [];
        } catch (err) {
            console.error('[DRIVE] Error listing files:', err);
            return [];
        }
    }

    /**
     * Downloads a file from Google Drive (with disk caching).
     */
    async getFileBuffer(fileId: string, fileName?: string): Promise<Buffer | null> {
        if (!this.drive) return null;

        const cacheFileName = fileName ? `${fileId}_${fileName}` : `${fileId}.pdf`;
        const cachePath = path.join(this.cacheDir, cacheFileName);

        // Check disk cache first
        if (fs.existsSync(cachePath)) {
            console.log(`[DRIVE] Cache HIT for ${cacheFileName}`);
            return fs.readFileSync(cachePath);
        }

        try {
            console.log(`[DRIVE] Cache MISS for ${cacheFileName}. Downloading...`);
            const res = await this.drive.files.get({
                fileId,
                alt: 'media',
            }, { responseType: 'arraybuffer' });

            const buffer = Buffer.from(res.data as ArrayBuffer);

            // Save to disk cache
            fs.writeFileSync(cachePath, buffer);

            return buffer;
        } catch (err) {
            console.error(`[DRIVE] Error downloading file ${fileId}:`, err);
            return null;
        }
    }
}
