# Obsidian Sync Options

This guide helps you choose how to sync your Obsidian vault across your devices, and tells you what vault path to use in your Claude Desktop settings file.

---

## Quick Decision Tree

| Your setup | Recommended sync method | Cost |
|-----------|------------------------|------|
| **Mac + iPhone/iPad** | iCloud (built-in, automatic) | Free |
| **Mac + Android** | Obsidian Sync or Remotely Save plugin | $4/month or Free |
| **Windows + iPhone/iPad** | iCloud for Windows | Free |
| **Windows + Android** | OneDrive + Remotely Save, or Obsidian Sync | Free or $4/month |
| **Just one computer, no phone** | No sync needed | Free |

---

## Option 1: iCloud (Mac + iPhone/iPad)

This is the simplest option if you're in the Apple ecosystem. Your notes sync automatically in the background.

### Setup

1. When creating your vault in Obsidian on your Mac, choose **Store in iCloud**
2. That's it on the Mac side — Obsidian handles everything

**On your iPhone or iPad:**
1. Install **Obsidian** from the App Store
2. Open Obsidian — it will automatically detect your iCloud vault
3. Tap the vault name to open it

### Vault path for your settings file

When your vault is stored in iCloud, the path on your Mac is:

```
/Users/YOUR_MAC_USERNAME/Library/Mobile Documents/iCloud~md~obsidian/Documents/YOUR_VAULT_NAME
```

For example:
```
/Users/johndoe/Library/Mobile Documents/iCloud~md~obsidian/Documents/GTD
```

> ⚠️ This path looks different from what you see in Finder. The `Library/Mobile Documents/iCloud~md~obsidian/` part is where Apple actually stores iCloud Obsidian data behind the scenes.

### Moving an existing vault to iCloud

If you already created a vault somewhere else and want to move it to iCloud:

1. Close Obsidian completely
2. Open Finder and navigate to your current vault folder
3. Open a second Finder window and navigate to: `/Users/YOUR_USERNAME/Library/Mobile Documents/iCloud~md~obsidian/Documents/`
   - To get there: click **Go** → **Go to Folder** → paste the path above (with your username) → press Enter
4. Drag your vault folder into the iCloud Obsidian Documents folder
5. Reopen Obsidian — it may ask you to locate the vault. Point it to the new location.
6. Update the vault path in your Claude Desktop settings file and restart Claude Desktop

---

## Option 2: iCloud for Windows (Windows + iPhone/iPad)

This lets Windows users sync with Apple devices through iCloud.

### Setup on Windows

1. Open the **Microsoft Store** (search for it in the Start menu)
2. Search for **iCloud**
3. Click **Get** or **Install**
4. Open iCloud for Windows and sign in with your Apple ID
5. Make sure **iCloud Drive** is checked/enabled
6. Wait for iCloud Drive to finish syncing (this can take a few minutes)

### Create or move your vault

**Creating a new vault:**
1. In Obsidian, click **Create new vault**
2. For the location, navigate to your iCloud Drive folder and create a subfolder called `Obsidian`:
   `C:\Users\YOUR_USERNAME\iCloud Drive\Obsidian\`
3. Create your vault inside that folder

**Moving an existing vault:**
1. Close Obsidian
2. Move your vault folder into `C:\Users\YOUR_USERNAME\iCloud Drive\Obsidian\`
3. Reopen Obsidian and point it to the new location

### Vault path for your settings file

```
C:\Users\YOUR_USERNAME\iCloud Drive\Obsidian\YOUR_VAULT_NAME
```

⚠️ Remember to double the backslashes in your settings file:
```
C:\\Users\\YOUR_USERNAME\\iCloud Drive\\Obsidian\\YOUR_VAULT_NAME
```

### On your iPhone or iPad

1. Install **Obsidian** from the App Store
2. Open it — your vault should appear automatically
3. If it doesn't appear, wait a few minutes for iCloud to sync, then try again

---

## Option 3: Obsidian Sync (Any device combination)

Obsidian Sync is Obsidian's official paid sync service. It works across all platforms — Mac, Windows, iPhone, iPad, Android, and Linux. It's the easiest option if you're mixing Apple and Android devices.

### Setup

1. In Obsidian on your computer, go to **Settings** (gear icon in the bottom-left)
2. Under **Core plugins**, find **Sync** and turn it on
3. Click on **Sync** in the left sidebar
4. Click **Subscribe** — you'll be taken to Obsidian's website to sign up ($4/month)
5. After subscribing, click **Connect** and sign in with your Obsidian account
6. Choose your vault to sync

**On your phone (iPhone, iPad, or Android):**
1. Install Obsidian from the App Store or Google Play Store
2. Open Obsidian → **Settings** → **Sync** → turn it on
3. Sign in with the same Obsidian account
4. Select the remote vault to sync

### Vault path for your settings file

Your vault stays wherever you originally created it. The path doesn't change when you enable Obsidian Sync.

- **Mac (default location):** `/Users/YOUR_USERNAME/Documents/YOUR_VAULT_NAME`
- **Windows (default location):** `C:\Users\YOUR_USERNAME\Documents\YOUR_VAULT_NAME`

---

## Option 4: Remotely Save Plugin (Free, community-built)

Remotely Save is a free community plugin that syncs your vault through cloud storage services like OneDrive, Dropbox, Google Drive, or S3. It works well but requires a bit more setup.

### Setup on your computer

1. In Obsidian, go to **Settings** → **Community plugins**
2. If this is your first community plugin, you'll need to click **Turn on community plugins** and confirm
3. Click **Browse** and search for **Remotely Save**
4. Click **Install**, then **Enable**
5. Go to the Remotely Save settings (it appears in your left sidebar under plugin settings)
6. Choose your cloud service:
   - **OneDrive** is a good choice for Windows users (it's built into Windows)
   - **Dropbox** or **Google Drive** also work
7. Click **Authorize** and sign in to your cloud account
8. Click **Check connectivity** to make sure it works
9. Configure sync to run automatically (or you can sync manually using the sync button in Obsidian's sidebar)

### Setup on your Android phone

1. Install **Obsidian** from the Google Play Store
2. Create a new (empty) vault with the same name as your computer vault
3. Go to **Settings** → **Community plugins** → **Browse** → search for **Remotely Save**
4. Install and enable it
5. Configure it with the same cloud service and account you used on your computer
6. Sync — your notes will download to your phone

### Vault path for your settings file

Your vault stays wherever you originally created it on your computer. Remotely Save handles the cloud sync separately — it doesn't change where the vault lives on your computer.

- **Mac (default):** `/Users/YOUR_USERNAME/Documents/YOUR_VAULT_NAME`
- **Windows (default):** `C:\Users\YOUR_USERNAME\Documents\YOUR_VAULT_NAME`
- **Windows (OneDrive):** `C:\Users\YOUR_USERNAME\OneDrive\Obsidian\YOUR_VAULT_NAME`

---

## Still Not Sure?

Here's the simplest recommendation:

- **If all your devices are Apple:** Use iCloud. It's free and automatic.
- **If you're on Windows + iPhone:** Install iCloud for Windows. It's free.
- **If you have an Android phone:** Pay $4/month for Obsidian Sync — it's the most reliable and easiest to set up.
- **If you're technical and want free Android sync:** Use Remotely Save with OneDrive or Dropbox.
