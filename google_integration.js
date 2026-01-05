/**
 * Google Integration Module
 * Direct integration with Google Drive and Sheets APIs
 * Version: 2.0.0
 */

(function() {
  'use strict';

  class GoogleIntegration {
    constructor() {
      this.token = null;
      this.tokenExpiry = null;
      this.isConnected = false;
      this.init();
    }

    async init() {
      // Check stored connection status
      try {
        const status = await this.getConnectionStatus();
        this.isConnected = status.connected;
        console.log('[Google Integration] Initialized, connected:', this.isConnected);
      } catch (e) {
        console.log('[Google Integration] Init check failed:', e);
      }
    }

    /**
     * Authenticate with Google using Chrome Identity API
     */
    async authenticate() {
      return new Promise((resolve, reject) => {
        if (typeof chrome === 'undefined' || !chrome.identity) {
          reject(new Error('Chrome identity API not available'));
          return;
        }

        chrome.identity.getAuthToken({ interactive: true }, (token) => {
          if (chrome.runtime.lastError) {
            console.error('[Google Integration] Auth failed:', chrome.runtime.lastError);
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          
          this.token = token;
          this.tokenExpiry = Date.now() + (3600 * 1000); // 1 hour
          this.isConnected = true;
          
          // Store connection status
          chrome.storage.local.set({ 
            googleConnected: true,
            tokenExpiry: this.tokenExpiry 
          });
          
          console.log('[Google Integration] Successfully authenticated');
          resolve(token);
        });
      });
    }

    /**
     * Check if we have a valid token
     */
    async ensureAuthenticated() {
      if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.token;
      }
      return this.authenticate();
    }

    /**
     * Disconnect from Google
     */
    async disconnect() {
      return new Promise((resolve) => {
        if (this.token && chrome.identity) {
          chrome.identity.removeCachedAuthToken({ token: this.token }, () => {
            this.token = null;
            this.tokenExpiry = null;
            this.isConnected = false;
            chrome.storage.local.set({ googleConnected: false, tokenExpiry: null });
            console.log('[Google Integration] Disconnected');
            resolve(true);
          });
        } else {
          this.isConnected = false;
          resolve(true);
        }
      });
    }

    /**
     * Get connection status
     */
    async getConnectionStatus() {
      return new Promise((resolve) => {
        if (typeof chrome === 'undefined' || !chrome.storage) {
          resolve({ connected: false, expiry: null });
          return;
        }
        
        chrome.storage.local.get(['googleConnected', 'tokenExpiry'], (result) => {
          const isValid = result.googleConnected && 
                         result.tokenExpiry && 
                         Date.now() < result.tokenExpiry;
          resolve({
            connected: isValid,
            expiry: result.tokenExpiry
          });
        });
      });
    }

    /**
     * List files from Google Drive
     */
    async listDriveFiles(query = '', mimeType = null) {
      await this.ensureAuthenticated();
      
      let q = "trashed=false";
      if (query) {
        q += ` and name contains '${query}'`;
      }
      if (mimeType) {
        q += ` and mimeType='${mimeType}'`;
      }

      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,modifiedTime)`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Drive API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      return data.files || [];
    }

    /**
     * List Google Sheets specifically
     */
    async listSheets() {
      return this.listDriveFiles('', 'application/vnd.google-apps.spreadsheet');
    }

    /**
     * Read data from a Google Sheet
     */
    async readSheet(spreadsheetId, range = 'Sheet1') {
      await this.ensureAuthenticated();

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Sheets API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      return data.values || [];
    }

    /**
     * Write data to a Google Sheet
     */
    async writeSheet(spreadsheetId, range, values) {
      await this.ensureAuthenticated();

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            values: values
          })
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Sheets API error: ${response.status} - ${error}`);
      }

      return response.json();
    }

    /**
     * Append data to a Google Sheet
     */
    async appendToSheet(spreadsheetId, range, values) {
      await this.ensureAuthenticated();

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            values: values
          })
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Sheets API error: ${response.status} - ${error}`);
      }

      return response.json();
    }

    /**
     * Get sheet metadata (sheet names, etc.)
     */
    async getSheetMetadata(spreadsheetId) {
      await this.ensureAuthenticated();

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Sheets API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      return data.sheets?.map(s => s.properties) || [];
    }

    /**
     * Read a file from Google Drive
     */
    async readDriveFile(fileId) {
      await this.ensureAuthenticated();

      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Drive API error: ${response.status} - ${error}`);
      }

      return response.text();
    }
  }

  // Create global instance
  window.GoogleIntegration = GoogleIntegration;
  window.googleIntegration = new GoogleIntegration();

  console.log('[Google Integration] Module loaded');
})();
